import type { Page } from "@playwright/test";

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
