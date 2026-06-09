import type { Page } from "@playwright/test";

let counter = 0;

function uniqueEmail(): string {
  return `e2e-${Date.now()}-${++counter}@tmm.dev`;
}

export async function signup(page: Page): Promise<string> {
  const email = uniqueEmail();
  await page.goto("/signup");
  await page.getByPlaceholder("jamie@example.com").fill(email);
  await page.getByPlaceholder("Create a strong password").fill("testpassword123");
  await page.getByRole("button", { name: "Start Free Trial" }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 15000 });
  // Wait for dashboard heading to confirm full render
  await page.getByRole("heading", { name: "Your Watchlists" }).waitFor({ timeout: 10000 });
  return email;
}

export async function signin(page: Page, email: string): Promise<void> {
  await page.goto("/login");
  await page.getByPlaceholder("you@example.com").fill(email);
  await page.getByPlaceholder("Enter your password").fill("testpassword123");
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 15000 });
  await page.getByRole("heading", { name: "Your Watchlists" }).waitFor({ timeout: 10000 });
}

export async function signout(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Sign Out" }).click();
  await page.waitForURL("/");
}

export async function createWatchlist(page: Page, name: string): Promise<void> {
  await page.getByPlaceholder(/Australian Banks/).fill(name);
  await page.getByRole("button", { name: "Add Watchlist" }).click();
  await page.waitForTimeout(500);
}

export async function addTicker(page: Page, code: string): Promise<void> {
  await page.getByPlaceholder("Add ticker (e.g. BHP)").fill(code);
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await page.waitForTimeout(500);
}

export async function removeTicker(page: Page, code: string): Promise<void> {
  await page.getByRole("button", { name: `Remove ${code}` }).click();
  await page.waitForTimeout(500);
}
