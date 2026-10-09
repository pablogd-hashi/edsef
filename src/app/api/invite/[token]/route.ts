import { NextResponse } from "next/server";
import { accessService, InviteError } from "@/lib/services/access.service";
import { acceptInviteSchema } from "@/lib/validators";
import { AUTH_LIMIT, clientIp, rateLimit } from "@/lib/rate-limit";

function tooMany(retryAfterSec: number) {
  return NextResponse.json(
    { error: "Too many attempts. Try again later." },
    { status: 429, headers: { "Retry-After": String(retryAfterSec) } }
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const limited = rateLimit(`invite:${clientIp(_request.headers)}`, AUTH_LIMIT);
  if (!limited.ok) return tooMany(limited.retryAfterSec);
  try {
    const invite = await accessService.getPublicInvite(token);
    return NextResponse.json({
      familyName: invite.family.name,
      expiresAt: invite.expiresAt,
    });
  } catch (error) {
    if (error instanceof InviteError) {
      const status = error.code === "not_found" ? 404 : 410;
      return NextResponse.json({ error: error.message, code: error.code }, { status });
    }
    throw error;
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const limited = rateLimit(`invite:${clientIp(request.headers)}`, AUTH_LIMIT);
  if (!limited.ok) return tooMany(limited.retryAfterSec);
  const body = await request.json();
  const parsed = acceptInviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const user = await accessService.acceptInvitation(token, parsed.data);
    return NextResponse.json(
      { id: user.id, email: user.email, name: user.name },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof InviteError) {
      const status =
        error.code === "email_taken" ? 409 : error.code === "not_found" ? 404 : 410;
      return NextResponse.json({ error: error.message, code: error.code }, { status });
    }
    throw error;
  }
}
