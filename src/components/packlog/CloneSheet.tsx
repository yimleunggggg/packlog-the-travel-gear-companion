import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { AuthGate } from "@/components/auth/AuthGate";
import { useI18n, pickName } from "@/lib/i18n";
import {
  libraryCategoryMatchForTemplate,
  type CommunityTemplate,
  type CommunityItem,
  type Container,
  type GearSpec,
  type Item,
} from "@/lib/packlog-data";
import { LIBRARY_CATEGORY_ORDER } from "@/lib/library-category-stats";
import { containerDisplayLabel } from "@/lib/container-label";

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
  library = [],
  targetTripId,
  onClose,
  onCommit,
  presentation = "modal",
}: {
  template: CommunityTemplate | null;
  containers: Container[];
  library?: GearSpec[];
  /** Trip receiving the blueprint merge — required for auth resume after OAuth. */
  targetTripId: string;
  onClose: () => void;
  onCommit: (selectedIdx: number[], targetContainerId: string) => void;
  /** `page`：独立社区详情页内嵌，无遮罩。 */
  presentation?: "modal" | "page";
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

  const categoryMatch = useMemo(() => {
    if (!template) return { matched: 0, total: 0 };
    return libraryCategoryMatchForTemplate(template, library);
  }, [template, library]);

  /** Preserve original item indices for selection / onCommit. */
  const groupedItems = useMemo((): {
    category: Item["category"];
    rows: { it: CommunityItem; i: number }[];
  }[] => {
    if (!template) return [];
    const byCat = new Map<Item["category"], { it: CommunityItem; i: number }[]>();
    for (const c of LIBRARY_CATEGORY_ORDER) byCat.set(c, []);
    template.items.forEach((it, i) => {
      byCat.get(it.category)?.push({ it, i });
    });
    const out: { category: Item["category"]; rows: { it: CommunityItem; i: number }[] }[] = [];
    for (const c of LIBRARY_CATEGORY_ORDER) {
      const rows = byCat.get(c);
      if (rows && rows.length > 0) out.push({ category: c, rows });
    }
    return out;
  }, [template]);

  const toggle = (i: number) =>
    setSelected((cur) => (cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i]));

  if (!template) return null;

  const innerCard = (
    <div
      className={`module corner-tick corner-tick-br relative flex w-full touch-pan-y flex-col overflow-hidden overscroll-y-contain p-5 sm:p-6 ${
        presentation === "modal"
          ? "max-h-[min(88dvh,calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-2rem))] max-w-3xl"
          : "max-w-3xl"
      }`}
    >
      <div className="border-b border-border pb-4">
        <div className="font-mono text-[10px] tracking-[0.22em] text-signal">
          ◐ {t("community.head")}
        </div>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-2">
          <h3 className="font-display text-2xl leading-tight">
            {lang === "zh" ? (template.titleZh ?? template.title) : template.title}
          </h3>
          <div className="text-right font-mono text-[10px] text-muted-foreground">
            <div>{template.author}</div>
            <div>
              ★ {template.rating} · {template.cloned.toLocaleString()} clones
            </div>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10px] text-muted-foreground">
          <span>{t(`scenario.${template.scenario}`)}</span>
          <span>{template.climate}</span>
          <span>{template.totalWeight}</span>
        </div>
        <div className="mt-2 rounded border border-border-strong bg-surface-2/80 px-2 py-1 font-mono text-[10px] text-muted-foreground">
          {t("community.match.ratio")
            .replace("{matched}", String(categoryMatch.matched))
            .replace("{total}", String(categoryMatch.total))}
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-foreground/85">
          {lang === "zh" ? (template.introZh ?? template.intro) : template.intro}
        </p>
        {template.sourceUrl ? (
          <p className="mt-2 font-mono text-[10px] leading-relaxed text-muted-foreground">
            <a
              href={template.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-link underline decoration-border-strong underline-offset-2 hover:decoration-foreground"
            >
              {lang === "zh"
                ? `出处 · ${template.sourceTitle ?? template.sourceUrl}`
                : `Source · ${template.sourceTitle ?? template.sourceUrl}`}
            </a>
          </p>
        ) : null}
      </div>

      {/* Items list */}
      <div className="flex-1 overflow-y-auto py-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="font-mono text-[10px] tracking-[0.22em] text-signal">
            {t("community.merge.itemsSection")}
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

        <div className="overflow-hidden rounded border border-border">
          {groupedItems.map(({ category, rows }, gi) => (
            <section key={category} className={gi > 0 ? "border-t border-border" : ""}>
              <div className="flex items-center gap-2 border-b border-border bg-surface-2/85 px-3 py-2">
                <span
                  className="h-2 w-2 shrink-0 rounded-[1px]"
                  style={{ background: catColor[category] }}
                />
                <span className="font-mono text-[10px] tracking-[0.18em] text-signal">
                  {t(`cat.${category}`)}
                </span>
                <span className="font-mono text-[9px] text-muted-foreground">({rows.length})</span>
              </div>
              <ul className="divide-y divide-border">
                {rows.map(({ it, i }) => {
                  const on = selected.includes(i);
                  return (
                    <li
                      key={i}
                      className={`grid grid-cols-12 items-start gap-2 px-3 py-2 transition ${
                        on ? "bg-surface" : "bg-surface-2/40"
                      }`}
                    >
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={on}
                        onClick={() => toggle(i)}
                        className={`col-span-1 mt-1 h-4 w-4 shrink-0 border ${
                          on ? "border-signal bg-signal" : "border-border-strong bg-background"
                        }`}
                        aria-label={t("community.merge.toggleItem")}
                      >
                        {on && (
                          <span className="block text-center text-[10px] leading-4 text-signal-foreground">
                            ✓
                          </span>
                        )}
                      </button>

                      <div className="col-span-6 sm:col-span-5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="h-1.5 w-1.5"
                            style={{ background: catColor[it.category] }}
                          />
                          <span className="text-sm">{pickName(lang, it)}</span>
                        </div>
                        <div className="mt-0.5 font-mono text-[10px] leading-relaxed text-muted-foreground">
                          {lang === "zh" ? (it.whyZh ?? it.why) : it.why}
                        </div>
                      </div>
                      <div className="col-span-2 text-right font-mono text-[10px] text-muted-foreground tabular-nums sm:col-span-1">
                        ×{it.qty}
                      </div>
                      <div className="col-span-2 text-right font-mono text-[10px] text-muted-foreground tabular-nums sm:col-span-2">
                        {it.weightG}g
                      </div>
                      <div className="col-span-1 flex justify-end sm:col-span-3">
                        <span className="hidden tag-chip sm:inline">
                          {it.category.toUpperCase()}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
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
                type="button"
                key={c.id}
                title={containerDisplayLabel(c, lang, t)}
                onClick={() => setTarget(c.id)}
                className={`max-w-[min(100%,11rem)] truncate border px-2 py-1 font-mono text-[10px] tracking-[0.15em] ${
                  target === c.id
                    ? "border-signal bg-signal text-signal-foreground"
                    : "border-border-strong bg-surface text-muted-foreground hover:text-foreground"
                }`}
              >
                {containerDisplayLabel(c, lang, t)}
              </button>
            ))}
          </div>
          <div className="font-mono text-[10px] text-muted-foreground">
            <span className="text-signal">{selected.length}</span> {t("community.items")} ·{" "}
            <span className="text-foreground">{totalKg.toFixed(2)}</span>
            kg
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="border border-border-strong bg-surface px-4 py-2 font-mono text-[10px] tracking-[0.18em] text-muted-foreground hover:text-foreground"
          >
            {t("community.merge.cancel")}
          </button>
          <AuthGate
            pendingAction={() => {
              onCommit(selected, target);
              onClose();
            }}
            resumeIntent={{
              v: 1,
              kind: "communityClone",
              tripId: targetTripId,
              templateId: template.id,
              selectedIdx: selected,
              targetContainerId: target,
            }}
          >
            <button
              type="button"
              disabled={!targetTripId || selected.length === 0}
              className="border border-signal bg-signal px-4 py-2 font-mono text-[10px] tracking-[0.18em] text-signal-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t("community.merge.commit")}
            </button>
          </AuthGate>
        </div>
      </div>
    </div>
  );

  if (presentation === "page") {
    return <div className="mx-auto w-full max-w-3xl">{innerCard}</div>;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="scrim fixed inset-0 z-50 grid touch-none place-items-center overscroll-none p-3 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
        >
          {innerCard}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
