import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useI18n, pickName } from "@/lib/i18n";
import type { CommunityTemplate, Container } from "@/lib/packlog-data";

const catColor: Record<string, string> = {
  tech: "var(--info)",
  apparel: "var(--signal)",
  doc: "var(--warn)",
  health: "var(--success)",
  optic: "var(--signal)",
  misc: "var(--muted-foreground)",
};

export function CloneSheet({
  template,
  containers,
  onClose,
  onCommit,
}: {
  template: CommunityTemplate | null;
  containers: Container[];
  onClose: () => void;
  onCommit: (selectedIdx: number[], targetContainerId: string) => void;
}) {
  const { t, lang } = useI18n();
  const [selected, setSelected] = useState<number[]>([]);
  const [target, setTarget] = useState<string>(containers[0]?.id ?? "");

  useEffect(() => {
    if (template) setSelected(template.items.map((_, i) => i));
    if (containers[0]) setTarget(containers[0].id);
  }, [template, containers]);

  const totalKg = useMemo(() => {
    if (!template) return 0;
    return (
      selected.reduce((s, i) => s + template.items[i].weightG * template.items[i].qty, 0) / 1000
    );
  }, [selected, template]);

  if (!template) return null;

  const toggle = (i: number) =>
    setSelected((cur) => (cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i]));

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="scrim fixed inset-0 z-50 grid place-items-center p-4"
        onClick={onClose}
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          className="module corner-tick corner-tick-br relative flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden p-6"
        >
          {/* Header */}
          <div className="border-b border-border pb-4">
            <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.22em] text-signal">
              <span>◐ COMMUNITY · BLUEPRINT</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">{template.author}</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">★ {template.rating}</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">
                {template.cloned.toLocaleString()} clones
              </span>
            </div>
            <h3 className="mt-2 font-display text-2xl leading-tight">
              {lang === "zh" ? (template.titleZh ?? template.title) : template.title}
            </h3>
            <div className="mt-1 font-mono text-[10px] text-muted-foreground">
              {t(`scenario.${template.scenario}`)} · {template.climate} · {template.totalWeight}
            </div>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-foreground/85">
              {lang === "zh" ? (template.introZh ?? template.intro) : template.intro}
            </p>
          </div>

          {/* Items list */}
          <div className="flex-1 overflow-y-auto py-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="font-mono text-[10px] tracking-[0.22em] text-signal">
                {t("community.intro")}
              </div>
              <div className="flex gap-2 font-mono text-[10px] tracking-[0.18em]">
                <button
                  onClick={() => setSelected(template.items.map((_, i) => i))}
                  className="text-muted-foreground hover:text-signal"
                >
                  {t("community.merge.checkAll")}
                </button>
                <span className="text-border-strong">|</span>
                <button
                  onClick={() => setSelected([])}
                  className="text-muted-foreground hover:text-signal"
                >
                  {t("community.merge.uncheckAll")}
                </button>
              </div>
            </div>

            <ul className="divide-y divide-border border border-border">
              {template.items.map((it, i) => {
                const on = selected.includes(i);
                return (
                  <li
                    key={i}
                    className={`grid grid-cols-12 items-start gap-2 px-3 py-2 transition ${
                      on ? "bg-surface" : "bg-surface-2/40"
                    }`}
                  >
                    <button
                      onClick={() => toggle(i)}
                      className={`col-span-1 mt-1 h-4 w-4 border ${
                        on ? "border-signal bg-signal" : "border-border-strong bg-background"
                      }`}
                      aria-label="select"
                    >
                      {on && <span className="block text-center text-[10px] leading-3 text-signal-foreground">✕</span>}
                    </button>

                    <div className="col-span-5">
                      <div className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5" style={{ background: catColor[it.category] }} />
                        <span className="text-sm">{pickName(lang, it)}</span>
                      </div>
                      <div className="mt-0.5 font-mono text-[10px] leading-relaxed text-muted-foreground">
                        {lang === "zh" ? (it.whyZh ?? it.why) : it.why}
                      </div>
                    </div>
                    <div className="col-span-1 text-right font-mono text-[10px] text-muted-foreground tabular-nums">
                      ×{it.qty}
                    </div>
                    <div className="col-span-2 text-right font-mono text-[10px] text-muted-foreground tabular-nums">
                      {it.weightG}g
                    </div>
                    <div className="col-span-3 flex justify-end">
                      <span className="tag-chip">{it.category.toUpperCase()}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Footer / merge controls */}
          <div className="border-t border-border pt-4">
            <div className="font-mono text-[10px] tracking-[0.22em] text-signal">
              {t("community.merge.title")}
            </div>
            <p className="mt-1 font-mono text-[10px] text-muted-foreground">
              {t("community.merge.subtitle")}
            </p>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-1">
                {containers.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setTarget(c.id)}
                    className={`border px-2 py-1 font-mono text-[10px] tracking-[0.15em] ${
                      target === c.id
                        ? "border-signal bg-signal text-signal-foreground"
                        : "border-border-strong bg-surface text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {c.code} · {c.name}
                  </button>
                ))}
              </div>
              <div className="font-mono text-[10px] text-muted-foreground">
                <span className="text-signal">{selected.length}</span> items ·{" "}
                <span className="text-foreground">{totalKg.toFixed(2)}</span>kg
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={onClose}
                className="border border-border-strong bg-surface px-4 py-2 font-mono text-[10px] tracking-[0.18em] text-muted-foreground hover:text-foreground"
              >
                {t("community.merge.cancel")}
              </button>
              <button
                disabled={selected.length === 0}
                onClick={() => {
                  onCommit(selected, target);
                  onClose();
                }}
                className="border border-signal bg-signal px-4 py-2 font-mono text-[10px] tracking-[0.18em] text-signal-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t("community.merge.commit")}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
