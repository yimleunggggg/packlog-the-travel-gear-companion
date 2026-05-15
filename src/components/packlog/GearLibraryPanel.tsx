import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useRef, useState } from "react";
import { AuthGate } from "@/components/auth/AuthGate";
import { useI18n, pickName } from "@/lib/i18n";
import type { GearSpec } from "@/lib/packlog-data";
import type { Trip } from "@/lib/packlog-data";
import type { Item } from "@/lib/packlog-data";
import {
  LIBRARY_CATEGORY_ORDER,
  aggregateGearLibraryByCategory,
  avgUtilityForCategory,
  summarizeLibraryInsights,
  verdictCountsForGear,
} from "@/lib/library-category-stats";
import { formatLibraryGearCardStats } from "@/lib/library-card-stats";
import {
  packlogBtnPrimary,
  packlogBtnSecondary,
  packlogBtnSm,
  packlogCardMono,
  packlogCatTitle,
  packlogHint,
  packlogItemName,
  packlogKicker,
  packlogProseCompact,
  packlogSectionTitle,
} from "@/lib/packlog-button-classes";
import { tripShortSelectLabel } from "@/lib/trip-list-label";
import { cn } from "@/lib/utils";
import { SheetDragHandle } from "@/components/ui/sheet-drag-handle";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  packlogModalBodyScroll,
  packlogModalScrim,
  packlogModalSurface,
} from "@/lib/packlog-mobile-modal-shell";
import { PACKLOG_CATEGORY_HEX, packlogCategoryHex } from "@/lib/packlog-category-colors";

const verdictColor: Record<string, string> = {
  keep: "var(--success)",
  upgrade: "var(--signal)",
  drop: "var(--destructive)",
};

type CatFilter = "all" | Item["category"];

