import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { useI18n, type Lang } from "@/lib/i18n";

export function TopBar({
  phase,
  onPhase,
  showPhase = true,
}: {
  phase?: "PACK" | "REVIEW";
  onPhase?: (p: "PACK" | "REVIEW") => void;
  showPhase?: boolean;
}) {
  const { t, lang, setLang } = useI18n();
  const phases: ("PACK" | "REVIEW")[] = ["PACK", "REVIEW"];
  const idx = phase ? phases.indexOf(phase) : 0;
  const langs: Lang[] = ["en", "zh", "ja"];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1480px] flex-wrap items-center gap-3 px-4 py-3 md:gap-6 md:px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-signal text-signal-foreground shadow-sm">
            <span className="font-mono text-[12px] font-bold">PL</span>
          </div>
          <div className="leading-tight">
            <div className="font-mono text-[11px] tracking-[0.22em] text-foreground">PACKLOG</div>
            <div className="font-mono text-[9px] tracking-[0.3em] text-muted-foreground">
              {t("brand.tagline")}
            </div>
          </div>
        </Link>

        {/* Nav */}
        <nav className="ml-2 flex items-center gap-1 md:ml-6">
          <Link
            to="/"
            activeOptions={{ exact: true }}
            className="border border-transparent px-2.5 py-1 font-mono text-[10px] tracking-[0.18em] text-muted-foreground transition hover:text-foreground [&.active]:border-signal [&.active]:bg-signal-soft [&.active]:text-foreground"
          >
            {t("nav.archive")}
          </Link>
          <Link
            to="/library"
            className="border border-transparent px-2.5 py-1 font-mono text-[10px] tracking-[0.18em] text-muted-foreground transition hover:text-foreground [&.active]:border-signal [&.active]:bg-signal-soft [&.active]:text-foreground"
          >
            {t("nav.library")}
          </Link>
          <Link
            to="/community"
            className="border border-transparent px-2.5 py-1 font-mono text-[10px] tracking-[0.18em] text-muted-foreground transition hover:text-foreground [&.active]:border-signal [&.active]:bg-signal-soft [&.active]:text-foreground"
          >
            {t("nav.community")}
          </Link>
        </nav>

        {/* Lifecycle Track (only shown inside a trip) */}
        {showPhase && phase && onPhase && (
          <div className="order-3 hidden flex-1 items-center gap-3 md:order-none md:flex">
            <span className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground">
              {t("lifecycle")}
            </span>
            <div className="relative flex flex-1 items-center">
              <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-border" />
              <motion.div
                className="absolute left-0 top-1/2 h-px -translate-y-1/2 bg-signal"
                initial={false}
                animate={{ width: `${(idx / (phases.length - 1)) * 100}%` }}
                transition={{ type: "spring", stiffness: 120, damping: 20 }}
              />
              <div className="relative flex flex-1 justify-between">
                {phases.map((p, i) => {
                  const active = i <= idx;
                  const current = i === idx;
                  return (
                    <button
                      key={p}
                      onClick={() => onPhase(p)}
                      className="group relative flex flex-col items-center gap-1.5"
                    >
                      <div
                        className={`relative h-3 w-3 rounded-full border ${
                          active
                            ? "border-signal bg-signal"
                            : "border-border-strong bg-background"
                        }`}
                      >
                        {current && (
                          <span className="absolute inset-0 animate-pulse-dot rounded-full bg-signal" />
                        )}
                      </div>
                      <span
                        className={`font-mono text-[10px] tracking-[0.18em] ${
                          active ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {String(i + 1).padStart(2, "0")} / {t(`phase.${p}`)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {showPhase && phase && onPhase && (
          <div className="order-2 flex w-full gap-1 md:hidden">
            {phases.map((p, i) => (
              <button
                key={p}
                onClick={() => onPhase(p)}
                className={`flex-1 border px-2 py-1 font-mono text-[10px] tracking-[0.15em] ${
                  i === idx
                    ? "border-signal bg-signal text-signal-foreground"
                    : "border-border text-muted-foreground"
                }`}
              >
                {t(`phase.${p}`)}
              </button>
            ))}
          </div>
        )}

        {/* Lang switcher */}
        <div className="ml-auto flex items-center gap-1 rounded-md border border-border-strong bg-surface p-0.5">
          {langs.map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`px-2 py-1 font-mono text-[10px] tracking-[0.15em] transition ${
                lang === l
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
