import { motion } from "framer-motion";
import { useRef, useState } from "react";
import type { Trip } from "@/lib/packlog-data";
import { pickName, useI18n } from "@/lib/i18n";
import {
  packlogBtnPrimary,
  packlogBtnSecondary,
  packlogBtnSm,
  packlogBtnTertiary,
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
    <section className="module corner-tick corner-tick-br relative overflow-hidden p-6">
      <div className="flex items-start justify-between border-b border-border pb-4">
        <div>
          <div className="font-mono text-[10px] tracking-[0.22em] text-signal">
            {t("review.head")}
          </div>
          <h3
            className={cn(
              packlogSectionTitle,
              "mt-1 max-w-full break-words [overflow-wrap:anywhere]",
            )}
          >
            {tripTitleDisplay(trip, lang)}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
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
          className={cn(packlogBtnSecondary, packlogBtnSm)}
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
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px]">
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
        className={`mt-5 space-y-2 transition-all ${logExpanded ? "rounded border border-signal/40 bg-signal-soft/20 p-3" : ""}`}
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
              className="grid grid-cols-12 items-center gap-3 border-b border-dashed border-border py-2"
            >
              <div
                className="col-span-1 grid h-6 w-6 place-items-center border font-mono text-xs text-muted-foreground"
                style={
                  m
                    ? { borderColor: m.color, color: m.color }
                    : { borderColor: "var(--border-strong)" }
                }
              >
                {m ? m.glyph : "—"}
              </div>
              <div className="col-span-3 text-sm">{v.displayName}</div>
              <div
                className="col-span-2 font-mono text-[10px]"
                style={{ color: m?.color ?? "var(--muted-foreground)" }}
              >
                {m ? m.label : "—"}
              </div>
              <div className="col-span-2 flex">
                {[1, 2, 3, 4, 5].map((n) => (
                  <span
                    key={n}
                    className="font-mono text-[10px]"
                    style={{
                      color: n <= (v.utility ?? 0) ? "var(--signal)" : "var(--border-strong)",
                    }}
                  >
                    ★
                  </span>
                ))}
              </div>
              <div className="col-span-4 font-mono text-[11px] text-muted-foreground">
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
        <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
          {savedTpl && (
            <span className="font-mono text-[10px] tracking-[0.18em] text-success">
              {t("review.savedTemplate")}
            </span>
          )}
          <button
            onClick={() => setSavedTpl(true)}
            disabled={savedTpl}
            className={cn(packlogBtnSecondary, packlogBtnSm, "py-2 disabled:opacity-50")}
          >
            {t("review.saveTemplate")}
          </button>
          <button onClick={onSeal} className={cn(packlogBtnPrimary, packlogBtnSm, "px-4 py-2")}>
            {t("review.seal")}
          </button>
        </div>
      )}
    </section>
  );
}
