import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { Trip } from "@/lib/packlog-data";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { usePacklog } from "@/lib/packlog-store";
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
  packlogBtnSecondary,
  packlogBtnTertiary,
} from "@/lib/packlog-button-classes";
import { tripTitleDisplay } from "@/lib/trip-list-label";
import { calendarDaysUntilTripStart } from "@/lib/trip-date";
import { cn } from "@/lib/utils";
import { TripTagPicker } from "@/components/packlog/TripTagPicker";
import { BriefingStatsAndProgress } from "@/components/packlog/trip-briefing-stats";
import { WeightDistributionPanel } from "@/components/packlog/WeightDistributionPanel";
import { CommunityUrlImport } from "@/components/packlog/CommunityUrlImport";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export function TripPackPageFoldout({
  trip,
  onOpenClone,
  onSharingPatch,
  onEnterReview,
}: {
  trip: Trip;
  onOpenClone: () => void;
  onSharingPatch?: (patch: Partial<Pick<Trip, "isPublic" | "tags">>) => void;
  onEnterReview: () => void;
}) {
  const { t, lang } = useI18n();
  const { trips } = usePacklog();
  const { requestAuth } = useAuth();
  const tagSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** 与社区页一致：链接导入可指定任意行程；默认当前打包页行程 */
  const [urlImportTargetTripId, setUrlImportTargetTripId] = useState(trip.id);

  useEffect(() => {
    setUrlImportTargetTripId(trip.id);
  }, [trip.id]);

  useEffect(() => {
    if (trips.length === 0) return;
    if (!trips.some((tr) => tr.id === urlImportTargetTripId)) {
      setUrlImportTargetTripId(trips.find((tr) => tr.phase !== "REVIEW")?.id ?? trips[0]!.id);
    }
  }, [trips, urlImportTargetTripId]);

  const scheduleTagSave = (tags: string[]) => {
    if (!onSharingPatch) return;
    if (tagSaveTimer.current) clearTimeout(tagSaveTimer.current);
    tagSaveTimer.current = setTimeout(() => {
      tagSaveTimer.current = null;
      requestAuth(
        () => onSharingPatch({ tags }),
        {
          v: 1,
          kind: "tripSharing",
          tripId: trip.id,
          patch: { tags },
        },
      );
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
    rawDep == null ? t("brief.stat.dep") : rawDep < 0 ? t("brief.stat.dep.since") : t("brief.stat.dep");
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
    <Collapsible className="group mx-auto max-w-[1480px] border-b border-[#E8E2D9] bg-background/80 px-4 py-2 md:px-6">
      <CollapsibleTrigger
        type="button"
        className="flex w-full min-h-11 items-center justify-between gap-3 rounded-md border border-border-strong bg-surface/70 px-3 py-2 text-left font-mono text-[10px] tracking-[0.18em] text-muted-foreground transition hover:border-foreground/25 hover:text-foreground"
      >
        <span>{t("pack.page.tripDetailsFold")}</span>
        <ChevronDown
          className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180"
          aria-hidden
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-6 border-t border-border/60 py-4">
          <div className="rounded-md border border-border bg-surface/40 p-4">
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
            <p className="mt-3 hidden font-mono text-sm tabular-nums text-foreground md:block">
              <span className="text-signal">{packedItems}</span>
              <span className="text-muted-foreground">/{totalItems}</span>{" "}
              <span className="text-muted-foreground">{t("brief.packedProgressSuffix")}</span>
              <span className="mx-2 text-border-strong">·</span>
              <span>{t("brief.stat.mass")}</span>{" "}
              <span className="text-signal">{totalKg.toFixed(1)}kg</span>
              <span className="mx-2 text-border-strong">·</span>
              <span>{t("brief.stat.baseMass")}</span>{" "}
              <span>{formatKgFromGrams(baseG)}kg</span>
              {big3Pct != null ? (
                <>
                  <span className="mx-2 text-border-strong">·</span>
                  <span className="text-muted-foreground">{t("brief.stat.big3OfBase").replace("{n}", String(big3Pct))}</span>
                </>
              ) : null}
            </p>
          </div>

          <div className="flex flex-wrap gap-1">
            {scenTags.map((s) => (
              <span
                key={s}
                className="rounded border border-border-strong bg-surface px-1.5 py-0.5 text-[9px] text-muted-foreground"
              >
                {t(`scenario.${s}`)}
              </span>
            ))}
          </div>

          {wishlistCount > 0 || (rawDep != null && rawDep < 0 && unpackCount > 0 && totalItems > 0) ? (
            <div className="space-y-1 font-mono text-[11px] leading-snug">
              {wishlistCount > 0 ? (
                <p className="text-signal">{t("brief.hint.wishlist").replace("{n}", String(wishlistCount))}</p>
              ) : null}
              {rawDep != null && rawDep < 0 && unpackCount > 0 && totalItems > 0 ? (
                <p className="text-muted-foreground">
                  {t("brief.hint.stillUnpack").replace("{n}", String(unpackCount))}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="flex flex-wrap items-stretch gap-2">
            <button
              type="button"
              onClick={onOpenClone}
              className={cn(packlogBtnSecondary, packlogBtnBlock, "min-h-[var(--touch-target)] flex-1 sm:flex-none")}
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
                packlogBtnTertiary,
                "flex min-h-[var(--touch-target)] flex-1 items-center justify-center px-3 py-2 text-[11px] sm:flex-none",
              )}
            >
              {t("brief.cta.export")}
            </button>
          </div>

          <CommunityUrlImport
            trips={trips}
            targetTripId={urlImportTargetTripId}
            onTargetTripChange={setUrlImportTargetTripId}
          />

          {trip.phase === "PACK" ? (
            <button type="button" onClick={onEnterReview} className={cn(packlogBtnSecondary, packlogBtnBlock)}>
              {t("trip.cta.enterReview")}
            </button>
          ) : null}

          <div className="rounded-md border border-[#E8E2D9] p-4">
            <div className="font-mono text-[10px] tracking-[0.22em] text-muted-foreground">{t("trip.bags.sectionTitle")}</div>
            <ul className="mt-2 space-y-1.5 font-mono text-[12px]">
              {trip.containers.map((c) => {
                const g = containerItemsGrams(c.id, trip);
                const label = containerDisplayLabel(c, lang, t);
                const limit = c.type === "checked" ? ` / ${c.maxKg}kg` : "";
                return (
                  <li
                    key={c.id}
                    className="flex min-h-[var(--item-row-height)] items-center justify-between gap-3 tabular-nums"
                  >
                    <span className="min-w-0 truncate text-foreground [font-size:var(--font-item-name-size)] [font-weight:var(--font-item-name-weight)]">
                      {label}
                    </span>
                    <span className="shrink-0 text-muted-foreground [font-family:var(--font-weight-number-family)] [font-size:var(--font-weight-number-size)]">
                      {formatKgFromGrams(g)}kg{limit}
                    </span>
                  </li>
                );
              })}
              {wornG > 0 ? (
                <li className="flex min-h-[var(--item-row-height)] items-center justify-between gap-3 tabular-nums text-muted-foreground">
                  <span>{t("container.type.worn")}</span>
                  <span>
                    {formatKgFromGrams(wornG)}kg（{t("trip.bags.wornHint")}）
                  </span>
                </li>
              ) : null}
            </ul>
          </div>

          {onSharingPatch ? (
            <div className="rounded-md border border-border bg-surface-2/80 p-3">
              <div className="font-mono text-[10px] tracking-[0.22em] text-signal">{t("trip.sharing.title")}</div>
              <label className="mt-2 flex min-h-[var(--touch-target)] cursor-pointer items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={trip.isPublic ?? false}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    requestAuth(
                      () => onSharingPatch({ isPublic: checked }),
                      {
                        v: 1,
                        kind: "tripSharing",
                        tripId: trip.id,
                        patch: { isPublic: checked },
                      },
                    );
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
                  <TripTagPicker value={trip.tags ?? []} onChange={scheduleTagSave} disabled={false} />
                </div>
              ) : null}
            </div>
          ) : null}

          <WeightDistributionPanel trip={trip} />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
