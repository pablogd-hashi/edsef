import { test, expect } from "@playwright/test";

test.describe("Auth smoke", () => {
  test("reset-session clears cookies and redirects to login", async ({
    page,
    context,
  }) => {
    await context.addCookies([
      {
        name: "authjs.session-token",
        value: "invalid-stale-token",
        domain: "localhost",
        path: "/",
      },
    ]);

    const response = await page.goto("/api/auth/reset-session");
    expect(response?.status()).toBeLessThan(400);
    await expect(page).toHaveURL(/\/login\?session=reset/);
    await expect(
      page.getByText("Session cleared. Sign in again with your email and password.")
    ).toBeVisible();
  });

  test("register and sign in", async ({ page }) => {
    const email = `smoke-${Date.now()}@example.com`;
    const password = "smoke-test-password-12";

    await page.goto("/register");
    await page.getByLabel("Your name").fill("Smoke Test");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page).toHaveURL(/\/login\?registered=1/);

    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/dashboard/);
  });
});
