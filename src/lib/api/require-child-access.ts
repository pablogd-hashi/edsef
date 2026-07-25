import { auth } from "@/lib/auth/config";
import { accessService } from "@/lib/services/access.service";
import { NextResponse } from "next/server";

/** Any family member (parent or child) can read yearbook content */
export async function requireChildAccess(childId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const canAccess = await accessService.assertChildAccess(session.user.id, childId);
  if (!canAccess) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { session, childId };
}
