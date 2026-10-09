import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import readline from "readline";

/**
 * Reset a local account password (no email flow on a private install).
 *
 *   npm run reset-password -- you@example.com
 *
 * The new password is asked for interactively (kept out of shell history).
 * Every existing login for that account is signed out.
 * Password must be 8–100 chars, matching registerSchema.
 */
const prisma = new PrismaClient();

async function main() {
  const [email] = process.argv.slice(2);

  if (!email) {
    console.error("Usage: npm run reset-password -- <email>");
    process.exit(1);
  }
  const password = await promptHidden("New password: ");
  if (password.length < 8 || password.length > 100) {
    console.error("Password must be between 8 and 100 characters.");
    process.exit(1);
  }

  const user = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
  if (!user) {
    console.error(`No user with email ${email}.`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash, sessionsValidAfter: new Date() } });

  console.log(`Password updated for ${user.email}. Every device has been signed out.`);
}

function promptHidden(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const write = (rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput;
    (rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput = (s: string) => {
      if (s.startsWith(question)) write.call(rl, s);
    };
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
  });
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
