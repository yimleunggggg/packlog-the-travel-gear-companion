import type { GearSpec, Item, Trip, WeightSource } from "./packlog-data";

function medianSorted(sorted: number[]): number {
  const n = sorted.length;
  if (n === 0) return 0;
  const mid = Math.floor(n / 2);
  return n % 2 === 1 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

function normBrand(b?: string): string {
  return (b ?? "").trim().toLowerCase();
}

/**
 * Heuristic reference interval when no brand/model is known (tier 2 fallback without API).
 * Optionally parses "35L" style capacity from the name for packs.
 */
export function heuristicAiEstimate(input: { category: Item["category"]; nameHint?: string }): {
  midG: number;
  lowG: number;
  highG: number;
} {
  const raw = input.nameHint ?? "";
  const vol = raw.match(/(\d+(?:\.\d+)?)\s*[lL][^\w]?/);
  const liters = vol ? Number(vol[1]) : null;

  const base: Record<Item["category"], [number, number]> = {
    tech: [200, 900],
    apparel: [150, 900],
    doc: [20, 120],
    health: [40, 350],
    optic: [50, 800],
    misc: [80, 1200],
  };

  let [lo, hi] = base[input.category];
  if (input.category === "misc" && liters != null && liters > 5 && liters <= 120) {
    const perL = 28;
    const mid = Math.round(liters * perL);
    const span = Math.round(mid * 0.18);
    return { midG: mid, lowG: Math.max(80, mid - span), highG: mid + span };
  }
  if (input.category === "apparel" && /靴|boot|鞋|shoe/i.test(raw)) {
    lo = 380;
    hi = 1400;
  }

  const mid = Math.round((lo + hi) / 2);
  const span = Math.round((hi - lo) / 2);
  return { midG: mid, lowG: Math.max(1, mid - span), highG: mid + span };
}

/**
 * Optional remote tier-2: POST JSON `{ category, nameHint }` → `{ midG, lowG, highG }`.
 * If unset or failing, falls back to {@link heuristicAiEstimate}.
 */
export async function resolveAiWeightEstimate(input: {
  category: Item["category"];
  nameHint?: string;
}): Promise<{ midG: number; lowG: number; highG: number }> {
  const url = typeof import.meta !== "undefined" ? import.meta.env?.VITE_WEIGHT_AI_URL : undefined;
  if (url && typeof fetch === "function") {
    try {
      const res = await fetch(String(url), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: input.category,
          nameHint: input.nameHint ?? "",
        }),
      });
      if (res.ok) {
        const j = (await res.json()) as { midG?: number; lowG?: number; highG?: number };
        if (
          typeof j.midG === "number" &&
          typeof j.lowG === "number" &&
          typeof j.highG === "number"
        ) {
          return { midG: j.midG, lowG: j.lowG, highG: j.highG };
        }
      }
    } catch {
      /* use heuristic */
    }
  }
  return heuristicAiEstimate(input);
}

function collectWeightsForProductKey(
  library: GearSpec[],
  trips: Trip[],
  ctx: { sku?: string; brand?: string; model?: string; category: Item["category"] },
): number[] {
  const out: number[] = [];
  const sku = ctx.sku?.trim();
  const b = normBrand(ctx.brand);
  const m = ctx.model?.trim().toLowerCase();

  if (sku) {
    for (const g of library) {
      if (g.category !== ctx.category) continue;
      if (g.sku === sku) out.push(g.weightG);
    }
    for (const trip of trips) {
      for (const c of trip.containers) {
        for (const it of c.items) {
          if (it.category !== ctx.category) continue;
          if (it.sku === sku) out.push(it.weightG);
        }
      }
    }
    return out;
  }

  if (b && m) {
    for (const g of library) {
      if (g.category !== ctx.category) continue;
      if (normBrand(g.brand) !== b) continue;
      const nm = ((g.nameEn ?? g.name) + " " + (g.nameZh ?? "")).toLowerCase();
      if (nm.includes(m)) out.push(g.weightG);
    }
    for (const trip of trips) {
      for (const c of trip.containers) {
        for (const it of c.items) {
          if (it.category !== ctx.category) continue;
          if (normBrand(it.brand) !== b) continue;
          const mm = (it.model ?? "").trim().toLowerCase();
          const nm = (it.nameEn ?? it.name ?? "").toLowerCase();
          if (mm === m || nm.includes(m)) out.push(it.weightG);
        }
      }
    }
  }

  return out;
}

/** Tier 3: median when ≥3 samples (same sku, or same brand+model in library/trips). */
export function communityMedianWeight(
  library: GearSpec[],
  trips: Trip[],
  ctx: { sku?: string; brand?: string; model?: string; category: Item["category"] },
): { medianG: number; n: number } | null {
  const weights = collectWeightsForProductKey(library, trips, ctx);
  if (weights.length < 3) return null;
  const sorted = [...weights].sort((a, b) => a - b);
  return { medianG: Math.round(medianSorted(sorted)), n: sorted.length };
}

export function itemWeightDisplayClasses(source?: WeightSource): string {
  if (source === "ai_estimate") return "italic text-muted-foreground";
  if (source === "community_median") return "font-medium text-[color:var(--info)]";
  return "";
}

export function formatItemWeightLine(item: Item): { text: string; prefixTilde: boolean } {
  const src = item.weightSource;
  const tilde = src === "ai_estimate" || src === "community_median";
  return { text: `${item.weightG}g`, prefixTilde: tilde };
}

/** Integer gram totals → stable 2-decimal kg string (avoids 815g displaying as 0.81 kg from float drift). */
export function formatKgFromGrams(totalG: number): string {
  if (!Number.isFinite(totalG) || totalG <= 0) return "0.00";
  return (Math.round(totalG / 10) / 100).toFixed(2);
}
