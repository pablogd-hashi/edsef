import { prisma } from "@/lib/db/prisma";
import type { FamilyRole, Prisma } from "@prisma/client";

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
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
  }

  async revokeInvitation(invitationId: string) {
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
