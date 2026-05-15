import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { AuthGate } from "@/components/auth/AuthGate";
import { useI18n, pickName } from "@/lib/i18n";
import {
  libraryCategoryMatchForTemplate,
  isCommunityGuide,
  type CommunityTemplate,
  type CommunityItem,
  type Container,
  type GearSpec,
  type Item,
  type Trip,
} from "@/lib/packlog-data";
import { CommunityMarkdown } from "@/components/packlog/CommunityMarkdown";
import { LIBRARY_CATEGORY_ORDER } from "@/lib/library-category-stats";
import { containerDisplayLabel } from "@/lib/container-label";
import { tripShortSelectLabel } from "@/lib/trip-list-label";
import { assignableContainers, unassignedContainerId } from "@/lib/unassigned-container";
import {
  packlogBtnPrimary,
  packlogBtnTertiary,
  packlogItemName,
  packlogItemWeight,
  packlogPageTitle,
  packlogSectionTitle,
} from "@/lib/packlog-button-classes";
import { cn } from "@/lib/utils";
import { SheetDragHandle } from "@/components/ui/sheet-drag-handle";
import { useMediaQuery } from "@/hooks/use-media-query";
import { packlogModalScrim, packlogModalSurface } from "@/lib/packlog-mobile-modal-shell";
import { PACKLOG_CATEGORY_HEX, packlogCategoryHex } from "@/lib/packlog-category-colors";

const ownColor: Record<Item["ownership"], string> = {
  owned: "var(--success)",
  wishlist: "var(--info)",
  borrowed: "var(--warn)",
  undecided: "var(--muted-foreground)",
};

function normalizeItemCategory(c: Item["category"]): Item["category"] {
  const key = String(c ?? "").toLowerCase() as Item["category"];
  return (LIBRARY_CATEGORY_ORDER as readonly Item["category"][]).includes(key) ? key : "misc";
}

