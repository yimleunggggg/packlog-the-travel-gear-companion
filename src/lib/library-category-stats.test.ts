import { describe, expect, it } from "vitest";
import type { GearSpec } from "@/lib/packlog-data";
import {
  aggregateGearLibraryByCategory,
  summarizeLibraryInsights,
  verdictCountsForGear,
} from "@/lib/library-category-stats";

describe("aggregateGearLibraryByCategory", () => {
  it("sums verdicts and trips per category", () => {
    const library: GearSpec[] = [
      {
        id: "a",
        name: "A",
        weightG: 100,
        category: "optic",
        description: "",
        ownedSince: "2024.01",
        ownership: "owned",
        history: [
          {
            tripId: "T1",
            tripTitle: "T1",
            date: "2024.01",
            verdict: "keep",
            utility: 5,
            note: "",
          },
          {
            tripId: "T2",
            tripTitle: "T2",
            date: "2024.02",
            verdict: "drop",
            utility: 1,
            note: "",
          },
        ],
      },
      {
        id: "b",
        name: "B",
        weightG: 50,
        category: "optic",
        description: "",
        ownedSince: "2024.01",
        ownership: "owned",
        history: [
          { tripId: "T1", tripTitle: "T1", date: "2024.01", verdict: "keep", utility: 5, note: "" },
        ],
      },
    ];
    const map = aggregateGearLibraryByCategory(library);
    const o = map.get("optic")!;
    expect(o.gearCount).toBe(2);
    expect(o.reviewCount).toBe(3);
    expect(o.uniqueTripIds.size).toBe(2);
    expect(o.verdicts.keep).toBe(2);
    expect(o.verdicts.drop).toBe(1);
  });
});

describe("summarizeLibraryInsights", () => {
  it("returns zeros for empty library", () => {
    const s = summarizeLibraryInsights([]);
    expect(s.totalReviews).toBe(0);
    expect(s.uniqueTripCount).toBe(0);
    expect(s.highlight).toBe(null);
  });
});

describe("verdictCountsForGear", () => {
  it("aggregates history verdicts", () => {
    const g: GearSpec = {
      id: "x",
      name: "x",
      weightG: 1,
      category: "misc",
      description: "",
      ownedSince: "2024.01",
      ownership: "owned",
      history: [
        { tripId: "a", tripTitle: "", date: "", verdict: "keep", utility: 5, note: "" },
        { tripId: "b", tripTitle: "", date: "", verdict: "keep", utility: 4, note: "" },
        { tripId: "c", tripTitle: "", date: "", verdict: "upgrade", utility: 3, note: "" },
      ],
    };
    expect(verdictCountsForGear(g)).toEqual({ keep: 2, upgrade: 1, drop: 0 });
  });
});
