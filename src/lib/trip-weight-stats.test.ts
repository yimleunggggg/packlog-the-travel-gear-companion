import { describe, expect, it } from "vitest";
import type { Item, Trip } from "./packlog-data";
import {
  tripBaseGrams,
  tripConsumableGrams,
  tripTotalGrams,
  tripWornGrams,
} from "./trip-weight-stats";

function item(p: Partial<Item> & Pick<Item, "id" | "name" | "weightG">): Item {
  return {
    gearId: null,
    qty: 1,
    category: "misc",
    status: "todo",
    verdict: null,
    utility: null,
    ownership: "owned",
    ...p,
  };
}

describe("trip-weight-stats", () => {
  it("computes base weight minus worn and consumables", () => {
    const trip = {
      id: "t1",
      title: "Test",
      destinations: [],
      days: 1,
      startDate: "2026.01.01",
      climate: "—",
      scenario: "general",
      scenarios: ["general"],
      phase: "PACK",
      containers: [
        {
          id: "c1",
          code: "C1",
          name: "Bag",
          type: "carry" as const,
          capacityL: 30,
          maxKg: 10,
          items: [
            item({ id: "1", name: "A", weightG: 100 }),
            item({ id: "2", name: "B", weightG: 200, isWorn: true }),
            item({ id: "3", name: "C", weightG: 50, isConsumable: true }),
          ],
        },
      ],
    } satisfies Trip;

    expect(tripTotalGrams(trip)).toBe(350);
    expect(tripWornGrams(trip)).toBe(200);
    expect(tripConsumableGrams(trip)).toBe(50);
    expect(tripBaseGrams(trip)).toBe(100);
  });
});
