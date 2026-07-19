import { test, expect } from "@playwright/test";

test.describe("Landing page", () => {
  test("shows app name and navigation", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "conservados para siempre"
    );
    await expect(page.getByRole("link", { name: "Iniciar sesión" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Crear cuenta" })).toBeVisible();
  });

  test("navigates to login page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Iniciar sesión" }).click();
    await expect(page).toHaveURL("/login");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Bienvenido de nuevo"
    );
  });
});

test.describe("Registration page", () => {
  test("shows registration form", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Crear cuenta"
    );
    await expect(page.getByLabel("Tu nombre")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Contraseña")).toBeVisible();
  });
});
