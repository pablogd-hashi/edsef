import { test, expect } from "@playwright/test";

test.describe("Yearbook photo book", () => {
  test("landing page presents digital photo book, not website", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("forever");
    await expect(page.getByText("Family digital yearbooks")).toBeVisible();
    await expect(page.getByText("Photos, videos, milestones, and stories in a beautiful digital book.")).toBeVisible();
  });

  test("registration and login flow", async ({ page }) => {
    const email = `test-${Date.now()}@example.com`;

    await page.goto("/register");
    await page.getByLabel(/name/i).fill("Test Parent");
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill("testpassword123");
    await page.getByRole("button", { name: /create account/i }).click();

    await page.waitForURL(/\/login/, { timeout: 15000 });

    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill("testpassword123");
    await page.getByRole("button", { name: /sign in|log in/i }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });

    await expect(page).toHaveURL(/\/dashboard/);
  });
});
