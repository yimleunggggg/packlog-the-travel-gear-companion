import { describe, expect, it } from "vitest";
import type { CommunityTemplate, Trip } from "@/lib/packlog-data";
import { cloneCommunityTemplateToTrip, moveTripItem, removeTripItem } from "@/lib/packlog-commands";
import { filterSeedsNotInTrip, mergedScenarioSeedsForTrip } from "@/lib/packing-pool";
import { unassignedContainerId } from "@/lib/unassigned-container";

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
  it("keeps the source item when the target container no longer exists", () => {
    const trip: Trip = {
      ...diveTripWithItem(),
      containers: [
        ...diveTripWithItem().containers,
        {
          id: "c2",
          code: "C-02",
          name: "Carry",
          type: "carry",
          capacityL: 40,
          maxKg: 12,
          items: [],
        },
      ],
    };

    const next = moveTripItem(trip, "c1", "i-cert", "missing-container");

    expect(next).toBe(trip);
    expect(next.containers[0]!.items.map((item) => item.id)).toEqual(["i-cert"]);
  });
});

describe("cloneCommunityTemplateToTrip", () => {
  it("falls back to unassigned and ignores invalid item indexes", () => {
    const trip = diveTripWithItem();
    const template: CommunityTemplate = {
      id: "tpl",
      author: "tester",
      rating: 5,
      cloned: 0,
      title: "Template",
      scenario: "dive",
      climate: "warm",
      totalWeight: "0.1kg",
      tags: [],
      intro: "",
      items: [
        {
          name: "Mask",
          nameZh: "面镜",
          weightG: 120,
          qty: 1,
          category: "misc",
          why: "backup",
        },
      ],
    };

    const next = cloneCommunityTemplateToTrip(
      trip,
      template,
      [0, 9],
      "missing-container",
      "borrowed",
    );
    const unassigned = next.containers.find(
      (container) => container.id === unassignedContainerId(trip.id),
    );

    expect(unassigned?.items).toHaveLength(1);
    expect(unassigned?.items[0]).toMatchObject({
      name: "Mask",
      nameZh: "面镜",
      ownership: "borrowed",
    });
    expect(next.containers.find((container) => container.id === "c1")?.items).toHaveLength(1);
  });
});
