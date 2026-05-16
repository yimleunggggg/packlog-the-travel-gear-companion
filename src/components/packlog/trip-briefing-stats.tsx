import { motion } from "framer-motion";
import type { Trip } from "@/lib/packlog-data";
import { formatKgFromGrams } from "@/lib/weight-provenance";
import { cn } from "@/lib/utils";

export function BriefingStatsAndProgress({
  layout,
  t,
  packedItems,
  totalItems,
  totalKg,
  baseG,
  pct,
  trip,
  depLabel,
  depStatValue,
}: {
  layout: "mobile" | "sidebar";
  t: (key: string) => string;
  packedItems: number;
  totalItems: number;
  totalKg: number;
  baseG: number;
  pct: number;
  trip: Trip;
  depLabel: string;
  depStatValue: string;
}) {
  const massDisplay = layout === "mobile" ? `${totalKg.toFixed(1)}kg` : `${totalKg.toFixed(2)}KG`;

  return (
    <>
      <div
        className={cn(
          "grid gap-px overflow-hidden rounded-md border border-border bg-border",
          layout === "mobile" ? "grid-cols-2" : "grid-cols-2 md:grid-cols-4",
        )}
      >
        <Stat
          label={t("brief.stat.items")}
          value={`${packedItems}/${totalItems}`}
          accent
          layout={layout}
        />
        <Stat label={t("brief.stat.mass")} value={massDisplay} layout={layout} />
        <Stat
          label={t("brief.stat.bags")}
          value={String(trip.containers.length).padStart(2, "0")}
          layout={layout}
        />
        <Stat label={depLabel} value={depStatValue} layout={layout} />
      </div>

      {layout === "mobile" ? (
        <div className="mt-3 space-y-2">
          <div className="flex min-h-[var(--touch-target)] items-center gap-2">
            <span className="sr-only">{t("brief.load")}</span>
            <div className="relative h-2 min-w-0 flex-1 overflow-hidden rounded bg-surface-3">
              <motion.div
                className={`absolute inset-y-0 left-0 ${pct >= 100 ? "bg-success" : "bg-signal"}`}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1, ease: [0.2, 0.8, 0.2, 1] }}
              />
            </div>
            <div className="shrink-0 tabular-nums [font-family:var(--font-weight-number-family)] [font-size:var(--font-weight-number-size)]">
              <span className={pct >= 100 ? "text-success" : "text-signal"}>{packedItems}</span>
              <span className="text-muted-foreground">/{totalItems}</span>
              <span className="text-muted-foreground"> · </span>
              <span className="text-signal">{totalKg.toFixed(1)}kg</span>
            </div>
          </div>
          <p className="[font-family:var(--font-weight-number-family)] [font-size:var(--font-weight-number-size)] tabular-nums text-[var(--text-secondary)]">
            {t("brief.stat.baseMass")} {formatKgFromGrams(baseG)}kg
          </p>
        </div>
      ) : (
        <>
          <div className="mt-3 flex items-center gap-3">
            <span className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground">
              {t("brief.load")}
            </span>
            <div className="relative h-2 flex-1 overflow-hidden rounded bg-surface-3">
              <motion.div
                className={`absolute inset-y-0 left-0 ${pct >= 100 ? "bg-success" : "bg-signal"}`}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1, ease: [0.2, 0.8, 0.2, 1] }}
              />
            </div>
            <div className="font-mono text-sm tabular-nums">
              <span className={pct >= 100 ? "text-success" : "text-signal"}>{Math.round(pct)}</span>
              <span className="text-muted-foreground">%</span>
            </div>
          </div>
        </>
      )}

      {pct >= 100 && totalItems > 0 ? (
        <p className="mt-2 font-mono text-xs text-success">{t("brief.readyToGo")}</p>
      ) : null}
    </>
  );
}

function Stat({
  label,
  value,
  accent,
  layout,
}: {
  label: string;
  value: string;
  accent?: boolean;
  layout: "mobile" | "sidebar";
}) {
  return (
    <div
      className={cn(
        "bg-surface px-3 md:px-4",
        layout === "mobile"
          ? "flex min-h-[var(--item-row-height)] flex-col justify-center py-2"
          : "py-3 md:py-4",
      )}
    >
      <div className="font-mono text-[9px] tracking-[0.22em] text-muted-foreground">{label}</div>
      <div
        className={cn(
          "mt-1 font-display font-bold tabular-nums tracking-tight",
          layout === "mobile" ? "text-lg" : "text-xl md:text-2xl",
          accent ? "text-signal" : "text-foreground",
        )}
      >
        {value}
      </div>
    </div>
  );
}
