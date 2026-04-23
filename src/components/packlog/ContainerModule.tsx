import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import type { Container, Item, LifecyclePhase } from "@/lib/packlog-data";

const typeMeta: Record<Container["type"], { label: string; glyph: string }> = {
  checked: { label: "CHECKED", glyph: "▣" },
  carry: { label: "CARRY-ON", glyph: "▤" },
  camera: { label: "OPTICAL", glyph: "◉" },
  personal: { label: "PERSONAL", glyph: "◍" },
};

const catColor: Record<Item["category"], string> = {
  tech: "var(--info)",
  apparel: "var(--signal)",
  doc: "var(--warn)",
  health: "var(--success)",
  optic: "var(--signal)",
  misc: "var(--muted-foreground)",
};

export function ContainerModule({
  container,
  phase,
  onToggle,
  onVerdict,
  variant = "tall",
}: {
  container: Container;
  phase: LifecyclePhase;
  onToggle: (containerId: string, itemId: string) => void;
  onVerdict: (containerId: string, itemId: string, v: Item["verdict"]) => void;
  variant?: "tall" | "wide";
}) {
  const [expanded, setExpanded] = useState(true);
  const meta = typeMeta[container.type];
  const totalKg =
    container.items.reduce((s, i) => s + i.weightG * i.qty, 0) / 1000;
  const packedKg =
    container.items
      .filter((i) => i.status === "packed")
      .reduce((s, i) => s + i.weightG * i.qty, 0) / 1000;
  const loadPct = Math.min(100, (totalKg / container.maxKg) * 100);
  const packPct =
    (container.items.filter((i) => i.status === "packed").length /
      container.items.length) *
    100;

  return (
    <article
      className={`module corner-tick relative ${
        variant === "wide" ? "row-span-1" : ""
      }`}
    >
      {/* Header */}
      <header className="flex items-start justify-between border-b border-border p-4">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center border border-border-strong bg-surface-2 font-mono text-base text-signal">
            {meta.glyph}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] tracking-[0.22em] text-muted-foreground">
                {container.code}
              </span>
              <span className="tag-chip border-signal/40 text-signal">
                {meta.label}
              </span>
            </div>
            <h3 className="mt-1 font-display text-xl leading-tight">
              {container.name}
            </h3>
          </div>
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground hover:text-signal"
        >
          {expanded ? "─ COLLAPSE" : "+ EXPAND"}
        </button>
      </header>

      {/* Capacity gauges */}
      <div className="grid grid-cols-2 gap-px bg-border">
        <Gauge
          label="MASS"
          current={`${totalKg.toFixed(2)}`}
          max={`${container.maxKg}KG`}
          pct={loadPct}
          warn={loadPct > 90}
        />
        <Gauge
          label="PACKED"
          current={String(container.items.filter((i) => i.status === "packed").length)}
          max={`/${container.items.length}`}
          pct={packPct}
        />
      </div>

      {/* Items */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
            className="divide-y divide-border overflow-hidden"
          >
            {container.items.map((it, idx) => (
              <motion.li
                key={it.id}
                layout
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.02 }}
                className="group grid grid-cols-12 items-center gap-2 px-4 py-2.5 hover:bg-surface-2"
              >
                <div className="col-span-1">
                  {phase === "REVIEW" ? (
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                  ) : (
                    <button
                      onClick={() => onToggle(container.id, it.id)}
                      className={`relative h-4 w-4 border ${
                        it.status === "packed"
                          ? "border-signal bg-signal"
                          : "border-border-strong bg-background"
                      } transition-all`}
                      aria-label="toggle pack"
                    >
                      {it.status === "packed" && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute inset-0 grid place-items-center font-mono text-[10px] text-signal-foreground"
                        >
                          ✕
                        </motion.span>
                      )}
                    </button>
                  )}
                </div>

                <div className="col-span-5 flex items-center gap-2">
                  <span
                    className="h-1.5 w-1.5"
                    style={{ background: catColor[it.category] }}
                  />
                  <span
                    className={`text-sm ${
                      it.status === "packed" && phase !== "REVIEW"
                        ? "text-muted-foreground line-through decoration-signal/50"
                        : "text-foreground"
                    }`}
                  >
                    {it.name}
                  </span>
                </div>

                <div className="col-span-1 text-right font-mono text-[11px] text-muted-foreground tabular-nums">
                  ×{it.qty}
                </div>
                <div className="col-span-2 text-right font-mono text-[11px] text-muted-foreground tabular-nums">
                  {it.weightG}g
                </div>
                <div className="col-span-3 flex justify-end">
                  {phase === "REVIEW" ? (
                    <VerdictPicker
                      v={it.verdict}
                      onChange={(v) => onVerdict(container.id, it.id, v)}
                    />
                  ) : (
                    <span className="tag-chip">
                      {it.category.toUpperCase()}
                    </span>
                  )}
                </div>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </article>
  );
}

function Gauge({
  label,
  current,
  max,
  pct,
  warn,
}: {
  label: string;
  current: string;
  max: string;
  pct: number;
  warn?: boolean;
}) {
  return (
    <div className="bg-surface px-4 py-3">
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-[9px] tracking-[0.22em] text-muted-foreground">
          {label}
        </span>
        <span className="font-mono text-xs tabular-nums">
          <span className={warn ? "text-destructive" : "text-foreground"}>
            {current}
          </span>
          <span className="text-muted-foreground">{max}</span>
        </span>
      </div>
      <div className="relative mt-2 h-1 bg-surface-3">
        <motion.div
          className={`absolute inset-y-0 left-0 ${
            warn ? "bg-destructive" : "bg-signal"
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
        />
      </div>
    </div>
  );
}

function VerdictPicker({
  v,
  onChange,
}: {
  v: Item["verdict"];
  onChange: (v: Item["verdict"]) => void;
}) {
  const opts: { val: NonNullable<Item["verdict"]>; label: string; color: string }[] = [
    { val: "keep", label: "K", color: "var(--success)" },
    { val: "upgrade", label: "U", color: "var(--signal)" },
    { val: "drop", label: "D", color: "var(--destructive)" },
  ];
  return (
    <div className="flex gap-1">
      {opts.map((o) => {
        const active = v === o.val;
        return (
          <button
            key={o.val}
            onClick={() => onChange(active ? null : o.val)}
            className="grid h-5 w-5 place-items-center border font-mono text-[10px] transition"
            style={{
              borderColor: active ? o.color : "var(--border-strong)",
              background: active ? o.color : "transparent",
              color: active ? "var(--background)" : "var(--muted-foreground)",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
