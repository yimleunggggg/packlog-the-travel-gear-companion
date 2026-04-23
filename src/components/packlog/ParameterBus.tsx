import { motion } from "framer-motion";
import type { Trip } from "@/lib/packlog-data";

const catLabels: Record<string, string> = {
  tech: "TECH",
  apparel: "APPAREL",
  doc: "DOCS",
  health: "HEALTH",
  optic: "OPTICAL",
  misc: "MISC",
};

const catColor: Record<string, string> = {
  tech: "var(--info)",
  apparel: "var(--signal)",
  doc: "var(--warn)",
  health: "var(--success)",
  optic: "var(--signal)",
  misc: "var(--muted-foreground)",
};

export function ParameterBus({ trip }: { trip: Trip }) {
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
          ◇ MASS · DISTRIBUTION
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-mono text-4xl tabular-nums">
            {totalKg.toFixed(2)}
          </span>
          <span className="font-mono text-xs text-muted-foreground">KG TOTAL</span>
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
                <span className="text-muted-foreground">{catLabels[cat]}</span>
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
          ◈ ANXIETY · INDEX
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-4xl tabular-nums text-success">
              −64
            </span>
            <span className="font-mono text-xs text-muted-foreground">
              % VS. UNPLANNED
            </span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Based on your packing rhythm, mass-distribution, and reviewed gear-DNA,
            departure stress is{" "}
            <span className="font-mono text-foreground">low</span>. Sleep tonight.
          </p>
        </div>

        {/* mini sparkline */}
        <svg viewBox="0 0 200 50" className="mt-3 h-12 w-full">
          {Array.from({ length: 24 }).map((_, i) => {
            const h = 8 + Math.abs(Math.sin(i * 0.7) * 18) + (i / 24) * 14;
            return (
              <rect
                key={i}
                x={i * 8.3}
                y={50 - h}
                width={5}
                height={h}
                fill={i > 18 ? "var(--signal)" : "var(--border-strong)"}
              />
            );
          })}
        </svg>
        <div className="mt-1 flex justify-between font-mono text-[9px] text-muted-foreground">
          <span>D−14</span>
          <span>TODAY</span>
        </div>
      </section>

      <section className="module corner-tick relative p-5">
        <div className="font-mono text-[10px] tracking-[0.22em] text-signal">
          ⚙ AUTO · ASSIST
        </div>
        <ul className="mt-3 space-y-2 text-xs">
          {[
            "Hokkaido in May → +2 hand warmers suggested",
            "Carry-on at 6.4/7kg → safe for ANA",
            "Missing: travel adapter (Type-A, JP)",
          ].map((m) => (
            <li
              key={m}
              className="flex gap-2 border-l-2 border-signal/60 bg-surface-2 px-3 py-2"
            >
              <span className="font-mono text-signal">▸</span>
              <span className="leading-relaxed">{m}</span>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
