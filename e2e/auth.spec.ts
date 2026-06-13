import { test, expect } from "@playwright/test";
import { signup, signin, signout, isRemote } from "./helpers";

test.describe("auth", () => {
  test("homepage renders with newsletter design", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle("The Morning Money");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "ASX Announcements",
    );
    await expect(page.getByRole("link", { name: "Sign In" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Get Started" }).first(),
    ).toBeVisible();
  });

  test("signup flow works", async ({ page }) => {
    await signup(page);
    // signup() verifies the redirect destination based on mode
  });

  test("login page renders", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByPlaceholder("you@example.com")).toBeVisible();
    await expect(page.getByPlaceholder("Enter your password")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Sign In" }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign up" })).toBeVisible();
  });

  test("unauthenticated user redirected from dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL(/\/login/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test("signout redirects to homepage", async ({ page }) => {
    await signup(page);
    if (isRemote()) {
      // On remote, email is required — test with signin
      test.skip();
      return;
    }
    await signout(page);
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("link", { name: "Sign In" })).toBeVisible();
  });

  test("signup shows free trial text", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByText("7-day free trial")).toBeVisible();
    await expect(page.getByText("No credit card required")).toBeVisible();
  });

  test("forgot-password page loads", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(
      page.getByPlaceholder("you@example.com"),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Send Reset Link" }),
    ).toBeVisible();
  });

  test("forgot-password form submission", async ({ page }) => {
    await page.goto("/forgot-password");
    await page
      .getByPlaceholder("you@example.com")
      .fill("e2e-nonexistent@tmm.dev");
    await page.getByRole("button", { name: "Send Reset Link" }).click();
    // Supabase always returns success (doesn't reveal if email exists)
    await expect(
      page.getByText("Check Your Email"),
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByRole("link", { name: "Back to sign in" }),
    ).toBeVisible();
  });

  test("terms and privacy pages render", async ({ page }) => {
    await page.goto("/terms");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.goto("/privacy");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("login with invalid credentials shows error", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("you@example.com").fill("wrong@email.com");
    await page.getByPlaceholder("Enter your password").fill("wrongpassword");
    await page.getByRole("button", { name: "Sign In" }).click();
    // Should stay on login page with an error
    await expect(page.getByText(/invalid/i)).toBeVisible({ timeout: 10000 });
  });
});
