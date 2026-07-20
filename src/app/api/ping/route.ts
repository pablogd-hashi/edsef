import { NextResponse } from "next/server";

/** Health check público para scripts de producción y monitoreo local */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "memoria",
    timestamp: new Date().toISOString(),
  });
}
