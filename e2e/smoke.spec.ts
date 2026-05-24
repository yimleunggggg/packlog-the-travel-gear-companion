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

  test("community items added to Unassigned stay visible in pack checklist", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/community/rei-first-aid-checklist");

    await page.getByRole("button", { name: "Select all" }).click();
    await page.getByRole("button", { name: "Add to trip" }).click();
    await page.goto("/trip/TRP-0421/pack");

    await expect(page.getByText("Antiseptic wipes", { exact: false })).toBeVisible();
    await expect(page.getByText("Unassigned", { exact: false }).first()).toBeVisible();
  });
});
