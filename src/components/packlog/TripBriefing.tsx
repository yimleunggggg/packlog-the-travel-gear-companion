import { motion } from "framer-motion";
import type { Trip } from "@/lib/packlog-data";
import { useI18n } from "@/lib/i18n";
import { formatDestinations } from "@/lib/destinations";

export function TripBriefing({
  trip,
  onBack,
  onContinue,
  onOpenClone,
}: {
  trip: Trip;
  onBack: () => void;
  onContinue: () => void;
  onOpenClone: () => void;
}) {
  const { t, lang } = useI18n();

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

  // Days until departure
  const today = new Date();
  const [y, m, d] = trip.startDate.split(".").map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
  const dDay = Math.max(0, Math.round((dt.getTime() - today.getTime()) / 86400000));

  const destStr = formatDestinations(trip.destinations, lang);

  return (
    <section className="module corner-tick corner-tick-br relative overflow-hidden">
      {/* Tape */}
      <div className="pointer-events-none absolute inset-x-0 top-0 overflow-hidden border-b border-border bg-surface-2/60">
        <div className="flex animate-tape gap-8 whitespace-nowrap py-1 font-mono text-[10px] tracking-[0.3em] text-muted-foreground">
          {Array.from({ length: 2 }).map((_, k) => (
            <div key={k} className="flex shrink-0 gap-8">
              <span>◆ {t("brief.tape.brief")}</span>
              <span>◆ {t("brief.tape.dep")} {trip.startDate}</span>
              <span>◆ {destStr}</span>
              <span>◆ {trip.climate}</span>
              <span>◆ {t("brief.tape.dur")} {String(trip.days).padStart(2, "0")}{t("brief.days")}</span>
              <span>◆ {t(`scenario.${trip.scenario}`).toUpperCase()}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="px-5 pt-9 md:px-8 md:pt-10">
        {/* Back link */}
        <button
          onClick={onBack}
          className="mb-3 font-mono text-[10px] tracking-[0.2em] text-muted-foreground hover:text-foreground"
        >
          {t("archive.back")}
        </button>

        <div className="grid grid-cols-12 gap-4 pb-2 md:gap-6">
          <div className="col-span-12 lg:col-span-7">
            <div className="font-mono text-[10px] tracking-[0.28em] text-signal">
              {t("brief.file")} · {trip.id} · {t(`scenario.${trip.scenario}`).toUpperCase()}
            </div>
            <h1 className="mt-2 font-display text-4xl leading-[1.05] tracking-tight md:text-6xl">
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
                · {trip.days}{t("brief.days")} · {trip.climate}
              </span>
            </div>
            <p className="mt-3 max-w-md text-sm text-muted-foreground">{t("brief.subtitle")}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                onClick={onContinue}
                className="rounded-md border border-signal bg-signal px-4 py-2 font-mono text-[11px] tracking-[0.18em] text-signal-foreground shadow-sm transition hover:opacity-90"
              >
                {t("brief.cta.continue")}
              </button>
              <button
                onClick={onOpenClone}
                className="rounded-md border border-border-strong bg-surface px-4 py-2 font-mono text-[11px] tracking-[0.18em] text-foreground transition hover:bg-surface-2"
              >
                {t("brief.cta.clone")}
              </button>
              <button className="rounded-md border border-border-strong bg-surface px-4 py-2 font-mono text-[11px] tracking-[0.18em] text-muted-foreground transition hover:bg-surface-2">
                {t("brief.cta.export")}
              </button>
            </div>
          </div>

          {/* Stat panel — moved tighter to top, bright */}
          <div className="col-span-12 lg:col-span-5">
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border bg-border md:grid-cols-4">
              <Stat label={t("brief.stat.items")} value={`${packedItems}/${totalItems}`} accent />
              <Stat label={t("brief.stat.mass")} value={`${totalKg.toFixed(2)}KG`} />
              <Stat label={t("brief.stat.bags")} value={String(trip.containers.length).padStart(2, "0")} />
              <Stat label={t("brief.stat.dep")} value={dDay > 0 ? `${dDay}D` : "GO"} />
            </div>

            {/* Load progress */}
            <div className="mt-3 flex items-center gap-3">
              <span className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground">
                {t("brief.load")}
              </span>
              <div className="relative h-2 flex-1 overflow-hidden rounded bg-surface-3">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-signal"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 1, ease: [0.2, 0.8, 0.2, 1] }}
                />
              </div>
              <div className="font-mono text-sm tabular-nums">
                <span className="text-signal">{Math.round(pct)}</span>
                <span className="text-muted-foreground">%</span>
              </div>
            </div>
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
      <div className={`mt-1 font-mono text-xl tabular-nums md:text-2xl ${accent ? "text-signal" : "text-foreground"}`}>
        {value}
      </div>
    </div>
  );
}
