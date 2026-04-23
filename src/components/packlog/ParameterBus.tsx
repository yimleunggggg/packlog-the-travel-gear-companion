import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import type { Trip } from "@/lib/packlog-data";
import { popularSuggestions } from "@/lib/weight-library";

const catColor: Record<string, string> = {
  tech: "var(--info)",
  apparel: "var(--signal)",
  doc: "var(--warn)",
  health: "var(--success)",
  optic: "var(--signal)",
  misc: "var(--muted-foreground)",
};

export function ParameterBus({
  trip,
  onQuickAdd,
}: {
  trip: Trip;
  onQuickAdd?: (name: string, weightG: number, category: string) => void;
}) {
  const { t } = useI18n();
  const all = trip.containers.flatMap((c) => c.items);
  const totalKg = all.reduce((s, i) => s + i.weightG * i.qty, 0) / 1000;
  const byCat = all.reduce<Record<string, number>>((acc, i) => {
    acc[i.category] = (acc[i.category] ?? 0) + i.weightG * i.qty;
    return acc;
  }, {});
  const cats = Object.entries(byCat).sort((a, b) => b[1] - a[1]);

  return (
    <aside className="space-y-4">
      <section className="module corner-tick relative p-5">
        <div className="font-mono text-[10px] tracking-[0.22em] text-signal">
          {t("param.distribution")}
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-mono text-4xl tabular-nums">
            {totalKg.toFixed(2)}
          </span>
          <span className="font-mono text-xs text-muted-foreground">{t("param.kg")}</span>
        </div>

        <div className="mt-4 flex h-3 w-full overflow-hidden border border-border">
          {cats.map(([cat, w]) => (
            <motion.div
              key={cat}
              initial={{ width: 0 }}
              animate={{ width: `${(w / (totalKg * 1000)) * 100}%` }}
              transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
              style={{ background: catColor[cat] }}
            />
          ))}
        </div>

        <ul className="mt-3 space-y-1.5">
          {cats.map(([cat, w]) => (
            <li
              key={cat}
              className="flex items-center justify-between font-mono text-[11px]"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-2 w-2"
                  style={{ background: catColor[cat] }}
                />
                <span className="text-muted-foreground">{t(`cat.${cat}`)}</span>
              </div>
              <span className="tabular-nums">
                <span>{(w / 1000).toFixed(2)}kg</span>
                <span className="ml-2 text-muted-foreground">
                  {Math.round((w / (totalKg * 1000)) * 100)}%
                </span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="module corner-tick relative p-5">
        <div className="font-mono text-[10px] tracking-[0.22em] text-signal">
          {t("param.assist")}
        </div>
        <ul className="mt-3 space-y-2 text-xs">
          {["param.assist.1", "param.assist.2", "param.assist.3"].map((k) => (
            <li
              key={k}
              className="flex gap-2 border-l-2 border-signal/60 bg-surface-2 px-3 py-2"
            >
              <span className="font-mono text-signal">▸</span>
              <span className="leading-relaxed">{t(k)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="module corner-tick relative p-5">
        <div className="flex items-baseline justify-between">
          <div className="font-mono text-[10px] tracking-[0.22em] text-signal">
            {t("param.suggest")}
          </div>
          <span className="tag-chip">N={popularSuggestions.length}</span>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">{t("param.suggest.tip")}</p>
        <ul className="mt-3 divide-y divide-border border border-border">
          {popularSuggestions.map((s) => (
            <li
              key={s.name}
              className="flex items-center justify-between gap-2 bg-surface px-3 py-2 transition hover:bg-surface-2"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-1.5 w-1.5"
                  style={{ background: catColor[s.hint.category] }}
                />
                <span className="text-xs">{s.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
                  {s.hint.weightG}g
                </span>
                <button
                  onClick={() =>
                    onQuickAdd?.(s.name, s.hint.weightG, s.hint.category)
                  }
                  className="border border-border-strong px-2 py-0.5 font-mono text-[10px] tracking-[0.15em] hover:bg-signal hover:text-signal-foreground"
                >
                  {t("param.suggest.add")}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