export function GearLibraryPanel({
  trips,
  library,
  onAddToTrip,
}: {
  trips: Trip[];
  library: GearSpec[];
  onAddToTrip: (tripId: string, gear: GearSpec) => void;
}) {
  const { t, lang } = useI18n();
  const mdUp = useMediaQuery("(min-width: 768px)");
  const [open, setOpen] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [catFilter, setCatFilter] = useState<CatFilter>("all");
  const [pickGear, setPickGear] = useState<GearSpec | null>(null);
  const [pickTripId, setPickTripId] = useState<string>("");
  const detailRef = useRef<HTMLDivElement>(null);

  const statsByCat = useMemo(() => aggregateGearLibraryByCategory(library), [library]);
  const insights = useMemo(() => summarizeLibraryInsights(library), [library]);

  const packTrips = useMemo(() => trips.filter((tr) => tr.phase !== "REVIEW"), [trips]);

  const filtered = library.filter((g) => {
    if (catFilter !== "all" && g.category !== catFilter) return false;
    return (
      !q ||
      g.name.toLowerCase().includes(q.toLowerCase()) ||
      (g.nameZh ?? "").includes(q) ||
      (g.brand ?? "").toLowerCase().includes(q.toLowerCase()) ||
      g.category.includes(q.toLowerCase())
    );
  });

  const cats: CatFilter[] = ["all", "tech", "apparel", "doc", "health", "optic", "misc"];

  const openPicker = (g: GearSpec) => {
    setPickGear(g);
    setPickTripId(packTrips[0]?.id ?? "");
  };

  return (
    <section className="module corner-tick corner-tick-br relative p-5 md:p-6">
      <div className="flex items-center justify-end border-b border-border pb-3">
        <span className="tag-chip">{`N=${library.length}`}</span>
      </div>

      <div className="mt-0 rounded-md border border-border bg-surface-2/70 p-4 md:p-5">
        <div className={cn(packlogKicker, "text-signal")}>{t("library.insights.head")}</div>
        {insights.totalReviews === 0 ? (
          <p className={cn(packlogHint, "mt-3")}>{t("library.insights.empty")}</p>
        ) : (
          <>
            <p className={cn(packlogProseCompact, "mt-3 max-w-prose")}>
              <span>
                {t("library.insights.lead")
                  .replace("{reviews}", String(insights.totalReviews))
                  .replace("{trips}", String(insights.uniqueTripCount))}
              </span>{" "}
              {insights.highlight ? (
                <span>
                  {t("library.insights.highlight")
                    .replace("{cat}", t(`cat.${insights.highlight.category}`))
                    .replace("{avg}", String(insights.highlight.avgUtility))
                    .replace("{n}", String(insights.highlight.reviewCount))}
                </span>
              ) : null}{" "}
              <span>
                {t("library.insights.verdicts")
                  .replace("{k}", String(insights.verdicts.keep))
                  .replace("{u}", String(insights.verdicts.upgrade))
                  .replace("{d}", String(insights.verdicts.drop))}
              </span>
            </p>
            <div className="mt-3 flex h-2 overflow-hidden border border-border">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${(insights.verdicts.keep / Math.max(1, insights.totalReviews)) * 100}%`,
                }}
                transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
                style={{ background: verdictColor.keep }}
              />
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${(insights.verdicts.upgrade / Math.max(1, insights.totalReviews)) * 100}%`,
                }}
                transition={{ duration: 0.6, delay: 0.05, ease: [0.2, 0.8, 0.2, 1] }}
                style={{ background: verdictColor.upgrade }}
              />
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${(insights.verdicts.drop / Math.max(1, insights.totalReviews)) * 100}%`,
                }}
                transition={{ duration: 0.6, delay: 0.1, ease: [0.2, 0.8, 0.2, 1] }}
                style={{ background: verdictColor.drop }}
              />
            </div>
          </>
        )}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-2 lg:grid-cols-3 lg:gap-3">
        {LIBRARY_CATEGORY_ORDER.map((cat) => {
          const agg = statsByCat.get(cat)!;
          const avg = avgUtilityForCategory(agg);
          const denom = agg.reviewCount > 0 ? agg.reviewCount : 1;
          const active = catFilter === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setCatFilter(cat);
                requestAnimationFrame(() =>
                  detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
                );
              }}
              className={`rounded-lg border p-4 text-left transition ${
                active
                  ? "border-signal bg-signal text-signal-foreground shadow-none"
                  : "border-border bg-surface/50 hover:border-foreground/20"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="mt-1 h-2 w-2 shrink-0 rounded-[1px]"
                    style={{ background: packlogCategoryHex(cat) }}
                  />
                  <span className={cn(packlogCatTitle, active ? "text-signal-foreground" : "")}>
                    {t(`cat.${cat}`)}
                  </span>
                </div>
                {avg !== null && (
                  <span
                    className={cn(
                      "shrink-0 font-mono tabular-nums [font-size:var(--font-weight-number-size)] [font-weight:var(--font-weight-number-weight)]",
                      active ? "text-signal-foreground/90" : "text-muted-foreground",
                    )}
                  >
                    ★ {avg.toFixed(1)}
                  </span>
                )}
              </div>
              <p
                className={cn(
                  packlogCardMono,
                  "mt-2 text-pretty",
                  active ? "text-signal-foreground/85" : "",
                )}
              >
                {t("library.cat.summary")
                  .replace("{gear}", String(agg.gearCount))
                  .replace("{reviews}", String(agg.reviewCount))
                  .replace("{trips}", String(agg.uniqueTripIds.size))}
              </p>
              {agg.reviewCount > 0 ? (
                <div className="mt-3 flex h-2 overflow-hidden rounded border border-border/80">
                  <div
                    style={{
                      width: `${(agg.verdicts.keep / denom) * 100}%`,
                      background: verdictColor.keep,
                    }}
                  />
                  <div
                    style={{
                      width: `${(agg.verdicts.upgrade / denom) * 100}%`,
                      background: verdictColor.upgrade,
                    }}
                  />
                  <div
                    style={{
                      width: `${(agg.verdicts.drop / denom) * 100}%`,
                      background: verdictColor.drop,
                    }}
                  />
                </div>
              ) : (
                <div
                  className={cn(
                    "mt-3 flex min-h-9 items-center justify-center rounded border border-dashed border-border/90 bg-surface-3/40 px-2",
                    active ? "border-signal-foreground/25 bg-signal-foreground/10" : "",
                  )}
                  aria-hidden
                >
                  <span
                    className={cn(
                      packlogCardMono,
                      active ? "text-signal-foreground/80" : "opacity-75",
                    )}
                  >
                    — {t("library.history.empty")}
                  </span>
                </div>
              )}
              <div
                className={cn(
                  packlogCardMono,
                  "mt-3 flex min-h-[var(--touch-target)] items-center font-medium tracking-wide",
                  active ? "text-signal-foreground" : "text-link",
                )}
              >
                {t("library.cat.cta")} →
              </div>
            </button>
          );
        })}
      </div>

      <div ref={detailRef} className="mt-8 border-t border-border pt-6">
        <h2 className={cn(packlogSectionTitle, "max-w-prose text-pretty")}>
          {t("library.detail.section")}
        </h2>

        <div className="mt-3 flex flex-wrap gap-2">
          {cats.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => setCatFilter(c)}
              className={`min-h-[var(--touch-target)] rounded-md border px-3 py-2 text-xs font-medium transition md:min-h-0 md:rounded md:px-2.5 md:py-1.5 md:font-mono md:[font-size:var(--font-card-mono-size)] md:font-normal md:leading-[var(--font-card-mono-leading)] md:tracking-[0.12em] ${
                catFilter === c
                  ? "border-signal bg-signal text-signal-foreground"
                  : "border-border-strong text-muted-foreground hover:text-foreground"
              }`}
            >
              {c === "all" ? t("library.filter.all") : t(`cat.${c}`)}
            </button>
          ))}
        </div>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("library.search")}
          className="mt-3 min-h-11 w-full rounded-md border border-border-strong bg-background px-3 py-2.5 text-base placeholder:text-muted-foreground focus:border-foreground/30 focus:outline-none md:min-h-0 md:px-2 md:py-1.5 md:text-sm"
        />

        <ul className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((g) => {
            const vc = verdictCountsForGear(g);
            const tripTouchCount = new Set(g.history.map((h) => h.tripId)).size;
            const avg =
              g.history.length > 0
                ? g.history.reduce((s, h) => s + h.utility, 0) / g.history.length
                : null;
            const isOpen = open === g.id;
            return (
              <motion.li
                layout
                key={g.id}
                className={`relative module p-4 transition ${
                  isOpen ? "ring-2 ring-signal/40" : ""
                }`}
              >
                <button onClick={() => setOpen(isOpen ? null : g.id)} className="w-full text-left">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="h-1.5 w-1.5 shrink-0"
                          style={{ background: PACKLOG_CATEGORY_HEX[g.category] }}
                        />
                        <span
                          className={cn(packlogCardMono, "tracking-[0.14em] text-muted-foreground")}
                        >
                          {t(`cat.${g.category}`)}
                        </span>
                      </div>
                      <div
                        className={cn(
                          packlogItemName,
                          "mt-1 break-words [overflow-wrap:anywhere] md:truncate",
                        )}
                      >
                        {pickName(lang, g)}
                      </div>
                      {g.brand && <div className={cn(packlogCardMono, "mt-0.5")}>{g.brand}</div>}
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="font-mono tabular-nums text-foreground [font-size:var(--font-weight-number-size)] [font-weight:var(--font-weight-number-weight)]">
                        {g.weightG}g
                      </div>
                      {avg !== null && (
                        <div className="mt-0.5 font-mono text-sm tabular-nums text-signal">
                          ★ {avg.toFixed(1)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className={cn(packlogCardMono, "mt-2.5 text-pretty")}>
                    {g.history.length > 0 ? (
                      <span>
                        {t("library.card.reviewsPrefix").replace("{n}", String(g.history.length))}{" "}
                        {formatLibraryGearCardStats(lang, tripTouchCount, vc)}
                      </span>
                    ) : (
                      <span>— {t("library.history.empty")}</span>
                    )}
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 border-t border-dashed border-border pt-3">
                        <p className={cn(packlogProseCompact, "max-w-prose")}>
                          {lang === "zh" ? (g.descriptionZh ?? g.description) : g.description}
                        </p>
                        <div className={cn(packlogCardMono, "mt-2")}>
                          {t("library.owned")} {g.ownedSince}
                        </div>

                        <div className="mt-4">
                          <div className={cn(packlogKicker, "text-foreground")}>
                            {t("library.history")}
                          </div>
                          {g.history.length === 0 ? (
                            <div className={cn(packlogCardMono, "mt-2 text-muted-foreground")}>
                              — {t("library.history.empty")}
                            </div>
                          ) : (
                            <ul className="mt-2 space-y-2">
                              {g.history.map((h, i) => (
                                <li
                                  key={i}
                                  className="border-l-2 bg-surface-2 px-3 py-2"
                                  style={{ borderColor: verdictColor[h.verdict] }}
                                >
                                  <div
                                    className={cn(
                                      packlogCardMono,
                                      "flex flex-wrap items-center justify-between gap-x-2 gap-y-1",
                                    )}
                                  >
                                    <span className="min-w-0 text-muted-foreground">
                                      {h.date} · {h.tripTitle}
                                    </span>
                                    <span
                                      className="shrink-0 font-medium"
                                      style={{ color: verdictColor[h.verdict] }}
                                    >
                                      {t(`review.verdict.${h.verdict}`)} · ★{h.utility}
                                    </span>
                                  </div>
                                  {h.note && (
                                    <div className={cn(packlogHint, "mt-1.5 text-foreground/85")}>
                                      &ldquo;{h.note}&rdquo;
                                    </div>
                                  )}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => openPicker(g)}
                          className={cn(
                            packlogBtnSecondary,
                            "mt-4 w-full min-h-[var(--touch-target)] justify-center px-4 py-2.5 text-[11px] tracking-[0.16em] md:min-h-0 md:py-2 md:text-[10px]",
                          )}
                        >
                          {t("library.add")}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.li>
            );
          })}
        </ul>
      </div>

      <AnimatePresence>
        {pickGear && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn("scrim", packlogModalScrim)}
            onClick={() => setPickGear(null)}
          >
            <motion.div
              initial={mdUp ? { y: 20, opacity: 0 } : { y: "100%", opacity: 1 }}
              animate={{ y: 0, opacity: 1 }}
              exit={mdUp ? { y: 20, opacity: 0 } : { y: "100%", opacity: 1 }}
              transition={
                mdUp
                  ? { duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }
                  : { type: "spring", damping: 30, stiffness: 320 }
              }
              onClick={(e) => e.stopPropagation()}
              className={cn(
                packlogModalSurface,
                "flex w-full flex-col overflow-hidden",
                "max-md:max-h-[90vh]",
                "md:max-w-md md:rounded-lg",
              )}
            >
              <SheetDragHandle />
              <div className="relative shrink-0 border-b border-border px-5 pb-3 pt-1 md:px-6 md:pt-3">
                <div className={cn(packlogKicker, "pr-10 text-foreground")}>
                  {t("library.pickTrip.title")}
                </div>
                <button
                  type="button"
                  onClick={() => setPickGear(null)}
                  className="absolute right-4 top-2 grid h-11 w-11 place-items-center font-mono text-base text-muted-foreground hover:text-foreground md:top-3 md:h-9 md:w-9 md:text-sm"
                  aria-label="close"
                >
                  ✕
                </button>
              </div>
              <div className={cn(packlogModalBodyScroll, "px-5 py-3 md:px-6")}>
                <p className={cn(packlogCardMono, "text-foreground")}>
                  {pickName(lang, pickGear)} · {pickGear.weightG}g
                </p>
                <p className={cn(packlogHint, "mt-2 text-muted-foreground")}>
                  {t("library.pickTrip.subtitle")}
                </p>

                {packTrips.length === 0 ? (
                  <p className={cn(packlogCardMono, "mt-4 text-muted-foreground")}>
                    {t("library.pickTrip.empty")}
                  </p>
                ) : (
                  <ul className="mt-4 max-h-48 space-y-1 overflow-y-auto rounded border border-border">
                    {packTrips.map((tr) => (
                      <li key={tr.id}>
                        <button
                          type="button"
                          onClick={() => setPickTripId(tr.id)}
                          className={`flex min-h-[var(--touch-target)] w-full flex-col items-start justify-center px-3 py-2 text-left text-sm transition md:min-h-0 md:text-xs ${
                            pickTripId === tr.id ? "bg-signal-soft/70" : "hover:bg-surface-2"
                          }`}
                        >
                          <span className="font-medium leading-snug">
                            {tripShortSelectLabel(tr, lang)}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-border px-5 py-3 md:px-6">
                <button
                  type="button"
                  onClick={() => setPickGear(null)}
                  className={cn(
                    packlogCardMono,
                    "min-h-[var(--touch-target)] rounded-md px-3 py-2 text-link underline-offset-4 hover:text-link-hover hover:underline md:min-h-0 md:px-2 md:py-1.5",
                  )}
                >
                  {t("trips.create.cancel")}
                </button>
                {pickGear && (
                  <AuthGate
                    pendingAction={() => {
                      if (!pickTripId) return;
                      onAddToTrip(pickTripId, pickGear);
                      setPickGear(null);
                    }}
                    resumeIntent={{
                      v: 1,
                      kind: "libraryAddGear",
                      gearId: pickGear.id,
                      tripId: pickTripId,
                    }}
                  >
                    <button
                      type="button"
                      disabled={!pickTripId || packTrips.length === 0}
                      className={cn(
                        packlogBtnPrimary,
                        packlogBtnSm,
                        "disabled:cursor-not-allowed disabled:opacity-40",
                      )}
                    >
                      {t("library.pickTrip.confirm")}
                    </button>
                  </AuthGate>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
