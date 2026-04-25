import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useI18n, pickName } from "@/lib/i18n";
import type { GearSpec } from "@/lib/packlog-data";

const catColor: Record<string, string> = {
  tech: "var(--info)",
  apparel: "var(--signal)",
  doc: "var(--warn)",
  health: "var(--success)",
  optic: "var(--signal)",
  misc: "var(--muted-foreground)",
};

const verdictColor: Record<string, string> = {
  keep: "var(--success)",
  upgrade: "var(--signal)",
  drop: "var(--destructive)",
};

export function GearLibraryPanel({
  library,
  onAddToTrip,
}: {
  library: GearSpec[];
  onAddToTrip: (gear: GearSpec) => void;
}) {
  const { t, lang } = useI18n();
  const [open, setOpen] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const filtered = library.filter(
    (g) =>
      !q ||
      g.name.toLowerCase().includes(q.toLowerCase()) ||
      (g.brand ?? "").toLowerCase().includes(q.toLowerCase()) ||
      g.category.includes(q.toLowerCase()),
  );

  return (
    <section className="module corner-tick corner-tick-br relative p-5">
      <div className="flex items-start justify-between border-b border-border pb-3">
        <div>
          <div className="font-mono text-[10px] tracking-[0.22em] text-signal">
            {t("library.head")}
          </div>
          <h3 className="mt-1 font-display text-xl">{t("library.title")}</h3>
          <p className="mt-1 font-mono text-[10px] text-muted-foreground">
            {t("library.subtitle")}
          </p>
        </div>
        <span className="tag-chip">N={library.length}</span>
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t("library.search")}
        className="mt-3 w-full border border-border-strong bg-background px-2 py-1.5 text-sm placeholder:text-muted-foreground focus:border-signal focus:outline-none"
      />

      <ul className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((g) => {
          const lastUse = g.history[0];
          const avg =
            g.history.length > 0
              ? g.history.reduce((s, h) => s + h.utility, 0) / g.history.length
              : null;
          const isOpen = open === g.id;
          return (
            <motion.li
              layout
              key={g.id}
              className={`relative border bg-surface p-3 transition ${
                isOpen ? "border-signal shadow-lg" : "border-border hover:border-border-strong"
              }`}
            >
              <button onClick={() => setOpen(isOpen ? null : g.id)} className="w-full text-left">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5" style={{ background: catColor[g.category] }} />
                      <span className="font-mono text-[9px] tracking-[0.18em] text-muted-foreground">
                        {g.category.toUpperCase()}
                      </span>
                    </div>
                    <div className="mt-1 truncate text-sm font-medium">{pickName(lang, g)}</div>
                    {g.brand && (
                      <div className="font-mono text-[10px] text-muted-foreground">{g.brand}</div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-xs tabular-nums">{g.weightG}g</div>
                    {avg !== null && (
                      <div className="font-mono text-[10px] text-signal">★ {avg.toFixed(1)}</div>
                    )}
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2 font-mono text-[9px] text-muted-foreground">
                  <span>×{g.history.length} trips</span>
                  {lastUse && (
                    <>
                      <span>·</span>
                      <span style={{ color: verdictColor[lastUse.verdict] }}>
                        last: {lastUse.verdict.toUpperCase()}
                      </span>
                    </>
                  )}
                </div>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 border-t border-dashed border-border pt-3">
                      <p className="text-[12px] leading-relaxed text-foreground/85">
                        {lang === "zh" ? (g.descriptionZh ?? g.description) : g.description}
                      </p>
                      <div className="mt-2 font-mono text-[9px] text-muted-foreground">
                        {t("library.owned")} {g.ownedSince}
                      </div>

                      <div className="mt-3">
                        <div className="font-mono text-[9px] tracking-[0.18em] text-signal">
                          {t("library.history")}
                        </div>
                        {g.history.length === 0 ? (
                          <div className="mt-1 font-mono text-[10px] text-muted-foreground">
                            — {t("library.history.empty")}
                          </div>
                        ) : (
                          <ul className="mt-1 space-y-1">
                            {g.history.map((h, i) => (
                              <li
                                key={i}
                                className="border-l-2 bg-surface-2 px-2 py-1 text-[11px]"
                                style={{ borderColor: verdictColor[h.verdict] }}
                              >
                                <div className="flex items-center justify-between font-mono text-[9px]">
                                  <span className="text-muted-foreground">
                                    {h.date} · {h.tripTitle}
                                  </span>
                                  <span style={{ color: verdictColor[h.verdict] }}>
                                    {h.verdict.toUpperCase()} · ★{h.utility}
                                  </span>
                                </div>
                                {h.note && (
                                  <div className="mt-0.5 leading-snug text-foreground/80">
                                    &ldquo;{h.note}&rdquo;
                                  </div>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <button
                        onClick={() => onAddToTrip(g)}
                        className="mt-3 w-full border border-signal bg-signal py-1.5 font-mono text-[10px] tracking-[0.18em] text-signal-foreground hover:opacity-90"
                      >
                        {t("library.add")}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.li>
          );
        })}
      </ul>
    </section>
  );
}
