import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PGlite } from "@electric-sql/pglite";
import { PrismaPGlite } from "pglite-prisma-adapter";
import { PrismaClient } from "@prisma/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, "../prisma/migrations");

async function applyMigrations(client: PGlite) {
  const migrations = fs
    .readdirSync(migrationsDir)
    .filter((dir) => fs.statSync(path.join(migrationsDir, dir)).isDirectory())
    .sort();

  for (const migration of migrations) {
    const sqlPath = path.join(migrationsDir, migration, "migration.sql");
    if (fs.existsSync(sqlPath)) {
      const sql = fs.readFileSync(sqlPath, "utf-8");
      await client.exec(sql);
    }
  }
}

export async function setup() {
  const client = new PGlite();
  await applyMigrations(client);

  const adapter = new PrismaPGlite(client);
  const prisma = new PrismaClient({ adapter });

  const globalForPrisma = globalThis as typeof globalThis & {
    prisma?: PrismaClient;
    __pglite?: PGlite;
  };

  globalForPrisma.prisma = prisma;
  globalForPrisma.__pglite = client;
}

export async function teardown() {
  const globalForPrisma = globalThis as typeof globalThis & {
    prisma?: PrismaClient;
    __pglite?: PGlite;
  };

  if (globalForPrisma.prisma) {
    await globalForPrisma.prisma.$disconnect();
    globalForPrisma.prisma = undefined;
  }
  if (globalForPrisma.__pglite) {
    await globalForPrisma.__pglite.close();
    globalForPrisma.__pglite = undefined;
  }
}
