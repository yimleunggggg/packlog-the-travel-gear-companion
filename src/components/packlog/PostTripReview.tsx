import { motion } from "framer-motion";
import { reviewTrip } from "@/lib/packlog-data";

const verdictMeta = {
  keep: { color: "var(--success)", label: "KEEP", glyph: "✓" },
  upgrade: { color: "var(--signal)", label: "UPGRADE", glyph: "↑" },
  drop: { color: "var(--destructive)", label: "DROP", glyph: "✕" },
};

export function PostTripReview() {
  const counts = {
    keep: reviewTrip.verdicts.filter((v) => v.verdict === "keep").length,
    upgrade: reviewTrip.verdicts.filter((v) => v.verdict === "upgrade").length,
    drop: reviewTrip.verdicts.filter((v) => v.verdict === "drop").length,
  };

  return (
    <section className="module corner-tick corner-tick-br relative overflow-hidden p-6">
      <div className="flex items-start justify-between border-b border-border pb-4">
        <div>
          <div className="font-mono text-[10px] tracking-[0.22em] text-signal">
            ⟲ POST-TRIP · DEBRIEF
          </div>
          <h3 className="mt-1 font-display text-2xl leading-tight">
            Last mission · {reviewTrip.title}
          </h3>
          <p className="mt-1 font-mono text-[10px] text-muted-foreground">
            {reviewTrip.date} · sealed {reviewTrip.verdicts.length} verdicts
          </p>
        </div>
        <button className="border border-border-strong px-3 py-1.5 font-mono text-[10px] tracking-[0.18em] hover:bg-surface-2">
          OPEN FULL LOG
        </button>
      </div>

      {/* Verdict distribution bar */}
      <div className="mt-4 flex h-2 overflow-hidden border border-border">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(counts.keep / reviewTrip.verdicts.length) * 100}%` }}
          transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
          style={{ background: verdictMeta.keep.color }}
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(counts.upgrade / reviewTrip.verdicts.length) * 100}%` }}
          transition={{ duration: 0.9, delay: 0.1, ease: [0.2, 0.8, 0.2, 1] }}
          style={{ background: verdictMeta.upgrade.color }}
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(counts.drop / reviewTrip.verdicts.length) * 100}%` }}
          transition={{ duration: 0.9, delay: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
          style={{ background: verdictMeta.drop.color }}
        />
      </div>
      <div className="mt-2 flex justify-between font-mono text-[10px]">
        <span style={{ color: verdictMeta.keep.color }}>● KEEP {counts.keep}</span>
        <span style={{ color: verdictMeta.upgrade.color }}>● UPGRADE {counts.upgrade}</span>
        <span style={{ color: verdictMeta.drop.color }}>● DROP {counts.drop}</span>
      </div>

      <ul className="mt-5 space-y-2">
        {reviewTrip.verdicts.map((v, i) => {
          const m = verdictMeta[v.verdict];
          return (
            <motion.li
              key={v.name}
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
              <div className="col-span-4 text-sm">{v.name}</div>
              <div className="col-span-2 font-mono text-[10px]" style={{ color: m.color }}>
                {m.label}
              </div>
              <div className="col-span-5 font-mono text-[11px] text-muted-foreground">
                &ldquo;{v.note}&rdquo;
              </div>
            </motion.li>
          );
        })}
      </ul>

      <div className="mt-5 border border-signal/40 bg-signal/5 p-4">
        <div className="font-mono text-[10px] tracking-[0.22em] text-signal">
          ◆ GEAR-DNA · INSIGHT
        </div>
        <p className="mt-2 text-sm leading-relaxed">
          Across <span className="font-mono text-signal">12</span> sealed trips, your
          highest-rated category is <span className="font-mono">OPTICAL</span> (avg
          4.7). You drop <span className="font-mono">paper-based</span> items{" "}
          <span className="font-mono text-signal">83%</span> of the time. Suggestion
          for next pack: skip the journal, bring the ND filter.
        </p>
      </div>
    </section>
  );
}
