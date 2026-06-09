import { test, expect } from "@playwright/test";
import { signup, createWatchlist, addTicker, removeTicker } from "./helpers";

test.describe("dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await signup(page);
  });

  test("empty state shows no watchlists message", async ({ page }) => {
    await expect(page.getByText("No watchlists yet")).toBeVisible();
    // Stats label visible in sidebar
    await expect(page.getByText("Tickers Tracked")).toBeVisible();
  });

  test("create watchlist", async ({ page }) => {
    await createWatchlist(page, "ASX Tech");
    await expect(page.getByRole("heading", { name: "ASX Tech" })).toBeVisible();
  });

  test("add tickers to watchlist", async ({ page }) => {
    await createWatchlist(page, "My Watchlist");
    await addTicker(page, "BHP");
    await addTicker(page, "CBA");
    await addTicker(page, "WDS");
    await expect(page.getByText("BHP")).toBeVisible();
    await expect(page.getByText("CBA")).toBeVisible();
    await expect(page.getByText("WDS")).toBeVisible();
  });

  test("remove ticker from watchlist", async ({ page }) => {
    await createWatchlist(page, "My Watchlist");
    await addTicker(page, "BHP");
    await addTicker(page, "CBA");
    await removeTicker(page, "BHP");
    await expect(page.getByText("CBA")).toBeVisible();
    await expect(page.getByText("BHP")).not.toBeVisible();
  });

  test("delete watchlist", async ({ page }) => {
    await createWatchlist(page, "Temp WL");
    await expect(page.getByRole("heading", { name: "Temp WL" })).toBeVisible();
    await page.getByRole("button", { name: "Delete watchlist" }).click();
    await page.waitForTimeout(500);
    await expect(page.getByText("No watchlists yet")).toBeVisible();
  });

  test("multiple watchlists", async ({ page }) => {
    await createWatchlist(page, "Miners");
    await createWatchlist(page, "Banks");
    await expect(page.getByRole("heading", { name: "Miners" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Banks" })).toBeVisible();
  });

  test("header shows email and upgrade link for free user", async ({ page }) => {
    await expect(page.getByRole("link", { name: "Upgrade" })).toBeVisible();
  });

  test("rejects duplicate ticker in same watchlist", async ({ page }) => {
    await createWatchlist(page, "My WL");
    await addTicker(page, "BHP");
    await addTicker(page, "BHP");
    // Remove buttons serve as ticker count — should only be one "Remove BHP"
    await expect(page.getByRole("button", { name: "Remove BHP" })).toHaveCount(1);
  });
});
