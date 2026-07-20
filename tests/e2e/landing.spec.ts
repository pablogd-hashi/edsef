import { test, expect } from "@playwright/test";

test.describe("Landing page", () => {
  test("shows app name and navigation", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("forever");
    await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Create account" })).toBeVisible();
  });

  test("navigates to login page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Sign in" }).click();
    await expect(page).toHaveURL("/login");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Welcome");
  });
});

test.describe("Registration page", () => {
  test("shows registration form", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Create account"
    );
    await expect(page.getByLabel("Your name")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
  });
});
