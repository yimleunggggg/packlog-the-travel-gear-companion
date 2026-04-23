import { motion } from "framer-motion";
import type { Trip } from "@/lib/packlog-data";

export function TripBriefing({ trip }: { trip: Trip }) {
  const totalItems = trip.containers.reduce((s, c) => s + c.items.length, 0);
  const packedItems = trip.containers.reduce(
    (s, c) => s + c.items.filter((i) => i.status === "packed").length,
    0,
  );
  const totalKg =
    trip.containers.reduce(
      (s, c) => s + c.items.reduce((ss, i) => ss + i.weightG * i.qty, 0),
      0,
    ) / 1000;

  return (
    <section className="module corner-tick corner-tick-br relative overflow-hidden p-8">
      {/* scrolling tape */}
      <div className="pointer-events-none absolute inset-x-0 top-0 overflow-hidden border-b border-border">
        <div className="flex animate-tape gap-8 whitespace-nowrap py-1 font-mono text-[10px] tracking-[0.3em] text-muted-foreground">
          {Array.from({ length: 2 }).map((_, k) => (
            <div key={k} className="flex shrink-0 gap-8">
              <span>◆ MISSION BRIEF</span>
              <span>◆ DEP {trip.startDate}</span>
              <span>◆ {trip.destination}</span>
              <span>◆ {trip.climate}</span>
              <span>◆ DURATION {String(trip.days).padStart(2, "0")}D</span>
              <span>◆ STATUS {trip.phase}</span>
              <span>◆ ANXIETY-LEVEL ↓ 64%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 pt-6">
        <div className="col-span-12 md:col-span-7">
          <div className="font-mono text-[10px] tracking-[0.28em] text-signal">
            FILE / {trip.id}
          </div>
          <h1 className="mt-3 font-display text-5xl font-medium leading-[1.05] tracking-tight md:text-6xl">
            {trip.title}
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
            {trip.destination} · {trip.days} days · {trip.climate}.
            Your gear is being professionally taken over. Breathe.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <button className="border border-signal bg-signal px-4 py-2 font-mono text-[11px] tracking-[0.18em] text-signal-foreground transition hover:opacity-90">
              ▸ CONTINUE PACKING
            </button>
            <button className="border border-border-strong px-4 py-2 font-mono text-[11px] tracking-[0.18em] text-foreground transition hover:bg-surface-2">
              CLONE FROM COMMUNITY
            </button>
            <button className="border border-border-strong px-4 py-2 font-mono text-[11px] tracking-[0.18em] text-muted-foreground transition hover:bg-surface-2">
              EXPORT MANIFEST
            </button>
          </div>
        </div>

        {/* Parameter bus */}
        <div className="col-span-12 grid grid-cols-2 gap-px self-end overflow-hidden border border-border bg-border md:col-span-5 md:grid-cols-4">
          <Stat label="ITEMS" value={`${packedItems}/${totalItems}`} accent />
          <Stat label="MASS" value={`${totalKg.toFixed(2)}KG`} />
          <Stat label="BAGS" value={String(trip.containers.length).padStart(2, "0")} />
          <Stat label="DEP-T" value="08D" />
        </div>
      </div>

      {/* Master progress bar */}
      <div className="mt-8 grid grid-cols-12 items-center gap-4">
        <div className="col-span-2 font-mono text-[10px] tracking-[0.2em] text-muted-foreground">
          LOAD PROGRESS
        </div>
        <div className="relative col-span-8 h-2 overflow-hidden bg-surface-3">
          <motion.div
            className="absolute inset-y-0 left-0 bg-signal"
            initial={{ width: 0 }}
            animate={{ width: `${(packedItems / totalItems) * 100}%` }}
            transition={{ duration: 1.2, ease: [0.2, 0.8, 0.2, 1] }}
          />
          <div className="absolute inset-0 scanlines opacity-60" />
        </div>
        <div className="col-span-2 text-right font-mono text-sm">
          <span className="text-signal">
            {Math.round((packedItems / totalItems) * 100)}
          </span>
          <span className="text-muted-foreground">.0%</span>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-surface px-4 py-4">
      <div className="font-mono text-[9px] tracking-[0.22em] text-muted-foreground">
        {label}
      </div>
      <div
        className={`mt-1 font-mono text-2xl tabular-nums ${
          accent ? "text-signal" : "text-foreground"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
