import type { Container, Item, Trip } from "./packlog-data";
import type { ScenarioKey, SeedItem } from "./scenario-templates";
import { scenarioTemplates } from "./scenario-templates";
import { tripScenarios } from "./trip-scenarios";

export const POOL_SEED_MIME = "application/x-packlog-pool-seed" as const;
/** Drag-move payload for trip items (same as ContainerModule). */
export const PACKLOG_ITEM_MIME = "application/x-packlog-item" as const;

export type PoolGroupKey =
  | "documents"
  | "sleep_camp"
  | "apparel"
  | "tech"
  | "health"
  | "optic"
  | "misc";

export const POOL_GROUP_ORDER: readonly PoolGroupKey[] = [
  "documents",
  "sleep_camp",
  "apparel",
  "tech",
  "health",
  "optic",
  "misc",
];

const SLEEP_CAMP_KEYS = [
  "tent",
  "tarps",
  "tarp",
  "groundsheet",
  "sleeping bag",
  "sleep pad",
  "sleeping pad",
  "sleeping mat",
  "air mattress",
  "bivy",
  "bivvy",
  "hammock",
  "stakes",
  "pegs",
  "guy line",
  "篷",
  "帐篷",
  "地布",
  "防潮垫",
  "睡袋",
  "气垫",
  "吊床",
  "地钉",
  "天幕",
];

function sleepCampMatch(seed: SeedItem): boolean {
  const hay = `${seed.en} ${seed.zh}`.toLowerCase();
  return SLEEP_CAMP_KEYS.some((k) => hay.includes(k));
}

export function poolGroupForSeed(seed: SeedItem): PoolGroupKey {
  if (sleepCampMatch(seed)) return "sleep_camp";
  switch (seed.category) {
    case "doc":
      return "documents";
    case "apparel":
      return "apparel";
    case "tech":
      return "tech";
    case "health":
      return "health";
    case "optic":
      return "optic";
    case "misc":
      return "misc";
  }
}

export function mergedScenarioSeedsForTrip(trip: Trip): SeedItem[] {
  const keys = tripScenarios(trip);
  const seen = new Set<string>();
  const out: SeedItem[] = [];
  for (const k of keys) {
    const list = scenarioTemplates[k as ScenarioKey] ?? [];
    for (const s of list) {
      const norm = s.en.trim().toLowerCase();
      if (seen.has(norm)) continue;
      seen.add(norm);
      out.push(s);
    }
  }
  return out;
}

export function itemNameKeys(it: Item): string[] {
  const keys = [it.name, it.nameEn, it.nameZh].filter(Boolean).map((s) => s!.trim().toLowerCase());
  return [...new Set(keys)];
}

/** If this scenario seed already exists on the trip, return where it lives. */
export function findTripItemForSeed(
  trip: Trip,
  seed: SeedItem,
): { container: Container; item: Item } | null {
  const key = seed.en.trim().toLowerCase();
  for (const c of trip.containers) {
    for (const it of c.items) {
      if (itemNameKeys(it).includes(key)) return { container: c, item: it };
    }
  }
  return null;
}

/** Seeds whose English template name is not already represented on any container item. */
export function filterSeedsNotInTrip(trip: Trip, seeds: SeedItem[]): SeedItem[] {
  const packed = new Set<string>();
  for (const c of trip.containers) {
    for (const it of c.items) {
      for (const k of itemNameKeys(it)) packed.add(k);
    }
  }
  const dismissed = new Set(
    (trip.dismissedScenarioSeeds ?? []).map((k) => k.trim().toLowerCase()).filter(Boolean),
  );
  return seeds.filter((s) => {
    const n = s.en.trim().toLowerCase();
    if (dismissed.has(n)) return false;
    return !packed.has(n);
  });
}

export function poolSeedToItemDraft(seed: SeedItem): Omit<Item, "id"> {
  return {
    gearId: null,
    name: seed.en,
    nameEn: seed.en,
    nameZh: seed.zh,
    qty: seed.qty ?? 1,
    weightG: seed.weightG,
    weightSource: "library",
    category: seed.category,
    status: "todo",
    verdict: null,
    utility: null,
    ownership: seed.ownership ?? "owned",
  };
}

export function groupSeedsByPool(seeds: SeedItem[]): Map<PoolGroupKey, SeedItem[]> {
  const map = new Map<PoolGroupKey, SeedItem[]>();
  for (const k of POOL_GROUP_ORDER) map.set(k, []);
  for (const s of seeds) {
    const g = poolGroupForSeed(s);
    map.get(g)!.push(s);
  }
  return map;
}
