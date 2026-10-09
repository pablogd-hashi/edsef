import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { loginSchema } from "@/lib/validators";
import { AUTH_LIMIT, clientIp, rateLimit } from "@/lib/rate-limit";

/** Re-check membership and revocation at most this often per session. */
const RECHECK_MS = 5 * 60 * 1000;

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const email = parsed.data.email.toLowerCase();
        const byEmail = rateLimit(`login:email:${email}`, AUTH_LIMIT);
        const byIp = rateLimit(`login:ip:${clientIp(request.headers)}`, AUTH_LIMIT);
        if (!byEmail.ok || !byIp.ok) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });

        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(
          parsed.data.password,
          user.passwordHash
        );
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      const now = Date.now();
      if (user) {
        token.id = user.id;
        // Own claim: Auth.js refreshes `iat` whenever it re-encodes the cookie.
        token.loginAt = now;
        token.checkedAt = 0;
      }
      if (!token.id) return null;

      // Sessions are JWTs, so revocation (password reset, removed parent) is
      // enforced by periodically re-reading the user and their membership.
      if (now - Number(token.checkedAt ?? 0) > RECHECK_MS) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            sessionsValidAfter: true,
            familyMembers: { select: { familyId: true, role: true }, take: 1 },
          },
        });
        if (!dbUser) return null;
        const loginAt = Number(token.loginAt ?? 0);
        if (dbUser.sessionsValidAfter && dbUser.sessionsValidAfter.getTime() > loginAt) {
          return null;
        }
        const membership = dbUser.familyMembers[0];
        token.familyId = membership?.familyId;
        token.role = membership?.role;
        token.checkedAt = now;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.familyId = token.familyId as string | undefined;
        session.user.role = token.role as string | undefined;
      }
      return session;
    },
  },
});
