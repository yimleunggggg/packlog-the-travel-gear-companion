import { describe, expect, it } from "vitest";
import type { Trip } from "@/lib/packlog-data";
import {
  assignableContainers,
  ensureUnassignedContainer,
  isUnassignedContainer,
  unassignedContainerId,
} from "@/lib/unassigned-container";

function tripWithOneBag(): Trip {
  return {
    id: "trip-1",
    title: "Test trip",
    destinations: [],
    days: 1,
    startDate: "2026.06.01",
    climate: "mild",
    scenario: "general",
    scenarios: ["general"],
    phase: "PACK",
    containers: [
      {
        id: "bag-1",
        code: "C-01",
        name: "Carry-on",
        type: "carry",
        capacityL: 35,
        maxKg: 10,
        items: [],
      },
    ],
  };
}

describe("unassigned container helpers", () => {
  it("keeps the internal bucket out of assignable bag targets", () => {
    const trip = ensureUnassignedContainer(tripWithOneBag());

    expect(trip.containers[0]?.id).toBe(unassignedContainerId(trip.id));
    expect(isUnassignedContainer(trip.containers[0]!, trip.id)).toBe(true);
    expect(assignableContainers(trip).map((container) => container.id)).toEqual(["bag-1"]);
  });
});
