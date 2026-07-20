import { NextResponse } from "next/server";

/** Public health check for production scripts and local monitoring */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "memoria",
    timestamp: new Date().toISOString(),
  });
}
