import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/** Public health check for production scripts and local monitoring */
export async function GET() {
  const timestamp = new Date().toISOString();

  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      ok: true,
      db: true,
      service: "memoria",
      timestamp,
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        db: false,
        service: "memoria",
        timestamp,
        error: "Database unavailable — run: docker compose -f docker-compose.local.yml up -d",
      },
      { status: 503 }
    );
  }
}
