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

      <div className="mt-4 flex items-baseline justify-between border-t border-border pt-3">
        <div className="font-mono text-[10px] tracking-[0.22em] text-foreground">
          {t("param.suggest")}
        </div>
        <span className="tag-chip">N={suggestions.length}</span>
      </div>
      {t("param.suggest.tip").trim() ? (
        <p className="mt-1 text-[11px] text-muted-foreground">{t("param.suggest.tip")}</p>
      ) : null}

      {suggestions.length > 0 ? (
        <ul className="mt-3 divide-y divide-border border border-border">
          {suggestions.map((s) => (
            <li
              key={s.name}
              className="flex items-center justify-between gap-2 bg-surface px-3 py-2 transition hover:bg-surface-2"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-1.5 w-1.5"
                  style={{ background: packlogCategoryHex(s.category) }}
                />
                <span className="text-xs">{s.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
                  {s.weightG}g
                </span>
                <button
                  type="button"
                  onClick={() => onQuickAdd?.(s.name, s.weightG, s.category)}
                  className="border border-border-strong px-2 py-0.5 font-mono text-[10px] tracking-[0.15em] hover:bg-[#C8956C] hover:text-white"
                >
                  {t("param.suggest.add")}
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-3 border border-dashed border-border bg-surface-2 px-3 py-4 text-center font-mono text-[10px] text-muted-foreground">
          {t("param.suggest.allDone")}
        </div>
      )}
    </section>
  );
}
