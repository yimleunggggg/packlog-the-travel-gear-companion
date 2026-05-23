import { describe, expect, it } from "vitest";
import type { Trip } from "@/lib/packlog-data";
import { preferredContainerForCategory } from "@/lib/preferred-container-for-category";
import { ensureUnassignedContainer } from "@/lib/unassigned-container";

function tripWithBags(): Trip {
  return ensureUnassignedContainer({
    id: "t1",
    title: "Test",
    destinations: [],
    days: 1,
    startDate: "2026.01.01",
    climate: "warm",
    scenario: "general",
    scenarios: ["general"],
    phase: "PACK",
    containers: [
      {
        id: "checked",
        code: "C-01",
        name: "Checked bag",
        type: "checked",
        capacityL: 60,
        maxKg: 20,
        items: [],
      },
      {
        id: "personal",
        code: "C-02",
        name: "Personal bag",
        type: "personal",
        capacityL: 18,
        maxKg: 7,
        items: [],
      },
    ],
  });
}

describe("preferredContainerForCategory", () => {
  it("ignores the internal unassigned bucket when routing new gear", () => {
    const trip = tripWithBags();

    expect(trip.containers[0]!.id).toBe("t1-unassigned");
    expect(preferredContainerForCategory(trip, "doc")?.id).toBe("personal");
    expect(preferredContainerForCategory(trip, "misc")?.id).toBe("checked");
  });

  it("returns undefined when a trip only has the internal unassigned bucket", () => {
    const trip = ensureUnassignedContainer({ ...tripWithBags(), containers: [] });

    expect(preferredContainerForCategory(trip, "misc")).toBeUndefined();
  });
});
