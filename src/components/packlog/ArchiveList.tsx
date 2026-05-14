import { motion } from "framer-motion";
import { AuthGate } from "@/components/auth/AuthGate";
import { useI18n } from "@/lib/i18n";
import type { Trip } from "@/lib/packlog-data";
import { formatDestinations } from "@/lib/destinations";
import { tripScenarios } from "@/lib/trip-scenarios";

function tripAggregate(tr: Trip) {
  let totalItems = 0;
  let packed = 0;
  let wishlist = 0;
  let grams = 0;
  for (const c of tr.containers) {
    for (const it of c.items) {
      totalItems += 1;
      if (it.status === "packed") packed += 1;
      if (it.ownership === "wishlist") wishlist += 1;
      grams += it.weightG * it.qty;
    }
  }
  return {
    totalItems,
    packed,
    wishlist,
    todo: totalItems - packed,
    totalKg: grams / 1000,
  };
}

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

  const Section = ({ title, items }: { title: string; items: Trip[] }) => {
    if (items.length === 0) return null;
    return (
      <section className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="h-2 w-2 shrink-0 rounded-full bg-foreground/20" />
          <h2 className="font-mono text-[10px] tracking-[0.24em] text-muted-foreground">{title}</h2>
          <span className="font-mono text-[10px] text-muted-foreground/80">
            · {String(items.length).padStart(2, "0")}
          </span>
          <div className="ml-2 h-px flex-1 bg-border" />
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {items.map((tr, i) => {
            const { totalItems, packed, wishlist, todo, totalKg } = tripAggregate(tr);
            const pct = totalItems ? (packed / totalItems) * 100 : 0;
            const dDay = daysUntil(tr.startDate);
            const tripStarted = dDay < 0;
            const isPack = tr.phase === "PACK";
            const allPacked = isPack && totalItems > 0 && todo === 0;
            const showUnpackPast = isPack && tripStarted && todo > 0;

            const flags = tr.destinations
              .map((d) => d.countryFlag)
              .slice(0, 4)
              .join(" ");
            const places = formatDestinations(tr.destinations, lang);

            const smartPrimary = (() => {
              if (!isPack) return null;
              if (allPacked) {
                return (
                  <p className="text-sm font-medium leading-snug text-success">
                    {t("archive.card.ready")}
                  </p>
                );
              }
              if (showUnpackPast) {
                return (
                  <p className="text-sm leading-snug text-muted-foreground">
                    {t("archive.card.unpackPast").replace("{n}", String(todo))}
                  </p>
                );
              }
              return null;
            })();

            const smartWishlist =
              isPack && wishlist > 0 ? (
                <p className="mt-1 text-xs leading-snug text-muted-foreground">
                  {t("archive.card.buyHint").replace("{n}", String(wishlist))}
                </p>
              ) : null;

            return (
              <motion.button
                key={tr.id}
                onClick={() => onOpen(tr.id)}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="module corner-tick group relative overflow-hidden rounded-md p-4 text-left transition hover:-translate-y-0.5"
              >
                <div className="min-w-0">
                  <h3 className="truncate font-display text-xl leading-snug text-foreground">
                    {t("archive.card.titleDays")
                      .replace("{title}", tr.title)
                      .replace("{n}", String(tr.days))}
                  </h3>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {flags ? `${flags} ` : ""}
                    {places} · {tr.startDate}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {tripScenarios(tr).map((s) => (
                      <span
                        key={s}
                        className="rounded border border-border-strong bg-surface-2 px-1.5 py-0.5 font-mono text-[9px] tracking-[0.06em] text-muted-foreground"
                      >
                        {t(`scenario.${s}`)}
                      </span>
                    ))}
                  </div>
                </div>

                {isPack && totalItems > 0 ? (
                  <>
                    <div className="mt-3 h-1 overflow-hidden rounded-full bg-surface-3">
                      <motion.div
                        className="h-full bg-signal"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.9 }}
                      />
                    </div>
                    <p className="mt-2 font-mono text-[11px] tabular-nums text-foreground">
                      {t("archive.card.packedKg")
                        .replace("{packed}", String(packed))
                        .replace("{total}", String(totalItems))
                        .replace("{kg}", totalKg.toFixed(1))}
                    </p>
                  </>
                ) : tr.phase === "REVIEW" ? (
                  <p className="mt-3 inline-flex rounded border border-border bg-surface-2 px-2 py-0.5 font-mono text-[10px] tracking-[0.12em] text-muted-foreground">
                    {t("archive.card.reviewDone")}
                  </p>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">
                    {t("archive.card.noItemsYet")}
                  </p>
                )}

                {(smartPrimary || smartWishlist) && (
                  <div className="mt-3 space-y-1 border-t border-border pt-3">
                    {smartPrimary}
                    {smartWishlist}
                  </div>
                )}

                <div className="mt-2 flex items-center justify-end">
                  <span className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground opacity-0 transition group-hover:opacity-100">
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
        <div className="min-w-0">
          {trips.length === 0 ? (
            <>
              <div className="font-mono text-[10px] tracking-[0.28em] text-muted-foreground">
                {t("archive.kicker")}
              </div>
              <h1 className="mt-2 font-display text-4xl leading-[1.05] md:text-5xl">
                {t("archive.title")}
              </h1>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">{t("archive.subtitle")}</p>
            </>
          ) : (
            <h1 className="font-display text-2xl leading-tight tracking-tight text-foreground md:text-3xl">
              {t("archive.title")}
            </h1>
          )}
        </div>
        <AuthGate pendingAction={onNewTrip} resumeIntent={{ v: 1, kind: "openNewTrip" }}>
          <button
            type="button"
            className="shrink-0 rounded-md border border-signal bg-signal px-4 py-2.5 font-mono text-[11px] tracking-[0.18em] text-signal-foreground shadow-sm hover:opacity-90"
          >
            {t("archive.new")}
          </button>
        </AuthGate>
      </header>

      {trips.length === 0 ? (
        <div className="mx-auto max-w-md rounded-md border border-border bg-surface px-6 py-14 text-center shadow-sm">
          <p className="font-display text-xl leading-snug text-foreground md:text-2xl">
            {t("archive.empty.lead")}
          </p>
          <AuthGate pendingAction={onNewTrip} resumeIntent={{ v: 1, kind: "openNewTrip" }}>
            <button
              type="button"
              className="mt-8 w-full max-w-xs rounded-md border border-signal bg-signal px-5 py-3 font-mono text-[11px] font-semibold tracking-[0.2em] text-signal-foreground shadow-sm transition hover:opacity-90"
            >
              {t("archive.new")}
            </button>
          </AuthGate>
        </div>
      ) : (
        <>
          <Section title={t("archive.active")} items={active} />
          <Section title={t("archive.upcoming")} items={upcoming} />
          <Section title={t("archive.past")} items={past} />
        </>
      )}
    </div>
  );
}
