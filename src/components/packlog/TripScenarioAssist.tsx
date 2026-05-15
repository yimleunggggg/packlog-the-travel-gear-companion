import { useMemo } from "react";
import { useI18n } from "@/lib/i18n";
import type { Trip } from "@/lib/packlog-data";
import { scenarioSuggestions } from "@/lib/packlog-data";
import { tripScenarios } from "@/lib/trip-scenarios";
import { packlogCategoryHex } from "@/lib/packlog-category-colors";

/** Scenario tags + “don’t forget” suggestions — lives under the packing surface (`/pack` + desktop overview workspace). */
export function TripScenarioAssist({
  trip,
  onQuickAdd,
}: {
  trip: Trip;
  onQuickAdd?: (name: string, weightG: number, category: string) => void;
}) {
  const { t } = useI18n();
  const suggestions = useMemo(() => {
    const owned = new Set(trip.containers.flatMap((c) => c.items).map((i) => i.name.toLowerCase()));
    const seenSuggest = new Set<string>();
    return tripScenarios(trip)
      .flatMap((sc) => scenarioSuggestions[sc] ?? [])
      .filter((s) => {
        const k = s.name.toLowerCase();
        if (seenSuggest.has(k)) return false;
        seenSuggest.add(k);
        return !owned.has(k);
      });
  }, [trip]);

  return (
    <section className="module corner-tick relative p-5">
      <div className="flex flex-wrap gap-1">
        {tripScenarios(trip).map((sc) => (
          <span key={sc} className="tag-chip">
            {t(`scenario.${sc}`)}
          </span>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
        <div className="font-mono text-[10px] tracking-[0.22em] text-foreground">
          {t("param.suggest")}
        </div>
        <span className="tag-chip">N={suggestions.length}</span>
      </div>
      {t("param.suggest.tip").trim() ? (
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground md:text-[11px]">
          {t("param.suggest.tip")}
        </p>
      ) : null}

      {suggestions.length > 0 ? (
        <ul className="mt-3 divide-y divide-border border border-border">
          {suggestions.map((s) => (
            <li
              key={s.name}
              className="flex flex-col gap-3 bg-surface px-3 py-3 transition hover:bg-surface-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:py-2.5"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  className="h-2 w-2 shrink-0 rounded-[1px]"
                  style={{ background: packlogCategoryHex(s.category) }}
                />
                <span className="min-w-0 text-sm font-medium leading-snug text-foreground">
                  {s.name}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 sm:shrink-0">
                <span className="font-mono text-xs tabular-nums text-muted-foreground md:text-[10px]">
                  {s.weightG}g
                </span>
                <button
                  type="button"
                  onClick={() => onQuickAdd?.(s.name, s.weightG, s.category)}
                  className="min-h-10 min-w-[5.5rem] rounded-md border border-border-strong px-3 text-sm font-medium tracking-wide text-foreground transition hover:border-[#C8956C] hover:bg-[#C8956C] hover:text-white md:min-h-9 md:min-w-0 md:px-2 md:py-1.5 md:font-mono md:text-[10px] md:tracking-[0.15em]"
                >
                  {t("param.suggest.add")}
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-3 border border-dashed border-border bg-surface-2 px-3 py-4 text-center text-xs text-muted-foreground md:font-mono md:text-[10px]">
          {t("param.suggest.allDone")}
        </div>
      )}
    </section>
  );
}
