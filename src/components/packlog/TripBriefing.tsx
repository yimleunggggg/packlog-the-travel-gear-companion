import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import type { Trip } from "@/lib/packlog-data";
import { useI18n } from "@/lib/i18n";

export function TripBriefing({
  trip,
  trips,
  onSwitchTrip,
  onNewTrip,
  onOpenClone,
  onContinue,
}: {
  trip: Trip;
  trips: Trip[];
  onSwitchTrip: (id: string) => void;
  onNewTrip: () => void;
  onOpenClone: () => void;
  onContinue: () => void;
}) {
  const { t } = useI18n();
  const [switchOpen, setSwitchOpen] = useState(false);

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
  const pct = totalItems ? (packedItems / totalItems) * 100 : 0;

  return (
    <section className="module corner-tick corner-tick-br relative overflow-hidden p-8">
      {/* scrolling tape */}
      <div className="pointer-events-none absolute inset-x-0 top-0 overflow-hidden border-b border-border">
        <div className="flex animate-tape gap-8 whitespace-nowrap py-1 font-mono text-[10px] tracking-[0.3em] text-muted-foreground">
          {Array.from({ length: 2 }).map((_, k) => (
            <div key={k} className="flex shrink-0 gap-8">
              <span>◆ {t("brief.tape.brief")}</span>
              <span>◆ {t("brief.tape.dep")} {trip.startDate}</span>
              <span>◆ {trip.destination}</span>
              <span>◆ {trip.climate}</span>
              <span>◆ {t("brief.tape.dur")} {String(trip.days).padStart(2, "0")}{t("brief.days")}</span>
              <span>◆ {t("brief.tape.status")} {t(`phase.${trip.phase}`)}</span>
              <span>◆ {t(`scenario.${trip.scenario}`).toUpperCase()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Trip switcher row */}
      <div className="mt-6 flex items-center gap-2">
        <span className="font-mono text-[10px] tracking-[0.22em] text-muted-foreground">
          {t("trips.label")} ·
        </span>
        <div className="relative">
          <button
            onClick={() => setSwitchOpen((v) => !v)}
            className="flex items-center gap-2 border border-border-strong bg-surface px-3 py-1.5 font-mono text-[10px] tracking-[0.18em] hover:bg-surface-2"
          >
            <span className="text-signal">{trip.id}</span>
            <span className="text-foreground">·</span>
            <span className="truncate text-foreground">{trip.title}</span>
            <span className="text-muted-foreground">▾</span>
          </button>
          <AnimatePresence>
            {switchOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute left-0 top-full z-30 mt-1 min-w-[280px] border border-border-strong bg-surface shadow-lg"
              >
                {trips.map((tt) => (
                  <button
                    key={tt.id}
                    onClick={() => {
                      onSwitchTrip(tt.id);
                      setSwitchOpen(false);
                    }}
                    className={`flex w-full flex-col items-start gap-0.5 border-b border-border px-3 py-2 text-left transition hover:bg-surface-2 ${
                      tt.id === trip.id ? "bg-signal-soft/40" : ""
                    }`}
                  >
                    <div className="font-mono text-[10px] tracking-[0.18em] text-signal">
                      {tt.id} · {t(`scenario.${tt.scenario}`).toUpperCase()}
                    </div>
                    <div className="text-sm text-foreground">{tt.title}</div>
                    <div className="font-mono text-[10px] text-muted-foreground">
                      {tt.startDate} · {tt.days}{t("brief.days")} · {tt.climate}
                    </div>
                  </button>
                ))}
                <button
                  onClick={() => {
                    onNewTrip();
                    setSwitchOpen(false);
                  }}
                  className="block w-full px-3 py-2 text-left font-mono text-[10px] tracking-[0.18em] text-signal hover:bg-signal hover:text-signal-foreground"
                >
                  {t("trips.new")}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={onNewTrip}
          className="ml-auto border border-border-strong bg-surface px-3 py-1.5 font-mono text-[10px] tracking-[0.18em] text-foreground hover:bg-signal hover:text-signal-foreground"
        >
          {t("trips.new")}
        </button>
      </div>

      <div className="mt-5 grid grid-cols-12 gap-6">
        <div className="col-span-12 md:col-span-7">
          <div className="font-mono text-[10px] tracking-[0.28em] text-signal">
            {t("brief.file")} / {trip.id} · {t(`scenario.${trip.scenario}`).toUpperCase()}
          </div>
          <h1 className="mt-3 font-display text-5xl font-medium leading-[1.05] tracking-tight md:text-6xl">
            {trip.title}
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
            {trip.destination} · {trip.days}{t("brief.days")} · {trip.climate}.
            {" "}{t("brief.subtitle")}
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <button
              onClick={onContinue}
              className="border border-signal bg-signal px-4 py-2 font-mono text-[11px] tracking-[0.18em] text-signal-foreground transition hover:opacity-90"
            >
              {t("brief.cta.continue")}
            </button>
            <button
              onClick={onOpenClone}
              className="border border-border-strong bg-surface px-4 py-2 font-mono text-[11px] tracking-[0.18em] text-foreground transition hover:bg-surface-2"
            >
              {t("brief.cta.clone")}
            </button>
            <button className="border border-border-strong bg-surface px-4 py-2 font-mono text-[11px] tracking-[0.18em] text-muted-foreground transition hover:bg-surface-2">
              {t("brief.cta.export")}
            </button>
          </div>
        </div>

        <div className="col-span-12 grid grid-cols-2 gap-px self-end overflow-hidden border border-border bg-border md:col-span-5 md:grid-cols-4">
          <Stat label={t("brief.stat.items")} value={`${packedItems}/${totalItems}`} accent />
          <Stat label={t("brief.stat.mass")} value={`${totalKg.toFixed(2)}KG`} />
          <Stat label={t("brief.stat.bags")} value={String(trip.containers.length).padStart(2, "0")} />
          <Stat label={t("brief.stat.dep")} value="08D" />
        </div>
      </div>

      <div className="mt-8 grid grid-cols-12 items-center gap-4">
        <div className="col-span-12 font-mono text-[10px] tracking-[0.2em] text-muted-foreground md:col-span-2">
          {t("brief.load")}
        </div>
        <div className="relative col-span-9 h-2 overflow-hidden bg-surface-3 md:col-span-8">
          <motion.div
            className="absolute inset-y-0 left-0 bg-signal"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1.2, ease: [0.2, 0.8, 0.2, 1] }}
          />
          <div className="absolute inset-0 scanlines opacity-60" />
        </div>
        <div className="col-span-3 text-right font-mono text-sm md:col-span-2">
          <span className="text-signal">{Math.round(pct)}</span>
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
      <div className={`mt-1 font-mono text-2xl tabular-nums ${accent ? "text-signal" : "text-foreground"}`}>
        {value}
      </div>
    </div>
  );
}
