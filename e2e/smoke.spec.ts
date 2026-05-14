import { expect, test } from "@playwright/test";

test.describe("smoke", () => {
  test("home archive loads", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/PACKLOG/i);
    await expect(page.locator("main")).toBeVisible();
  });

  test("seed trip detail renders", async ({ page }) => {
    await page.goto("/trip/TRP-0421");
    await expect(page).toHaveURL(/TRP-0421/);
    await expect(page.locator("main")).toBeVisible();
  });

  test("gear library route loads", async ({ page }) => {
    await page.goto("/library");
    await expect(page).toHaveURL(/\/library$/);
    await expect(page.locator("main")).toBeVisible();
  });
});
