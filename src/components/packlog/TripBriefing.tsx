import { Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import type { Trip } from "@/lib/packlog-data";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { tripScenarios } from "@/lib/trip-scenarios";
import { buildTripManifestCsvForExcel, downloadManifestFile } from "@/lib/export-trip-manifest";
import { formatKgFromGrams } from "@/lib/weight-provenance";
import { containerDisplayLabel } from "@/lib/container-label";
import {
  containerItemsGrams,
  tripBaseGrams,
  tripBig3PctOfBase,
  tripTotalGrams,
  tripWornGrams,
} from "@/lib/trip-weight-stats";
import {
  packlogBtnBlock,
  packlogBtnPrimary,
  packlogBtnSecondary,
  packlogPageTitle,
} from "@/lib/packlog-button-classes";
import { tripTitleDisplay } from "@/lib/trip-list-label";
import { calendarDaysUntilTripStart } from "@/lib/trip-date";
import { cn } from "@/lib/utils";
import { TripTagPicker } from "@/components/packlog/TripTagPicker";
import { BriefingStatsAndProgress } from "@/components/packlog/trip-briefing-stats";

export function TripBriefing({
  trip,
  phase,
  onPhase,
  onBack,
  onOpenClone,
  onSharingPatch,
  className,
}: {
  trip: Trip;
  phase?: "PACK" | "REVIEW";
  onPhase?: (p: "PACK" | "REVIEW") => void;
  onBack: () => void;
  onOpenClone: () => void;
  onSharingPatch?: (patch: Partial<Pick<Trip, "isPublic" | "tags">>) => void;
  className?: string;
}) {
  const { t, lang } = useI18n();
  const { requestAuth } = useAuth();
  const tagSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleTagSave = (tags: string[]) => {
    if (!onSharingPatch) return;
    if (tagSaveTimer.current) clearTimeout(tagSaveTimer.current);
    tagSaveTimer.current = setTimeout(() => {
      tagSaveTimer.current = null;
      requestAuth(() => onSharingPatch({ tags }), {
        v: 1,
        kind: "tripSharing",
        tripId: trip.id,
        patch: { tags },
      });
    }, 450);
  };

  useEffect(() => {
    return () => {
      if (tagSaveTimer.current) clearTimeout(tagSaveTimer.current);
    };
  }, []);

  const totalItems = trip.containers.reduce((s, c) => s + c.items.length, 0);
  const packedItems = trip.containers.reduce(
    (s, c) => s + c.items.filter((i) => i.status === "packed").length,
    0,
  );
  const totalG = tripTotalGrams(trip);
  const baseG = tripBaseGrams(trip);
  const wornG = tripWornGrams(trip);
  const big3Pct = tripBig3PctOfBase(trip);
  const totalKg = totalG / 1000;
  const pct = totalItems ? (packedItems / totalItems) * 100 : 0;

  const today = new Date();
  const rawDep = calendarDaysUntilTripStart(trip.startDate, today);
  const depLabel =
    rawDep == null
      ? t("brief.stat.dep")
      : rawDep < 0
        ? t("brief.stat.dep.since")
        : t("brief.stat.dep");
  const depStatValue =
    rawDep == null
      ? "—"
      : rawDep > 0
        ? t("brief.stat.dep.future").replace("{n}", String(rawDep))
        : rawDep === 0
          ? t("brief.stat.dep.go")
          : t("brief.stat.dep.pastDays").replace("{n}", String(-rawDep));

  const scenTags = tripScenarios(trip);

  const flatItems = trip.containers.flatMap((c) => c.items);
  const wishlistCount = flatItems.filter((i) => i.ownership === "wishlist").length;
  const unpackCount = totalItems - packedItems;

  return (
    <section
      className={cn("module corner-tick corner-tick-br relative overflow-hidden", className)}
    >
      <div className="p-[var(--card-padding)] md:p-8 md:pt-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-3">
          <button
            type="button"
            onClick={onBack}
            className="min-h-[var(--touch-target)] px-1 text-left font-mono text-[11px] tracking-[0.18em] text-link underline-offset-4 hover:text-link-hover hover:underline md:text-[10px] md:tracking-[0.2em]"
          >
            {t("trip.overview.backTrips")}
          </button>
          {onPhase && phase ? (
            <button
              type="button"
              onClick={() => onPhase(phase === "PACK" ? "REVIEW" : "PACK")}
              className="min-h-[var(--touch-target)] shrink-0 rounded-md border border-border-strong bg-surface px-3 py-2 text-center font-mono text-[11px] font-medium tracking-[0.12em] text-foreground transition hover:border-foreground/20 hover:bg-surface-2 md:border-0 md:bg-transparent md:px-1 md:py-0 md:text-[10px] md:font-normal md:tracking-[0.18em] md:text-[#6B5234] md:underline md:decoration-[#6B5234]/50 md:underline-offset-2 md:hover:text-foreground"
            >
              {phase === "PACK" ? t("trip.cta.enterReview") : t("trip.cta.backToPacking")}
            </button>
          ) : null}
        </div>

        <div className="grid grid-cols-12 gap-4 pb-2 md:gap-6">
          <div className="col-span-12 md:col-span-7">
            <h1
              className={cn(
                packlogPageTitle,
                "min-w-0 max-w-full break-words [overflow-wrap:anywhere]",
              )}
            >
              {tripTitleDisplay(trip, lang)}
            </h1>
            <div
              className={cn(
                "mt-2 flex flex-wrap items-center gap-2 text-[var(--text-secondary)]",
                "[font-size:var(--font-item-meta-size)] [font-weight:var(--font-item-meta-weight)] [line-height:var(--font-item-meta-leading)]",
              )}
            >
              {trip.destinations.map((d) => (
                <span
                  key={d.id}
                  className="flex max-w-full items-center gap-1.5 rounded-md border border-border-strong bg-surface px-2 py-1 text-xs leading-tight"
                >
                  <span className="shrink-0">{d.countryFlag}</span>
                  <span className="min-w-0 break-words [overflow-wrap:anywhere]">
                    {lang === "zh" ? d.cityZh : d.cityEn}
                  </span>
                </span>
              ))}
              <span className="min-w-0 max-w-full break-words font-mono text-xs leading-snug tabular-nums [overflow-wrap:anywhere]">
                · {trip.startDate} · {trip.days}
                {t("brief.days")} · {trip.climate}
              </span>
            </div>

            <div className="mt-2 flex flex-wrap gap-1.5">
              {scenTags.map((s) => (
                <span
                  key={s}
                  className="rounded border border-border-strong bg-surface px-2 py-0.5 text-xs leading-tight text-muted-foreground"
                >
                  {t(`scenario.${s}`)}
                </span>
              ))}
            </div>

            <div className="md:hidden">
              <div className="mt-4">
                <BriefingStatsAndProgress
                  layout="mobile"
                  t={t}
                  packedItems={packedItems}
                  totalItems={totalItems}
                  totalKg={totalKg}
                  baseG={baseG}
                  pct={pct}
                  trip={trip}
                  depLabel={depLabel}
                  depStatValue={depStatValue}
                />
              </div>
            </div>

            <p className="mt-3 hidden font-mono text-sm tabular-nums text-foreground md:block">
              <span className="text-signal">{packedItems}</span>
              <span className="text-muted-foreground">/{totalItems}</span>{" "}
              <span className="text-muted-foreground">{t("brief.packedProgressSuffix")}</span>
              <span className="mx-2 text-border-strong">·</span>
              <span>{t("brief.stat.mass")}</span>{" "}
              <span className="text-signal">{totalKg.toFixed(1)}kg</span>
              <span className="mx-2 text-border-strong">·</span>
              <span>{t("brief.stat.baseMass")}</span> <span>{formatKgFromGrams(baseG)}kg</span>
              {big3Pct != null ? (
                <>
                  <span className="mx-2 text-border-strong">·</span>
                  <span className="text-muted-foreground">
                    {t("brief.stat.big3OfBase").replace("{n}", String(big3Pct))}
                  </span>
                </>
              ) : null}
            </p>

            {trip.phase === "PACK" &&
            (wishlistCount > 0 ||
              (rawDep != null && rawDep < 0 && unpackCount > 0 && totalItems > 0)) ? (
              <div className="mt-2 max-md:hidden space-y-1 font-mono text-[11px] leading-snug">
                {wishlistCount > 0 ? (
                  <p className="text-signal">
                    {t("brief.hint.wishlist").replace("{n}", String(wishlistCount))}
                  </p>
                ) : null}
                {rawDep != null && rawDep < 0 && unpackCount > 0 && totalItems > 0 ? (
                  <p className="text-muted-foreground">
                    {t("brief.hint.stillUnpack").replace("{n}", String(unpackCount))}
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="mt-5 w-full max-w-lg space-y-3 md:mt-6">
              <Link
                id="trip-overview-pack-cta"
                to="/trip/$tripId/pack"
                params={{ tripId: trip.id }}
                className={cn(
                  packlogBtnPrimary,
                  packlogBtnBlock,
                  "min-h-[var(--touch-target)] py-3 text-[12px]",
                )}
              >
                {t("brief.cta.continue")}
              </Link>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
                <button
                  type="button"
                  onClick={onOpenClone}
                  className={cn(
                    packlogBtnSecondary,
                    packlogBtnBlock,
                    "min-h-[var(--touch-target)] w-full justify-center sm:min-h-0",
                  )}
                >
                  {t("brief.cta.clone")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const body = buildTripManifestCsvForExcel(trip, lang, t);
                    downloadManifestFile(trip.id, tripTitleDisplay(trip, lang), body, "csv");
                  }}
                  className={cn(
                    "inline-flex min-h-[var(--touch-target)] w-full items-center justify-center rounded-[10px] border-[1.5px] border-border-strong bg-background font-mono text-[11px] font-semibold tracking-[0.14em] text-foreground transition hover:border-[#C8956C]/45 hover:bg-surface-2 sm:min-h-0",
                  )}
                >
                  {t("brief.cta.export")}
                </button>
              </div>
            </div>

            <div className="mt-6 border-t border-[#E8E2D9] pt-4">
              <div className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground md:tracking-[0.22em]">
                {t("trip.bags.sectionTitle")}
              </div>
              <ul className="mt-3 space-y-0.5 font-mono text-[13px] md:mt-2 md:space-y-1.5 md:text-[12px]">
                {trip.containers.map((c) => {
                  const g = containerItemsGrams(c.id, trip);
                  const label = containerDisplayLabel(c, lang, t);
                  const limit = c.type === "checked" ? ` / ${c.maxKg}kg` : "";
                  return (
                    <li
                      key={c.id}
                      className="flex min-h-[var(--item-row-height)] items-start justify-between gap-3 border-b border-dashed border-border/70 py-2.5 last:border-0 md:items-center md:border-0 md:py-0"
                    >
                      <span className="min-w-0 flex-1 break-words text-foreground [font-size:var(--font-item-name-size)] [font-weight:var(--font-item-name-weight)] [overflow-wrap:anywhere] md:truncate">
                        {label}
                      </span>
                      <span className="shrink-0 pt-0.5 text-right text-muted-foreground [font-family:var(--font-weight-number-family)] [font-size:var(--font-weight-number-size)] md:pt-0">
                        {formatKgFromGrams(g)}kg{limit}
                      </span>
                    </li>
                  );
                })}
                {wornG > 0 ? (
                  <li className="flex min-h-[var(--item-row-height)] items-start justify-between gap-3 border-b border-dashed border-border/70 py-2.5 text-muted-foreground last:border-0 md:items-center md:border-0 md:py-0">
                    <span className="min-w-0 flex-1 break-words [overflow-wrap:anywhere] md:truncate">
                      {t("container.type.worn")}
                    </span>
                    <span className="shrink-0 text-right font-mono tabular-nums [font-size:var(--font-weight-number-size)]">
                      {formatKgFromGrams(wornG)}kg（{t("trip.bags.wornHint")}）
                    </span>
                  </li>
                ) : null}
              </ul>
            </div>

            {onSharingPatch && (
              <div className="mt-5 rounded-md border border-border bg-surface-2/80 p-3">
                <div className="font-mono text-[10px] tracking-[0.22em] text-signal">
                  {t("trip.sharing.title")}
                </div>
                <label className="mt-2 flex min-h-[var(--touch-target)] cursor-pointer items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={trip.isPublic ?? false}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      requestAuth(() => onSharingPatch({ isPublic: checked }), {
                        v: 1,
                        kind: "tripSharing",
                        tripId: trip.id,
                        patch: { isPublic: checked },
                      });
                    }}
                    className="h-4 w-4 shrink-0 accent-[var(--signal)]"
                  />
                  <span className="text-muted-foreground">{t("trip.sharing.public")}</span>
                </label>
                {trip.isPublic ? (
                  <div className="mt-2">
                    <div className="mb-1 block font-mono text-[9px] tracking-[0.15em] text-muted-foreground">
                      {t("trip.sharing.tags")}
                    </div>
                    <p className="mb-1.5 text-[10px] leading-snug text-muted-foreground">
                      {t("trip.sharing.tagsPlaceholder")}
                    </p>
                    <TripTagPicker
                      value={trip.tags ?? []}
                      onChange={scheduleTagSave}
                      disabled={false}
                    />
                  </div>
                ) : null}
              </div>
            )}
          </div>

          <div className="hidden md:col-span-5 md:block">
            <BriefingStatsAndProgress
              layout="sidebar"
              t={t}
              packedItems={packedItems}
              totalItems={totalItems}
              totalKg={totalKg}
              baseG={baseG}
              pct={pct}
              trip={trip}
              depLabel={depLabel}
              depStatValue={depStatValue}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
