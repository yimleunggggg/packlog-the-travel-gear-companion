import type { GearSpec } from "@/lib/packlog-data";
import type { Item } from "@/lib/packlog-data";

export const LIBRARY_CATEGORY_ORDER: readonly Item["category"][] = [
  "tech",
  "apparel",
  "doc",
  "health",
  "optic",
  "misc",
];

export type CategoryAggregate = {
  category: Item["category"];
  gearCount: number;
  reviewCount: number;
  /** Distinct trips that left a review on gear in this category. */
  uniqueTripIds: Set<string>;
  verdicts: { keep: number; upgrade: number; drop: number };
  utilitySum: number;
  utilityCount: number;
};

export function emptyCategoryAggregate(category: Item["category"]): CategoryAggregate {
  return {
    category,
    gearCount: 0,
    reviewCount: 0,
    uniqueTripIds: new Set(),
    verdicts: { keep: 0, upgrade: 0, drop: 0 },
    utilitySum: 0,
    utilityCount: 0,
  };
}

/** Aggregate gear library usage / verdicts by item category (all history rows). */
export function aggregateGearLibraryByCategory(
  library: GearSpec[],
): Map<Item["category"], CategoryAggregate> {
  const map = new Map<Item["category"], CategoryAggregate>();
  for (const c of LIBRARY_CATEGORY_ORDER) {
    map.set(c, emptyCategoryAggregate(c));
  }

  for (const g of library) {
    const agg = map.get(g.category);
    if (!agg) continue;
    agg.gearCount += 1;
    for (const h of g.history) {
      agg.reviewCount += 1;
      agg.uniqueTripIds.add(h.tripId);
      agg.verdicts[h.verdict] += 1;
      agg.utilitySum += h.utility;
      agg.utilityCount += 1;
    }
  }

  return map;
}

export type LibraryInsightsSnapshot = {
  totalReviews: number;
  uniqueTripCount: number;
  verdicts: { keep: number; upgrade: number; drop: number };
  /** Category with highest average ★ utility among those with ≥1 review (tie → more reviews). */
  highlight: {
    category: Item["category"];
    avgUtility: number;
    reviewCount: number;
  } | null;
};

/** Cross-trip summary for the insights banner (not single-trip). */
export function summarizeLibraryInsights(library: GearSpec[]): LibraryInsightsSnapshot {
  const byCat = aggregateGearLibraryByCategory(library);
  const allTripIds = new Set<string>();
  let totalReviews = 0;
  const verdicts = { keep: 0, upgrade: 0, drop: 0 };

  for (const agg of byCat.values()) {
    totalReviews += agg.reviewCount;
    for (const id of agg.uniqueTripIds) allTripIds.add(id);
    verdicts.keep += agg.verdicts.keep;
    verdicts.upgrade += agg.verdicts.upgrade;
    verdicts.drop += agg.verdicts.drop;
  }

  let highlight: LibraryInsightsSnapshot["highlight"] = null;
  let bestScore = -1;
  for (const c of LIBRARY_CATEGORY_ORDER) {
    const a = byCat.get(c)!;
    if (a.reviewCount === 0) continue;
    const avg = a.utilityCount > 0 ? a.utilitySum / a.utilityCount : 0;
    const score = avg * 1000 + a.reviewCount;
    if (score > bestScore) {
      bestScore = score;
      highlight = {
        category: c,
        avgUtility: Math.round(avg * 10) / 10,
        reviewCount: a.reviewCount,
      };
    }
  }

  return {
    totalReviews,
    uniqueTripCount: allTripIds.size,
    verdicts,
    highlight,
  };
}

export function avgUtilityForCategory(agg: CategoryAggregate): number | null {
  if (agg.utilityCount === 0) return null;
  return Math.round((agg.utilitySum / agg.utilityCount) * 10) / 10;
}

/** Mini verdict counts for one gear row (replace single “last trip” line). */
export function verdictCountsForGear(g: GearSpec): { keep: number; upgrade: number; drop: number } {
  const v = { keep: 0, upgrade: 0, drop: 0 };
  for (const h of g.history) {
    v[h.verdict] += 1;
  }
  return v;
}
