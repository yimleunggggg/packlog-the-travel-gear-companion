import { motion } from "framer-motion";
import { useRef, useState } from "react";
import type { Trip } from "@/lib/packlog-data";
import { pickName, useI18n } from "@/lib/i18n";
import {
  packlogBtnPrimary,
  packlogBtnSecondary,
  packlogBtnSm,
  packlogItemName,
  packlogSectionTitle,
} from "@/lib/packlog-button-classes";
import { tripTitleDisplay } from "@/lib/trip-list-label";
import { cn } from "@/lib/utils";

export function PostTripReview({ trip, onSeal }: { trip: Trip; onSeal?: () => void }) {
  const { t, lang } = useI18n();
  const [savedTpl, setSavedTpl] = useState(false);
  const [logExpanded, setLogExpanded] = useState(false);
  const logRef = useRef<HTMLUListElement | null>(null);
  const verdictMeta = {
    keep: { color: "var(--success)", label: t("review.verdict.keep"), glyph: "✓" },
    upgrade: { color: "var(--signal)", label: t("review.verdict.upgrade"), glyph: "★" },
    drop: { color: "var(--destructive)", label: t("review.verdict.drop"), glyph: "·" },
  } as const;

  const rows = trip.containers.flatMap((c) =>
    c.items.map((it) => ({
      ...it,
      containerLabel: c.code,
      displayName: pickName(lang, it),
    })),
  );

  const judged = rows.filter((r) => r.verdict != null);
  const counts = {
    keep: judged.filter((v) => v.verdict === "keep").length,
    upgrade: judged.filter((v) => v.verdict === "upgrade").length,
    drop: judged.filter((v) => v.verdict === "drop").length,
  };
  const utilitySamples = rows.filter((r) => (r.utility ?? 0) > 0);
  const avgUtility =
    utilitySamples.length > 0
      ? utilitySamples.reduce((s, v) => s + (v.utility ?? 0), 0) / utilitySamples.length
      : 0;
  const barDenom = judged.length > 0 ? judged.length : 1;

  return (
    <section
      id="trip-review-panel"
      className="module corner-tick corner-tick-br relative scroll-mt-28 overflow-hidden p-4 md:p-6"
    >
      <div className="flex flex-col gap-4 border-b border-border pb-4 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
        <div className="min-w-0 flex-1 lg:pr-3">
          <div className="font-mono text-[10px] tracking-[0.22em] text-signal">
            {t("review.head")}
          </div>
          <h3 className={cn(packlogSectionTitle, "mt-1 max-w-full break-words [overflow-wrap:anywhere]")}>
            {tripTitleDisplay(trip, lang)}
          </h3>
          <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
            {t("review.editHint")}
          </p>
          <p className="mt-2 font-mono text-[10px] text-muted-foreground">
            {trip.startDate}
            {" · "}
            {t("review.progressLine")
              .replace("{rated}", String(judged.length))
              .replace("{total}", String(rows.length))}
            {utilitySamples.length > 0 ? (
              <>
                {" · "}
                {t("review.avgUtility").replace("{n}", avgUtility.toFixed(1))}
              </>
            ) : null}
          </p>
        </div>
        <button
          onClick={() => {
            setLogExpanded(true);
            requestAnimationFrame(() =>
              logRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
            );
          }}
          className={cn(
            packlogBtnSecondary,
            packlogBtnSm,
            "min-h-11 w-full shrink-0 whitespace-nowrap lg:min-h-0 lg:w-auto lg:self-start",
          )}
        >
          {t("review.openLog")}
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="mt-4 font-mono text-[11px] text-muted-foreground">{t("review.empty")}</p>
      ) : (
        <>
          <div className="mt-4 flex h-2 overflow-hidden border border-border">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(counts.keep / barDenom) * 100}%` }}
              transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
              style={{ background: verdictMeta.keep.color }}
            />
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(counts.upgrade / barDenom) * 100}%` }}
              transition={{ duration: 0.9, delay: 0.1, ease: [0.2, 0.8, 0.2, 1] }}
              style={{ background: verdictMeta.upgrade.color }}
            />
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(counts.drop / barDenom) * 100}%` }}
              transition={{ duration: 0.9, delay: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
              style={{ background: verdictMeta.drop.color }}
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-muted-foreground md:text-[10px]">
            <span style={{ color: verdictMeta.keep.color }}>
              ● {t("review.verdict.keep")} {counts.keep}
            </span>
            <span style={{ color: verdictMeta.upgrade.color }}>
              ● {t("review.verdict.upgrade")} {counts.upgrade}
            </span>
            <span style={{ color: verdictMeta.drop.color }}>
              ● {t("review.verdict.drop")} {counts.drop}
            </span>
          </div>
        </>
      )}

      <ul
        ref={logRef}
        className={`mt-5 space-y-2 transition-all md:space-y-0 ${logExpanded ? "rounded border border-signal/40 bg-signal-soft/20 p-3" : ""}`}
      >
        {rows.map((v, i) => {
          const ver = v.verdict;
          const m = ver ? verdictMeta[ver] : null;
          return (
            <motion.li
              key={`${v.id}-${v.containerLabel}`}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex flex-col gap-2 py-3 max-md:rounded-lg max-md:border max-md:border-border/80 max-md:bg-surface/50 max-md:p-3 md:grid md:grid-cols-12 md:items-center md:gap-x-3 md:gap-y-1 md:border-b md:border-dashed md:border-border md:py-2"
            >
              <div className="flex items-start gap-3 md:contents">
                <div
                  className="grid h-9 w-9 shrink-0 place-items-center border font-mono text-xs text-muted-foreground md:col-span-1 md:h-6 md:w-6 md:text-[10px]"
                  style={
                    m
                      ? { borderColor: m.color, color: m.color }
                      : { borderColor: "var(--border-strong)" }
                  }
                >
                  {m ? m.glyph : "—"}
                </div>
                <div
                  className={cn(
                    packlogItemName,
                    "min-w-0 flex-1 leading-snug [overflow-wrap:anywhere] md:col-span-3",
                  )}
                >
                  {v.displayName}
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 pl-12 md:contents md:pl-0">
                <div
                  className="flex min-w-0 flex-1 flex-wrap items-center gap-2 font-mono text-[13px] text-muted-foreground md:col-span-2 md:text-[10px]"
                  style={{ color: m?.color ?? "var(--muted-foreground)" }}
                >
                  <span>{m ? m.label : "—"}</span>
                  {v.reviewConfirmed ? (
                    <span className="rounded border border-success/35 bg-success/10 px-1.5 py-0.5 text-[11px] font-medium leading-none text-success md:text-[9px]">
                      ✓ {t("review.row.logBadge")}
                    </span>
                  ) : null}
                </div>
                <div className="flex shrink-0 gap-0.5 md:col-span-2">
                  <span className="sr-only">
                    {t("review.row.stars")}: {v.utility ?? 0}/5
                  </span>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <span
                      key={n}
                      className="font-mono text-[15px] leading-none md:text-[10px]"
                      style={{
                        color: n <= (v.utility ?? 0) ? "var(--signal)" : "var(--border-strong)",
                      }}
                      aria-hidden
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
              <div className="pl-12 text-[13px] leading-relaxed text-muted-foreground [overflow-wrap:anywhere] md:col-span-4 md:pl-0 md:font-mono md:text-[11px] md:leading-snug">
                {v.note ? `“${v.note}”` : "—"}
              </div>
            </motion.li>
          );
        })}
      </ul>

      {import.meta.env.DEV && (
        <div className="mt-5 border border-dashed border-border bg-surface-2/50 p-4">
          <div className="font-mono text-[10px] tracking-[0.22em] text-muted-foreground">
            {t("review.dna.devOnly")}
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {t("review.dna.text")}
          </p>
        </div>
      )}

      {onSeal && (
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          {savedTpl && (
            <span className="text-center font-mono text-[10px] tracking-[0.18em] text-success sm:mr-auto sm:w-auto sm:text-left">
              {t("review.savedTemplate")}
            </span>
          )}
          <button
            onClick={() => setSavedTpl(true)}
            disabled={savedTpl}
            className={cn(
              packlogBtnSecondary,
              packlogBtnSm,
              "min-h-[var(--touch-target)] w-full justify-center px-4 py-2.5 text-[11px] disabled:opacity-50 sm:w-auto sm:min-h-0 sm:py-2 sm:text-[10px]",
            )}
          >
            {t("review.saveTemplate")}
          </button>
          <button
            onClick={onSeal}
            className={cn(
              packlogBtnPrimary,
              packlogBtnSm,
              "min-h-[var(--touch-target)] w-full justify-center px-4 py-2.5 text-[11px] sm:w-auto sm:min-h-0 sm:py-2 sm:text-[10px]",
            )}
          >
            {t("review.seal")}
          </button>
        </div>
      )}
    </section>
  );
}
