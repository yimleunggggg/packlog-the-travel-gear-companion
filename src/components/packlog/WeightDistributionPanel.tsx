import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";
import type { Item, PackSystemGroup, Trip } from "@/lib/packlog-data";
import { formatKgFromGrams } from "@/lib/weight-provenance";
import { tripAllItems, tripBaseGrams, tripBig3PctOfBase } from "@/lib/trip-weight-stats";
import {
  effectiveSystemGroup,
  isBig3Group,
  SYSTEM_GROUP_CHART_COLOR,
  tripUsesOutdoorSystemView,
} from "@/lib/packlog-system-groups";

const catColor: Record<Item["category"], string> = {
  tech: "var(--info)",
  apparel: "var(--signal)",
  doc: "var(--warn)",
  health: "var(--success)",
  optic: "var(--signal)",
  misc: "var(--muted-foreground)",
};

/** Weight breakdown — collapsed by default (trip detail sidebar). */
export function WeightDistributionPanel({ trip }: { trip: Trip }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  const outdoorSystemView = tripUsesOutdoorSystemView(trip);
  const weightItems = tripAllItems(trip);
  const totalGrams = weightItems.reduce((s, i) => s + i.weightG * i.qty, 0);
  const baseGrams = tripBaseGrams(trip);
  const big3Pct = tripBig3PctOfBase(trip);

  const byBucket = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const i of weightItems) {
      const key = outdoorSystemView ? effectiveSystemGroup(i) : i.category;
      acc[key] = (acc[key] ?? 0) + i.weightG * i.qty;
    }
    return acc;
  }, [weightItems, outdoorSystemView]);

  const buckets = useMemo(() => Object.entries(byBucket).sort((a, b) => b[1] - a[1]), [byBucket]);
  const pctDenom = totalGrams > 0 ? totalGrams : 1;

  const barColor = (key: string) => {
    if (outdoorSystemView) {
      return SYSTEM_GROUP_CHART_COLOR[key as PackSystemGroup] ?? "var(--muted-foreground)";
    }
    return catColor[key as Item["category"]] ?? "var(--muted-foreground)";
  };

  const rowLabel = (key: string) => {
    if (outdoorSystemView) return t(`sysGroup.${key}`);
    return t(`cat.${key}`);
  };

  return (
    <section className="module corner-tick relative p-5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <div className="min-w-0">
          <div className="font-mono text-[10px] tracking-[0.22em] text-signal">
            {t("param.distribution")}
            {outdoorSystemView ? (
              <span className="ml-2 text-muted-foreground">
                · {t("param.distribution.systemView")}
              </span>
            ) : null}
          </div>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
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
        </div>
        <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
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
            {buckets.map(([key, w]) => {
              const big3 = outdoorSystemView && isBig3Group(key as PackSystemGroup);
              return (
                <li key={key} className="flex items-center justify-between font-mono text-[11px]">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="h-2 w-2 shrink-0" style={{ background: barColor(key) }} />
                    <span
                      className={`truncate text-muted-foreground ${big3 ? "font-medium text-foreground" : ""}`}
                    >
                      {rowLabel(key)}
                      {big3 ? (
                        <span className="ml-1.5 rounded border border-signal/40 px-1 text-[9px] text-signal">
                          {t("param.distribution.big3Badge")}
                        </span>
                      ) : null}
                    </span>
                  </div>
                  <span className="shrink-0 tabular-nums">
                    <span>{formatKgFromGrams(w)}kg</span>
                    <span className="ml-2 text-muted-foreground">
                      {Math.round((w / pctDenom) * 100)}%
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
