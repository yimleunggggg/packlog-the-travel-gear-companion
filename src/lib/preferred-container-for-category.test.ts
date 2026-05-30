import { describe, expect, it } from "vitest";
import type { Trip } from "@/lib/packlog-data";
import { preferredContainerForCategory } from "@/lib/preferred-container-for-category";
import { ensureUnassignedContainer, unassignedContainerId } from "@/lib/unassigned-container";

function tripWithUnassignedFirst(): Trip {
  return ensureUnassignedContainer({
    id: "t1",
    title: "Default target test",
    destinations: [],
    days: 2,
    startDate: "2026.06.01",
    climate: "warm",
    scenario: "general",
    scenarios: ["general"],
    phase: "PACK",
    containers: [
      {
        id: "bag-1",
        code: "C-01",
        name: "Checked Bag",
        type: "checked",
        capacityL: 40,
        maxKg: 23,
        items: [],
      },
    ],
  });
}

describe("preferredContainerForCategory", () => {
  it("does not route new items to the unassigned bucket by default", () => {
    const trip = tripWithUnassignedFirst();

    expect(trip.containers[0]?.id).toBe(unassignedContainerId(trip.id));
    expect(preferredContainerForCategory(trip, "misc")?.id).toBe("bag-1");
  });
});
