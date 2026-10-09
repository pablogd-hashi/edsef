/**
 * Starts Next.js dev server with in-memory PGlite for E2E tests.
 */
import { spawn } from "child_process";
import { mkdtempSync } from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
// Never write test uploads into the real ./storage (family photos).
const storagePath = mkdtempSync(path.join(os.tmpdir(), "memoria-e2e-"));

const child = spawn("npx", ["next", "dev", "-H", "0.0.0.0", "-p", "3000"], {
  cwd: root,
  stdio: "inherit",
  env: {
    ...process.env,
    MEMORIA_TEST_MODE: "1",
    DATABASE_URL: "postgresql://pglite:pglite@localhost:5432/memoria",
    AUTH_SECRET: "dev-secret-change-in-production-min-32-chars-long",
    AUTH_URL: "http://localhost:3000",
    ALLOW_REGISTRATION: "true",
    STORAGE_PATH: storagePath,
  },
});

child.on("exit", (code) => process.exit(code ?? 0));

process.on("SIGINT", () => child.kill("SIGINT"));
process.on("SIGTERM", () => child.kill("SIGTERM"));
