import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import type { Trip } from "@/lib/packlog-data";
import { useI18n } from "@/lib/i18n";
import { tripTitleDisplay } from "@/lib/trip-list-label";
import { packlogBtnBlock, packlogBtnPrimary, packlogPageTitle } from "@/lib/packlog-button-classes";
import { cn } from "@/lib/utils";

export function TripPackOverviewLite({
  trip,
  onBack,
  onEnterReview,
}: {
  trip: Trip;
  onBack: () => void;
  onEnterReview: () => void;
}) {
  const { t, lang } = useI18n();

  const totalItems = trip.containers.reduce((s, c) => s + c.items.length, 0);
  const packedItems = trip.containers.reduce(
    (s, c) => s + c.items.filter((i) => i.status === "packed").length,
    0,
  );
  const pct = totalItems ? (packedItems / totalItems) * 100 : 0;

  return (
    <section className="module corner-tick corner-tick-br mx-auto max-w-lg overflow-hidden">
      <div className="p-[var(--card-padding)] md:p-8">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[var(--touch-target)] min-w-[var(--touch-target)] px-1 text-left font-mono text-[10px] tracking-[0.2em] text-[#6B5234] hover:underline"
        >
          {t("trip.overview.backTrips")}
        </button>

        <h1
          className={cn(
            packlogPageTitle,
            "mt-4 min-w-0 max-w-full break-words [overflow-wrap:anywhere]",
          )}
        >
          {tripTitleDisplay(trip, lang)}
        </h1>

        <div className="mt-6">
          <span className="sr-only">{t("brief.load")}</span>
          <div className="flex min-h-[var(--touch-target)] items-center gap-3">
            <div className="relative h-2.5 min-w-0 flex-1 overflow-hidden rounded bg-surface-3">
              <motion.div
                className={`absolute inset-y-0 left-0 ${pct >= 100 ? "bg-success" : "bg-signal"}`}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
              />
            </div>
            <div className="shrink-0 font-mono text-sm tabular-nums">
              <span className={pct >= 100 ? "text-success" : "text-signal"}>{packedItems}</span>
              <span className="text-muted-foreground">/{totalItems}</span>
              <span className="text-muted-foreground"> · </span>
              <span className={pct >= 100 ? "text-success" : "text-signal"}>
                {Math.round(pct)}%
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-3">
          <Link
            id="trip-overview-pack-cta"
            to="/trip/$tripId/pack"
            params={{ tripId: trip.id }}
            className={cn(packlogBtnPrimary, packlogBtnBlock, "py-3.5 text-[12px]")}
          >
            {t("trip.overview.startPacking")}
          </Link>
          <button
            type="button"
            onClick={onEnterReview}
            className="w-full py-2 text-center font-mono text-[10px] tracking-[0.18em] text-[#6B5234] underline decoration-[#6B5234]/50 underline-offset-2 hover:text-foreground"
          >
            {t("trip.cta.enterReview")}
          </button>
        </div>
      </div>
    </section>
  );
}
