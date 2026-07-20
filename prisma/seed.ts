import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Intentionally empty — no demo users or children are seeded.
 * Create your account at /register, then add children from the dashboard.
 */
async function main() {
  console.log("Seed complete (no demo data).");
  console.log("  1. Open the app and go to /register");
  console.log("  2. Create your family account");
  console.log("  3. Add your first child from the dashboard");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
