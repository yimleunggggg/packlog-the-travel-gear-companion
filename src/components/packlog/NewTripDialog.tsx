import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import type { Trip } from "@/lib/packlog-data";

export function NewTripDialog({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (args: {
    title: string;
    destination: string;
    days: number;
    startDate: string;
    climate: string;
    scenario: Trip["scenario"];
  }) => void;
}) {
  const { t } = useI18n();
  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [days, setDays] = useState(5);
  const [startDate, setStartDate] = useState("2026.06.01");
  const [climate, setClimate] = useState("");
  const [scenario, setScenario] = useState<Trip["scenario"]>("general");

  const scenarios: Trip["scenario"][] = [
    "winter-city", "summer-beach", "trail-run", "alpine", "desert", "workation", "general",
  ];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !destination.trim()) return;
    onCreate({
      title: title.trim(),
      destination: destination.trim(),
      days: Math.max(1, days),
      startDate,
      climate: climate.trim() || "—",
      scenario,
    });
    setTitle("");
    setDestination("");
    setDays(5);
    setClimate("");
    setScenario("general");
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="scrim fixed inset-0 z-50 grid place-items-center p-4"
          onClick={onClose}
        >
          <motion.form
            onSubmit={submit}
            onClick={(e) => e.stopPropagation()}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="module corner-tick corner-tick-br relative w-full max-w-xl space-y-4 p-6"
          >
            <div>
              <div className="font-mono text-[10px] tracking-[0.22em] text-signal">
                ◆ NEW · TRIP
              </div>
              <h3 className="mt-1 font-display text-2xl">{t("trips.create.title")}</h3>
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                {t("trips.create.subtitle")}
              </p>
            </div>

            <div className="grid grid-cols-12 gap-3">
              <Field span={12} label={t("trips.create.name")}>
                <input
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Yunnan / Spring Trail"
                  className="input"
                />
              </Field>
              <Field span={8} label={t("trips.create.dest")}>
                <input
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Kunming → Dali → Lijiang"
                  className="input"
                />
              </Field>
              <Field span={4} label={t("trips.create.days")}>
                <input
                  type="number"
                  min={1}
                  value={days}
                  onChange={(e) => setDays(+e.target.value)}
                  className="input text-center font-mono"
                />
              </Field>
              <Field span={6} label={t("trips.create.date")}>
                <input
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  placeholder="2026.06.01"
                  className="input font-mono"
                />
              </Field>
              <Field span={6} label={t("trips.create.climate")}>
                <input
                  value={climate}
                  onChange={(e) => setClimate(e.target.value)}
                  placeholder="−5°C ↔ 8°C / Snow"
                  className="input font-mono"
                />
              </Field>
              <Field span={12} label={t("trips.create.scenario")}>
                <div className="flex flex-wrap gap-1">
                  {scenarios.map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setScenario(s)}
                      className={`border px-2 py-1 font-mono text-[10px] tracking-[0.15em] ${
                        scenario === s
                          ? "border-signal bg-signal text-signal-foreground"
                          : "border-border-strong bg-surface text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {t(`scenario.${s}`)}
                    </button>
                  ))}
                </div>
              </Field>
            </div>

            <div className="flex justify-end gap-2 border-t border-border pt-4">
              <button
                type="button"
                onClick={onClose}
                className="border border-border-strong bg-surface px-4 py-2 font-mono text-[10px] tracking-[0.18em] text-muted-foreground hover:text-foreground"
              >
                {t("trips.create.cancel")}
              </button>
              <button
                type="submit"
                className="border border-signal bg-signal px-4 py-2 font-mono text-[10px] tracking-[0.18em] text-signal-foreground hover:opacity-90"
              >
                {t("trips.create.commit")}
              </button>
            </div>

            <style>{`.input{ width:100%; border:1px solid var(--border-strong); background: var(--background); padding:0.4rem 0.55rem; font-size:0.875rem; outline:none; }
              .input:focus{ border-color: var(--signal); }`}</style>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Field({
  span,
  label,
  children,
}: {
  span: number;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`col-span-${span} block`} style={{ gridColumn: `span ${span} / span ${span}` }}>
      <span className="mb-1 block font-mono text-[10px] tracking-[0.18em] text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
