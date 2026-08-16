import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { accessService } from "@/lib/services";

function inviteUrl(token: string) {
  const base = (process.env.AUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return `${base}/invite/${token}`;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || !session.user.familyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [invites, parents] = await Promise.all([
    accessService.listInvitations(session.user.familyId),
    accessService.listParents(session.user.familyId),
  ]);

  return NextResponse.json({
    parents: parents.map((p) => ({
      id: p.user.id,
      name: p.user.name,
      email: p.user.email,
      role: p.role,
    })),
    invitations: invites.map((invite) => ({
      id: invite.id,
      status: invite.status,
      email: invite.email.startsWith("pending+") ? null : invite.email,
      expiresAt: invite.expiresAt,
      createdAt: invite.createdAt,
      url: invite.status === "PENDING" ? inviteUrl(invite.token) : null,
    })),
  });
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id || !session.user.familyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = session.user.role;
  if (role !== "OWNER" && role !== "PARENT") {
    return NextResponse.json({ error: "Only parents can invite" }, { status: 403 });
  }

  const invite = await accessService.createParentInvite(
    session.user.familyId,
    session.user.id
  );

  await accessService.logAudit(
    "invite.create",
    session.user.id,
    session.user.familyId,
    "Invitation",
    invite.id
  );

  return NextResponse.json(
    {
      id: invite.id,
      url: inviteUrl(invite.token),
      expiresAt: invite.expiresAt,
    },
    { status: 201 }
  );
}
