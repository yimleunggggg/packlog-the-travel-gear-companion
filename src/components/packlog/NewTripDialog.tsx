import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";
import type { Trip } from "@/lib/packlog-data";
import {
  destinationTree,
  flattenSearch,
  getGlobalCountries,
  type SelectedDestination,
} from "@/lib/destinations";
import type { ScenarioKey } from "@/lib/scenario-templates";

export function NewTripDialog({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (args: {
    title: string;
    destinations: SelectedDestination[];
    days: number;
    startDate: string;
    climate: string;
    scenario: ScenarioKey;
    seedFromScenario?: boolean;
  }) => void;
}) {
  const { t, lang } = useI18n();
  const [title, setTitle] = useState("");
  const [destinations, setDestinations] = useState<SelectedDestination[]>([]);
  const [days, setDays] = useState(5);
  const [startDate, setStartDate] = useState("2026.06.01");
  const [climate, setClimate] = useState("");
  const [scenario, setScenario] = useState<ScenarioKey>("general");
  const [seed, setSeed] = useState(true);
  const [destSearch, setDestSearch] = useState("");
  const [openCountry, setOpenCountry] = useState<string | null>("jp");

  const scenarios: ScenarioKey[] = [
    "winter-city", "summer-beach", "trail-run", "alpine",
    "desert", "ski", "dive", "workation", "general",
  ];

  const searchResults = useMemo(() => flattenSearch(destSearch), [destSearch]);

  const toggleDestination = (d: SelectedDestination) => {
    setDestinations((cur) =>
      cur.find((x) => x.id === d.id) ? cur.filter((x) => x.id !== d.id) : [...cur, d],
    );
  };
  const isSelected = (id: string) => destinations.some((d) => d.id === id);
  const globalCountries = useMemo(() => getGlobalCountries(), []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || destinations.length === 0) return;
    onCreate({
      title: title.trim(),
      destinations,
      days: Math.max(1, days),
      startDate,
      climate: climate.trim() || "—",
      scenario,
      seedFromScenario: seed,
    });
    // reset
    setTitle(""); setDestinations([]); setDays(5); setClimate(""); setScenario("general");
    setDestSearch(""); setSeed(true);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="scrim fixed inset-0 z-50 grid place-items-center p-3 md:p-4"
          onClick={onClose}
        >
          <motion.form
            onSubmit={submit}
            onClick={(e) => e.stopPropagation()}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="module corner-tick corner-tick-br relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden p-5 md:p-6"
          >
            <div className="shrink-0">
              <div className="font-mono text-[10px] tracking-[0.22em] text-signal">
                ◆ NEW · TRIP
              </div>
              <h3 className="mt-1 font-display text-3xl">{t("trips.create.title")}</h3>
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                {t("trips.create.subtitle")}
              </p>
            </div>

            <div className="mt-4 flex-1 space-y-4 overflow-y-auto pr-1">
              <Field label={t("trips.create.name")}>
                <input
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Yunnan Spring Trail · 滇西春季徒步"
                  className="input"
                />
              </Field>

              {/* Destinations: hierarchical + multi-select */}
              <Field label={t("trips.create.dest")}>
                <input
                  value={destSearch}
                  onChange={(e) => setDestSearch(e.target.value)}
                  placeholder={t("trips.create.dest.search")}
                  className="input"
                />

                {destinations.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {destinations.map((d) => (
                      <button
                        type="button"
                        key={d.id}
                        onClick={() => toggleDestination(d)}
                        className="flex items-center gap-1.5 rounded-md border border-signal bg-signal-soft px-2 py-1 font-mono text-[10px]"
                      >
                        <span>{d.countryFlag}</span>
                        <span>{lang === "zh" ? d.cityZh : d.cityEn}</span>
                        <span className="text-muted-foreground">✕</span>
                      </button>
                    ))}
                  </div>
                )}

                {destSearch ? (
                  <div className="mt-2 max-h-40 overflow-y-auto rounded-md border border-border">
                    {searchResults.length === 0 ? (
                      <div className="px-3 py-2 font-mono text-[10px] text-muted-foreground">
                        — no matches —
                      </div>
                    ) : (
                      searchResults.map((d) => (
                        <button
                          type="button"
                          key={d.id}
                          onClick={() => toggleDestination(d)}
                          className={`flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-xs transition hover:bg-surface-2 ${
                            isSelected(d.id) ? "bg-signal-soft/60" : ""
                          }`}
                        >
                          <span>
                            {d.countryFlag}{" "}
                            <span className="text-foreground">
                              {lang === "zh" ? d.cityZh : d.cityEn}
                            </span>
                            <span className="ml-1 text-muted-foreground">
                              · {d.kind === "country" ? (lang === "zh" ? "国家" : "country") : (lang === "zh" ? "城市" : "city")}
                            </span>
                          </span>
                          {isSelected(d.id) && <span className="text-signal">✓</span>}
                        </button>
                      ))
                    )}
                  </div>
                ) : (
                  <div className="mt-2 max-h-52 overflow-y-auto rounded-md border border-border">
                    {destinationTree.map((c) => {
                      const expanded = openCountry === c.id;
                      return (
                        <div key={c.id} className="border-b border-border last:border-b-0">
                          <div className="flex items-center justify-between bg-surface-2 px-3 py-1.5">
                            <button
                              type="button"
                              onClick={() => setOpenCountry(expanded ? null : c.id)}
                              className="text-left font-mono text-[11px]"
                            >
                              <span>
                                {c.flag} {lang === "zh" ? c.zh : c.en}
                              </span>
                            </button>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  toggleDestination({
                                    id: `country-${c.id}`,
                                    countryId: c.id,
                                    regionId: "country",
                                    cityEn: c.en,
                                    cityZh: c.zh,
                                    countryFlag: c.flag,
                                    kind: "country",
                                  })
                                }
                                className={`rounded border px-2 py-0.5 text-[10px] ${
                                  isSelected(`country-${c.id}`)
                                    ? "border-signal bg-signal text-signal-foreground"
                                    : "border-border-strong bg-surface"
                                }`}
                              >
                                {lang === "zh" ? "仅国家" : "Country only"}
                              </button>
                              <span className="text-muted-foreground">{expanded ? "−" : "+"}</span>
                            </div>
                          </div>
                          {expanded && (
                            <div>
                              {c.regions.map((r) => (
                                <div key={r.id} className="border-t border-border bg-surface">
                                  <div className="px-3 pt-1.5 font-mono text-[10px] tracking-[0.15em] text-muted-foreground">
                                    {lang === "zh" ? r.zh : r.en}
                                  </div>
                                  <div className="flex flex-wrap gap-1 p-2">
                                    {r.cities.map((ci) => {
                                      const sel = isSelected(ci.id);
                                      return (
                                        <button
                                          type="button"
                                          key={ci.id}
                                          onClick={() =>
                                            toggleDestination({
                                              id: ci.id, countryId: c.id, regionId: r.id,
                                              cityEn: ci.en, cityZh: ci.zh, countryFlag: c.flag, kind: "city",
                                            })
                                          }
                                          className={`rounded border px-2 py-0.5 text-[11px] transition ${
                                            sel
                                              ? "border-signal bg-signal text-signal-foreground"
                                              : "border-border-strong bg-surface text-foreground hover:border-signal"
                                          }`}
                                        >
                                          {lang === "zh" ? ci.zh : ci.en}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <div className="border-t border-border bg-surface-2 px-3 py-2">
                      <div className="mb-1 font-mono text-[10px] tracking-[0.15em] text-muted-foreground">
                        {lang === "zh" ? "全球国家（仅国家）" : "Global countries (country-only)"}
                      </div>
                      <div className="max-h-28 overflow-y-auto">
                        <div className="flex flex-wrap gap-1">
                          {globalCountries.map((co) => {
                            const id = `country-${co.id}`;
                            const sel = isSelected(id);
                            return (
                              <button
                                type="button"
                                key={id}
                                onClick={() =>
                                  toggleDestination({
                                    id,
                                    countryId: co.id,
                                    regionId: "country",
                                    cityEn: co.en,
                                    cityZh: co.zh,
                                    countryFlag: co.flag,
                                    kind: "country",
                                  })
                                }
                                className={`rounded border px-2 py-0.5 text-[11px] ${
                                  sel
                                    ? "border-signal bg-signal text-signal-foreground"
                                    : "border-border-strong bg-surface text-foreground hover:border-signal"
                                }`}
                              >
                                {co.flag} {lang === "zh" ? co.zh : co.en}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {destinations.length === 0 && (
                  <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                    {t("trips.create.dest.none")}
                  </p>
                )}
              </Field>

              <div className="grid grid-cols-12 gap-3">
                <Field span={4} label={t("trips.create.days")}>
                  <input
                    type="number" min={1} value={days}
                    onChange={(e) => setDays(+e.target.value)}
                    className="input text-center font-mono"
                  />
                </Field>
                <Field span={4} label={t("trips.create.date")}>
                  <input
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    placeholder="2026.06.01"
                    className="input font-mono"
                  />
                </Field>
                <Field span={4} label={t("trips.create.climate")}>
                  <input
                    value={climate}
                    onChange={(e) => setClimate(e.target.value)}
                    placeholder="−5°C / Snow"
                    className="input font-mono"
                  />
                </Field>
              </div>

              <Field label={t("trips.create.scenario")}>
                <div className="flex flex-wrap gap-1">
                  {scenarios.map((s) => (
                    <button
                      type="button" key={s}
                      onClick={() => setScenario(s)}
                      className={`rounded border px-2.5 py-1 font-mono text-[10px] tracking-[0.12em] transition ${
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

              <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-surface-2 p-2.5">
                <input
                  type="checkbox"
                  checked={seed}
                  onChange={(e) => setSeed(e.target.checked)}
                  className="h-3.5 w-3.5 accent-[var(--signal)]"
                />
                <span className="text-xs">
                  {t("trips.create.seed")}{" "}
                  <span className="font-mono text-[10px] text-muted-foreground">
                    · {t(`scenario.${scenario}`)}
                  </span>
                </span>
              </label>
            </div>

            <div className="mt-4 flex justify-end gap-2 border-t border-border pt-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded border border-border-strong bg-surface px-4 py-2 font-mono text-[10px] tracking-[0.18em] text-muted-foreground hover:text-foreground"
              >
                {t("trips.create.cancel")}
              </button>
              <button
                type="submit"
                disabled={!title.trim() || destinations.length === 0}
                className="rounded border border-signal bg-signal px-4 py-2 font-mono text-[10px] tracking-[0.18em] text-signal-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t("trips.create.commit")}
              </button>
            </div>

            <style>{`.input{ width:100%; border:1px solid var(--border-strong); background: var(--background); padding:0.45rem 0.6rem; font-size:0.875rem; outline:none; border-radius: 4px; }
              .input:focus{ border-color: var(--signal); box-shadow: 0 0 0 3px var(--signal-soft); }`}</style>
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
  span?: number;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label
      className="block"
      style={span ? { gridColumn: `span ${span} / span ${span}` } : undefined}
    >
      <span className="mb-1 block font-mono text-[10px] tracking-[0.18em] text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
