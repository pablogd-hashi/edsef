import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db/prisma";
import type { FamilyRole, Prisma } from "@prisma/client";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** 256-bit unguessable token for one-time invite links. */
function newInviteToken() {
  return randomBytes(32).toString("base64url");
}

export class InviteError extends Error {
  constructor(
    message: string,
    readonly code: "not_found" | "expired" | "used" | "email_taken"
  ) {
    super(message);
    this.name = "InviteError";
  }
}

export class AccessService {
  async getUserFamily(userId: string) {
    return prisma.familyMember.findFirst({
      where: { userId },
      include: { family: true },
    });
  }

  async assertFamilyAccess(
    userId: string,
    familyId: string,
    minRole: FamilyRole[] = ["OWNER", "PARENT"]
  ): Promise<boolean> {
    const member = await prisma.familyMember.findFirst({
      where: { userId, familyId },
    });
    if (!member) return false;
    if (minRole.includes(member.role)) return true;
    return false;
  }

  async assertChildAccess(userId: string, childId: string): Promise<boolean> {
    const child = await prisma.child.findUnique({
      where: { id: childId },
      select: { familyId: true },
    });
    if (!child) return false;

    const member = await prisma.familyMember.findFirst({
      where: {
        userId,
        OR: [
          { familyId: child.familyId, role: { in: ["OWNER", "PARENT"] } },
          { childId, role: "CHILD" },
        ],
      },
    });
    return !!member;
  }

  /** Parents (OWNER/PARENT) can edit yearbook content */
  async assertParentAccess(userId: string, childId: string): Promise<boolean> {
    const child = await prisma.child.findUnique({
      where: { id: childId },
      select: { familyId: true },
    });
    if (!child) return false;

    const member = await prisma.familyMember.findFirst({
      where: {
        userId,
        familyId: child.familyId,
        role: { in: ["OWNER", "PARENT"] },
      },
    });
    return !!member;
  }

  async createInvitation(
    familyId: string,
    email: string,
    role: FamilyRole,
    invitedById: string,
    childId?: string,
    activateAtAge?: number
  ) {
    return prisma.invitation.create({
      data: {
        familyId,
        email,
        role,
        childId,
        activateAtAge,
        invitedById,
        token: newInviteToken(),
        expiresAt: new Date(Date.now() + INVITE_TTL_MS),
      },
    });
  }

  /** One-time parent invite. Email is filled in when the partner accepts. */
  async createParentInvite(familyId: string, invitedById: string) {
    return prisma.invitation.create({
      data: {
        familyId,
        email: `pending+${crypto.randomUUID()}@invite.local`,
        role: "PARENT",
        invitedById,
        token: newInviteToken(),
        expiresAt: new Date(Date.now() + INVITE_TTL_MS),
      },
    });
  }

  async listInvitations(familyId: string) {
    return prisma.invitation.findMany({
      where: { familyId },
      orderBy: { createdAt: "desc" },
    });
  }

  async listParents(familyId: string) {
    return prisma.familyMember.findMany({
      where: { familyId, role: { in: ["OWNER", "PARENT"] } },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    });
  }

  async getInvitationByToken(token: string) {
    return prisma.invitation.findUnique({
      where: { token },
      include: { family: { select: { id: true, name: true } } },
    });
  }

  async getPublicInvite(token: string) {
    const invite = await this.getInvitationByToken(token);
    if (!invite) throw new InviteError("Invite not found", "not_found");
    if (invite.status === "REVOKED" || invite.status === "ACCEPTED") {
      throw new InviteError("This invite is no longer valid", "used");
    }
    if (invite.expiresAt && invite.expiresAt < new Date()) {
      if (invite.status === "PENDING") {
        await prisma.invitation.update({
          where: { id: invite.id },
          data: { status: "EXPIRED" },
        });
      }
      throw new InviteError("This invite has expired", "expired");
    }
    return invite;
  }

  async acceptInvitation(
    token: string,
    data: { name: string; email: string; password: string }
  ) {
    const invite = await this.getPublicInvite(token);

    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      throw new InviteError("This email is already registered", "email_taken");
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    return prisma.$transaction(async (tx) => {
      // Claim the invite first so two simultaneous accepts can't both succeed.
      const claimed = await tx.invitation.updateMany({
        where: { id: invite.id, status: "PENDING" },
        data: { status: "ACCEPTED", email: data.email },
      });
      if (claimed.count !== 1) {
        throw new InviteError("This invite is no longer valid", "used");
      }

      const user = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          passwordHash,
        },
      });

      await tx.familyMember.create({
        data: {
          familyId: invite.familyId,
          userId: user.id,
          role: "PARENT",
        },
      });

      return user;
    });
  }

  async revokeInvitation(invitationId: string, familyId: string) {
    const existing = await prisma.invitation.findFirst({
      where: { id: invitationId, familyId },
    });
    if (!existing) throw new InviteError("Invite not found", "not_found");
    return prisma.invitation.update({
      where: { id: invitationId },
      data: { status: "REVOKED" },
    });
  }

  async logAudit(
    action: string,
    actorId: string,
    familyId?: string,
    resource?: string,
    resourceId?: string,
    metadata?: Prisma.InputJsonValue
  ) {
    return prisma.auditLog.create({
      data: {
        familyId,
        actorId,
        action,
        resource,
        resourceId,
        metadata,
      },
    });
  }
}

export const accessService = new AccessService();
