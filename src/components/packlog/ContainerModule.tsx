import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import type { Container, Item, LifecyclePhase, GearSpec } from "@/lib/packlog-data";
import { useI18n, pickName } from "@/lib/i18n";
import { suggestFromName } from "@/lib/weight-library";

const typeKey: Record<Container["type"], string> = {
  checked: "container.type.checked",
  carry: "container.type.carry",
  camera: "container.type.camera",
  personal: "container.type.personal",
};
const typeGlyph: Record<Container["type"], string> = {
  checked: "▣", carry: "▤", camera: "◉", personal: "◍",
};

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

export function ContainerModule({
  container,
  phase,
  onToggle,
  onVerdict,
  onUtility,
  onAdd,
  onRemove,
  onMove,
  onCycleOwnership,
  onOpenLibrary,
  variant = "tall",
}: {
  container: Container;
  phase: LifecyclePhase;
  onToggle: (containerId: string, itemId: string) => void;
  onVerdict: (containerId: string, itemId: string, v: Item["verdict"]) => void;
  onUtility?: (containerId: string, itemId: string, u: number) => void;
  onAdd?: (containerId: string, item: Omit<Item, "id">) => void;
  onRemove?: (containerId: string, itemId: string) => void;
  onMove?: (fromContainerId: string, itemId: string, toContainerId: string) => void;
  onCycleOwnership?: (containerId: string, itemId: string) => void;
  onOpenLibrary?: (containerId: string) => void;
  variant?: "tall" | "wide";
}) {
  const { t, lang } = useI18n();
  const [expanded, setExpanded] = useState(true);
  const [adding, setAdding] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const totalKg = container.items.reduce((s, i) => s + i.weightG * i.qty, 0) / 1000;
  const loadPct = Math.min(100, (totalKg / container.maxKg) * 100);
  const packPct = container.items.length
    ? (container.items.filter((i) => i.status === "packed").length / container.items.length) * 100
    : 0;

  const containerName = lang === "zh" ? (container.nameZh ?? container.name) : container.name;

  return (
    <article
      className={`module corner-tick relative ${variant === "wide" ? "row-span-1" : ""} ${dragOver ? "drop-target" : ""}`}
      onDragOver={(e) => {
        if (onMove) { e.preventDefault(); setDragOver(true); }
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        if (!onMove) return;
        e.preventDefault();
        setDragOver(false);
        const data = e.dataTransfer.getData("application/x-packlog-item");
        if (data) {
          const { fromContainerId, itemId } = JSON.parse(data);
          if (fromContainerId !== container.id) onMove(fromContainerId, itemId, container.id);
        }
      }}
    >
      <header className="flex items-start justify-between border-b border-border p-4">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-md border border-border-strong bg-surface-2 font-mono text-base text-signal">
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
            <h3 className="mt-1 font-display text-xl leading-tight">{containerName}</h3>
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
        <Gauge label={t("container.gauge.mass")} current={totalKg.toFixed(2)} max={`/${container.maxKg}KG`} pct={loadPct} warn={loadPct > 90} />
        <Gauge label={t("container.gauge.packed")} current={String(container.items.filter((i) => i.status === "packed").length)} max={`/${container.items.length}`} pct={packPct} />
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
                — empty —
              </div>
            )}

            <ul className="divide-y divide-border">
              {container.items.map((it, idx) => {
                const displayName = pickName(lang, it);
                return (
                  <motion.li
                    key={it.id}
                    layout
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    draggable={phase !== "REVIEW" && !!onMove}
                    onDragStart={(e: React.DragEvent) => {
                      e.dataTransfer.setData(
                        "application/x-packlog-item",
                        JSON.stringify({ fromContainerId: container.id, itemId: it.id }),
                      );
                      e.dataTransfer.effectAllowed = "move";
                    }}
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
                          className={`relative h-4 w-4 rounded-sm border ${
                            it.status === "packed"
                              ? "border-signal bg-signal"
                              : "border-border-strong bg-background"
                          }`}
                          aria-label="toggle pack"
                        >
                          {it.status === "packed" && (
                            <span className="absolute inset-0 grid place-items-center font-mono text-[10px] text-signal-foreground">✓</span>
                          )}
                        </button>
                      )}
                    </div>

                    <div className="col-span-5 flex min-w-0 items-center gap-2">
                      <span className="h-1.5 w-1.5 shrink-0" style={{ background: catColor[it.category] }} />
                      <span
                        className={`truncate text-sm ${
                          it.status === "packed" && phase !== "REVIEW"
                            ? "text-muted-foreground line-through decoration-signal/50"
                            : "text-foreground"
                        }`}
                      >
                        {displayName}
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
                      {it.weightSource === "user" && <span className="ml-0.5 text-signal">·</span>}
                    </div>
                    <div className="col-span-3 flex justify-end gap-1">
                      {phase === "REVIEW" ? (
                        <ReviewControls
                          item={it}
                          onVerdict={(v) => onVerdict(container.id, it.id, v)}
                          onUtility={(u) => onUtility?.(container.id, it.id, u)}
                        />
                      ) : (
                        <>
                          <button
                            onClick={() => onCycleOwnership?.(container.id, it.id)}
                            title={t("own.toggle")}
                            className="rounded border px-1.5 py-0.5 font-mono text-[9px] tracking-[0.1em]"
                            style={{
                              borderColor: ownColor[it.ownership],
                              color: ownColor[it.ownership],
                              background: it.ownership === "wishlist" ? "var(--accent)" : "transparent",
                            }}
                          >
                            {t(`own.${it.ownership}`)}
                          </button>
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
                        </>
                      )}
                    </div>
                  </motion.li>
                );
              })}
            </ul>

            {phase !== "REVIEW" && onAdd && (
              <div className="space-y-2 border-t border-dashed border-border bg-surface-2/50 p-3">
                {adding ? (
                  <AddGearForm
                    onCancel={() => setAdding(false)}
                    onCommit={(item) => {
                      onAdd(container.id, item);
                      setAdding(false);
                    }}
                  />
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setAdding(true)}
                      className="flex-1 rounded border border-dashed border-border-strong py-2 font-mono text-[11px] tracking-[0.18em] text-muted-foreground transition hover:border-signal hover:text-signal"
                    >
                      {t("container.add")}
                    </button>
                    {onOpenLibrary && (
                      <button
                        onClick={() => onOpenLibrary(container.id)}
                        className="rounded border border-border-strong bg-surface px-3 py-2 font-mono text-[11px] tracking-[0.18em] text-foreground hover:border-signal hover:bg-signal-soft"
                      >
                        ⌬ {t("container.add.fromLib")}
                      </button>
                    )}
                  </div>
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
  const [ownership, setOwnership] = useState<Item["ownership"]>("owned");
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
    const trimmed = name.trim();
    const isZh = /[\u4e00-\u9fa5]/.test(trimmed);
    onCommit({
      gearId: null,
      name: trimmed,
      nameEn: isZh ? undefined : trimmed,
      nameZh: isZh ? trimmed : undefined,
      qty: Math.max(1, qty),
      weightG: +weight,
      weightSource: autoFilled ? "library" : "user",
      category,
      status: "todo",
      verdict: null,
      utility: null,
      ownership,
    });
  };

  const cats: Item["category"][] = ["tech", "apparel", "doc", "health", "optic", "misc"];
  const owns: Item["ownership"][] = ["owned", "wishlist", "undecided"];

  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="grid grid-cols-12 gap-2">
        <input
          autoFocus
          value={name}
          onChange={(e) => { setName(e.target.value); if (!e.target.value) setAutoFilled(false); }}
          placeholder={t("container.add.name")}
          className="col-span-6 rounded border border-border-strong bg-background px-2 py-1.5 text-sm placeholder:text-muted-foreground focus:border-signal focus:outline-none"
        />
        <input
          type="number" min={1} value={qty}
          onChange={(e) => setQty(+e.target.value)}
          placeholder={t("container.add.qty")}
          className="col-span-2 rounded border border-border-strong bg-background px-2 py-1.5 text-center font-mono text-sm focus:border-signal focus:outline-none"
        />
        <input
          type="number" min={1} value={weight}
          onChange={(e) => { setWeight(e.target.value === "" ? "" : +e.target.value); setAutoFilled(false); }}
          placeholder={t("container.add.weight")}
          className={`col-span-4 rounded border bg-background px-2 py-1.5 text-right font-mono text-sm focus:border-signal focus:outline-none ${
            autoFilled ? "border-signal/60 text-signal" : "border-border-strong"
          }`}
        />
      </div>
      <div className="flex flex-wrap items-center gap-1">
        {cats.map((c) => (
          <button
            type="button" key={c}
            onClick={() => setCategory(c)}
            className={`rounded border px-2 py-0.5 font-mono text-[10px] tracking-[0.15em] ${
              category === c
                ? "border-signal bg-signal text-signal-foreground"
                : "border-border-strong text-muted-foreground hover:text-foreground"
            }`}
          >
            {t(`cat.${c}`)}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-1">
        {owns.map((o) => (
          <button
            type="button" key={o}
            onClick={() => setOwnership(o)}
            className={`rounded border px-2 py-0.5 font-mono text-[10px] tracking-[0.15em] ${
              ownership === o
                ? "border-signal bg-signal-soft text-foreground"
                : "border-border-strong text-muted-foreground hover:text-foreground"
            }`}
          >
            {t(`own.${o}`)}
          </button>
        ))}
      </div>
      <p className="font-mono text-[10px] leading-relaxed text-muted-foreground">
        {autoFilled && "✓ "}{t("container.add.suggest")}
      </p>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded border border-border-strong px-3 py-1 font-mono text-[10px] tracking-[0.18em] text-muted-foreground hover:text-foreground">
          {t("container.add.cancel")}
        </button>
        <button type="submit" className="rounded border border-signal bg-signal px-3 py-1 font-mono text-[10px] tracking-[0.18em] text-signal-foreground hover:opacity-90">
          {t("container.add.commit")}
        </button>
      </div>
    </form>
  );
}

function Gauge({ label, current, max, pct, warn }: { label: string; current: string; max: string; pct: number; warn?: boolean }) {
  return (
    <div className="bg-surface px-4 py-3">
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-[9px] tracking-[0.22em] text-muted-foreground">{label}</span>
        <span className="font-mono text-xs tabular-nums">
          <span className={warn ? "text-destructive" : "text-foreground"}>{current}</span>
          <span className="text-muted-foreground">{max}</span>
        </span>
      </div>
      <div className="relative mt-2 h-1 overflow-hidden rounded bg-surface-3">
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

function ReviewControls({ item, onVerdict, onUtility }: { item: Item; onVerdict: (v: Item["verdict"]) => void; onUtility: (u: number) => void }) {
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
              className="grid h-5 w-5 place-items-center rounded border font-mono text-[10px] transition"
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
            >
              ★
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Slim Library picker dialog used inline in containers
export function LibraryPicker({
  open,
  library,
  onClose,
  onPick,
}: {
  open: boolean;
  library: GearSpec[];
  onClose: () => void;
  onPick: (gear: GearSpec) => void;
}) {
  const { t, lang } = useI18n();
  const [q, setQ] = useState("");
  if (!open) return null;
  const filtered = library.filter(
    (g) =>
      !q ||
      g.name.toLowerCase().includes(q.toLowerCase()) ||
      (g.nameZh ?? "").includes(q) ||
      (g.brand ?? "").toLowerCase().includes(q.toLowerCase()) ||
      g.category.includes(q.toLowerCase()),
  );
  return (
    <div className="scrim fixed inset-0 z-50 grid place-items-center p-4" onClick={onClose}>
      <div className="module corner-tick relative flex max-h-[80vh] w-full max-w-2xl flex-col p-5" onClick={(e) => e.stopPropagation()}>
        <div className="font-mono text-[10px] tracking-[0.22em] text-signal">⌬ {t("container.add.fromLib")}</div>
        <input
          value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("library.search")}
          className="mt-3 w-full rounded border border-border-strong bg-background px-2 py-1.5 text-sm focus:border-signal focus:outline-none"
        />
        <ul className="mt-3 flex-1 space-y-1 overflow-y-auto">
          {filtered.map((g) => (
            <li key={g.id}>
              <button
                onClick={() => onPick(g)}
                className="flex w-full items-center justify-between gap-3 rounded border border-border bg-surface px-3 py-2 text-left transition hover:border-signal hover:bg-surface-2"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm">{pickName(lang, g)}</div>
                  <div className="font-mono text-[10px] text-muted-foreground">
                    {g.brand ?? "—"} · {t(`cat.${g.category}`)}
                  </div>
                </div>
                <div className="shrink-0 text-right font-mono text-[11px] tabular-nums">{g.weightG}g</div>
              </button>
            </li>
          ))}
        </ul>
        <button onClick={onClose} className="mt-3 self-end rounded border border-border-strong px-3 py-1 font-mono text-[10px] tracking-[0.18em] text-muted-foreground">
          {t("library.closePanel")}
        </button>
      </div>
    </div>
  );
}
