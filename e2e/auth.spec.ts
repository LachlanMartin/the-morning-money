import { test, expect } from "@playwright/test";
import { signup, signout } from "./helpers";

test.describe("auth", () => {
  test("homepage renders with newsletter design", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle("The Morning Money");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "ASX Announcements",
    );
    await expect(page.getByRole("link", { name: "Sign In" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Get Started" }).first()).toBeVisible();
  });

  test("signup redirects to dashboard", async ({ page }) => {
    await signup(page);
    // signup() already waits for heading — just verify we're on dashboard
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("login page renders", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByPlaceholder("you@example.com")).toBeVisible();
    await expect(page.getByPlaceholder("Enter your password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign up" })).toBeVisible();
  });

  test("unauthenticated user redirected from dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL(/\/login/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test("signout redirects to homepage", async ({ page }) => {
    await signup(page);
    await signout(page);
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("link", { name: "Sign In" })).toBeVisible();
  });

  test("signup shows free trial text", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByText("7-day free trial")).toBeVisible();
    await expect(page.getByText("No credit card required")).toBeVisible();
  });

  test("terms and privacy pages render", async ({ page }) => {
    await page.goto("/terms");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.goto("/privacy");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});
