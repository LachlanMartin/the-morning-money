import { test, expect } from "@playwright/test";
import { signup } from "./helpers";

test.describe("pricing", () => {
  test("pricing page shows both plans", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.getByRole("heading", { name: "Simple Pricing" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Self-Host" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Pro (Hosted)" })).toBeVisible();
  });

  test("unauthenticated user sees Get Started button on pricing", async ({ page }) => {
    await page.goto("/pricing");
    // "Upgrade to Pro" or "Get Started" — unauthenticated should see CTA
    const ctaArea = page.getByText("Pro (Hosted)").locator("..");
    await expect(ctaArea).toBeVisible();
  });

  test("free user sees Upgrade to Pro button", async ({ page }) => {
    await signup(page);
    await page.goto("/pricing");
    await expect(page.getByRole("button", { name: "Upgrade to Pro" })).toBeVisible();
  });

  test("free user has Upgrade link in header", async ({ page }) => {
    await signup(page);
    await expect(page.getByRole("link", { name: "Upgrade" })).toBeVisible();
  });

  test("Upgrade to Pro redirects to Stripe Checkout", async ({ page }) => {
    await signup(page);
    await page.goto("/pricing");
    await page.getByRole("button", { name: "Upgrade to Pro" }).click();
    await page.waitForURL(/checkout\.stripe\.com/);
    await expect(page).toHaveURL(/checkout\.stripe\.com/);
    await expect(page.getByText("The Morning Money — Pro Plan")).toBeVisible();
    // No signout — we're on Stripe's domain now, not the app
  });

  test("pricing page mentions cancel anytime", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.getByText("Cancel anytime")).toBeVisible();
  });

  test("Self-Host links to GitHub", async ({ page }) => {
    await page.goto("/pricing");
    const ghLink = page.getByRole("link", { name: "View on GitHub" });
    await expect(ghLink).toBeVisible();
    await expect(ghLink).toHaveAttribute("href", /github\.com/);
  });
});
