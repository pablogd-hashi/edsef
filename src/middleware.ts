import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicRoutes = ["/", "/login", "/register"];
const authRoutes = ["/login", "/register"];

const AUTH_COOKIE_NAMES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "authjs.callback-url",
  "__Secure-authjs.callback-url",
  "authjs.csrf-token",
  "__Host-authjs.csrf-token",
];

function applySecurityHeaders(response: NextResponse, pathname: string) {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; font-src 'self' data:;"
  );

  if (!pathname.startsWith("/api")) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  return response;
}

function clearAuthCookies(response: NextResponse) {
  for (const name of AUTH_COOKIE_NAMES) {
    response.cookies.set(name, "", { path: "/", maxAge: 0 });
  }
  return response;
}

function hasSessionCookie(request: NextRequest) {
  return AUTH_COOKIE_NAMES.some((name) => request.cookies.has(name));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic =
    publicRoutes.some((route) => pathname === route) ||
    pathname.startsWith("/api/auth") ||
    pathname === "/api/ping";
  const isAuthRoute = authRoutes.includes(pathname);

  let token = null;
  try {
    token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
    });
  } catch {
    token = null;
  }

  const isLoggedIn = !!token;
  const staleSession = !isLoggedIn && hasSessionCookie(request);

  if (isAuthRoute && isLoggedIn) {
    return applySecurityHeaders(
      NextResponse.redirect(new URL("/dashboard", request.url)),
      pathname
    );
  }

  if (
    pathname === "/register" &&
    process.env.ALLOW_REGISTRATION === "false"
  ) {
    return applySecurityHeaders(
      NextResponse.redirect(new URL("/login", request.url)),
      pathname
    );
  }

  if (!isPublic && !isLoggedIn) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    const response = NextResponse.redirect(loginUrl);
    if (staleSession) clearAuthCookies(response);
    return applySecurityHeaders(response, pathname);
  }

  const response = NextResponse.next();
  if (staleSession && isAuthRoute) {
    clearAuthCookies(response);
  }
  return applySecurityHeaders(response, pathname);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
