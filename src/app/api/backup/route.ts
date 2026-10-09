import { NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";
import { auth } from "@/lib/auth/config";
import { readBackupStatus } from "@/lib/backup/status";

export async function GET() {
  const session = await auth();
  if (!session?.user?.familyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "OWNER" && session.user.role !== "PARENT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(await readBackupStatus());
}

/** Starts the same script the nightly LaunchAgent runs; poll GET for completion. */
export async function POST() {
  const session = await auth();
  if (!session?.user?.familyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Only the family owner can create backups" }, { status: 403 });
  }

  const status = await readBackupStatus();
  if (status.running) {
    return NextResponse.json({ started: false, running: true }, { status: 409 });
  }

  const script = path.join(process.cwd(), "scripts", "prod", "backup.sh");
  const child = spawn("bash", [script], {
    cwd: process.cwd(),
    detached: true,
    stdio: "ignore",
    env: process.env,
  });
  child.unref();

  return NextResponse.json({ started: true }, { status: 202 });
}
