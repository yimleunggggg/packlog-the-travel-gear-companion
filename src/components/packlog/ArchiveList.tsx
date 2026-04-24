import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import type { Trip } from "@/lib/packlog-data";
import { formatDestinations } from "@/lib/destinations";

export function ArchiveList({
  trips,
  onOpen,
  onNewTrip,
}: {
  trips: Trip[];
  onOpen: (id: string) => void;
  onNewTrip: () => void;
}) {
  const { t, lang } = useI18n();

  // Today: lowercase fixed reference
  const today = new Date();
  const daysUntil = (yyyymmdd: string) => {
    const [y, m, d] = yyyymmdd.split(".").map(Number);
    const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
    return Math.round((dt.getTime() - today.getTime()) / 86400000);
  };

  const upcoming: Trip[] = [];
  const active: Trip[] = [];
  const past: Trip[] = [];
  trips.forEach((tr) => {
    if (tr.phase === "REVIEW") past.push(tr);
    else if (daysUntil(tr.startDate) <= 14) active.push(tr);
    else upcoming.push(tr);
  });

  const Section = ({
    title,
    accent,
    items,
  }: {
    title: string;
    accent: string;
    items: Trip[];
  }) => {
    if (items.length === 0) return null;
    return (
      <section className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="h-2 w-2 rounded-full" style={{ background: accent }} />
          <h2 className="font-mono text-[11px] tracking-[0.28em] text-foreground">{title}</h2>
          <span className="font-mono text-[10px] text-muted-foreground">
            · {String(items.length).padStart(2, "0")}
          </span>
          <div className="ml-2 h-px flex-1 bg-border" />
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {items.map((tr, i) => {
            const totalItems = tr.containers.reduce((s, c) => s + c.items.length, 0);
            const packed = tr.containers.reduce(
              (s, c) => s + c.items.filter((i) => i.status === "packed").length,
              0,
            );
            const totalKg =
              tr.containers.reduce(
                (s, c) => s + c.items.reduce((ss, i) => ss + i.weightG * i.qty, 0),
                0,
              ) / 1000;
            const pct = totalItems ? (packed / totalItems) * 100 : 0;
            const dDay = daysUntil(tr.startDate);
            return (
              <motion.button
                key={tr.id}
                onClick={() => onOpen(tr.id)}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="module corner-tick group relative overflow-hidden p-4 text-left transition hover:-translate-y-0.5"
                style={{ ["--corner-color" as string]: accent }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-[10px] tracking-[0.18em] text-signal">
                      {tr.id} · {t(`scenario.${tr.scenario}`)}
                    </div>
                    <h3 className="mt-1 truncate font-display text-xl leading-tight">
                      {tr.title}
                    </h3>
                    <div className="mt-1 truncate text-xs text-muted-foreground">
                      {tr.destinations.map((d) => d.countryFlag).slice(0, 3).join(" ")}{" "}
                      {formatDestinations(tr.destinations, lang)}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-mono text-[10px] text-muted-foreground">
                      {tr.startDate}
                    </div>
                    {tr.phase === "REVIEW" ? (
                      <div className="mt-0.5 inline-block rounded-sm border border-info bg-info/10 px-1.5 py-0.5 font-mono text-[9px] tracking-[0.18em] text-info">
                        DEBRIEFED
                      </div>
                    ) : dDay >= 0 ? (
                      <div className="mt-0.5 font-mono text-base tabular-nums text-foreground">
                        D-{dDay}
                      </div>
                    ) : (
                      <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                        passed
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-px overflow-hidden border border-border bg-border">
                  <Mini label={t("brief.stat.items")} value={`${packed}/${totalItems}`} />
                  <Mini label={t("brief.stat.mass")} value={`${totalKg.toFixed(1)}kg`} />
                  <Mini label={t("brief.stat.bags")} value={String(tr.containers.length).padStart(2, "0")} />
                </div>

                {tr.phase !== "REVIEW" && (
                  <div className="mt-3 h-1 overflow-hidden rounded bg-surface-3">
                    <motion.div
                      className="h-full bg-signal"
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.9 }}
                    />
                  </div>
                )}

                <div className="mt-3 flex items-center justify-between">
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {tr.climate}
                  </span>
                  <span className="font-mono text-[10px] tracking-[0.18em] text-signal opacity-0 transition group-hover:opacity-100">
                    {t("archive.open")} →
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </section>
    );
  };

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between gap-4">
        <div>
          <div className="font-mono text-[10px] tracking-[0.28em] text-signal">PACKLOG · ARCHIVE</div>
          <h1 className="mt-2 font-display text-4xl leading-[1.05] md:text-5xl">
            {t("archive.title")}
          </h1>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            {t("archive.subtitle")}
          </p>
        </div>
        <button
          onClick={onNewTrip}
          className="shrink-0 rounded-md border border-signal bg-signal px-4 py-2.5 font-mono text-[11px] tracking-[0.18em] text-signal-foreground shadow-sm hover:opacity-90"
        >
          {t("archive.new")}
        </button>
      </header>

      {trips.length === 0 ? (
        <div className="module corner-tick relative grid place-items-center p-12 text-center">
          <div className="font-mono text-[11px] text-muted-foreground">{t("archive.empty")}</div>
          <button
            onClick={onNewTrip}
            className="mt-4 rounded border border-signal bg-signal px-4 py-2 font-mono text-[10px] tracking-[0.18em] text-signal-foreground"
          >
            {t("archive.new")}
          </button>
        </div>
      ) : (
        <>
          <Section title={t("archive.active")} accent="var(--signal)" items={active} />
          <Section title={t("archive.upcoming")} accent="var(--info)" items={upcoming} />
          <Section title={t("archive.past")} accent="var(--muted-foreground)" items={past} />
        </>
      )}
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface px-2 py-1.5">
      <div className="font-mono text-[8px] tracking-[0.22em] text-muted-foreground">{label}</div>
      <div className="font-mono text-xs tabular-nums">{value}</div>
    </div>
  );
}
