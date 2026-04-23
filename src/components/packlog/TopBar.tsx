import { motion } from "framer-motion";
import { useI18n, type Lang } from "@/lib/i18n";

export function TopBar({
  phase,
  onPhase,
}: {
  phase: "PLAN" | "PACK" | "REVIEW";
  onPhase: (p: "PLAN" | "PACK" | "REVIEW") => void;
}) {
  const { t, lang, setLang } = useI18n();
  const phases: ("PLAN" | "PACK" | "REVIEW")[] = ["PLAN", "PACK", "REVIEW"];
  const idx = phases.indexOf(phase);
  const langs: Lang[] = ["en", "zh", "ja"];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1480px] items-center gap-6 px-6 py-3">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center bg-signal text-signal-foreground">
            <span className="font-mono text-[11px] font-bold">PL</span>
          </div>
          <div className="leading-tight">
            <div className="font-mono text-[11px] tracking-[0.22em] text-foreground">PACKLOG</div>
            <div className="font-mono text-[9px] tracking-[0.3em] text-signal">{t("brand.tagline")}</div>
          </div>
        </div>

        {/* Lifecycle Track */}
        <div className="ml-6 hidden flex-1 items-center gap-1 md:flex">
          <span className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground">{t("lifecycle")}</span>
          <div className="relative ml-3 flex flex-1 items-center">
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
                    className="group relative flex flex-col items-center gap-2"
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

        {/* Mobile lifecycle compact */}
        <div className="flex flex-1 gap-1 md:hidden">
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

        {/* Lang switcher */}
        <div className="flex items-center gap-1 border border-border-strong bg-surface p-0.5">
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
