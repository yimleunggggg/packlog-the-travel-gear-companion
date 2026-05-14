import { describe, expect, it, vi } from "vitest";
import { makeFreshTrip } from "@/lib/packlog-data";
import type { SelectedDestination } from "@/lib/destinations";

const dest: SelectedDestination = {
  id: "x",
  countryId: "c",
  regionId: "r",
  cityEn: "Y",
  cityZh: "Y",
  countryFlag: "🏳️",
};

describe("makeFreshTrip multi-scenario dedupe", () => {
  it("merges seeds without duplicate English names across scenarios", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.12345);
    const trip = makeFreshTrip({
      title: "Test",
      destinations: [dest],
      days: 2,
      startDate: "2026.06.01",
      climate: "warm",
      scenarios: ["general", "workation"],
    });
    vi.restoreAllMocks();

    const names = trip.containers.flatMap((c) => c.items.map((i) => i.name.toLowerCase()));
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);

    const adapters = trip.containers
      .flatMap((c) => c.items)
      .filter((i) => i.name === "Travel Adapter");
    expect(adapters).toHaveLength(1);

    expect(trip.scenario).toBe("general");
    expect(trip.scenarios).toEqual(["general", "workation"]);
  });
});
