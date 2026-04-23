import { motion } from "framer-motion";

export function TopBar({
  phase,
  onPhase,
}: {
  phase: "PLAN" | "PACK" | "REVIEW";
  onPhase: (p: "PLAN" | "PACK" | "REVIEW") => void;
}) {
  const phases: ("PLAN" | "PACK" | "REVIEW")[] = ["PLAN", "PACK", "REVIEW"];
  const idx = phases.indexOf(phase);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1480px] items-center gap-6 px-6 py-3">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center bg-signal text-signal-foreground">
            <span className="font-mono text-[11px] font-bold">PL</span>
          </div>
          <div className="leading-tight">
            <div className="font-mono text-[11px] tracking-[0.22em] text-muted-foreground">PACKLOG</div>
            <div className="font-mono text-[9px] tracking-[0.3em] text-signal">行 · 前 · 志</div>
          </div>
        </div>

        {/* Lifecycle Track */}
        <div className="ml-6 flex flex-1 items-center gap-1">
          <span className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground">LIFECYCLE</span>
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
                      {String(i + 1).padStart(2, "0")} / {p}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <div className="tag-chip">REC · 2026.05.02</div>
          <div className="tag-chip">USR · 0001</div>
        </div>
      </div>
    </header>
  );
}
