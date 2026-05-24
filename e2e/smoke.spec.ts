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

  test("Unassigned items stay visible in pack checklist", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => {
      window.localStorage.setItem("packlog.lang", "en");
      window.localStorage.setItem(
        "packlog.snapshot.v1",
        JSON.stringify({
          version: 1,
          updatedAt: new Date().toISOString(),
          library: [],
          trips: [
            {
              id: "TRP-E2E",
              title: "E2E unassigned trip",
              destinations: [],
              days: 2,
              startDate: "2026.06.01",
              climate: "mild",
              scenario: "alpine",
              scenarios: ["alpine"],
              phase: "PACK",
              containers: [
                {
                  id: "TRP-E2E-unassigned",
                  code: "C-00",
                  name: "Unassigned",
                  nameZh: "待分类",
                  type: "custom",
                  capacityL: 40,
                  maxKg: 50,
                  items: [
                    {
                      id: "i-antiseptic-wipes",
                      gearId: null,
                      name: "Antiseptic wipes",
                      nameEn: "Antiseptic wipes",
                      nameZh: "消毒湿巾",
                      qty: 1,
                      weightG: 28,
                      weightSource: "library",
                      category: "health",
                      status: "todo",
                      verdict: null,
                      utility: null,
                      ownership: "owned",
                    },
                  ],
                },
                {
                  id: "c-pack",
                  code: "C-01",
                  name: "Main pack",
                  type: "hike",
                  capacityL: 45,
                  maxKg: 12,
                  items: [],
                },
              ],
            },
          ],
        }),
      );
    });

    await page.goto("/trip/TRP-E2E/pack");

    await expect(page.getByText("Antiseptic wipes", { exact: false })).toBeVisible();
    await expect(page.getByText("Unassigned", { exact: false }).first()).toBeVisible();
  });
});
