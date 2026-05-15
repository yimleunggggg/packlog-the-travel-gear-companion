import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { Trip } from "@/lib/packlog-data";
import { formatKgFromGrams } from "@/lib/weight-provenance";
import { tripAllItems, tripBaseGrams, tripBig3PctOfBase } from "@/lib/trip-weight-stats";
import {
  itemPackDisplayGroup,
  packDisplayGroupLabel,
  packGroupOrder,
  PACK_DISPLAY_GROUP_CHART_COLOR,
  tripUsesOutdoorPackGrouping,
  type PackDisplayGroup,
} from "@/lib/pack-display-groups";
import { packlogCategoryHex } from "@/lib/packlog-category-colors";

/** Weight breakdown — collapsed by default (trip detail sidebar). */
export function WeightDistributionPanel({
  trip,
  overviewLayout = false,
}: {
  trip: Trip;
  /** Trip overview (mobile): one-line collapsed header + section rule. */
  overviewLayout?: boolean;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  const outdoorView = tripUsesOutdoorPackGrouping(trip);
  const weightItems = tripAllItems(trip);
  const totalGrams = weightItems.reduce((s, i) => s + i.weightG * i.qty, 0);
  const baseGrams = tripBaseGrams(trip);
  const big3Pct = tripBig3PctOfBase(trip);

  const byBucket = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const i of weightItems) {
      const key = outdoorView ? itemPackDisplayGroup(trip, i) : i.category;
      acc[key] = (acc[key] ?? 0) + i.weightG * i.qty;
    }
    return acc;
  }, [weightItems, outdoorView, trip]);

  const buckets = useMemo(() => {
    const entries = Object.entries(byBucket);
    if (!outdoorView) {
      return entries.sort((a, b) => b[1] - a[1]);
    }
    const order = packGroupOrder(trip);
    const idx = (k: string) => {
      const i = order.indexOf(k as PackDisplayGroup);
      return i === -1 ? 999 : i;
    };
    return entries.sort((a, b) => idx(a[0]) - idx(b[0]) || b[1] - a[1]);
  }, [byBucket, outdoorView, trip]);

  const pctDenom = totalGrams > 0 ? totalGrams : 1;

  const barColor = (key: string) => {
    if (outdoorView) {
      return PACK_DISPLAY_GROUP_CHART_COLOR[key as PackDisplayGroup] ?? "var(--muted-foreground)";
    }
    return packlogCategoryHex(key);
  };

  const rowLabel = (key: string) => {
    if (outdoorView) return packDisplayGroupLabel(t, key as PackDisplayGroup);
    return t(`cat.${key}`);
  };

  const showCompactCollapsed = overviewLayout && !open;

  return (
    <section className="module corner-tick relative p-5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-2 text-left"
      >
        <div className="min-w-0 flex-1">
          <div
            className={cn(
              "font-mono text-[10px] tracking-[0.22em] text-foreground",
              showCompactCollapsed && "max-md:hidden",
            )}
          >
            {t("param.distribution")}
            {outdoorView ? (
              <span className="ml-2 text-muted-foreground">
                · {t("param.distribution.systemView")}
              </span>
            ) : null}
          </div>
          <div
            className={cn(
              "mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1",
              showCompactCollapsed && "max-md:hidden",
            )}
          >
            <span className="font-mono text-2xl tabular-nums">{formatKgFromGrams(totalGrams)}</span>
            <span className="font-mono text-xs text-muted-foreground">{t("param.kg")}</span>
            <span className="font-mono text-xs text-muted-foreground">
              · {t("brief.stat.baseMass")} {formatKgFromGrams(baseGrams)}
            </span>
            {big3Pct != null ? (
              <span className="font-mono text-xs text-signal">
                · {t("brief.stat.big3OfBase").replace("{n}", String(big3Pct))}
              </span>
            ) : null}
          </div>

          {overviewLayout ? (
            <div className={cn("mt-3 hidden border-t border-border pt-3", !open && "max-md:block")}>
              <div className="font-mono text-[10px] tracking-[0.22em] text-muted-foreground">
                ── {t("param.distribution")} ──
              </div>
              <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1 [font-size:var(--font-label-size)] text-[var(--text-secondary)]">
                <span aria-hidden className="text-muted-foreground">
                  ▸
                </span>
                <span>{t("param.distribution.overviewTeaser")}</span>
                <span className="rounded border border-border-strong px-1.5 py-0.5 font-mono text-[10px] tracking-[0.12em] text-muted-foreground">
                  {t("param.distribution.expand")}
                </span>
              </div>
            </div>
          ) : null}
        </div>
        <span
          className={cn(
            "shrink-0 font-mono text-[10px] text-muted-foreground",
            showCompactCollapsed && "max-md:sr-only",
          )}
        >
          {open ? t("param.distribution.hide") : t("param.distribution.show")}
        </span>
      </button>

      {open && (
        <>
          <div className="mt-4 flex h-3 w-full overflow-hidden border border-border">
            {buckets.map(([key, w]) => (
              <motion.div
                key={key}
                initial={{ width: 0 }}
                animate={{ width: `${(w / pctDenom) * 100}%` }}
                transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
                style={{ background: barColor(key) }}
              />
            ))}
          </div>

          <ul className="mt-3 space-y-1.5">
            {buckets.map(([key, w]) => (
              <li key={key} className="flex items-center justify-between font-mono text-[11px]">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="h-2 w-2 shrink-0" style={{ background: barColor(key) }} />
                  <span className="truncate text-muted-foreground">{rowLabel(key)}</span>
                </div>
                <span className="shrink-0 tabular-nums">
                  <span>{formatKgFromGrams(w)}kg</span>
                  <span className="ml-2 text-muted-foreground">
                    {Math.round((w / pctDenom) * 100)}%
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
