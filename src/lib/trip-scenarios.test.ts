import { describe, expect, it } from "vitest";
import { primaryScenario, tripMatchesTemplateScenario, tripScenarios } from "@/lib/trip-scenarios";
import type { Trip } from "@/lib/packlog-data";

function baseTrip(over: Partial<Trip> = {}): Trip {
  return {
    id: "TRP-1",
    title: "T",
    destinations: [
      {
        id: "city",
        countryId: "jp",
        regionId: "r",
        cityEn: "Tokyo",
        cityZh: "东京",
        countryFlag: "🇯🇵",
      },
    ],
    days: 3,
    startDate: "2026.01.01",
    climate: "mild",
    scenario: "general",
    phase: "PACK",
    containers: [],
    ...over,
  };
}

describe("tripScenarios", () => {
  it("falls back to single scenario when scenarios absent", () => {
    expect(tripScenarios(baseTrip({ scenario: "dive" }))).toEqual(["dive"]);
  });

  it("uses scenarios array when present", () => {
    expect(
      tripScenarios(
        baseTrip({
          scenario: "dive",
          scenarios: ["general", "dive"],
        }),
      ),
    ).toEqual(["general", "dive"]);
  });
});

describe("primaryScenario", () => {
  it("returns first tag", () => {
    expect(primaryScenario(baseTrip({ scenarios: ["ski", "general"] }))).toBe("ski");
  });
});

describe("tripMatchesTemplateScenario", () => {
  it("matches Trip by any tag", () => {
    const trip = baseTrip({ scenarios: ["winter-city", "dive"] });
    expect(tripMatchesTemplateScenario(trip, "dive")).toBe(true);
    expect(tripMatchesTemplateScenario(trip, "ski")).toBe(false);
  });

  it("accepts raw tag list", () => {
    expect(tripMatchesTemplateScenario(["general"], "general")).toBe(true);
  });
});
