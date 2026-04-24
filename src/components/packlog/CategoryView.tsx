import { motion } from "framer-motion";
import { useMemo } from "react";
import type { Item, LifecyclePhase, Trip } from "@/lib/packlog-data";
import { useI18n, pickName } from "@/lib/i18n";

const catColor: Record<Item["category"], string> = {
  tech: "var(--info)",
  apparel: "var(--signal)",
  doc: "var(--warn)",
  health: "var(--success)",
  optic: "var(--signal)",
  misc: "var(--muted-foreground)",
};

const ownColor: Record<Item["ownership"], string> = {
  owned: "var(--success)",
  wishlist: "var(--info)",
  undecided: "var(--muted-foreground)",
};

type ItemWithCtx = Item & { _containerId: string; _containerCode: string };

export function CategoryView({
  trip,
  phase,
  onToggle,
  onCycleOwnership,
  onRemove,
}: {
  trip: Trip;
  phase: LifecyclePhase;
  onToggle: (containerId: string, itemId: string) => void;
  onCycleOwnership: (containerId: string, itemId: string) => void;
  onRemove: (containerId: string, itemId: string) => void;
}) {
  const { t, lang } = useI18n();

  const grouped = useMemo(() => {
    const map: Record<string, ItemWithCtx[]> = {};
    trip.containers.forEach((c) =>
      c.items.forEach((it) => {
        (map[it.category] ??= []).push({ ...it, _containerId: c.id, _containerCode: c.code });
      }),
    );
    return Object.entries(map).sort((a, b) => b[1].length - a[1].length);
  }, [trip.containers]);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {grouped.map(([cat, items]) => {
        const totalKg = items.reduce((s, i) => s + i.weightG * i.qty, 0) / 1000;
        return (
          <motion.section
            key={cat}
            layout
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="module corner-tick relative"
          >
            <header className="flex items-center justify-between border-b border-border p-3">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2" style={{ background: catColor[cat as Item["category"]] }} />
                <span className="font-mono text-[11px] tracking-[0.22em]">{t(`cat.${cat}`)}</span>
                <span className="tag-chip">N={items.length}</span>
              </div>
              <span className="font-mono text-xs tabular-nums">{totalKg.toFixed(2)}kg</span>
            </header>
            <ul className="divide-y divide-border">
              {items.map((it) => (
                <li key={it.id} className="group grid grid-cols-12 items-center gap-2 px-3 py-2 hover:bg-surface-2">
                  <div className="col-span-1">
                    {phase === "REVIEW" ? (
                      <span className="font-mono text-[10px] text-muted-foreground">·</span>
                    ) : (
                      <button
                        onClick={() => onToggle(it._containerId, it.id)}
                        className={`h-4 w-4 rounded-sm border ${
                          it.status === "packed"
                            ? "border-signal bg-signal"
                            : "border-border-strong bg-background"
                        }`}
                      >
                        {it.status === "packed" && (
                          <span className="block text-center font-mono text-[10px] text-signal-foreground">✓</span>
                        )}
                      </button>
                    )}
                  </div>
                  <div className="col-span-6 min-w-0 truncate text-sm">
                    {pickName(lang, it)}
                    <span className="ml-2 font-mono text-[9px] text-muted-foreground">
                      {it._containerCode}
                    </span>
                  </div>
                  <div className="col-span-1 text-right font-mono text-[10px] text-muted-foreground tabular-nums">
                    ×{it.qty}
                  </div>
                  <div className="col-span-2 text-right font-mono text-[10px] text-muted-foreground tabular-nums">
                    {it.weightG}g
                  </div>
                  <div className="col-span-2 flex justify-end gap-1">
                    <button
                      onClick={() => onCycleOwnership(it._containerId, it.id)}
                      className="rounded border px-1.5 py-0.5 font-mono text-[9px]"
                      style={{ borderColor: ownColor[it.ownership], color: ownColor[it.ownership] }}
                    >
                      {t(`own.${it.ownership}`)}
                    </button>
                    <button
                      onClick={() => onRemove(it._containerId, it.id)}
                      className="opacity-0 transition group-hover:opacity-100 font-mono text-[10px] text-muted-foreground hover:text-destructive"
                    >
                      ✕
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </motion.section>
        );
      })}
    </div>
  );
}
