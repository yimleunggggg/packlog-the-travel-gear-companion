import { describe, expect, it } from "vitest";
import type { Trip } from "@/lib/packlog-data";
import type { SeedItem } from "@/lib/scenario-templates";
import {
  filterSeedsNotInTrip,
  mergedScenarioSeedsForTrip,
  poolGroupForSeed,
  poolSeedToItemDraft,
} from "@/lib/packing-pool";

function minimalTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: "t1",
    title: "Test",
    destinations: [],
    days: 1,
    startDate: "2026.01.01",
    climate: "",
    scenario: "general",
    phase: "PACK",
    containers: [],
    ...overrides,
  };
}

describe("poolGroupForSeed", () => {
  it("puts shelter keywords into sleep_camp", () => {
    const seed: SeedItem = {
      en: "Tent 2P",
      zh: "双人帐篷",
      weightG: 1800,
      category: "misc",
    };
    expect(poolGroupForSeed(seed)).toBe("sleep_camp");
  });

  it("routes doc category to documents", () => {
    const seed: SeedItem = {
      en: "Passport",
      zh: "护照",
      weightG: 60,
      category: "doc",
    };
    expect(poolGroupForSeed(seed)).toBe("documents");
  });
});

describe("mergedScenarioSeedsForTrip", () => {
  it("dedupes by English name across scenarios", () => {
    const trip = minimalTrip({
      scenarios: ["general", "workation"],
      scenario: "general",
    });
    const seeds = mergedScenarioSeedsForTrip(trip);
    const passports = seeds.filter((s) => s.en === "Passport");
    expect(passports.length).toBe(1);
  });
});

describe("filterSeedsNotInTrip", () => {
  it("hides seeds listed in trip.dismissedScenarioSeeds", () => {
    const trip = minimalTrip({
      scenarios: ["dive"],
      scenario: "dive",
      dismissedScenarioSeeds: ["dive logbook"],
      containers: [],
    });
    const merged = mergedScenarioSeedsForTrip(trip);
    expect(merged.some((s) => s.en === "Dive Logbook")).toBe(true);
    const rest = filterSeedsNotInTrip(trip, merged);
    expect(rest.some((s) => s.en === "Dive Logbook")).toBe(false);
  });

  it("hides seeds whose English name matches an existing item", () => {
    const trip = minimalTrip({
      containers: [
        {
          id: "c1",
          code: "C-01",
          name: "Checked",
          type: "checked",
          capacityL: 80,
          maxKg: 23,
          items: [
            {
              id: "i1",
              gearId: null,
              name: "Passport",
              nameEn: "Passport",
              nameZh: "护照",
              qty: 1,
              weightG: 60,
              category: "doc",
              status: "todo",
              verdict: null,
              utility: null,
              ownership: "owned",
            },
          ],
        },
      ],
    });
    const merged = mergedScenarioSeedsForTrip(trip);
    const rest = filterSeedsNotInTrip(trip, merged);
    expect(rest.some((s) => s.en === "Passport")).toBe(false);
  });
});

describe("poolSeedToItemDraft", () => {
  it("matches makeFreshTrip seeding shape", () => {
    const seed: SeedItem = {
      en: "Power Bank 10K",
      zh: "充电宝 10K",
      weightG: 220,
      category: "tech",
      qty: 1,
    };
    expect(poolSeedToItemDraft(seed)).toMatchObject({
      name: "Power Bank 10K",
      nameEn: "Power Bank 10K",
      nameZh: "充电宝 10K",
      qty: 1,
      weightG: 220,
      weightSource: "library",
      category: "tech",
      status: "todo",
      ownership: "owned",
    });
  });
});
