import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import type { Container, Item, LifecyclePhase } from "@/lib/packlog-data";
import { useI18n } from "@/lib/i18n";
import { suggestFromName } from "@/lib/weight-library";

const typeKey: Record<Container["type"], string> = {
  checked: "container.type.checked",
  carry: "container.type.carry",
  camera: "container.type.camera",
  personal: "container.type.personal",
};
const typeGlyph: Record<Container["type"], string> = {
  checked: "▣",
  carry: "▤",
  camera: "◉",
  personal: "◍",
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
  onUtility,
  onAdd,
  onRemove,
  variant = "tall",
}: {
  container: Container;
  phase: LifecyclePhase;
  onToggle: (containerId: string, itemId: string) => void;
  onVerdict: (containerId: string, itemId: string, v: Item["verdict"]) => void;
  onUtility?: (containerId: string, itemId: string, u: number) => void;
  onAdd?: (containerId: string, item: Omit<Item, "id">) => void;
  onRemove?: (containerId: string, itemId: string) => void;
  variant?: "tall" | "wide";
}) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(true);
  const [adding, setAdding] = useState(false);

  const totalKg =
    container.items.reduce((s, i) => s + i.weightG * i.qty, 0) / 1000;
  const loadPct = Math.min(100, (totalKg / container.maxKg) * 100);
  const packPct = container.items.length
    ? (container.items.filter((i) => i.status === "packed").length /
        container.items.length) *
      100
    : 0;

  return (
    <article className={`module corner-tick relative ${variant === "wide" ? "row-span-1" : ""}`}>
      <header className="flex items-start justify-between border-b border-border p-4">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center border border-border-strong bg-surface-2 font-mono text-base text-signal">
            {typeGlyph[container.type]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] tracking-[0.22em] text-muted-foreground">
                {container.code}
              </span>
              <span className="tag-chip border-signal/40 text-signal">
                {t(typeKey[container.type])}
              </span>
            </div>
            <h3 className="mt-1 font-display text-xl leading-tight">{container.name}</h3>
          </div>
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground hover:text-signal"
        >
          {expanded ? t("container.collapse") : t("container.expand")}
        </button>
      </header>

      <div className="grid grid-cols-2 gap-px bg-border">
        <Gauge
          label={t("container.gauge.mass")}
          current={`${totalKg.toFixed(2)}`}
          max={`/${container.maxKg}KG`}
          pct={loadPct}
          warn={loadPct > 90}
        />
        <Gauge
          label={t("container.gauge.packed")}
          current={String(container.items.filter((i) => i.status === "packed").length)}
          max={`/${container.items.length}`}
          pct={packPct}
        />
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
            className="overflow-hidden"
          >
            {container.items.length === 0 && (
              <div className="px-4 py-6 text-center font-mono text-[11px] text-muted-foreground">
                — empty container —
              </div>
            )}

            <ul className="divide-y divide-border">
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
                    <span className="h-1.5 w-1.5" style={{ background: catColor[it.category] }} />
                    <span
                      className={`text-sm ${
                        it.status === "packed" && phase !== "REVIEW"
                          ? "text-muted-foreground line-through decoration-signal/50"
                          : "text-foreground"
                      }`}
                    >
                      {it.name}
                      {it.gearId && (
                        <span className="ml-1.5 font-mono text-[9px] text-signal" title="from gear library">⌬</span>
                      )}
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
                      <ReviewControls
                        item={it}
                        onVerdict={(v) => onVerdict(container.id, it.id, v)}
                        onUtility={(u) => onUtility?.(container.id, it.id, u)}
                      />
                    ) : (
                      <div className="flex items-center gap-1">
                        <span className="tag-chip">{t(`cat.${it.category}`)}</span>
                        {onRemove && (
                          <button
                            onClick={() => onRemove(container.id, it.id)}
                            className="opacity-0 transition group-hover:opacity-100 font-mono text-[10px] text-muted-foreground hover:text-destructive"
                            aria-label="remove"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </motion.li>
              ))}
            </ul>

            {phase !== "REVIEW" && onAdd && (
              <div className="border-t border-dashed border-border bg-surface-2/50 p-3">
                {adding ? (
                  <AddGearForm
                    onCancel={() => setAdding(false)}
                    onCommit={(item) => {
                      onAdd(container.id, item);
                      setAdding(false);
                    }}
                  />
                ) : (
                  <button
                    onClick={() => setAdding(true)}
                    className="w-full border border-dashed border-border-strong py-2 font-mono text-[11px] tracking-[0.18em] text-muted-foreground transition hover:border-signal hover:text-signal"
                  >
                    {t("container.add")}
                  </button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}

function AddGearForm({
  onCancel,
  onCommit,
}: {
  onCancel: () => void;
  onCommit: (item: Omit<Item, "id">) => void;
}) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [qty, setQty] = useState(1);
  const [weight, setWeight] = useState<number | "">("");
  const [category, setCategory] = useState<Item["category"]>("misc");
  const [autoFilled, setAutoFilled] = useState(false);

  useEffect(() => {
    const hit = suggestFromName(name);
    if (hit) {
      if (weight === "" || autoFilled) {
        setWeight(hit.weightG);
        setCategory(hit.category);
        setAutoFilled(true);
      }
    }
  }, [name]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || weight === "" || +weight <= 0) return;
    onCommit({
      gearId: null,
      name: name.trim(),
      qty: Math.max(1, qty),
      weightG: +weight,
      category,
      status: "todo",
      verdict: null,
      utility: null,
    });
  };

  const cats: Item["category"][] = ["tech", "apparel", "doc", "health", "optic", "misc"];

  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="grid grid-cols-12 gap-2">
        <input
          autoFocus
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (!e.target.value) setAutoFilled(false);
          }}
          placeholder={t("container.add.name")}
          className="col-span-6 border border-border-strong bg-background px-2 py-1.5 text-sm placeholder:text-muted-foreground focus:border-signal focus:outline-none"
        />
        <input
          type="number"
          min={1}
          value={qty}
          onChange={(e) => setQty(+e.target.value)}
          placeholder={t("container.add.qty")}
          className="col-span-2 border border-border-strong bg-background px-2 py-1.5 text-center font-mono text-sm focus:border-signal focus:outline-none"
        />
        <input
          type="number"
          min={1}
          value={weight}
          onChange={(e) => {
            setWeight(e.target.value === "" ? "" : +e.target.value);
            setAutoFilled(false);
          }}
          placeholder={t("container.add.weight")}
          className={`col-span-4 border bg-background px-2 py-1.5 text-right font-mono text-sm focus:border-signal focus:outline-none ${
            autoFilled ? "border-signal/60 text-signal" : "border-border-strong"
          }`}
        />
      </div>
      <div className="flex flex-wrap items-center gap-1">
        {cats.map((c) => (
          <button
            type="button"
            key={c}
            onClick={() => setCategory(c)}
            className={`border px-2 py-0.5 font-mono text-[10px] tracking-[0.15em] ${
              category === c
                ? "border-signal bg-signal text-signal-foreground"
                : "border-border-strong text-muted-foreground hover:text-foreground"
            }`}
          >
            {t(`cat.${c}`)}
          </button>
        ))}
      </div>
      <p className="font-mono text-[10px] leading-relaxed text-muted-foreground">
        {autoFilled && "✓ "}
        {t("container.add.suggest")}
      </p>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="border border-border-strong px-3 py-1 font-mono text-[10px] tracking-[0.18em] text-muted-foreground hover:text-foreground"
        >
          {t("container.add.cancel")}
        </button>
        <button
          type="submit"
          className="border border-signal bg-signal px-3 py-1 font-mono text-[10px] tracking-[0.18em] text-signal-foreground hover:opacity-90"
        >
          {t("container.add.commit")}
        </button>
      </div>
    </form>
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
          <span className={warn ? "text-destructive" : "text-foreground"}>{current}</span>
          <span className="text-muted-foreground">{max}</span>
        </span>
      </div>
      <div className="relative mt-2 h-1 bg-surface-3">
        <motion.div
          className={`absolute inset-y-0 left-0 ${warn ? "bg-destructive" : "bg-signal"}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
        />
      </div>
    </div>
  );
}

function ReviewControls({
  item,
  onVerdict,
  onUtility,
}: {
  item: Item;
  onVerdict: (v: Item["verdict"]) => void;
  onUtility: (u: number) => void;
}) {
  const opts: { val: NonNullable<Item["verdict"]>; label: string; color: string }[] = [
    { val: "keep", label: "K", color: "var(--success)" },
    { val: "upgrade", label: "U", color: "var(--signal)" },
    { val: "drop", label: "D", color: "var(--destructive)" },
  ];
  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-1">
        {opts.map((o) => {
          const active = item.verdict === o.val;
          return (
            <button
              key={o.val}
              onClick={() => onVerdict(active ? null : o.val)}
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
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => {
          const active = (item.utility ?? 0) >= n;
          return (
            <button
              key={n}
              onClick={() => onUtility(item.utility === n ? 0 : n)}
              className="font-mono text-[11px] leading-none transition"
              style={{ color: active ? "var(--signal)" : "var(--border-strong)" }}
              aria-label={`utility ${n}`}
            >
              ★
            </button>
          );
        })}
      </div>
    </div>
  );
}
