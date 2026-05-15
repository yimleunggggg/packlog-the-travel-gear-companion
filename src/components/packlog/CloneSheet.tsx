import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
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
import {
  assignableContainers,
  unassignedContainerId,
} from "@/lib/unassigned-container";
import {
  packlogBtnPrimary,
  packlogBtnTertiary,
  packlogCardMono,
  packlogCatTitle,
  packlogFieldLabel,
  packlogHint,
  packlogItemName,
  packlogItemWeight,
  packlogKicker,
  packlogPageTitle,
  packlogProseCompact,
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

  const bags = useMemo(() => assignableContainers({ id: targetTripId, containers } as Trip), [targetTripId, containers]);
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
  const TitleTag: "h1" | "h2" = isPage ? "h1" : "h2";
  const titleClassName = isPage
    ? cn(packlogPageTitle, "max-w-[min(100%,42rem)] text-pretty")
    : "max-w-[min(100%,42rem)] text-pretty font-display text-2xl font-normal leading-tight text-foreground";

  const innerCard = (
    <motion.div
      className={cn(
        "module corner-tick corner-tick-br relative flex w-full flex-col p-5 sm:p-6",
        isPage
          ? "max-w-5xl pb-[max(6rem,env(safe-area-inset-bottom))] max-md:pb-32"
          : "max-h-[90vh] max-w-3xl touch-pan-y overflow-hidden overscroll-y-contain pb-[max(3rem,env(safe-area-inset-bottom))] max-md:pb-10",
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
        <div className="flex flex-wrap items-center gap-2">
          <div className={packlogKicker}>
            <span className="text-signal">◐</span>
            <span className="ml-1.5">{t("community.head")}</span>
          </div>
          <span
            className={cn(
              packlogCardMono,
              "rounded border border-border-strong bg-surface px-2 py-0.5 font-medium text-muted-foreground",
            )}
          >
            {guide ? t("community.badge.guide") : t("community.badge.blueprint")}
          </span>
        </div>
        <div
          className={cn(
            "mt-3 flex flex-col gap-3",
            isPage ? "md:flex-row md:items-start md:justify-between md:gap-6" : "sm:flex-row sm:items-end sm:justify-between sm:gap-4",
          )}
        >
          <TitleTag className={titleClassName}>
            {lang === "zh" ? (template.titleZh ?? template.title) : template.title}
          </TitleTag>
          <aside className={cn(packlogCardMono, "shrink-0 space-y-0.5 md:text-right")}>
            <div>{lang === "zh" && template.authorZh ? template.authorZh : template.author}</div>
            <div className="tabular-nums">
              ★ {template.rating} ·{" "}
              {t("community.stats.clones").replace("{n}", template.cloned.toLocaleString())}
            </div>
          </aside>
        </div>
        <div className={cn(packlogCardMono, "mt-3 flex flex-wrap gap-x-4 gap-y-1")}>
          <span>{t(`scenario.${template.scenario}`)}</span>
          <span>{lang === "zh" && template.climateZh ? template.climateZh : template.climate}</span>
          <span>{lang === "zh" && template.totalWeightZh ? template.totalWeightZh : template.totalWeight}</span>
        </div>
        <div
          className={cn(
            packlogCardMono,
            "mt-3 rounded-md border border-border-strong bg-surface-2/90 px-3 py-2.5 text-foreground/90",
          )}
        >
          {t("community.match.ratio")
            .replace("{matched}", String(categoryMatch.matched))
            .replace("{total}", String(categoryMatch.total))}
        </div>
        <p className={cn(packlogProseCompact, "mt-3 max-w-2xl text-pretty text-foreground/90")}>
          {lang === "zh" ? (template.introZh ?? template.intro) : template.intro}
        </p>
        {template.sourceUrl ? (
          <p className={cn(packlogCardMono, "mt-2")}>
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
          <div className="mt-5 rounded-md border border-border-strong bg-surface-2/50 p-4 md:p-5">
            <h2 id="community-guide-body" className={cn(packlogSectionTitle, "mb-3 scroll-mt-28 text-pretty")}>
              {t("community.guide.article")}
            </h2>
            <CommunityMarkdown markdown={markdownBody} />
          </div>
        ) : null}
      </div>

      <div className={cn(isPage ? "py-3" : "min-h-0 flex-1 overflow-y-auto py-3")}>
        {hasAttachableItems ? (
          <>
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
              <h2 className={cn(packlogSectionTitle, "scroll-mt-28 text-pretty")}>{t("community.merge.itemsSection")}</h2>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <button
                  type="button"
                  onClick={() => setSelected(template.items.map((_, i) => i))}
                  className={cn(
                    packlogBtnTertiary,
                    packlogCardMono,
                    "min-h-9 rounded-md px-2 py-1.5 font-medium md:min-h-0 md:py-0",
                  )}
                >
                  {t("community.merge.checkAll")}
                </button>
                <span className="text-border-strong" aria-hidden>
                  |
                </span>
                <button
                  type="button"
                  onClick={() => setSelected([])}
                  className={cn(
                    packlogBtnTertiary,
                    packlogCardMono,
                    "min-h-9 rounded-md px-2 py-1.5 font-medium md:min-h-0 md:py-0",
                  )}
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
                <span className={packlogCatTitle}>{t(`cat.${category}`)}</span>
                <span className={cn(packlogCardMono, "tabular-nums text-muted-foreground")}>({rows.length})</span>
              </div>
              <ul className="divide-y divide-border">
                {rows.map(({ it, i }) => {
                  const on = selected.includes(i);
                  const catKey = normalizeItemCategory(it.category);
                  return (
                    <li
                      key={i}
                      className={`grid grid-cols-12 items-start gap-2 px-3 py-2.5 transition ${
                        on ? "bg-surface" : "bg-surface-2/40"
                      }`}
                    >
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={on}
                        onClick={() => toggle(i)}
                        className={cn(
                          "col-span-1 mt-0.5 grid shrink-0 place-items-center border transition max-md:min-h-11 max-md:min-w-11 max-md:rounded-md md:mt-1 md:h-4 md:w-4",
                          on ? "border-signal bg-signal" : "border-border-strong bg-background",
                        )}
                        aria-label={t("community.merge.toggleItem")}
                      >
                        {on && (
                          <span className="font-mono text-xs leading-none text-signal-foreground md:text-[10px]">
                            ✓
                          </span>
                        )}
                      </button>

                      <div className="col-span-7 min-w-0 sm:col-span-8">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="h-1.5 w-1.5 shrink-0"
                            style={{ background: PACKLOG_CATEGORY_HEX[catKey] }}
                          />
                          <span className={packlogItemName}>{pickName(lang, it)}</span>
                        </div>
                        <div className={cn(packlogHint, "mt-1 max-w-prose text-pretty")}>
                          {lang === "zh" ? (it.whyZh ?? it.why) : it.why}
                        </div>
                      </div>
                      <div className={cn(packlogItemWeight, "col-span-2 text-right sm:col-span-1")}>
                        ×{it.qty}
                      </div>
                      <div className={cn(packlogItemWeight, "col-span-2 text-right sm:col-span-2")}>
                        {it.weightG}g
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
          <p className={cn(packlogHint, "mb-1 max-w-prose text-pretty")}>
            {t("community.guide.noAttachedList")}
          </p>
        )}
      </div>

      <div className="border-t border-border pt-5 md:pt-6">
        <h2 className={cn(packlogSectionTitle, "scroll-mt-28 text-pretty")}>{t("community.merge.title")}</h2>
        <p className={cn(packlogHint, "mt-2 max-w-prose text-pretty")}>
          {hasAttachableItems ? t("community.merge.subtitle") : t("community.guide.mergeSubtitleNoItems")}
        </p>

        {hasSelection ? (
          <div className="mt-4 space-y-5">
            <label className="block">
              <span className={packlogFieldLabel}>{t("community.merge.pickTrip")}</span>
              <select
                value={targetTripId}
                onChange={(e) => onTargetTripChange(e.target.value)}
                className="mt-2 min-h-11 w-full max-w-md rounded-md border border-border-strong bg-background px-3 py-2.5 font-mono text-base text-foreground focus:border-[#C8956C] focus:outline-none md:min-h-0 md:py-2 md:text-sm"
              >
                {trips.map((tr) => (
                  <option key={tr.id} value={tr.id}>
                    {tripShortSelectLabel(tr, lang)}
                  </option>
                ))}
              </select>
            </label>

            <div>
              <span className={packlogFieldLabel}>{t("community.merge.ownership")}</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {ownershipOptions.map((o) => {
                  const active = ownership === o;
                  return (
                    <button
                      key={o}
                      type="button"
                      onClick={() => setOwnership(o)}
                      className={cn(
                        "min-h-10 rounded-md border px-3 py-2 font-mono text-xs font-medium transition md:min-h-0 md:px-2.5 md:py-1.5 md:text-[11px]",
                        active &&
                          (o === "owned"
                            ? "border-success/90 text-[color:var(--success)]"
                            : "border-signal bg-signal-soft text-foreground"),
                        !active && "border-border-strong text-muted-foreground hover:text-foreground",
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
              <span className={packlogFieldLabel}>{t("community.merge.target")}</span>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setTarget(unassignedId)}
                  className={cn(
                    "min-h-10 max-w-[min(100%,14rem)] truncate rounded-md border px-3 py-2 font-mono text-xs tracking-wide transition md:min-h-0 md:py-1.5 md:text-[11px]",
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
                        "min-h-10 max-w-[min(100%,14rem)] truncate rounded-md border px-3 py-2 font-mono text-xs tracking-wide transition md:min-h-0 md:py-1.5 md:text-[11px]",
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
                <p className={cn(packlogHint, "mt-2 max-w-prose text-muted-foreground")}>
                  {t("community.merge.unassignedHint")}
                </p>
              ) : null}
            </div>

            <div className={cn(packlogCardMono, "tabular-nums text-muted-foreground")}>
              <span className="font-medium text-signal">{selected.length}</span> {t("community.items")} ·{" "}
              <span className="text-foreground">{totalKg.toFixed(2)}</span>
              {" kg"}
            </div>
          </div>
        ) : (
          <p className={cn(packlogHint, "mt-3 max-w-prose")}>
            {hasAttachableItems ? `${t("community.merge.itemsSection")} ↑` : t("community.guide.mergeHintNoItems")}
          </p>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
          <button
            type="button"
            onClick={onClose}
            className={cn(
              packlogBtnTertiary,
              "min-h-11 w-full justify-center px-4 py-2.5 text-xs sm:min-h-0 sm:w-auto sm:px-3 sm:py-2 sm:text-[11px]",
            )}
          >
            {t("community.merge.cancel")}
          </button>
          <AuthGate
            pendingAction={() => {
              const n = selected.length;
              onCommit(selected, target, ownership);
              if (n > 0) {
                toast.success(t("community.merge.successToast").replace("{n}", String(n)));
              }
              setSelected([]);
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
              className={cn(
                packlogBtnPrimary,
                "min-h-11 w-full justify-center px-4 py-2.5 text-xs tracking-[0.14em] sm:min-h-0 sm:w-auto sm:py-2 sm:text-[10px] sm:tracking-[0.18em]",
              )}
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
          className={cn(packlogModalSurface, "w-full max-md:max-h-[90vh]", "md:max-w-[min(100%,48rem)] md:rounded-lg")}
        >
          {innerCard}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
