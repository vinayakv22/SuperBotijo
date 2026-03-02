import { test, expect } from "@playwright/test";
import { login } from "./auth";

test.describe("Navigation", () => {
  test("should access dashboard after login", async ({ page }) => {
    await login(page);

    // Verify we can access a protected page
    await page.goto("/");
    await page.waitForSelector("body", { timeout: 10000 });

    // Should not redirect to login
    expect(page.url()).not.toContain("/login");
  });

  test("should redirect to login when not authenticated", async ({ page }) => {
    // Clear any cookies
    await page.context().clearCookies();

    // Try to access protected page
    await page.goto("/");

    // Wait for page to load
    await page.waitForSelector("body", { timeout: 10000 });

    // Should be on login page (may have query params)
    expect(page.url()).toContain("/login");
  });
});
