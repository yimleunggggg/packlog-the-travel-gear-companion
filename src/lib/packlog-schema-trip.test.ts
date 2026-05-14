import { describe, expect, it } from "vitest";
import { tripSchema } from "@/lib/packlog-schema";

const minimalDest = {
  id: "city-1",
  countryId: "c1",
  regionId: "reg",
  cityEn: "X",
  cityZh: "X",
  countryFlag: "🏳️",
};

const minimalContainer = {
  id: "c1",
  code: "C-01",
  name: "Bag",
  type: "checked" as const,
  capacityL: 40,
  maxKg: 23,
  items: [] as const,
};

function legacyTrip() {
  return {
    id: "TRP-legacy",
    title: "Legacy",
    destinations: [minimalDest],
    days: 1,
    startDate: "2026.05.01",
    climate: "ok",
    scenario: "general",
    phase: "PACK" as const,
    containers: [minimalContainer],
  };
}

describe("tripSchema preprocess", () => {
  it("fills scenarios from legacy scenario-only payload", () => {
    const parsed = tripSchema.parse(legacyTrip());
    expect(parsed.scenario).toBe("general");
    expect(parsed.scenarios).toEqual(["general"]);
  });

  it("syncs primary scenario to first scenarios entry", () => {
    const parsed = tripSchema.parse({
      ...legacyTrip(),
      scenarios: ["dive", "general"],
      scenario: "ignored",
    });
    expect(parsed.scenario).toBe("dive");
    expect(parsed.scenarios).toEqual(["dive", "general"]);
  });
});
