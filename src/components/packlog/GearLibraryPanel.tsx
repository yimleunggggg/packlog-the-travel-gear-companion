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

const catColor: Record<string, string> = {
  tech: "var(--info)",
  apparel: "var(--signal)",
  doc: "var(--warn)",
  health: "var(--success)",
  optic: "var(--signal)",
  misc: "var(--muted-foreground)",
};

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
    <section className="module corner-tick corner-tick-br relative p-5">
      <div className="flex items-start justify-between border-b border-border pb-3">
        <div>
          <div className="font-mono text-[10px] tracking-[0.22em] text-signal">
            {t("library.head")}
          </div>
          <h3 className="mt-1 font-display text-xl">{t("library.title")}</h3>
          <p className="mt-1 font-mono text-[10px] text-muted-foreground">
            {t("library.subtitle")}
          </p>
        </div>
        <span className="tag-chip">N={library.length}</span>
      </div>

      <div className="mt-4 rounded-md border border-border bg-surface-2/70 p-4">
        <div className="font-mono text-[10px] tracking-[0.22em] text-signal">
          {t("library.insights.head")}
        </div>
        {insights.totalReviews === 0 ? (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {t("library.insights.empty")}
          </p>
        ) : (
          <>
            <p className="mt-2 text-sm leading-relaxed text-foreground/90">
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

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
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
              className={`rounded-md border p-3 text-left transition ${
                active
                  ? "border-signal bg-signal-soft/35 shadow-sm"
                  : "border-border bg-surface/50 hover:border-border-strong"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 shrink-0" style={{ background: catColor[cat] }} />
                  <span className="font-mono text-[10px] tracking-[0.18em] text-signal">
                    {t(`cat.${cat}`)}
                  </span>
                </div>
                {avg !== null && (
                  <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                    ★ {avg.toFixed(1)}
                  </span>
                )}
              </div>
              <p className="mt-2 font-mono text-[9px] leading-snug text-muted-foreground">
                {t("library.cat.summary")
                  .replace("{gear}", String(agg.gearCount))
                  .replace("{reviews}", String(agg.reviewCount))
                  .replace("{trips}", String(agg.uniqueTripIds.size))}
              </p>
              {agg.reviewCount > 0 ? (
                <div className="mt-2 flex h-1.5 overflow-hidden border border-border">
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
                <div className="mt-2 h-1.5 border border-dashed border-border bg-surface-3/60" />
              )}
              <div className="mt-2 font-mono text-[9px] tracking-[0.14em] text-muted-foreground">
                {t("library.cat.cta")} →
              </div>
            </button>
          );
        })}
      </div>

      <div ref={detailRef} className="mt-6 border-t border-border pt-5">
        <div className="font-mono text-[10px] tracking-[0.22em] text-signal">
          {t("library.detail.section")}
        </div>

        <div className="mt-2 flex flex-wrap gap-1">
          {cats.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => setCatFilter(c)}
              className={`rounded border px-2 py-0.5 font-mono text-[9px] tracking-[0.12em] ${
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
          className="mt-3 w-full rounded-md border border-border-strong bg-background px-2 py-1.5 text-sm placeholder:text-muted-foreground focus:border-signal focus:outline-none"
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
                className={`relative border bg-surface p-3 transition ${
                  isOpen ? "border-signal shadow-lg" : "border-border hover:border-border-strong"
                }`}
              >
                <button onClick={() => setOpen(isOpen ? null : g.id)} className="w-full text-left">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="h-1.5 w-1.5"
                          style={{ background: catColor[g.category] }}
                        />
                        <span className="font-mono text-[9px] tracking-[0.18em] text-muted-foreground">
                          {g.category.toUpperCase()}
                        </span>
                      </div>
                      <div className="mt-1 truncate text-sm font-medium">{pickName(lang, g)}</div>
                      {g.brand && (
                        <div className="font-mono text-[10px] text-muted-foreground">{g.brand}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-xs tabular-nums">{g.weightG}g</div>
                      {avg !== null && (
                        <div className="font-mono text-[10px] text-signal">★ {avg.toFixed(1)}</div>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 font-mono text-[9px] leading-snug text-muted-foreground">
                    {g.history.length > 0 ? (
                      <span>
                        {t("library.card.line")
                          .replace("{reviews}", String(g.history.length))
                          .replace("{trips}", String(tripTouchCount))
                          .replace("{k}", String(vc.keep))
                          .replace("{u}", String(vc.upgrade))
                          .replace("{d}", String(vc.drop))}
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
                        <p className="text-[12px] leading-relaxed text-foreground/85">
                          {lang === "zh" ? (g.descriptionZh ?? g.description) : g.description}
                        </p>
                        <div className="mt-2 font-mono text-[9px] text-muted-foreground">
                          {t("library.owned")} {g.ownedSince}
                        </div>

                        <div className="mt-3">
                          <div className="font-mono text-[9px] tracking-[0.18em] text-signal">
                            {t("library.history")}
                          </div>
                          {g.history.length === 0 ? (
                            <div className="mt-1 font-mono text-[10px] text-muted-foreground">
                              — {t("library.history.empty")}
                            </div>
                          ) : (
                            <ul className="mt-1 space-y-1">
                              {g.history.map((h, i) => (
                                <li
                                  key={i}
                                  className="border-l-2 bg-surface-2 px-2 py-1 text-[11px]"
                                  style={{ borderColor: verdictColor[h.verdict] }}
                                >
                                  <div className="flex items-center justify-between font-mono text-[9px]">
                                    <span className="text-muted-foreground">
                                      {h.date} · {h.tripTitle}
                                    </span>
                                    <span style={{ color: verdictColor[h.verdict] }}>
                                      {h.verdict.toUpperCase()} · ★{h.utility}
                                    </span>
                                  </div>
                                  {h.note && (
                                    <div className="mt-0.5 leading-snug text-foreground/80">
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
                          className="mt-3 w-full border border-signal bg-signal py-1.5 font-mono text-[10px] tracking-[0.18em] text-signal-foreground hover:opacity-90"
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
            className="scrim fixed inset-0 z-50 grid touch-none place-items-center overscroll-none p-3 sm:p-4"
            onClick={() => setPickGear(null)}
          >
            <motion.div
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 16, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="module corner-tick relative w-full max-w-md p-5"
            >
              <div className="font-mono text-[10px] tracking-[0.22em] text-signal">
                {t("library.pickTrip.title")}
              </div>
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                {pickName(lang, pickGear)} · {pickGear.weightG}g
              </p>
              <p className="mt-2 text-xs text-muted-foreground">{t("library.pickTrip.subtitle")}</p>

              {packTrips.length === 0 ? (
                <p className="mt-4 font-mono text-[11px] text-muted-foreground">
                  {t("library.pickTrip.empty")}
                </p>
              ) : (
                <ul className="mt-4 max-h-48 space-y-1 overflow-y-auto rounded border border-border">
                  {packTrips.map((tr) => (
                    <li key={tr.id}>
                      <button
                        type="button"
                        onClick={() => setPickTripId(tr.id)}
                        className={`flex w-full flex-col items-start px-3 py-2 text-left text-xs transition ${
                          pickTripId === tr.id ? "bg-signal-soft/70" : "hover:bg-surface-2"
                        }`}
                      >
                        <span className="font-medium">{tr.title}</span>
                        <span className="font-mono text-[10px] text-muted-foreground">{tr.id}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPickGear(null)}
                  className="rounded border border-border-strong px-3 py-1.5 font-mono text-[10px] tracking-[0.18em] text-muted-foreground hover:text-foreground"
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
                      className="rounded border border-signal bg-signal px-3 py-1.5 font-mono text-[10px] tracking-[0.18em] text-signal-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
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
