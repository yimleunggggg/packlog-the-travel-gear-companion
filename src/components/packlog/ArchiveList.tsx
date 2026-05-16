import { motion } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { AuthGate } from "@/components/auth/AuthGate";
import { useI18n } from "@/lib/i18n";
import type { Trip } from "@/lib/packlog-data";
import { formatDestinations } from "@/lib/destinations";
import { filterTripTagList } from "@/lib/community-tag-display";
import {
  canonicalTagKey,
  formatTagForUi,
  isPresetTagId,
  tripTagMatchStrength,
} from "@/lib/tag-presets";
import {
  packlogBtnBlock,
  packlogBtnPrimary,
  packlogBtnSm,
  packlogHint,
  packlogPageTitle,
  packlogSectionTitle,
} from "@/lib/packlog-button-classes";
import { tripTitleDisplay } from "@/lib/trip-list-label";
import { tripScenarios } from "@/lib/trip-scenarios";
import { calendarDaysUntilTripStart } from "@/lib/trip-date";
import { cn } from "@/lib/utils";

function tripAggregate(tr: Trip) {
  let totalItems = 0;
  let packed = 0;
  let wishlist = 0;
  let grams = 0;
  for (const c of tr.containers) {
    for (const it of c.items) {
      totalItems += 1;
      if (it.status === "packed") packed += 1;
      if (it.ownership === "wishlist") wishlist += 1;
      grams += it.weightG * it.qty;
    }
  }
  return {
    totalItems,
    packed,
    wishlist,
    todo: totalItems - packed,
    totalKg: grams / 1000,
  };
}

