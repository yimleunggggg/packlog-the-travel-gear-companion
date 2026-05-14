import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";
import {
  destinationTree,
  findCountryById,
  flattenSearch,
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
    scenarios: ScenarioKey[];
    seedFromScenario?: boolean;
  }) => void;
}) {
  const { t, lang } = useI18n();
  const [title, setTitle] = useState("");
  const [titleManual, setTitleManual] = useState(false);
  const [destinations, setDestinations] = useState<SelectedDestination[]>([]);
  const [startIso, setStartIso] = useState("2026-06-01");
  const [endIso, setEndIso] = useState("2026-06-05");
  const [climate, setClimate] = useState("");
  const [selectedScenarios, setSelectedScenarios] = useState<ScenarioKey[]>(["general"]);
  const [seed, setSeed] = useState(true);
  const [destSearch, setDestSearch] = useState("");
  const [showCascade, setShowCascade] = useState(false);
  const [nlTrip, setNlTrip] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiNote, setAiNote] = useState<string | null>(null);
  const [cCountryId, setCCountryId] = useState(() => destinationTree[0]?.id ?? "jp");
  const [cRegionId, setCRegionId] = useState(() => destinationTree[0]?.regions[0]?.id ?? "");
  const [cCityId, setCCityId] = useState(() => destinationTree[0]?.regions[0]?.cities[0]?.id ?? "");

  const scenarios: ScenarioKey[] = [
    "winter-city",
    "summer-beach",
    "trail-run",
    "alpine",
    "desert",
    "ski",
    "dive",
    "workation",
    "general",
  ];

  const daysComputed = useMemo(() => tripDaysInclusive(startIso, endIso), [startIso, endIso]);

  const searchResults = useMemo(() => flattenSearch(destSearch), [destSearch]);

  const cascadeCountry = useMemo(() => findCountryById(cCountryId), [cCountryId]);
  const cascadeRegions = cascadeCountry?.regions ?? [];
  const cascadeRegion = cascadeRegions.find((r) => r.id === cRegionId);
  const cascadeCities = cascadeRegion?.cities ?? [];
  const cascadeCity = cascadeCities.find((c) => c.id === cCityId);

  useEffect(() => {
    if (!open) return;
    setTitleManual(false);
    setTitle("");
    setDestinations([]);
    setDestSearch("");
    setShowCascade(false);
    setSelectedScenarios(["general"]);
    setSeed(true);
    setClimate("");
    setStartIso("2026-06-01");
    setEndIso("2026-06-05");
    setNlTrip("");
    setAiNote(null);
    setAiBusy(false);
  }, [open]);

  useEffect(() => {
    setEndIso((prev) => (prev < startIso ? startIso : prev));
  }, [startIso]);

  useEffect(() => {
    if (!open || titleManual || destinations.length === 0) return;
    const destPart = destinations
      .slice(0, 2)
      .map((d) => (lang === "zh" ? d.cityZh : d.cityEn))
      .join(" · ");
    const d = daysComputed;
    const auto =
      lang === "zh"
        ? `${destPart} · ${d} 天`
        : lang === "ja"
          ? `${destPart} · ${d}日`
          : `${destPart} · ${d}d`;
    setTitle(auto);
  }, [open, titleManual, destinations, daysComputed, lang, t]);

  const toggleDestination = (d: SelectedDestination) => {
    setDestinations((cur) =>
      cur.find((x) => x.id === d.id) ? cur.filter((x) => x.id !== d.id) : [...cur, d],
    );
  };

  const pickFromSearch = (d: SelectedDestination) => {
    toggleDestination(d);
    setDestSearch("");
  };

  const isSelected = (id: string) => destinations.some((dd) => dd.id === id);

  const addCascadeCity = () => {
    if (!cascadeCountry || !cascadeRegion || !cascadeCity) return;
    toggleDestination({
      id: cascadeCity.id,
      countryId: cascadeCountry.id,
      regionId: cascadeRegion.id,
      cityEn: cascadeCity.en,
      cityZh: cascadeCity.zh,
      countryFlag: cascadeCountry.flag,
      kind: "city",
    });
  };

  const addCascadeCountryOnly = () => {
    if (!cascadeCountry) return;
    toggleDestination({
      id: `country-${cascadeCountry.id}`,
      countryId: cascadeCountry.id,
      regionId: "country",
      cityEn: cascadeCountry.en,
      cityZh: cascadeCountry.zh,
      countryFlag: cascadeCountry.flag,
      kind: "country",
    });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || destinations.length === 0) return;
    onCreate({
      title: title.trim(),
      destinations,
      days: Math.max(1, daysComputed),
      startDate: isoToDot(startIso),
      climate: climate.trim() || "—",
      scenarios: selectedScenarios,
      seedFromScenario: seed,
    });
  };

  const toggleScenario = (s: ScenarioKey) => {
    setSelectedScenarios((cur) => {
      if (cur.includes(s)) {
        if (cur.length <= 1) return cur;
        return cur.filter((x) => x !== s);
      }
      return [...cur, s];
    });
  };

  const runAiParse = async () => {
    const text = nlTrip.trim();
    if (!text) return;
    setAiBusy(true);
    setAiNote(null);
    const subscriptionTier = parseSubscriptionTier();
    try {
      const res = await fetch("/api/ai/parse-trip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, subscriptionTier }),
      });
      let data: unknown;
      try {
        data = await res.json();
      } catch {
        setAiNote(t("newTrip.ai.errorHttp"));
        return;
      }
      if (!res.ok) {
        setAiNote(t("newTrip.ai.errorHttp"));
        return;
      }
      const body = data as {
        ok?: boolean;
        code?: string;
        message?: string;
        parsed?: unknown;
      };
      if (body.ok === true && body.parsed && typeof body.parsed === "object") {
        const hints = applyParsedTripFields(t, body.parsed as Record<string, unknown>, {
          setTitle,
          setTitleManual,
          setStartIso,
          setEndIso,
          setClimate,
          setSelectedScenarios,
          setDestinations,
        });
        setAiNote([t("newTrip.ai.done"), ...hints].filter(Boolean).join(" · "));
        return;
      }
      const code = body.code;
      if (code === "PRO_REQUIRED") setAiNote(t("newTrip.ai.errorPro"));
      else if (code === "AI_NOT_CONFIGURED") setAiNote(t("newTrip.ai.errorNotConfigured"));
      else if (code === "PARSE_FAILED") setAiNote(t("newTrip.ai.errorParse"));
      else if (code === "MISSING_TEXT") setAiNote(t("newTrip.ai.errorUnknown"));
      else setAiNote(body.message?.trim() || t("newTrip.ai.errorUnknown"));
    } catch {
      setAiNote(t("newTrip.ai.errorNetwork"));
    } finally {
      setAiBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="scrim fixed inset-0 z-50 grid touch-none place-items-center overscroll-none p-3 md:p-4"
          onClick={onClose}
        >
          <motion.form
            onSubmit={submit}
            onClick={(e) => e.stopPropagation()}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="module corner-tick corner-tick-br relative flex max-h-[min(92dvh,calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-1.5rem))] w-full max-w-2xl touch-pan-y flex-col overflow-hidden overscroll-y-contain p-5 md:p-6"
          >
            <div className="shrink-0 flex items-start justify-between gap-3 border-b border-[#E8E2D9] pb-3">
              <h3 className="font-display text-2xl md:text-3xl">{t("trips.create.title")}</h3>
              <button
                type="button"
                onClick={onClose}
                className="font-mono text-xs text-muted-foreground hover:text-foreground"
                aria-label="close"
              >
                ×
              </button>
            </div>

            <div className="mt-4 flex-1 space-y-4 overflow-y-auto pr-1">
              <div className="rounded-md border border-border bg-surface-2/60 p-3">
                <label className="block font-mono text-[9px] tracking-[0.15em] text-muted-foreground">
                  AI
                </label>
                <textarea
                  value={nlTrip}
                  onChange={(e) => setNlTrip(e.target.value)}
                  placeholder={t("newTrip.ai.placeholder")}
                  rows={2}
                  className="input mt-1 min-h-[2.75rem] resize-y"
                />
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={aiBusy || !nlTrip.trim()}
                    onClick={() => void runAiParse()}
                    className="rounded-md border border-signal bg-signal px-3 py-1.5 font-mono text-[10px] font-semibold tracking-[0.15em] text-signal-foreground disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {aiBusy ? t("newTrip.ai.busy") : t("newTrip.ai.cta")}
                  </button>
                  {aiNote ? (
                    <span className="font-mono text-[10px] text-muted-foreground">{aiNote}</span>
                  ) : null}
                </div>
              </div>

              {/* Destinations first — title auto-fills from selections */}
              <Field label={t("trips.create.dest")}>
                <input
                  autoFocus
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
                        <span>
                          {lang === "zh" ? d.cityZh : d.cityEn}
                          <span className="text-muted-foreground">
                            {" "}
                            · {lang === "zh" ? d.cityEn : d.cityZh}
                          </span>
                        </span>
                        <span className="text-muted-foreground">✕</span>
                      </button>
                    ))}
                  </div>
                )}

                {destSearch.trim() !== "" && (
                  <div className="mt-2 max-h-40 overflow-y-auto rounded-md border border-border">
                    {searchResults.length === 0 ? (
                      <div className="px-3 py-2 font-mono text-[10px] text-muted-foreground">
                        {t("trips.create.dest.noResults")}
                      </div>
                    ) : (
                      searchResults.map((d) => (
                        <button
                          type="button"
                          key={d.id}
                          onClick={() => pickFromSearch(d)}
                          className={`flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-xs transition hover:bg-surface-2 ${
                            isSelected(d.id) ? "bg-signal-soft/60" : ""
                          }`}
                        >
                          <span>
                            {d.countryFlag}{" "}
                            <span className="text-foreground">
                              {lang === "zh" ? d.cityZh : d.cityEn}
                            </span>
                            <span className="ml-1 font-mono text-[10px] text-muted-foreground">
                              · {lang === "zh" ? d.cityEn : d.cityZh}
                            </span>
                            <span className="ml-1 text-muted-foreground">
                              ·{" "}
                              {d.kind === "country"
                                ? lang === "zh"
                                  ? "国家"
                                  : "country"
                                : lang === "zh"
                                  ? "城市"
                                  : "city"}
                            </span>
                          </span>
                          {isSelected(d.id) && (
                            <span className="font-mono text-[9px] text-signal">✓</span>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                )}

                <div className="mt-3 space-y-2">
                  <button
                    type="button"
                    onClick={() => setShowCascade((v) => !v)}
                    className="font-mono text-[10px] tracking-[0.18em] text-signal hover:underline"
                  >
                    {showCascade
                      ? t("trips.create.dest.cascade.hide")
                      : t("trips.create.dest.cascade.show")}
                  </button>

                  {showCascade && cascadeCountry && (
                    <div className="rounded-md border border-border bg-surface-2/80 p-3">
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        <label className="block">
                          <span className="mb-1 block font-mono text-[9px] tracking-[0.15em] text-muted-foreground">
                            {t("trips.create.dest.cascade.country")}
                          </span>
                          <select
                            value={cCountryId}
                            onChange={(e) => {
                              const next = e.target.value;
                              setCCountryId(next);
                              const co = findCountryById(next);
                              const r0 = co?.regions[0];
                              setCRegionId(r0?.id ?? "");
                              setCCityId(r0?.cities[0]?.id ?? "");
                            }}
                            className="input font-mono text-xs"
                          >
                            {destinationTree.map((co) => (
                              <option key={co.id} value={co.id}>
                                {co.flag} {lang === "zh" ? co.zh : co.en}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="block">
                          <span className="mb-1 block font-mono text-[9px] tracking-[0.15em] text-muted-foreground">
                            {t("trips.create.dest.cascade.region")}
                          </span>
                          <select
                            value={cRegionId}
                            onChange={(e) => {
                              const next = e.target.value;
                              setCRegionId(next);
                              const reg = cascadeCountry?.regions.find((r) => r.id === next);
                              setCCityId(reg?.cities[0]?.id ?? "");
                            }}
                            className="input font-mono text-xs"
                          >
                            {cascadeRegions.map((r) => (
                              <option key={r.id} value={r.id}>
                                {lang === "zh" ? r.zh : r.en}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="block">
                          <span className="mb-1 block font-mono text-[9px] tracking-[0.15em] text-muted-foreground">
                            {t("trips.create.dest.cascade.city")}
                          </span>
                          <select
                            value={cCityId}
                            onChange={(e) => setCCityId(e.target.value)}
                            className="input font-mono text-xs"
                          >
                            {cascadeCities.map((ci) => (
                              <option key={ci.id} value={ci.id}>
                                {lang === "zh" ? ci.zh : ci.en} · {lang === "zh" ? ci.en : ci.zh}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={addCascadeCity}
                          disabled={!cascadeCity}
                          className="rounded border border-signal bg-signal px-3 py-1.5 font-mono text-[10px] tracking-[0.15em] text-signal-foreground disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {t("trips.create.dest.addCity")}
                        </button>
                        <button
                          type="button"
                          onClick={addCascadeCountryOnly}
                          className="rounded border border-border-strong bg-surface px-3 py-1.5 font-mono text-[10px] tracking-[0.15em] text-foreground"
                        >
                          {t("trips.create.dest.countryOnly")}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {destinations.length === 0 && (
                  <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                    {t("trips.create.dest.none")}
                  </p>
                )}
              </Field>

              <Field label={t("trips.create.name")}>
                <input
                  value={title}
                  onChange={(e) => {
                    setTitleManual(true);
                    setTitle(e.target.value);
                  }}
                  placeholder={t("trips.create.name.placeholder")}
                  className="input input-trip-title"
                />
              </Field>

              <div className="grid grid-cols-12 gap-3">
                <Field span={4} label={t("trips.create.dateStart")}>
                  <input
                    type="date"
                    value={startIso}
                    onChange={(e) => setStartIso(e.target.value)}
                    className="input font-mono"
                  />
                </Field>
                <Field span={4} label={t("trips.create.dateEnd")}>
                  <input
                    type="date"
                    value={endIso}
                    min={startIso}
                    onChange={(e) => setEndIso(e.target.value)}
                    className="input font-mono"
                  />
                </Field>
                <Field span={4} label={t("trips.create.daysSummary")}>
                  <div className="input flex items-center font-mono text-sm text-foreground">
                    {t("trips.create.daysCount").replace("{n}", String(daysComputed))}
                  </div>
                </Field>
              </div>

              <Field label={t("trips.create.climate")}>
                <input
                  value={climate}
                  onChange={(e) => setClimate(e.target.value)}
                  placeholder={t("trips.create.climate.placeholder")}
                  className="input font-mono w-full"
                />
              </Field>

              <Field label={t("trips.create.scenarios")}>
                <div className="flex flex-wrap gap-1">
                  {scenarios.map((s) => {
                    const on = selectedScenarios.includes(s);
                    return (
                      <button
                        type="button"
                        key={s}
                        onClick={() => toggleScenario(s)}
                        className={`rounded border px-2.5 py-1 font-mono text-[10px] tracking-[0.12em] transition ${
                          on
                            ? "border-signal bg-signal text-signal-foreground"
                            : "border-border-strong bg-surface text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {t(`scenario.${s}`)}
                      </button>
                    );
                  })}
                </div>
              </Field>

              <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-surface-2 p-2.5">
                <input
                  type="checkbox"
                  checked={seed}
                  onChange={(e) => setSeed(e.target.checked)}
                  className="h-3.5 w-3.5 accent-[var(--signal)]"
                />
                <span className="text-xs">{t("trips.create.seed")}</span>
              </label>
            </div>

            <div className="mt-4 flex flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:justify-end sm:gap-3">
              <button
                type="button"
                onClick={onClose}
                className="order-2 min-h-11 rounded border border-border-strong bg-surface px-4 py-2.5 font-mono text-[10px] tracking-[0.18em] text-muted-foreground hover:text-foreground sm:order-1"
              >
                {t("trips.create.cancel")}
              </button>
              <button
                type="submit"
                disabled={!title.trim() || destinations.length === 0}
                className="order-1 min-h-11 flex-1 rounded-md border border-signal bg-signal px-4 py-2.5 font-mono text-[10px] font-semibold tracking-[0.18em] text-signal-foreground shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40 sm:order-2 sm:max-w-xs sm:flex-none"
              >
                {t("trips.create.commit")}
              </button>
            </div>

            <style>{`.input{ width:100%; border:1px solid var(--border-strong); background: var(--background); padding:0.45rem 0.6rem; font-size:0.875rem; outline:none; border-radius: 4px; }
              .input:focus{ border-color: var(--signal); box-shadow: 0 0 0 3px var(--signal-soft); }
              .input.input-trip-title{ font-size: clamp(0.78rem, 2.6vw, 0.95rem); line-height: 1.35; min-height: 2.45rem; max-height: 7rem; overflow-y: auto; resize: vertical; word-break: break-word; }`}</style>
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

function isoToDot(iso: string): string {
  return iso.replace(/-/g, ".");
}

function tripDaysInclusive(startIso: string, endIso: string): number {
  const [ys, ms, ds] = startIso.split("-").map(Number);
  const [ye, me, de] = endIso.split("-").map(Number);
  const a = new Date(ys!, ms! - 1, ds!).getTime();
  const b = new Date(ye!, me! - 1, de!).getTime();
  if (Number.isNaN(a) || Number.isNaN(b) || b < a) return 1;
  return Math.round((b - a) / 86400000) + 1;
}

/** Vite: `VITE_PACKLOG_SUBSCRIPTION_TIER=pro` sends Pro tier to the API (server still enforces key + optional bypass). */
function parseSubscriptionTier(): "pro" | "free" {
  const raw = String(import.meta.env.VITE_PACKLOG_SUBSCRIPTION_TIER ?? "")
    .toLowerCase()
    .trim();
  return raw === "pro" ? "pro" : "free";
}

const CHINESE_SCENE_TO_SCENARIO: Record<string, ScenarioKey> = {
  通用: "general",
  "冬季/城市": "winter-city",
  "夏季/海滩": "summer-beach",
  越野跑: "trail-run",
  "山地/高山": "alpine",
  沙漠: "desert",
  "滑雪/单板": "ski",
  "潜水/浮潜": "dive",
  远程办公: "workation",
};

function scenesToScenarioKeys(scenes: unknown): ScenarioKey[] {
  if (!Array.isArray(scenes)) return ["general"];
  const keys = new Set<ScenarioKey>();
  for (const s of scenes) {
    const k = CHINESE_SCENE_TO_SCENARIO[String(s).trim()];
    if (k) keys.add(k);
  }
  if (keys.size === 0) return ["general"];
  return Array.from(keys);
}

function isYmd(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function isoAddDays(iso: string, deltaDays: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y!, m! - 1, d! + deltaDays);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function resolveDestinationFromParsed(dest: unknown): {
  picked: SelectedDestination[];
  labelForHint: string;
} {
  if (!dest || typeof dest !== "object") return { picked: [], labelForHint: "" };
  const d = dest as Record<string, unknown>;
  const city = String(d.city ?? "").trim();
  const cityEn = String(d.city_en ?? "").trim();
  const country = String(d.country ?? "").trim();
  const countryEn = String(d.country_en ?? "").trim();
  const labelForHint = city || cityEn || country || countryEn;
  const queries = [
    city,
    cityEn,
    city && country ? `${city} ${country}` : "",
    cityEn && countryEn ? `${cityEn} ${countryEn}` : "",
  ].filter((q) => q.length >= 1);
  for (const q of queries) {
    const hits = flattenSearch(q);
    if (hits.length > 0) return { picked: [hits[0]!], labelForHint };
  }
  return { picked: [], labelForHint };
}

/**
 * Maps AI JSON into dialog state. Returns extra `aiNote` lines (already localized).
 */
function applyParsedTripFields(
  t: (key: string) => string,
  parsed: Record<string, unknown>,
  setters: {
    setTitle: (v: string) => void;
    setTitleManual: (v: boolean) => void;
    setStartIso: (v: string) => void;
    setEndIso: (v: string) => void;
    setClimate: (v: string) => void;
    setSelectedScenarios: (v: ScenarioKey[]) => void;
    setDestinations: (v: SelectedDestination[]) => void;
  },
): string[] {
  const hints: string[] = [];
  const {
    setTitle,
    setTitleManual,
    setStartIso,
    setEndIso,
    setClimate,
    setSelectedScenarios,
    setDestinations,
  } = setters;

  const titleRaw = parsed.title;
  if (typeof titleRaw === "string" && titleRaw.trim()) {
    setTitleManual(true);
    setTitle(titleRaw.trim());
  }

  const start =
    typeof parsed.start_date === "string" && isYmd(parsed.start_date) ? parsed.start_date : "";
  let end = typeof parsed.end_date === "string" && isYmd(parsed.end_date) ? parsed.end_date : "";
  const dur =
    typeof parsed.duration_days === "number" && Number.isFinite(parsed.duration_days)
      ? Math.max(1, Math.floor(parsed.duration_days))
      : 0;

  if (start) {
    setStartIso(start);
    if (end && end >= start) {
      setEndIso(end);
    } else if (dur > 0) {
      end = isoAddDays(start, dur - 1);
      setEndIso(end);
    }
  } else if (end && isYmd(end)) {
    setEndIso(end);
  }

  const climateRaw = parsed.climate_note;
  if (typeof climateRaw === "string" && climateRaw.trim()) {
    setClimate(climateRaw.trim());
  }

  setSelectedScenarios(scenesToScenarioKeys(parsed.scenes));

  const { picked, labelForHint } = resolveDestinationFromParsed(parsed.destination);
  if (picked.length > 0) {
    setDestinations(picked);
  } else if (labelForHint) {
    hints.push(t("newTrip.ai.destHint").replace("{city}", labelForHint));
  }

  const notes = parsed.special_notes;
  if (Array.isArray(notes) && notes.length > 0) {
    const text = notes
      .map((n) => String(n).trim())
      .filter(Boolean)
      .join(" · ");
    if (text) {
      hints.push(t("newTrip.ai.specialNotesLine").replace("{notes}", text));
    }
  }

  return hints;
}
