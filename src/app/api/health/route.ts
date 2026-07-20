import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { mediaService } from "@/lib/services";

export async function GET() {
  const session = await auth();
  if (!session?.user?.familyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const health = await mediaService.getHealthStats(session.user.familyId);
  return NextResponse.json({
    ...health,
    totalSize: health.totalSize.toString(),
  });
}