export function CloneSheet({
  template,
  trips,
  targetTripId,
  onTargetTripChange,
  containers,
  library = [],
  onClose,
  onCommit,
  presentation = "modal",
  commitCloses = true,
}: {
  template: CommunityTemplate | null;
  trips: Trip[];
  targetTripId: string;
  onTargetTripChange: (tripId: string) => void;
  containers: Container[];
  library?: GearSpec[];
  onClose: () => void;
  onCommit: (
    selectedIdx: number[],
    targetContainerId: string,
    ownership: Item["ownership"],
  ) => void;
  presentation?: "modal" | "page";
  commitCloses?: boolean;
}) {
  const { t, lang } = useI18n();
  const mdUp = useMediaQuery("(min-width: 768px)");
  const [selected, setSelected] = useState<number[]>([]);
  const [target, setTarget] = useState<string>(() => unassignedContainerId(targetTripId));
  const [ownership, setOwnership] = useState<Item["ownership"]>("owned");

  useEffect(() => {
    if (template) setSelected([]);
  }, [template?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setTarget(unassignedContainerId(targetTripId));
  }, [targetTripId]);

  const bags = useMemo(
    () => assignableContainers({ id: targetTripId, containers } as Trip),
    [targetTripId, containers],
  );
  const unassignedId = unassignedContainerId(targetTripId);

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

  const groupedItems = useMemo((): {
    category: Item["category"];
    rows: { it: CommunityItem; i: number }[];
  }[] => {
    if (!template) return [];
    const byCat = new Map<Item["category"], { it: CommunityItem; i: number }[]>();
    for (const c of LIBRARY_CATEGORY_ORDER) byCat.set(c, []);
    template.items.forEach((it, i) => {
      const cat = normalizeItemCategory(it.category);
      byCat.get(cat)!.push({ it, i });
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

  const isPage = presentation === "page";
  const guide = isCommunityGuide(template);
  const markdownBody =
    guide && template.markdown
      ? lang === "zh"
        ? (template.markdownZh ?? template.markdown)
        : template.markdown
      : null;
  const hasAttachableItems = template.items.length > 0;
  const hasSelection = selected.length > 0;
  const ownershipOptions: Item["ownership"][] = ["owned", "wishlist", "borrowed", "undecided"];

  const innerCard = (
    <motion.div
      className={cn(
        "module corner-tick corner-tick-br relative flex w-full flex-col p-5 sm:p-6",
        isPage
          ? "max-w-5xl"
          : "max-h-[90vh] max-w-3xl touch-pan-y overflow-hidden overscroll-y-contain",
      )}
    >
      {!isPage ? <SheetDragHandle /> : null}
      <div className={cn("border-b border-border pb-4", !isPage && "relative pr-12")}>
        {!isPage ? (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-1 top-1 z-10 font-mono text-sm text-muted-foreground hover:text-foreground"
            aria-label="close"
          >
            ✕
          </button>
        ) : null}
        <motion.div className="flex flex-wrap items-center gap-2 font-mono text-[10px] tracking-[0.22em] text-signal">
          <span>◐ {t("community.head")}</span>
          <span className="rounded border border-border-strong bg-surface px-1.5 py-0.5 text-[9px] tracking-[0.14em] text-muted-foreground">
            {guide ? t("community.badge.guide") : t("community.badge.blueprint")}
          </span>
        </motion.div>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-2">
          <h3
            className={cn(
              presentation === "page" ? packlogPageTitle : "font-display text-2xl leading-tight",
            )}
          >
            {lang === "zh" ? (template.titleZh ?? template.title) : template.title}
          </h3>
          <div className="text-right font-mono text-[10px] text-muted-foreground">
            <div>{lang === "zh" && template.authorZh ? template.authorZh : template.author}</div>
            <div>
              ★ {template.rating} ·{" "}
              {t("community.stats.clones").replace("{n}", template.cloned.toLocaleString())}
            </div>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10px] text-muted-foreground">
          <span>{t(`scenario.${template.scenario}`)}</span>
          <span>{lang === "zh" && template.climateZh ? template.climateZh : template.climate}</span>
          <span>
            {lang === "zh" && template.totalWeightZh
              ? template.totalWeightZh
              : template.totalWeight}
          </span>
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
                ? `出处 · ${template.sourceTitleZh ?? template.sourceTitle ?? template.sourceUrl}`
                : `Source · ${template.sourceTitle ?? template.sourceUrl}`}
            </a>
          </p>
        ) : null}
        {markdownBody ? (
          <div className="mt-4 rounded border border-border-strong bg-surface-2/50 p-4">
            <div className="mb-3 font-mono text-[10px] tracking-[0.22em] text-signal">
              {t("community.guide.article")}
            </div>
            <CommunityMarkdown markdown={markdownBody} />
          </div>
        ) : null}
      </div>

      <div className={cn(isPage ? "py-3" : "min-h-0 flex-1 overflow-y-auto py-3")}>
        {hasAttachableItems ? (
          <>
            <div className="mb-2 flex items-center justify-between">
              <div className="font-mono text-[10px] tracking-[0.22em] text-signal">
                {t("community.merge.itemsSection")}
              </div>
              <div className="flex gap-2 font-mono text-[10px] tracking-[0.18em]">
                <button
                  type="button"
                  onClick={() => setSelected(template.items.map((_, i) => i))}
                  className={cn(packlogBtnTertiary, "min-h-0 px-0 py-0 font-normal")}
                >
                  {t("community.merge.checkAll")}
                </button>
                <span className="text-border-strong">|</span>
                <button
                  type="button"
                  onClick={() => setSelected([])}
                  className={cn(packlogBtnTertiary, "min-h-0 px-0 py-0 font-normal")}
                >
                  {t("community.merge.uncheckAll")}
                </button>
              </div>
            </div>

            <div className="overflow-hidden rounded border border-border">
              {groupedItems.map(({ category, rows }, gi) => (
                <section key={category} className={gi > 0 ? "border-t border-border" : ""}>
                  <div className="flex items-center gap-2 border-b border-border bg-surface-2/85 px-3 py-2.5">
                    <span
                      className="h-2 w-2 shrink-0 rounded-[1px]"
                      style={{ background: packlogCategoryHex(category) }}
                    />
                    <span className={cn(packlogSectionTitle, "font-mono tracking-normal")}>
                      {t(`cat.${category}`)}
                    </span>
                    <span className="font-mono text-[12px] tabular-nums text-muted-foreground">
                      ({rows.length})
                    </span>
                  </div>
                  <ul className="divide-y divide-border">
                    {rows.map(({ it, i }) => {
                      const on = selected.includes(i);
                      const catKey = normalizeItemCategory(it.category);
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
                                style={{ background: PACKLOG_CATEGORY_HEX[catKey] }}
                              />
                              <span className={packlogItemName}>{pickName(lang, it)}</span>
                            </div>
                            <div className="mt-0.5 font-mono text-[10px] leading-relaxed text-muted-foreground">
                              {lang === "zh" ? (it.whyZh ?? it.why) : it.why}
                            </div>
                          </div>
                          <div
                            className={cn(packlogItemWeight, "col-span-2 text-right sm:col-span-1")}
                          >
                            ×{it.qty}
                          </div>
                          <div
                            className={cn(packlogItemWeight, "col-span-2 text-right sm:col-span-2")}
                          >
                            {it.weightG}g
                          </div>
                          <div className="col-span-1 flex justify-end sm:col-span-3">
                            <span className="inline max-w-[4.5rem] truncate rounded border border-border-strong px-1.5 py-0.5 text-center font-mono text-[9px] tracking-[0.06em] text-muted-foreground sm:max-w-none">
                              {t(`cat.${catKey}`)}
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
          </>
        ) : (
          <p className="mb-1 font-mono text-[11px] leading-relaxed text-muted-foreground">
            {t("community.guide.noAttachedList")}
          </p>
        )}
      </div>

      <div className="border-t border-border pt-4">
        <div className="font-mono text-[10px] tracking-[0.22em] text-signal">
          {t("community.merge.title")}
        </div>
        <p className="mt-1 font-mono text-[10px] text-muted-foreground">
          {hasAttachableItems
            ? t("community.merge.subtitle")
            : t("community.guide.mergeSubtitleNoItems")}
        </p>

        {hasSelection ? (
          <div className="mt-4 space-y-4">
            <label className="block">
              <span className="font-mono text-[9px] tracking-[0.18em] text-muted-foreground">
                {t("community.merge.pickTrip")}
              </span>
              <select
                value={targetTripId}
                onChange={(e) => onTargetTripChange(e.target.value)}
                className="mt-1 w-full max-w-md rounded border border-border-strong bg-background px-2 py-1.5 font-mono text-xs focus:border-[#C8956C] focus:outline-none"
              >
                {trips.map((tr) => (
                  <option key={tr.id} value={tr.id}>
                    {tripShortSelectLabel(tr, lang)}
                  </option>
                ))}
              </select>
            </label>

            <div>
              <span className="font-mono text-[9px] tracking-[0.18em] text-muted-foreground">
                {t("community.merge.ownership")}
              </span>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {ownershipOptions.map((o) => {
                  const active = ownership === o;
                  return (
                    <button
                      key={o}
                      type="button"
                      onClick={() => setOwnership(o)}
                      className={cn(
                        "rounded border px-2 py-1 font-mono text-[9px]",
                        active &&
                          (o === "owned"
                            ? "border-success/90 text-[color:var(--success)]"
                            : "border-signal bg-signal-soft text-foreground"),
                        !active &&
                          "border-border-strong text-muted-foreground hover:text-foreground",
                      )}
                      style={!active ? { borderColor: ownColor[o], color: ownColor[o] } : undefined}
                    >
                      {t(`own.${o}`)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <span className="font-mono text-[9px] tracking-[0.18em] text-muted-foreground">
                {t("community.merge.target")}
              </span>
              <div className="mt-1.5 flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => setTarget(unassignedId)}
                  className={cn(
                    "max-w-[min(100%,11rem)] truncate border px-2 py-1 font-mono text-[10px] tracking-[0.15em]",
                    target === unassignedId
                      ? "border-signal bg-signal text-signal-foreground"
                      : "border-border-strong bg-transparent text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                  )}
                >
                  {t("community.merge.unassigned")}
                </button>
                {bags.map((c) => {
                  const label = containerDisplayLabel(c, lang, t);
                  return (
                    <button
                      type="button"
                      key={c.id}
                      title={label}
                      onClick={() => setTarget(c.id)}
                      className={cn(
                        "max-w-[min(100%,11rem)] truncate border px-2 py-1 font-mono text-[10px] tracking-[0.15em]",
                        target === c.id
                          ? "border-signal bg-signal text-signal-foreground"
                          : "border-border-strong bg-transparent text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              {target === unassignedId && t("community.merge.unassignedHint").trim() ? (
                <p className="mt-1.5 font-mono text-[10px] leading-relaxed text-muted-foreground">
                  {t("community.merge.unassignedHint")}
                </p>
              ) : null}
            </div>

            <div className="font-mono text-[10px] text-muted-foreground">
              <span className="text-signal">{selected.length}</span> {t("community.items")} ·{" "}
              <span className="text-foreground">{totalKg.toFixed(2)}</span>
              kg
            </div>
          </div>
        ) : (
          <p className="mt-3 font-mono text-[10px] text-muted-foreground">
            {hasAttachableItems
              ? `${t("community.merge.itemsSection")} ↑`
              : t("community.guide.mergeHintNoItems")}
          </p>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className={cn(packlogBtnTertiary, "px-2 py-2 text-[10px]")}
          >
            {t("community.merge.cancel")}
          </button>
          <AuthGate
            pendingAction={() => {
              onCommit(selected, target, ownership);
              if (commitCloses) onClose();
            }}
            resumeIntent={{
              v: 1,
              kind: "communityClone",
              tripId: targetTripId,
              templateId: template.id,
              selectedIdx: selected,
              targetContainerId: target,
              ownership,
            }}
          >
            <button
              type="button"
              disabled={!targetTripId || selected.length === 0}
              className={cn(packlogBtnPrimary, "px-4 py-2 text-[10px] tracking-[0.18em]")}
            >
              {t("community.merge.commit")}
            </button>
          </AuthGate>
        </div>
      </div>
    </motion.div>
  );

  if (presentation === "page") {
    return <div className="mx-auto w-full max-w-5xl">{innerCard}</div>;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={cn("scrim z-50", packlogModalScrim)}
        onClick={onClose}
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={mdUp ? { y: 20, opacity: 0 } : { y: "100%", opacity: 1 }}
          animate={{ y: 0, opacity: 1 }}
          exit={mdUp ? { y: 20, opacity: 0 } : { y: "100%", opacity: 1 }}
          transition={
            mdUp
              ? { duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }
              : { type: "spring", damping: 30, stiffness: 320 }
          }
          className={cn(
            packlogModalSurface,
            "w-full max-md:max-h-[90vh]",
            "md:max-w-[min(100%,48rem)] md:rounded-lg",
          )}
        >
          {innerCard}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
