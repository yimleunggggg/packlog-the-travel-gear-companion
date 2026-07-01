import { describe, expect, it } from "vitest";
import type { Trip } from "@/lib/packlog-data";
import { moveTripItem, removeTripItem } from "@/lib/packlog-commands";
import { filterSeedsNotInTrip, mergedScenarioSeedsForTrip } from "@/lib/packing-pool";
import { isUnassignedContainer, unassignedContainerId } from "@/lib/unassigned-container";

function diveTripWithItem(): Trip {
  return {
    id: "t1",
    title: "Dive test",
    destinations: [],
    days: 3,
    startDate: "2026.06.01",
    climate: "warm",
    scenario: "dive",
    scenarios: ["dive"],
    phase: "PACK",
    containers: [
      {
        id: "c1",
        code: "C-01",
        name: "Personal",
        type: "personal",
        capacityL: 20,
        maxKg: 8,
        items: [
          {
            id: "i-cert",
            gearId: null,
            name: "Passport + Cert Card",
            nameEn: "Passport + Cert Card",
            nameZh: "护照 + 潜水证",
            qty: 1,
            weightG: 75,
            category: "doc",
            status: "todo",
            verdict: null,
            utility: null,
            ownership: "owned",
          },
        ],
      },
    ],
  };
}

describe("removeTripItem", () => {
  it("records dismissed scenario seed when last matching item is removed", () => {
    const trip = diveTripWithItem();
    const merged = mergedScenarioSeedsForTrip(trip);
    expect(filterSeedsNotInTrip(trip, merged).some((s) => s.en === "Passport + Cert Card")).toBe(
      false,
    );

    const next = removeTripItem(trip, "c1", "i-cert");
    expect(next.containers[0]!.items).toHaveLength(0);
    expect(next.dismissedScenarioSeeds).toContain("passport + cert card");

    const mergedAfter = mergedScenarioSeedsForTrip(next);
    expect(
      filterSeedsNotInTrip(next, mergedAfter).some((s) => s.en === "Passport + Cert Card"),
    ).toBe(false);
  });

  it("does not dismiss when another item still matches the seed English key", () => {
    const trip = diveTripWithItem();
    const trip2: Trip = {
      ...trip,
      containers: trip.containers.map((c) =>
        c.id !== "c1"
          ? c
          : {
              ...c,
              items: [
                ...c.items,
                {
                  id: "i-dup",
                  gearId: null,
                  name: "Passport + Cert Card",
                  nameEn: "Passport + Cert Card",
                  nameZh: "副本",
                  qty: 1,
                  weightG: 75,
                  category: "doc",
                  status: "todo",
                  verdict: null,
                  utility: null,
                  ownership: "owned",
                },
              ],
            },
      ),
    };

    const next = removeTripItem(trip2, "c1", "i-cert");
    expect(next.containers[0]!.items).toHaveLength(1);
    expect(next.dismissedScenarioSeeds).toBeUndefined();
  });
});

describe("moveTripItem", () => {
  it("does not remove the item when the target container is missing", () => {
    const trip = diveTripWithItem();

    const next = moveTripItem(trip, "c1", "i-cert", "missing-container");

    expect(next).toBe(trip);
    expect(next.containers[0]!.items.map((item) => item.id)).toEqual(["i-cert"]);
  });

  it("creates the unassigned container before moving into it", () => {
    const trip = diveTripWithItem();
    const targetId = unassignedContainerId(trip.id);

    const next = moveTripItem(trip, "c1", "i-cert", targetId);
    const unassigned = next.containers.find((container) =>
      isUnassignedContainer(container, trip.id),
    );

    expect(unassigned?.items.map((item) => item.id)).toEqual(["i-cert"]);
    expect(next.containers.find((container) => container.id === "c1")?.items).toHaveLength(0);
  });
});
