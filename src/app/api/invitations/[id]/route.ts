import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { accessService, InviteError } from "@/lib/services/access.service";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || !session.user.familyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await accessService.revokeInvitation(id, session.user.familyId);
    await accessService.logAudit(
      "invite.revoke",
      session.user.id,
      session.user.familyId,
      "Invitation",
      id
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof InviteError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    throw error;
  }
}
