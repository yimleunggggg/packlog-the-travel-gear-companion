import { motion } from "framer-motion";
import { useRef, useState } from "react";
import type { Item, Trip } from "@/lib/packlog-data";
import { useI18n, pickName } from "@/lib/i18n";

type ReviewRow = {
  id: string;
  name: string;
  verdict: NonNullable<Item["verdict"]>;
  utility: number;
  note: string;
};

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

  const verdicts: ReviewRow[] = trip.containers.flatMap((container) =>
    container.items.flatMap((item) =>
      item.verdict
        ? [
            {
              id: `${container.id}-${item.id}`,
              name: pickName(lang, item),
              verdict: item.verdict,
              utility: item.utility ?? 3,
              note: item.note ?? "",
            },
          ]
        : [],
    ),
  );
  const verdictCount = verdicts.length;
  const counts = {
    keep: verdicts.filter((v) => v.verdict === "keep").length,
    upgrade: verdicts.filter((v) => v.verdict === "upgrade").length,
    drop: verdicts.filter((v) => v.verdict === "drop").length,
  };
  const avgUtility = verdictCount ? verdicts.reduce((s, v) => s + v.utility, 0) / verdictCount : 0;
  const pct = (count: number) => (verdictCount ? (count / verdictCount) * 100 : 0);

  return (
    <section className="module corner-tick corner-tick-br relative overflow-hidden p-6">
      <div className="flex items-start justify-between border-b border-border pb-4">
        <div>
          <div className="font-mono text-[10px] tracking-[0.22em] text-signal">
            {t("review.head")}
          </div>
          <h3 className="mt-1 font-display text-2xl leading-tight">
            {t("review.last")} · {trip.title}
          </h3>
          <p className="mt-1 font-mono text-[10px] text-muted-foreground">
            {trip.startDate.slice(0, 7)} · {t("review.sealed")} {verdictCount}{" "}
            {t("review.verdicts")} · ★ {avgUtility.toFixed(1)} avg
          </p>
        </div>
        <button
          onClick={() => {
            setLogExpanded(true);
            requestAnimationFrame(() =>
              logRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
            );
          }}
          className="border border-border-strong bg-surface px-3 py-1.5 font-mono text-[10px] tracking-[0.18em] hover:border-signal hover:bg-signal-soft"
        >
          {t("review.openLog")}
        </button>
      </div>

      <div className="mt-4 flex h-2 overflow-hidden border border-border">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct(counts.keep)}%` }}
          transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
          style={{ background: verdictMeta.keep.color }}
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct(counts.upgrade)}%` }}
          transition={{ duration: 0.9, delay: 0.1, ease: [0.2, 0.8, 0.2, 1] }}
          style={{ background: verdictMeta.upgrade.color }}
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct(counts.drop)}%` }}
          transition={{ duration: 0.9, delay: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
          style={{ background: verdictMeta.drop.color }}
        />
      </div>
      <div className="mt-2 flex justify-between font-mono text-[10px]">
        <span style={{ color: verdictMeta.keep.color }}>● KEEP {counts.keep}</span>
        <span style={{ color: verdictMeta.upgrade.color }}>● UPGRADE {counts.upgrade}</span>
        <span style={{ color: verdictMeta.drop.color }}>● DROP {counts.drop}</span>
      </div>

      <ul
        ref={logRef}
        className={`mt-5 space-y-2 transition-all ${logExpanded ? "rounded border border-signal/40 bg-signal-soft/20 p-3" : ""}`}
      >
        {verdictCount === 0 && (
          <li className="border border-dashed border-border bg-surface-2 px-3 py-4 text-center font-mono text-[10px] text-muted-foreground">
            {t("review.empty")}
          </li>
        )}
        {verdicts.map((v, i) => {
          const m = verdictMeta[v.verdict];
          return (
            <motion.li
              key={v.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="grid grid-cols-12 items-center gap-3 border-b border-dashed border-border py-2"
            >
              <div
                className="col-span-1 grid h-6 w-6 place-items-center border font-mono text-xs"
                style={{ borderColor: m.color, color: m.color }}
              >
                {m.glyph}
              </div>
              <div className="col-span-3 text-sm">{v.name}</div>
              <div className="col-span-2 font-mono text-[10px]" style={{ color: m.color }}>
                {m.label}
              </div>
              <div className="col-span-2 flex">
                {[1, 2, 3, 4, 5].map((n) => (
                  <span
                    key={n}
                    className="font-mono text-[10px]"
                    style={{ color: n <= v.utility ? "var(--signal)" : "var(--border-strong)" }}
                  >
                    ★
                  </span>
                ))}
              </div>
              <div className="col-span-4 font-mono text-[11px] text-muted-foreground">
                {v.note ? <>&ldquo;{v.note}&rdquo;</> : "—"}
              </div>
            </motion.li>
          );
        })}
      </ul>

      <div className="mt-5 border border-signal/40 bg-signal-soft/30 p-4">
        <div className="font-mono text-[10px] tracking-[0.22em] text-signal">{t("review.dna")}</div>
        <p className="mt-2 text-sm leading-relaxed">{t("review.dna.text")}</p>
      </div>

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
            className="border border-border-strong bg-surface px-3 py-2 font-mono text-[10px] tracking-[0.2em] text-foreground hover:border-signal disabled:opacity-50"
          >
            {t("review.saveTemplate")}
          </button>
          <button
            onClick={onSeal}
            className="border border-signal bg-signal px-4 py-2 font-mono text-[10px] tracking-[0.2em] text-signal-foreground hover:opacity-90"
          >
            {t("review.seal")}
          </button>
        </div>
      )}
    </section>
  );
}
