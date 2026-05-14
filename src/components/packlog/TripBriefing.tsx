import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { Trip } from "@/lib/packlog-data";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { tripScenarios } from "@/lib/trip-scenarios";
import { buildTripManifestText, downloadManifestFile } from "@/lib/export-trip-manifest";
import { formatKgFromGrams } from "@/lib/weight-provenance";
import { containerDisplayLabel } from "@/lib/container-label";
import {
  containerItemsGrams,
  tripBaseGrams,
  tripBig3PctOfBase,
  tripTotalGrams,
  tripWornGrams,
} from "@/lib/trip-weight-stats";

export function TripBriefing({
  trip,
  phase,
  onPhase,
  onBack,
  onOpenClone,
  onSharingPatch,
}: {
  trip: Trip;
  phase?: "PACK" | "REVIEW";
  onPhase?: (p: "PACK" | "REVIEW") => void;
  onBack: () => void;
  onOpenClone: () => void;
  onSharingPatch?: (patch: Partial<Pick<Trip, "isPublic" | "tags">>) => void;
}) {
  const { t, lang } = useI18n();
  const { requestAuth } = useAuth();
  const [tagStr, setTagStr] = useState(() => (trip.tags ?? []).join(", "));

  useEffect(() => {
    setTagStr((trip.tags ?? []).join(", "));
  }, [trip.id, trip.tags]);

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
  const todayCal = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const [y, m, d] = trip.startDate.split(".").map(Number);
  const depCal = new Date(y, (m ?? 1) - 1, d ?? 1);
  const depDiffDays = Math.round((depCal.getTime() - todayCal.getTime()) / 86400000);
  const depStatValue =
    depDiffDays > 0
      ? `${depDiffDays}D`
      : depDiffDays === 0
        ? t("brief.stat.dep.go")
        : t("brief.stat.dep.past").replace("{n}", String(-depDiffDays));

  const scenTags = tripScenarios(trip);

  const flatItems = trip.containers.flatMap((c) => c.items);
  const wishlistCount = flatItems.filter((i) => i.ownership === "wishlist").length;
  const unpackCount = totalItems - packedItems;

  return (
    <section className="module corner-tick corner-tick-br relative overflow-hidden border border-[rgba(0,0,0,0.06)] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="px-5 pt-6 md:px-8 md:pt-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="font-mono text-[10px] tracking-[0.2em] text-[#6B5234] hover:underline"
          >
            {t("trip.overview.backTrips")}
          </button>
          {onPhase && phase ? (
            <button
              type="button"
              onClick={() => onPhase(phase === "PACK" ? "REVIEW" : "PACK")}
              className="font-mono text-[10px] tracking-[0.18em] text-[#6B5234] underline decoration-[#6B5234]/50 underline-offset-2 hover:text-foreground"
            >
              {phase === "PACK" ? t("trip.cta.enterReview") : t("trip.cta.backToPacking")}
            </button>
          ) : null}
        </div>

        <div className="grid grid-cols-12 gap-4 pb-2 md:gap-6">
          <div className="col-span-12 lg:col-span-7">
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
            <h1 className="mt-2 min-w-0 max-w-full break-words font-display text-[clamp(1.125rem,4.2vw,2.65rem)] leading-snug tracking-tight [overflow-wrap:anywhere] md:text-[clamp(1.35rem,3.4vw,3.15rem)] lg:text-[clamp(1.5rem,2.75vw,3.35rem)]">
              {trip.title}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {trip.destinations.map((d) => (
                <span
                  key={d.id}
                  className="flex items-center gap-1.5 rounded-md border border-border-strong bg-surface px-2 py-0.5 text-xs"
                >
                  <span>{d.countryFlag}</span>
                  <span>{lang === "zh" ? d.cityZh : d.cityEn}</span>
                </span>
              ))}
              <span className="font-mono text-xs text-muted-foreground">
                · {trip.startDate} · {trip.days}
                {t("brief.days")} · {trip.climate}
              </span>
            </div>

            <p className="mt-3 font-mono text-sm tabular-nums text-foreground">
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
            (wishlistCount > 0 || (depDiffDays < 0 && unpackCount > 0 && totalItems > 0)) ? (
              <div className="mt-2 space-y-1 font-mono text-[11px] leading-snug">
                {wishlistCount > 0 ? (
                  <p className="text-signal">
                    {t("brief.hint.wishlist").replace("{n}", String(wishlistCount))}
                  </p>
                ) : null}
                {depDiffDays < 0 && unpackCount > 0 && totalItems > 0 ? (
                  <p className="text-muted-foreground">
                    {t("brief.hint.stillUnpack").replace("{n}", String(unpackCount))}
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="mt-5 w-full max-w-lg space-y-3">
              <Link
                to="/trip/$tripId/pack"
                params={{ tripId: trip.id }}
                className="flex min-h-11 w-full items-center justify-center rounded-md border border-signal bg-signal px-5 py-3 text-center font-mono text-[11px] font-semibold tracking-[0.2em] text-signal-foreground shadow-sm transition hover:opacity-95"
              >
                {t("brief.cta.continue")}
              </Link>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={onOpenClone}
                  className="inline-flex min-h-11 flex-1 items-center justify-center rounded-md border-[1.5px] border-signal bg-transparent px-4 py-2 font-mono text-[11px] tracking-[0.18em] text-signal transition hover:bg-signal-soft/60 sm:flex-none"
                >
                  {t("brief.cta.clone")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const body = buildTripManifestText(trip, lang, t);
                    downloadManifestFile(trip.id, trip.title, body);
                  }}
                  className="inline-flex min-h-11 flex-1 items-center justify-center bg-transparent px-3 py-2 font-mono text-[11px] tracking-[0.12em] text-[#6B5234] underline decoration-[#6B5234]/50 underline-offset-2 hover:text-foreground sm:flex-none"
                >
                  {t("brief.cta.export")}
                </button>
              </div>
            </div>

            <div className="mt-6 border-t border-[#E8E2D9] pt-4">
              <div className="font-mono text-[10px] tracking-[0.22em] text-muted-foreground">
                {t("trip.bags.sectionTitle")}
              </div>
              <ul className="mt-2 space-y-1.5 font-mono text-[12px]">
                {trip.containers.map((c) => {
                  const g = containerItemsGrams(c.id, trip);
                  const label = containerDisplayLabel(c, lang, t);
                  const limit = c.type === "checked" ? ` / ${c.maxKg}kg` : "";
                  return (
                    <li key={c.id} className="flex justify-between gap-3 tabular-nums">
                      <span className="min-w-0 truncate text-foreground">{label}</span>
                      <span className="shrink-0 text-muted-foreground">
                        {formatKgFromGrams(g)}kg{limit}
                      </span>
                    </li>
                  );
                })}
                {wornG > 0 ? (
                  <li className="flex justify-between gap-3 tabular-nums text-muted-foreground">
                    <span>{t("container.type.worn")}</span>
                    <span>
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
                <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs">
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
                    className="h-3.5 w-3.5 accent-[var(--signal)]"
                  />
                  <span className="text-muted-foreground">{t("trip.sharing.public")}</span>
                </label>
                <label className="mt-2 block">
                  <span className="mb-1 block font-mono text-[9px] tracking-[0.15em] text-muted-foreground">
                    {t("trip.sharing.tags")}
                  </span>
                  <input
                    value={tagStr}
                    onChange={(e) => setTagStr(e.target.value)}
                    onBlur={() => {
                      const tags = tagStr
                        .split(/[,，]/)
                        .map((s) => s.trim())
                        .filter(Boolean);
                      requestAuth(() => onSharingPatch({ tags }), {
                        v: 1,
                        kind: "tripSharing",
                        tripId: trip.id,
                        patch: { tags },
                      });
                    }}
                    placeholder={t("trip.sharing.tags.placeholder")}
                    className="w-full rounded border border-border-strong bg-background px-2 py-1.5 font-mono text-[11px] outline-none focus:border-signal"
                  />
                </label>
              </div>
            )}
          </div>

          <div className="col-span-12 lg:col-span-5">
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border bg-border md:grid-cols-4">
              <Stat label={t("brief.stat.items")} value={`${packedItems}/${totalItems}`} accent />
              <Stat label={t("brief.stat.mass")} value={`${totalKg.toFixed(2)}KG`} />
              <Stat
                label={t("brief.stat.bags")}
                value={String(trip.containers.length).padStart(2, "0")}
              />
              <Stat label={t("brief.stat.dep")} value={depStatValue} />
            </div>

            <div className="mt-3 flex items-center gap-3">
              <span className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground">
                {t("brief.load")}
              </span>
              <div className="relative h-2 flex-1 overflow-hidden rounded bg-surface-3">
                <motion.div
                  className={`absolute inset-y-0 left-0 ${pct >= 100 ? "bg-success" : "bg-signal"}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 1, ease: [0.2, 0.8, 0.2, 1] }}
                />
              </div>
              <div className="font-mono text-sm tabular-nums">
                <span className={pct >= 100 ? "text-success" : "text-signal"}>
                  {Math.round(pct)}
                </span>
                <span className="text-muted-foreground">%</span>
              </div>
            </div>
            {pct >= 100 && totalItems > 0 ? (
              <p className="mt-2 font-mono text-xs text-success">{t("brief.readyToGo")}</p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-surface px-3 py-3 md:px-4 md:py-4">
      <div className="font-mono text-[9px] tracking-[0.22em] text-muted-foreground">{label}</div>
      <div
        className={`mt-1 font-mono text-xl tabular-nums md:text-2xl ${accent ? "text-signal" : "text-foreground"}`}
      >
        {value}
      </div>
    </div>
  );
}
