import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

/**
 * Reset a local account password (no email flow on a private install).
 *
 *   npm run reset-password -- you@example.com "new password"
 *
 * Password must be 8–100 chars, matching registerSchema.
 */
const prisma = new PrismaClient();

async function main() {
  const [email, password] = process.argv.slice(2);

  if (!email || !password) {
    console.error('Usage: npm run reset-password -- <email> "<new password>"');
    process.exit(1);
  }
  if (password.length < 8 || password.length > 100) {
    console.error("Password must be between 8 and 100 characters.");
    process.exit(1);
  }

  const user = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
  if (!user) {
    const users = await prisma.user.findMany({ select: { email: true } });
    console.error(`No user with email ${email}.`);
    console.error(`Known accounts: ${users.map((u) => u.email).join(", ") || "(none)"}`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  console.log(`Password updated for ${user.email}. Sign in again on every device.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
