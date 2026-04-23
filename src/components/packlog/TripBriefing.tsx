import { motion } from "framer-motion";
import type { Trip } from "@/lib/packlog-data";
import { useI18n } from "@/lib/i18n";

export function TripBriefing({ trip }: { trip: Trip }) {
  const { t } = useI18n();
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
              <span>◆ {t("brief.tape.brief")}</span>
              <span>◆ {t("brief.tape.dep")} {trip.startDate}</span>
              <span>◆ {trip.destination}</span>
              <span>◆ {trip.climate}</span>
              <span>◆ {t("brief.tape.dur")} {String(trip.days).padStart(2, "0")}{t("brief.days")}</span>
              <span>◆ {t("brief.tape.status")} {t(`phase.${trip.phase}`)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 pt-6">
        <div className="col-span-12 md:col-span-7">
          <div className="font-mono text-[10px] tracking-[0.28em] text-signal">
            {t("brief.file")} / {trip.id}
          </div>
          <h1 className="mt-3 font-display text-5xl font-medium leading-[1.05] tracking-tight md:text-6xl">
            {trip.title}
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
            {trip.destination} · {trip.days}{t("brief.days")} · {trip.climate}.
            {" "}{t("brief.subtitle")}
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <button className="border border-signal bg-signal px-4 py-2 font-mono text-[11px] tracking-[0.18em] text-signal-foreground transition hover:opacity-90">
              {t("brief.cta.continue")}
            </button>
            <button className="border border-border-strong px-4 py-2 font-mono text-[11px] tracking-[0.18em] text-foreground transition hover:bg-surface-2">
              {t("brief.cta.clone")}
            </button>
            <button className="border border-border-strong px-4 py-2 font-mono text-[11px] tracking-[0.18em] text-muted-foreground transition hover:bg-surface-2">
              {t("brief.cta.export")}
            </button>
          </div>
        </div>

        {/* Parameter bus */}
        <div className="col-span-12 grid grid-cols-2 gap-px self-end overflow-hidden border border-border bg-border md:col-span-5 md:grid-cols-4">
          <Stat label={t("brief.stat.items")} value={`${packedItems}/${totalItems}`} accent />
          <Stat label={t("brief.stat.mass")} value={`${totalKg.toFixed(2)}KG`} />
          <Stat label={t("brief.stat.bags")} value={String(trip.containers.length).padStart(2, "0")} />
          <Stat label={t("brief.stat.dep")} value="08D" />
        </div>
      </div>

      {/* Master progress bar */}
      <div className="mt-8 grid grid-cols-12 items-center gap-4">
        <div className="col-span-12 font-mono text-[10px] tracking-[0.2em] text-muted-foreground md:col-span-2">
          {t("brief.load")}
        </div>
        <div className="relative col-span-9 h-2 overflow-hidden bg-surface-3 md:col-span-8">
          <motion.div
            className="absolute inset-y-0 left-0 bg-signal"
            initial={{ width: 0 }}
            animate={{ width: `${(packedItems / totalItems) * 100}%` }}
            transition={{ duration: 1.2, ease: [0.2, 0.8, 0.2, 1] }}
          />
          <div className="absolute inset-0 scanlines opacity-60" />
        </div>
        <div className="col-span-3 text-right font-mono text-sm md:col-span-2">
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
