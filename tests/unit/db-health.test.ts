import { describe, expect, it } from "vitest";
import { isDatabaseUnavailableError } from "@/lib/db/health";

describe("isDatabaseUnavailableError", () => {
  it("detects Prisma initialization errors", () => {
    expect(
      isDatabaseUnavailableError({
        name: "PrismaClientInitializationError",
        message: "Can't reach database server at `localhost:5432`",
      })
    ).toBe(true);
  });

  it("detects connection refused messages", () => {
    expect(isDatabaseUnavailableError(new Error("connect ECONNREFUSED 127.0.0.1:5432"))).toBe(true);
  });

  it("ignores unrelated errors", () => {
    expect(isDatabaseUnavailableError(new Error("Not found"))).toBe(false);
  });
});