export function ArchiveList({
  trips,
  tagFilter,
  onOpen,
  onNewTrip,
}: {
  trips: Trip[];
  tagFilter?: string;
  onOpen: (id: string) => void;
  onNewTrip: () => void;
}) {
  const { t, lang } = useI18n();
  const navigate = useNavigate();

  const visibleTrips = useMemo(() => {
    if (!tagFilter?.trim()) return trips;
    return [...trips]
      .map((tr) => ({ tr, s: tripTagMatchStrength(tr.tags, tagFilter) }))
      .filter((x) => x.s !== "none")
      .sort((a, b) => {
        if (a.s === b.s) return 0;
        if (a.s === "exact") return -1;
        if (b.s === "exact") return 1;
        return 0;
      })
      .map((x) => x.tr);
  }, [trips, tagFilter]);

  const today = new Date();
  const daysUntil = (yyyymmdd: string) => calendarDaysUntilTripStart(yyyymmdd, today) ?? 0;

  const upcoming: Trip[] = [];
  const active: Trip[] = [];
  const past: Trip[] = [];
  visibleTrips.forEach((tr) => {
    if (tr.phase === "REVIEW") past.push(tr);
    else if (daysUntil(tr.startDate) <= 14) active.push(tr);
    else upcoming.push(tr);
  });

  const Section = ({ title, items }: { title: string; items: Trip[] }) => {
    if (items.length === 0) return null;
    return (
      <section className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="h-2 w-2 shrink-0 rounded-full bg-foreground/20" />
          <h2 className="font-mono text-[10px] tracking-[0.24em] text-muted-foreground">{title}</h2>
          <span className="font-mono text-[10px] text-muted-foreground/80">
            · {String(items.length).padStart(2, "0")}
          </span>
          <div className="ml-2 h-px flex-1 bg-border" />
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {items.map((tr, i) => {
            const { totalItems, packed, wishlist, todo, totalKg } = tripAggregate(tr);
            const pct = totalItems ? (packed / totalItems) * 100 : 0;
            const dDay = daysUntil(tr.startDate);
            const tripStarted = dDay < 0;
            const isPack = tr.phase === "PACK";
            const allPacked = isPack && totalItems > 0 && todo === 0;
            const showUnpackPast = isPack && tripStarted && todo > 0;

            const flags = tr.destinations
              .map((d) => d.countryFlag)
              .slice(0, 4)
              .join(" ");
            const places = formatDestinations(tr.destinations, lang);
            const titleShown = tripTitleDisplay(tr, lang);
            const briefDay = `${tr.days}${t("brief.days")}`;
            const titleHasTripDays =
              tr.days > 0 &&
              (titleShown.includes(briefDay) ||
                titleShown.includes(`${tr.days}天`) ||
                titleShown.includes(`${tr.days}日`) ||
                new RegExp(`${tr.days}\\s*d(?:ays)?\\b`, "i").test(titleShown));

            const smartPrimary = (() => {
              if (!isPack) return null;
              if (allPacked) {
                return (
                  <p className="text-sm font-medium leading-snug text-success">
                    {t("archive.card.ready")}
                  </p>
                );
              }
              if (showUnpackPast) {
                return (
                  <p className="text-sm leading-snug text-muted-foreground">
                    {t("archive.card.unpackPast").replace("{n}", String(todo))}
                  </p>
                );
              }
              return null;
            })();

            const smartWishlist =
              isPack && wishlist > 0 ? (
                <p className="mt-1 text-xs leading-snug text-muted-foreground">
                  {t("archive.card.buyHint").replace("{n}", String(wishlist))}
                </p>
              ) : null;

            return (
              <motion.button
                key={tr.id}
                onClick={() => onOpen(tr.id)}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="module corner-tick group relative overflow-hidden rounded-md p-4 text-left transition hover:-translate-y-0.5"
              >
                <div className="min-w-0">
                  <h3 className={cn(packlogSectionTitle, "truncate")}>{titleShown}</h3>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {flags ? `${flags} ` : ""}
                    {places} · {tr.startDate}
                    {typeof tr.days === "number" && tr.days > 0 && !titleHasTripDays
                      ? ` · ${tr.days} ${t("brief.days")}`
                      : ""}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {tripScenarios(tr).map((s) => (
                      <span
                        key={s}
                        className="rounded border border-border-strong bg-surface-2 px-1.5 py-0.5 font-mono text-[9px] tracking-[0.06em] text-muted-foreground"
                      >
                        {t(`scenario.${s}`)}
                      </span>
                    ))}
                  </div>
                  {filterTripTagList(tr.tags).length > 0 ? (
                    <div
                      className="mt-2 flex flex-wrap gap-1"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                      role="presentation"
                    >
                      {filterTripTagList(tr.tags).map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate({
                              to: "/tag/$tagName",
                              params: { tagName: canonicalTagKey(tag) },
                            });
                          }}
                          className={cn(
                            "tag-chip cursor-pointer font-mono text-[9px] transition hover:border-foreground/25 hover:text-foreground",
                            !isPresetTagId(tag) &&
                              "border-dashed border-muted-foreground/70 bg-transparent",
                          )}
                        >
                          {formatTagForUi(tag, lang)}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                {isPack && totalItems > 0 ? (
                  <>
                    <div className="mt-3 h-1 overflow-hidden rounded-full bg-surface-3">
                      <motion.div
                        className="h-full bg-signal"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.9 }}
                      />
                    </div>
                    <p className="mt-2 font-mono text-[11px] tabular-nums text-foreground">
                      {t("archive.card.packedKg")
                        .replace("{packed}", String(packed))
                        .replace("{total}", String(totalItems))
                        .replace("{kg}", totalKg.toFixed(1))}
                    </p>
                  </>
                ) : tr.phase === "REVIEW" ? (
                  <p className="mt-3 inline-flex rounded border border-border bg-surface-2 px-2 py-0.5 font-mono text-[10px] tracking-[0.12em] text-muted-foreground">
                    {t("archive.card.reviewDone")}
                  </p>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">
                    {t("archive.card.noItemsYet")}
                  </p>
                )}

                {(smartPrimary || smartWishlist) && (
                  <div className="mt-3 space-y-1 border-t border-border pt-3">
                    {smartPrimary}
                    {smartWishlist}
                  </div>
                )}

                <div className="mt-2 flex items-center justify-end">
                  <span className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground opacity-0 transition group-hover:opacity-100">
                    {t("archive.open")} →
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </section>
    );
  };

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          {trips.length === 0 ? (
            <>
              <div className="font-mono text-[10px] tracking-[0.28em] text-muted-foreground">
                {t("archive.kicker")}
              </div>
              <h1 className={cn("mt-2", packlogPageTitle)}>{t("archive.title")}</h1>
              <p className={cn("mt-2 max-w-md", packlogHint)}>{t("archive.subtitle")}</p>
            </>
          ) : (
            <h1 className={packlogPageTitle}>{t("archive.title")}</h1>
          )}
        </div>
        <AuthGate pendingAction={onNewTrip} resumeIntent={{ v: 1, kind: "openNewTrip" }}>
          <button type="button" className={cn(packlogBtnPrimary, packlogBtnSm, "shrink-0")}>
            {t("archive.new")}
          </button>
        </AuthGate>
      </header>

      {trips.length === 0 ? (
        <div className="module mx-auto max-w-md px-6 py-14 text-center">
          <p className="font-display text-xl leading-snug text-foreground md:text-2xl">
            {t("archive.empty.lead")}
          </p>
          <AuthGate pendingAction={onNewTrip} resumeIntent={{ v: 1, kind: "openNewTrip" }}>
            <button
              type="button"
              className={cn(packlogBtnPrimary, packlogBtnBlock, "mt-8 max-w-xs")}
            >
              {t("archive.new")}
            </button>
          </AuthGate>
        </div>
      ) : tagFilter && visibleTrips.length === 0 ? (
        <p className="font-mono text-[11px] text-muted-foreground">{t("tag.filter.empty")}</p>
      ) : (
        <>
          <Section title={t("archive.active")} items={active} />
          <Section title={t("archive.upcoming")} items={upcoming} />
          <Section title={t("archive.past")} items={past} />
        </>
      )}
    </div>
  );
}
