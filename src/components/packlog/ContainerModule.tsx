import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useId, useMemo, useState } from "react";
import type { Container, Item, LifecyclePhase, GearSpec, WeightSource } from "@/lib/packlog-data";
import type { PackViewFilter } from "@/lib/pack-view-filter";
import { itemMatchesPackViewFilter } from "@/lib/pack-view-filter";
import { useAuth } from "@/lib/auth-context";
import { useI18n, pickName } from "@/lib/i18n";
import { suggestFromName } from "@/lib/weight-library";
import { usePacklog } from "@/lib/packlog-store";
import {
  communityMedianWeight,
  formatKgFromGrams,
  resolveAiWeightEstimate,
} from "@/lib/weight-provenance";
import { ItemWeightLabel } from "@/components/packlog/ItemWeightLabel";
import { POOL_SEED_MIME, poolSeedToItemDraft } from "@/lib/packing-pool";
import type { SeedItem } from "@/lib/scenario-templates";

const typeKey: Record<Container["type"], string> = {
  checked: "container.type.checked",
  carry: "container.type.carry",
  camera: "container.type.camera",
  personal: "container.type.personal",
  daypack: "container.type.daypack",
  hike: "container.type.hike",
  toiletry: "container.type.toiletry",
  makeup: "container.type.makeup",
  tech: "container.type.tech",
  clothing: "container.type.clothing",
  custom: "container.type.custom",
};
const typeGlyph: Record<Container["type"], string> = {
  checked: "▣",
  carry: "▤",
  camera: "◉",
  personal: "◍",
  daypack: "◊",
  hike: "▲",
  toiletry: "◐",
  makeup: "◑",
  tech: "◈",
  clothing: "◇",
  custom: "◯",
};

const catColor: Record<Item["category"], string> = {
  tech: "var(--info)",
  apparel: "var(--signal)",
  doc: "var(--warn)",
  health: "var(--success)",
  optic: "var(--signal)",
  misc: "var(--muted-foreground)",
};

const ownColor: Record<Item["ownership"], string> = {
  owned: "var(--success)",
  wishlist: "var(--info)",
  borrowed: "var(--warn)",
  undecided: "var(--muted-foreground)",
};

export function ContainerModule({
  container,
  phase,
  tripId,
  onToggle,
  onVerdict,
  onUtility,
  onAdd,
  onRemove,
  onMove,
  onDropFromPool,
  onCycleOwnership,
  onOpenLibrary,
  onUpdate,
  onSaveToLibrary,
  isInLibrary,
  variant = "tall",
  packViewFilter = "all",
}: {
  container: Container;
  phase: LifecyclePhase;
  /** When saving gear to library, used for lazy-auth resume (trip detail route). */
  tripId?: string;
  onToggle: (containerId: string, itemId: string) => void;
  onVerdict: (containerId: string, itemId: string, v: Item["verdict"]) => void;
  onUtility?: (containerId: string, itemId: string, u: number) => void;
  onAdd?: (containerId: string, item: Omit<Item, "id">) => void;
  onRemove?: (containerId: string, itemId: string) => void;
  onMove?: (fromContainerId: string, itemId: string, toContainerId: string) => void;
  /** PACK: drop from scenario packing pool (copy into this container). */
  onDropFromPool?: (containerId: string, item: Omit<Item, "id">) => void;
  onCycleOwnership?: (containerId: string, itemId: string) => void;
  onOpenLibrary?: (containerId: string) => void;
  onUpdate?: (containerId: string, itemId: string, patch: Partial<Item>) => void;
  onSaveToLibrary?: (item: Item) => void;
  isInLibrary?: (item: Item) => boolean;
  variant?: "tall" | "wide";
  /** PACKLOG-SPEC §3.4 — packing page filter (PACK phase only). */
  packViewFilter?: PackViewFilter;
}) {
  const { t, lang } = useI18n();
  const { requestAuth } = useAuth();
  const [expanded, setExpanded] = useState(() => phase === "REVIEW");
  const [adding, setAdding] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  /** PACKLOG-SPEC §3.4 — PACK 行默认折叠，展开后显示归属/分类等操作。 */
  const [packOpenItemId, setPackOpenItemId] = useState<string | null>(null);

  const visiblePackItems = useMemo(() => {
    if (phase !== "PACK") return container.items;
    if (packViewFilter === "all") return container.items;
    return container.items.filter((i) => itemMatchesPackViewFilter(i, packViewFilter));
  }, [container.items, phase, packViewFilter]);

  const listItems = phase === "REVIEW" ? container.items : visiblePackItems;

  useEffect(() => {
    if (phase === "REVIEW") setExpanded(true);
  }, [phase]);

  useEffect(() => {
    if (packOpenItemId && !container.items.some((i) => i.id === packOpenItemId)) {
      setPackOpenItemId(null);
    }
  }, [container.items, packOpenItemId]);

  const massItems =
    phase === "PACK" ? container.items.filter((i) => i.status === "packed") : container.items;
  const totalG = massItems.reduce((s, i) => s + i.weightG * i.qty, 0);
  const totalKg = totalG / 1000;
  const loadPct = container.maxKg > 0 ? Math.min(100, (totalKg / container.maxKg) * 100) : 0;
  const packPct = container.items.length
    ? (container.items.filter((i) => i.status === "packed").length / container.items.length) * 100
    : 0;

  const containerTitle =
    container.type === "custom"
      ? lang === "zh"
        ? (container.nameZh ?? container.name)
        : container.name
      : t(typeKey[container.type]);

  return (
    <article
      className={`module corner-tick relative ${variant === "wide" ? "row-span-1" : ""} ${dragOver ? "drop-target" : ""}`}
      onDragOver={(e) => {
        const types = Array.from(e.dataTransfer.types);
        const allowPool = !!onDropFromPool && types.includes(POOL_SEED_MIME);
        if (!allowPool) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const poolRaw = e.dataTransfer.getData(POOL_SEED_MIME);
        if (poolRaw && onDropFromPool) {
          try {
            const seed = JSON.parse(poolRaw) as SeedItem;
            onDropFromPool(container.id, poolSeedToItemDraft(seed));
          } catch {
            /* ignore malformed payload */
          }
          return;
        }
      }}
    >
      <div
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        className="cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        onClick={() => setExpanded((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setExpanded((v) => !v);
          }
        }}
      >
        <header className="flex items-start justify-between border-b border-border p-4">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-md border border-border-strong bg-surface-2 font-mono text-base text-signal">
              {typeGlyph[container.type]}
            </div>
            <div>
              <h3 className="font-display text-xl leading-tight">{containerTitle}</h3>
            </div>
          </div>
          <span className="pointer-events-none font-mono text-[10px] tracking-[0.18em] text-muted-foreground">
            {expanded ? t("container.collapse") : t("container.expand")}
          </span>
        </header>

        <div className="grid grid-cols-2 gap-px bg-border">
          <Gauge
            label={t("container.gauge.mass")}
            current={formatKgFromGrams(totalG)}
            max={`/${container.maxKg}KG`}
            pct={loadPct}
            warn={loadPct > 90}
          />
          <Gauge
            label={t("container.gauge.packed")}
            current={String(container.items.filter((i) => i.status === "packed").length)}
            max={`/${container.items.length}`}
            pct={packPct}
          />
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
            className="overflow-hidden"
          >
            {listItems.length === 0 && (
              <div className="px-4 py-6 text-center font-mono text-[11px] text-muted-foreground">
                {container.items.length === 0 ? "— empty —" : t("pack.list.filteredEmpty")}
              </div>
            )}
            <ul className="divide-y divide-border">
              {listItems.map((it, idx) => {
                const displayName = pickName(lang, it);
                if (phase === "REVIEW") {
                  return (
                    <motion.li
                      key={it.id}
                      layout
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      draggable={false}
                      className="group flex flex-col gap-3 px-4 py-3 hover:bg-surface-2"
                    >
                      <div className="flex items-start gap-2">
                        <span className="shrink-0 pt-0.5 font-mono text-[10px] text-muted-foreground">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <span
                          className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-[1px]"
                          style={{ background: catColor[it.category] }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium leading-snug">{displayName}</div>
                          <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2 font-mono text-[11px] text-muted-foreground">
                            <span>×{it.qty}</span>
                            <ItemWeightLabel item={it} className="inline text-[11px]" />
                          </div>
                        </div>
                      </div>
                      <ReviewControls
                        item={it}
                        onVerdict={(v) => onVerdict(container.id, it.id, v)}
                        onUtility={(u) => onUtility?.(container.id, it.id, u)}
                        onNote={
                          onUpdate ? (note) => onUpdate(container.id, it.id, { note }) : undefined
                        }
                      />
                    </motion.li>
                  );
                }
                const isPackRowOpen = packOpenItemId === it.id;
                return (
                  <motion.li
                    key={it.id}
                    layout
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    draggable={false}
                    aria-expanded={isPackRowOpen}
                    onClick={(e) => {
                      const el = e.target as HTMLElement;
                      if (el.closest("button, a, input, textarea, select")) return;
                      setPackOpenItemId((cur) => (cur === it.id ? null : it.id));
                    }}
                    className="group flex cursor-pointer flex-col gap-2 px-4 py-2.5 hover:bg-surface-2 md:grid md:grid-cols-12 md:items-center md:gap-2"
                  >
                    <div className="flex min-w-0 items-center gap-2 md:contents">
                      <div className="shrink-0 md:col-span-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => onToggle(container.id, it.id)}
                          className={`relative h-4 w-4 rounded-sm border ${
                            it.status === "packed"
                              ? "border-signal bg-signal"
                              : "border-border-strong bg-background"
                          }`}
                          aria-label="toggle pack"
                        >
                          {it.status === "packed" && (
                            <span className="absolute inset-0 grid place-items-center font-mono text-[10px] text-signal-foreground">
                              ✓
                            </span>
                          )}
                        </button>
                      </div>

                      <div className="flex min-w-0 flex-1 items-start gap-2 md:col-span-5 md:items-center">
                        <span
                          className="mt-1.5 h-1.5 w-1.5 shrink-0 md:mt-0"
                          style={{ background: catColor[it.category] }}
                        />
                        {onUpdate ? (
                          isPackRowOpen ? (
                            <button
                              type="button"
                              onClick={() => setEditingId(it.id)}
                              title={t("item.edit")}
                              className={`group/name flex min-w-0 flex-1 items-center gap-1 text-left text-sm hover:text-signal ${
                                it.status === "packed"
                                  ? "text-muted-foreground line-through decoration-signal/50"
                                  : "text-foreground"
                              }`}
                            >
                              <span className="min-w-0 truncate">{displayName}</span>
                              {it.brand && (
                                <span className="hidden shrink-0 font-mono text-[9px] text-muted-foreground sm:inline">
                                  · {it.brand}
                                </span>
                              )}
                              {it.gearId && (
                                <span
                                  className="shrink-0 font-mono text-[9px] text-signal"
                                  title="from gear library"
                                >
                                  ⌬
                                </span>
                              )}
                              <span className="shrink-0 font-mono text-[9px] text-signal opacity-0 transition group-hover/name:opacity-100">
                                ✎
                              </span>
                            </button>
                          ) : (
                            <span
                              className={`min-w-0 flex-1 truncate text-sm ${
                                it.status === "packed"
                                  ? "text-muted-foreground line-through decoration-signal/50"
                                  : "text-foreground"
                              }`}
                            >
                              {displayName}
                              {it.gearId && (
                                <span
                                  className="ml-1.5 font-mono text-[9px] text-signal"
                                  title="from gear library"
                                >
                                  ⌬
                                </span>
                              )}
                            </span>
                          )
                        ) : (
                          <span
                            className={`min-w-0 flex-1 truncate text-sm ${
                              it.status === "packed"
                                ? "text-muted-foreground line-through decoration-signal/50"
                                : "text-foreground"
                            }`}
                          >
                            {displayName}
                            {it.gearId && (
                              <span
                                className="ml-1.5 font-mono text-[9px] text-signal"
                                title="from gear library"
                              >
                                ⌬
                              </span>
                            )}
                          </span>
                        )}
                      </div>

                      <div className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground md:col-span-1 md:text-right">
                        ×{it.qty}
                      </div>
                    </div>

                    <div className="flex w-full min-w-0 flex-wrap items-center justify-end gap-x-1.5 gap-y-1 pl-6 md:contents md:pl-0">
                      <div className="min-w-0 text-right text-muted-foreground md:col-span-2 md:flex md:justify-end">
                        <ItemWeightLabel
                          item={it}
                          className="inline-block max-w-full text-right text-[10px] leading-snug sm:text-[11px]"
                        />
                      </div>
                      {isPackRowOpen ? (
                        <div
                          className="flex max-w-full min-w-0 flex-wrap items-center justify-end gap-1 md:col-span-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => onCycleOwnership?.(container.id, it.id)}
                            title={t("own.toggle")}
                            className="shrink-0 whitespace-nowrap rounded border px-1.5 py-0.5 font-mono text-[9px] tracking-[0.1em]"
                            style={{
                              borderColor: ownColor[it.ownership],
                              color: ownColor[it.ownership],
                              background:
                                it.ownership === "wishlist" ? "var(--accent)" : "transparent",
                            }}
                          >
                            {t(`own.${it.ownership}`)}
                          </button>
                          <span className="tag-chip shrink-0 whitespace-nowrap">
                            {t(`cat.${it.category}`)}
                          </span>
                          {onUpdate && (
                            <button
                              type="button"
                              onClick={() => setEditingId(it.id)}
                              title={t("item.edit")}
                              className="shrink-0 rounded border border-border-strong px-1.5 py-0.5 font-mono text-[9px] tracking-[0.1em] text-muted-foreground hover:border-signal hover:text-signal"
                              aria-label="edit"
                            >
                              ✎
                            </button>
                          )}
                          {onRemove && (
                            <button
                              type="button"
                              onClick={() => onRemove(container.id, it.id)}
                              className="shrink-0 font-mono text-[10px] text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:text-destructive"
                              aria-label="remove"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </motion.li>
                );
              })}
            </ul>

            {phase !== "REVIEW" && onAdd && (
              <div className="space-y-2 border-t border-dashed border-border bg-surface-2/50 p-3">
                {adding ? (
                  <AddGearForm
                    onCancel={() => setAdding(false)}
                    onCommit={(item) => {
                      onAdd(container.id, item);
                      setAdding(false);
                    }}
                  />
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setAdding(true)}
                      className="flex-1 rounded border border-dashed border-border-strong py-2 font-mono text-[11px] tracking-[0.18em] text-muted-foreground transition hover:border-signal hover:text-signal"
                    >
                      {t("container.add")}
                    </button>
                    {onOpenLibrary && (
                      <button
                        onClick={() => onOpenLibrary(container.id)}
                        className="rounded border border-border-strong bg-surface px-3 py-2 font-mono text-[11px] tracking-[0.18em] text-foreground hover:border-signal hover:bg-signal-soft"
                      >
                        ⌬ {t("container.add.fromLib")}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {editingId && onUpdate && (
        <EditItemDialog
          item={container.items.find((x) => x.id === editingId)!}
          inLibrary={isInLibrary?.(container.items.find((x) => x.id === editingId)!) ?? false}
          onClose={() => setEditingId(null)}
          onSave={(patch) => {
            onUpdate(container.id, editingId, patch);
            setEditingId(null);
          }}
          onDelete={
            onRemove
              ? () => {
                  onRemove(container.id, editingId);
                  setEditingId(null);
                }
              : undefined
          }
          onSaveToLibrary={
            onSaveToLibrary
              ? () => {
                  const it = container.items.find((x) => x.id === editingId);
                  if (!it) return;
                  if (tripId) {
                    requestAuth(() => onSaveToLibrary(it), {
                      v: 1,
                      kind: "saveItemToLibrary",
                      tripId,
                      containerId: container.id,
                      itemId: it.id,
                    });
                  } else {
                    onSaveToLibrary(it);
                  }
                }
              : undefined
          }
        />
      )}
    </article>
  );
}

export function AddGearForm({
  onCancel,
  onCommit,
  initialCategory = "misc",
}: {
  onCancel: () => void;
  onCommit: (item: Omit<Item, "id">) => void;
  /** Pre-select category when opening from a category section of the checklist. */
  initialCategory?: Item["category"];
}) {
  const { t, lang } = useI18n();
  const [name, setName] = useState("");
  const [qty, setQty] = useState(1);
  const [weight, setWeight] = useState<number | "">("");
  const [category, setCategory] = useState<Item["category"]>(initialCategory);
  const [ownership, setOwnership] = useState<Item["ownership"]>("owned");
  // Whether user has manually overridden the weight/category since last suggestion apply.
  const [userTouchedWeight, setUserTouchedWeight] = useState(false);
  const [userTouchedCat, setUserTouchedCat] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  /** When user applied tier-2 AI estimate and hasn't changed weight away from midpoint. */
  const [aiMid, setAiMid] = useState<number | null>(null);
  const [aiLow, setAiLow] = useState<number | null>(null);
  const [aiHigh, setAiHigh] = useState<number | null>(null);

  // Live suggestion (NEVER auto-overwrites user-typed values).
  const hint = suggestFromName(name);

  // Apply hint: only when user hasn't touched the weight, and weight is empty.
  useEffect(() => {
    if (!hint) return;
    if (!userTouchedWeight && weight === "") setWeight(hint.weightG);
    if (!userTouchedCat) setCategory(hint.category);
  }, [hint?.weightG, hint?.category]); // eslint-disable-line react-hooks/exhaustive-deps

  const applyHintNow = () => {
    if (!hint) return;
    setWeight(hint.weightG);
    setCategory(hint.category);
    // If the hint has a canonical name and the user typed only a partial/brand,
    // upgrade the input to the canonical form (helps "salomon ultra 4" → "Salomon Ultra 4").
    const canonical = lang === "zh" ? hint.nameZh : hint.nameEn;
    if (canonical && canonical.toLowerCase() !== name.trim().toLowerCase()) {
      setName(canonical);
    }
    setUserTouchedWeight(false);
    setUserTouchedCat(false);
    setAiMid(null);
    setAiLow(null);
    setAiHigh(null);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const trimmed = name.trim();
    const isZh = /[\u4e00-\u9fa5]/.test(trimmed);

    // Weight is optional. Order: explicit user input → library hint → 100g default.
    let finalWeight: number;
    let source: WeightSource | undefined;
    let weightEstimateLowG: number | undefined;
    let weightEstimateHighG: number | undefined;

    const wNum = weight !== "" ? +weight : NaN;
    const matchedAi =
      aiMid != null &&
      aiLow != null &&
      aiHigh != null &&
      Number.isFinite(wNum) &&
      Math.round(wNum) === Math.round(aiMid);

    if (weight !== "" && +weight > 0) {
      finalWeight = +weight;
      if (matchedAi) {
        source = "ai_estimate";
        weightEstimateLowG = aiLow;
        weightEstimateHighG = aiHigh;
      } else {
        source = userTouchedWeight ? "user" : hint ? "library" : "library";
      }
    } else if (hint) {
      finalWeight = hint.weightG;
      source = "library";
    } else {
      finalWeight = 100;
      source = "library";
    }

    // Carry over canonical bilingual names from the hint when available.
    const nameEn = hint?.nameEn ?? (isZh ? undefined : trimmed);
    const nameZh = hint?.nameZh ?? (isZh ? trimmed : undefined);

    onCommit({
      gearId: null,
      name: trimmed,
      nameEn,
      nameZh,
      qty: Math.max(1, qty),
      weightG: finalWeight,
      weightSource: source,
      weightEstimateLowG,
      weightEstimateHighG,
      category,
      status: "todo",
      verdict: null,
      utility: null,
      ownership,
    });
  };

  const applyAiEstimate = async () => {
    setAiBusy(true);
    try {
      const est = await resolveAiWeightEstimate({
        category,
        nameHint: name.trim(),
      });
      setAiMid(est.midG);
      setAiLow(est.lowG);
      setAiHigh(est.highG);
      setWeight(est.midG);
      setUserTouchedWeight(false);
    } finally {
      setAiBusy(false);
    }
  };

  const cats: Item["category"][] = ["tech", "apparel", "doc", "health", "optic", "misc"];
  const owns: Item["ownership"][] = ["owned", "wishlist", "borrowed", "undecided"];

  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="grid grid-cols-12 gap-2">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("container.add.name")}
          className="col-span-6 rounded border border-border-strong bg-background px-2 py-1.5 text-sm placeholder:text-muted-foreground focus:border-signal focus:outline-none"
        />
        <input
          type="number"
          min={1}
          value={qty}
          onChange={(e) => setQty(+e.target.value)}
          placeholder={t("container.add.qty")}
          className="col-span-2 rounded border border-border-strong bg-background px-2 py-1.5 text-center font-mono text-sm focus:border-signal focus:outline-none"
        />
        <input
          type="number"
          min={1}
          value={weight}
          onChange={(e) => {
            setWeight(e.target.value === "" ? "" : +e.target.value);
            setUserTouchedWeight(true);
            setAiMid(null);
            setAiLow(null);
            setAiHigh(null);
          }}
          placeholder={t("container.add.weight")}
          className={`col-span-4 rounded border bg-background px-2 py-1.5 text-right font-mono text-sm focus:border-signal focus:outline-none ${
            !userTouchedWeight && hint ? "border-signal/60 text-signal" : "border-border-strong"
          }`}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={aiBusy}
          onClick={() => void applyAiEstimate()}
          className="rounded border border-border-strong bg-surface px-2 py-1 font-mono text-[10px] tracking-[0.15em] text-muted-foreground hover:border-signal hover:text-signal disabled:opacity-40"
        >
          {aiBusy ? "…" : t("weight.action.ai")}
        </button>
      </div>

      {hint && (
        <button
          type="button"
          onClick={applyHintNow}
          className="flex w-full items-center justify-between rounded border border-signal/40 bg-signal-soft/40 px-2 py-1.5 text-left font-mono text-[10px] hover:bg-signal-soft"
        >
          <span className="truncate text-foreground">
            <span className="text-signal">↳</span>{" "}
            {(lang === "zh" ? hint.nameZh : hint.nameEn) ?? name}
            <span className="ml-1.5 text-muted-foreground">
              · {hint.weightG}g · {t(`cat.${hint.category}`)}
            </span>
          </span>
          <span className="ml-2 shrink-0 tracking-[0.15em] text-signal">USE ↵</span>
        </button>
      )}

      <div className="flex flex-wrap items-center gap-1">
        {cats.map((c) => (
          <button
            type="button"
            key={c}
            onClick={() => {
              setCategory(c);
              setUserTouchedCat(true);
            }}
            className={`rounded border px-2 py-0.5 font-mono text-[10px] tracking-[0.15em] ${
              category === c
                ? "border-signal bg-signal text-signal-foreground"
                : "border-border-strong text-muted-foreground hover:text-foreground"
            }`}
          >
            {t(`cat.${c}`)}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-1">
        {owns.map((o) => (
          <button
            type="button"
            key={o}
            onClick={() => setOwnership(o)}
            className={`rounded border px-2 py-0.5 font-mono text-[10px] tracking-[0.15em] ${
              ownership === o
                ? "border-signal bg-signal-soft text-foreground"
                : "border-border-strong text-muted-foreground hover:text-foreground"
            }`}
          >
            {t(`own.${o}`)}
          </button>
        ))}
      </div>
      <p className="font-mono text-[10px] leading-relaxed text-muted-foreground">
        {t("container.add.suggest")}
      </p>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-border-strong px-3 py-1 font-mono text-[10px] tracking-[0.18em] text-muted-foreground hover:text-foreground"
        >
          {t("container.add.cancel")}
        </button>
        <button
          type="submit"
          className="rounded border border-signal bg-signal px-3 py-1 font-mono text-[10px] tracking-[0.18em] text-signal-foreground hover:opacity-90"
        >
          {t("container.add.commit")}
        </button>
      </div>
    </form>
  );
}

function Gauge({
  label,
  current,
  max,
  pct,
  warn,
}: {
  label: string;
  current: string;
  max: string;
  pct: number;
  warn?: boolean;
}) {
  return (
    <div className="bg-surface px-4 py-3">
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-[9px] tracking-[0.22em] text-muted-foreground">
          {label}
        </span>
        <span className="font-mono text-xs tabular-nums">
          <span className={warn ? "text-destructive" : "text-foreground"}>{current}</span>
          <span className="text-muted-foreground">{max}</span>
        </span>
      </div>
      <div className="relative mt-2 h-1 overflow-hidden rounded bg-surface-3">
        <motion.div
          className={`absolute inset-y-0 left-0 ${warn ? "bg-destructive" : "bg-signal"}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
        />
      </div>
    </div>
  );
}

function ReviewControls({
  item,
  onVerdict,
  onUtility,
  onNote,
}: {
  item: Item;
  onVerdict: (v: Item["verdict"]) => void;
  onUtility: (u: number) => void;
  onNote?: (note: string) => void;
}) {
  const { t } = useI18n();
  const opts: { val: NonNullable<Item["verdict"]>; labelKey: string; color: string }[] = [
    { val: "keep", labelKey: "review.verdict.keep", color: "var(--success)" },
    { val: "upgrade", labelKey: "review.verdict.upgrade", color: "var(--signal)" },
    { val: "drop", labelKey: "review.verdict.drop", color: "var(--destructive)" },
  ];
  return (
    <div className="w-full space-y-3 rounded-md border border-border-strong/80 bg-surface/50 p-3">
      <div>
        <div className="text-[11px] font-medium text-foreground">{t("review.row.outcome")}</div>
        <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">
          {t("review.row.outcomeHint")}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {opts.map((o) => {
            const active = item.verdict === o.val;
            return (
              <button
                key={o.val}
                type="button"
                onClick={() => onVerdict(active ? null : o.val)}
                className="rounded-md border px-2.5 py-1.5 text-left text-[12px] leading-tight transition"
                style={{
                  borderColor: active ? o.color : "var(--border-strong)",
                  background: active ? o.color : "transparent",
                  color: active ? "var(--background)" : "var(--foreground)",
                }}
              >
                {t(o.labelKey)}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <div className="text-[11px] font-medium text-foreground">{t("review.row.stars")}</div>
        <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">
          {t("review.row.starsHint")}
        </p>
        <div
          className="mt-2 flex items-center gap-0.5"
          role="group"
          aria-label={t("review.row.stars")}
        >
          {[1, 2, 3, 4, 5].map((n) => {
            const active = (item.utility ?? 0) >= n;
            return (
              <button
                key={n}
                type="button"
                onClick={() => onUtility(item.utility === n ? 0 : n)}
                className="min-h-9 min-w-9 rounded border border-transparent text-[14px] leading-none transition hover:border-border-strong"
                style={{ color: active ? "var(--signal)" : "var(--border-strong)" }}
                aria-label={t("review.starPick").replace("{n}", String(n))}
                aria-pressed={active}
              >
                ★
              </button>
            );
          })}
        </div>
      </div>
      {onNote ? (
        <div>
          <label
            className="text-[11px] font-medium text-foreground"
            htmlFor={`rev-note-${item.id}`}
          >
            {t("review.row.noteLabel")}
          </label>
          <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">
            {t("review.row.noteHint")}
          </p>
          <textarea
            id={`rev-note-${item.id}`}
            value={item.note ?? ""}
            onChange={(e) => onNote(e.target.value)}
            placeholder={t("review.notePlaceholder")}
            rows={2}
            className="mt-2 w-full resize-y rounded-md border border-border-strong bg-background px-2 py-2 text-[13px] leading-snug text-foreground placeholder:text-muted-foreground focus:border-signal focus:outline-none"
          />
        </div>
      ) : null}
    </div>
  );
}

// Slim Library picker dialog used inline in containers
export function LibraryPicker({
  open,
  library,
  onClose,
  onPick,
}: {
  open: boolean;
  library: GearSpec[];
  onClose: () => void;
  onPick: (gear: GearSpec) => void;
}) {
  const { t, lang } = useI18n();
  const [q, setQ] = useState("");
  if (!open) return null;
  const filtered = library.filter(
    (g) =>
      !q ||
      g.name.toLowerCase().includes(q.toLowerCase()) ||
      (g.nameZh ?? "").includes(q) ||
      (g.brand ?? "").toLowerCase().includes(q.toLowerCase()) ||
      g.category.includes(q.toLowerCase()),
  );
  return (
    <div
      className="scrim fixed inset-0 z-50 grid touch-none place-items-center overscroll-none p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className="module corner-tick relative flex max-h-[min(80dvh,calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-2rem))] w-full max-w-2xl touch-pan-y flex-col overscroll-y-contain p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="font-mono text-[10px] tracking-[0.22em] text-signal">
          ⌬ {t("container.add.fromLib")}
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("library.search")}
          className="mt-3 w-full rounded border border-border-strong bg-background px-2 py-1.5 text-sm focus:border-signal focus:outline-none"
        />
        <ul className="mt-3 flex-1 space-y-1 overflow-y-auto">
          {filtered.map((g) => (
            <li key={g.id}>
              <button
                onClick={() => onPick(g)}
                className="flex w-full items-center justify-between gap-3 rounded border border-border bg-surface px-3 py-2 text-left transition hover:border-signal hover:bg-surface-2"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm">{pickName(lang, g)}</div>
                  <div className="font-mono text-[10px] text-muted-foreground">
                    {g.brand ?? "—"} · {t(`cat.${g.category}`)}
                  </div>
                </div>
                <div className="shrink-0 text-right font-mono text-[11px] tabular-nums">
                  {g.weightG}g
                </div>
              </button>
            </li>
          ))}
        </ul>
        <button
          onClick={onClose}
          className="mt-3 self-end rounded border border-border-strong px-3 py-1 font-mono text-[10px] tracking-[0.18em] text-muted-foreground"
        >
          {t("library.closePanel")}
        </button>
      </div>
    </div>
  );
}

export function EditItemDialog({
  item,
  inLibrary,
  onClose,
  onSave,
  onDelete,
  onSaveToLibrary,
}: {
  item: Item;
  inLibrary: boolean;
  onClose: () => void;
  onSave: (patch: Partial<Item>) => void;
  onDelete?: () => void;
  onSaveToLibrary?: () => void;
}) {
  const { t, lang } = useI18n();
  const { library, trips } = usePacklog();
  const brandListId = useId();
  const brandOptions = useMemo(() => {
    const set = new Set<string>();
    for (const g of library) {
      const b = g.brand?.trim();
      if (b) set.add(b);
    }
    for (const tr of trips) {
      for (const c of tr.containers) {
        for (const it of c.items) {
          const b = it.brand?.trim();
          if (b) set.add(b);
        }
      }
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [library, trips]);
  const [name, setName] = useState(pickName(lang, item));
  const [brand, setBrand] = useState(item.brand ?? "");
  const [model, setModel] = useState(item.model ?? "");
  const [qty, setQty] = useState(item.qty);
  const [weight, setWeight] = useState<number>(item.weightG);
  const [category, setCategory] = useState<Item["category"]>(item.category);
  const [note, setNote] = useState(item.note ?? "");
  const [isWorn, setIsWorn] = useState(item.isWorn === true);
  const [isConsumable, setIsConsumable] = useState(item.isConsumable === true);
  const [savedToLib, setSavedToLib] = useState(inLibrary);
  const [estimateKind, setEstimateKind] = useState<null | "ai" | "community">(null);
  const [aiBand, setAiBand] = useState<{ low: number; high: number } | null>(null);
  const [communityN, setCommunityN] = useState<number | null>(null);
  const [aiBusy, setAiBusy] = useState(false);

  const cats: Item["category"][] = ["tech", "apparel", "doc", "health", "optic", "misc"];
  const isZh = /[\u4e00-\u9fa5]/.test(name);

  const slug = (s: string) =>
    s
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
      .replace(/^-|-$/g, "");

  useEffect(() => {
    setEstimateKind(null);
    setAiBand(null);
    setCommunityN(null);
    if (item.weightSource === "community_median" && item.communityMedianSampleCount != null) {
      setEstimateKind("community");
      setCommunityN(item.communityMedianSampleCount);
    } else if (
      item.weightSource === "ai_estimate" &&
      item.weightEstimateLowG != null &&
      item.weightEstimateHighG != null
    ) {
      setEstimateKind("ai");
      setAiBand({ low: item.weightEstimateLowG, high: item.weightEstimateHighG });
    }
  }, [item.id]); // eslint-disable-line react-hooks/exhaustive-deps -- tier UI only resets when switching rows

  useEffect(() => {
    setIsWorn(item.isWorn === true);
    setIsConsumable(item.isConsumable === true);
  }, [item.id, item.isWorn, item.isConsumable]);

  const cmPreview = useMemo(() => {
    const b = brand.trim();
    const m = model.trim();
    if (!b || !m) return null;
    const sku = `${slug(b)}:${slug(m)}`;
    return communityMedianWeight(library, trips, {
      sku,
      brand: b,
      model: m,
      category,
    });
  }, [brand, model, category, library, trips]);

  const applyAiEstimate = async () => {
    setAiBusy(true);
    try {
      const probe = [brand, model, name].filter(Boolean).join(" ").trim();
      const est = await resolveAiWeightEstimate({
        category,
        nameHint: probe || pickName(lang, item),
      });
      setWeight(est.midG);
      setEstimateKind("ai");
      setAiBand({ low: est.lowG, high: est.highG });
      setCommunityN(null);
    } finally {
      setAiBusy(false);
    }
  };

  const applyCommunityMedian = () => {
    const b = brand.trim();
    const m = model.trim();
    const trimmed = name.trim();
    if (!b || !m) return;
    const sku = `${slug(b)}:${slug(m)}`;
    const cm = communityMedianWeight(library, trips, {
      sku,
      brand: b,
      model: m,
      category,
    });
    if (!cm) return;
    setWeight(cm.medianG);
    setEstimateKind("community");
    setCommunityN(cm.n);
    setAiBand(null);
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const b = brand.trim();
    const m = model.trim();
    const sku =
      b && m
        ? `${slug(b)}:${slug(m)}`
        : b
          ? `${slug(b)}:${slug(trimmed)}`
          : `generic:${slug(trimmed)}`;

    const patch: Partial<Item> = {
      name: trimmed,
      nameEn: isZh ? item.nameEn : trimmed,
      nameZh: isZh ? trimmed : item.nameZh,
      brand: b || undefined,
      model: m || undefined,
      sku,
      qty: Math.max(1, qty),
      weightG: Math.max(1, weight),
      category,
      note: note.trim() || undefined,
      isWorn,
      isConsumable,
    };

    if (estimateKind === "community" && communityN != null) {
      patch.weightSource = "community_median";
      patch.communityMedianSampleCount = communityN;
      patch.weightEstimateLowG = undefined;
      patch.weightEstimateHighG = undefined;
    } else if (estimateKind === "ai" && aiBand) {
      patch.weightSource = "ai_estimate";
      patch.weightEstimateLowG = aiBand.low;
      patch.weightEstimateHighG = aiBand.high;
      patch.communityMedianSampleCount = undefined;
    } else {
      if (weight !== item.weightG) {
        patch.weightSource = "user";
        patch.weightEstimateLowG = undefined;
        patch.weightEstimateHighG = undefined;
        patch.communityMedianSampleCount = undefined;
      }
    }

    onSave(patch);
  };

  return (
    <div
      className="scrim fixed inset-0 z-50 grid touch-none place-items-center overscroll-none p-3 sm:p-4"
      onClick={onClose}
    >
      <form
        onSubmit={save}
        onClick={(e) => e.stopPropagation()}
        className="module corner-tick relative max-h-[min(90dvh,calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-2rem))] w-full max-w-md touch-pan-y space-y-3 overflow-y-auto overscroll-y-contain p-5"
      >
        <div className="flex items-center justify-between">
          <div className="font-mono text-[10px] tracking-[0.22em] text-signal">
            ✎ {t("item.edit.title")}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="font-mono text-[10px] text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>

        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("container.add.name")}
          className="w-full rounded border border-border-strong bg-background px-2 py-1.5 text-sm focus:border-signal focus:outline-none"
        />

        <div className="grid grid-cols-2 gap-2">
          <input
            list={brandListId}
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder={t("item.edit.brand")}
            className="rounded border border-border-strong bg-background px-2 py-1.5 text-sm focus:border-signal focus:outline-none"
          />
          <input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder={t("item.edit.model")}
            className="rounded border border-border-strong bg-background px-2 py-1.5 text-sm focus:border-signal focus:outline-none"
          />
        </div>
        <datalist id={brandListId}>
          {brandOptions.map((b) => (
            <option key={b} value={b} />
          ))}
        </datalist>

        {(() => {
          // Re-suggest from combined brand+model+name. If the suggested weight differs
          // from the current weight, surface a one-click apply chip.
          const probe = [brand, model, name].filter(Boolean).join(" ").trim();
          const hint = probe.length > 1 ? suggestFromName(probe) : null;
          if (!hint || hint.weightG === weight) return null;
          return (
            <button
              type="button"
              onClick={() => {
                setWeight(hint.weightG);
                setCategory(hint.category);
                const canonical = lang === "zh" ? hint.nameZh : hint.nameEn;
                if (canonical) setName(canonical);
              }}
              className="flex w-full items-center justify-between rounded border border-signal/40 bg-signal-soft/40 px-2 py-1.5 text-left font-mono text-[10px] hover:bg-signal-soft"
            >
              <span className="truncate text-foreground">
                <span className="text-signal">↳</span>{" "}
                {(lang === "zh" ? hint.nameZh : hint.nameEn) ?? probe}
                <span className="ml-1.5 text-muted-foreground">
                  · {hint.weightG}g · {t(`cat.${hint.category}`)}
                </span>
              </span>
              <span className="ml-2 shrink-0 tracking-[0.15em] text-signal">USE ↵</span>
            </button>
          );
        })()}

        <div className="grid grid-cols-12 gap-2">
          <input
            type="number"
            min={1}
            value={qty}
            onChange={(e) => setQty(+e.target.value)}
            placeholder={t("container.add.qty")}
            className="col-span-4 rounded border border-border-strong bg-background px-2 py-1.5 text-center font-mono text-sm focus:border-signal focus:outline-none"
          />
          <input
            type="number"
            min={1}
            value={weight}
            onChange={(e) => {
              setWeight(+e.target.value);
              setEstimateKind(null);
              setAiBand(null);
              setCommunityN(null);
            }}
            placeholder={t("container.add.weight")}
            className="col-span-8 rounded border border-border-strong bg-background px-2 py-1.5 text-right font-mono text-sm focus:border-signal focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={aiBusy}
            onClick={() => void applyAiEstimate()}
            className="rounded border border-border-strong bg-surface px-2 py-1 font-mono text-[10px] tracking-[0.15em] text-muted-foreground hover:border-signal hover:text-signal disabled:opacity-40"
          >
            {aiBusy ? "…" : t("weight.action.ai")}
          </button>
          <button
            type="button"
            disabled={!brand.trim() || !model.trim() || !cmPreview}
            onClick={applyCommunityMedian}
            title={cmPreview ? t("weight.community.applyTitle") : t("weight.community.needSamples")}
            className="rounded border border-border-strong bg-surface px-2 py-1 font-mono text-[10px] tracking-[0.15em] text-muted-foreground hover:border-signal hover:text-signal disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t("weight.action.community")}
          </button>
        </div>
        <p className="font-mono text-[10px] leading-relaxed text-muted-foreground">
          {brand.trim() && model.trim()
            ? cmPreview
              ? t("weight.community.preview")
                  .replace("{n}", String(cmPreview.n))
                  .replace("{g}", String(cmPreview.medianG))
              : t("weight.community.needSamples")
            : t("weight.community.needBrandModel")}
        </p>

        <div className="flex flex-wrap items-center gap-1">
          {cats.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded border px-2 py-0.5 font-mono text-[10px] tracking-[0.15em] ${
                category === c
                  ? "border-signal bg-signal text-signal-foreground"
                  : "border-border-strong text-muted-foreground hover:text-foreground"
              }`}
            >
              {t(`cat.${c}`)}
            </button>
          ))}
        </div>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t("item.edit.note")}
          rows={2}
          className="w-full resize-none rounded border border-border-strong bg-background px-2 py-1.5 text-sm focus:border-signal focus:outline-none"
        />

        <div className="flex flex-col gap-2 rounded border border-border-strong bg-surface/40 px-2 py-2">
          <label className="flex cursor-pointer items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={isWorn}
              onChange={(e) => setIsWorn(e.target.checked)}
              className="h-4 w-4 accent-[var(--signal)]"
            />
            <span>{t("item.edit.worn")}</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={isConsumable}
              onChange={(e) => setIsConsumable(e.target.checked)}
              className="h-4 w-4 accent-[var(--signal)]"
            />
            <span>{t("item.edit.consumable")}</span>
          </label>
        </div>

        {onSaveToLibrary && (
          <button
            type="button"
            disabled={savedToLib}
            onClick={() => {
              onSaveToLibrary();
              setSavedToLib(true);
            }}
            className={`flex w-full items-center justify-center rounded border px-2 py-1.5 font-mono text-[10px] tracking-[0.15em] transition ${
              savedToLib
                ? "border-success/50 bg-success/10 text-success"
                : "border-signal/50 bg-signal-soft/40 text-signal hover:bg-signal-soft"
            }`}
          >
            {savedToLib ? t("item.edit.inLib") : t("item.edit.toLib")}
          </button>
        )}

        <div className="flex justify-between gap-2 pt-1">
          {onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              className="rounded border border-destructive/50 px-3 py-1 font-mono text-[10px] tracking-[0.18em] text-destructive hover:bg-destructive/10"
            >
              {t("item.edit.delete")}
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-border-strong px-3 py-1 font-mono text-[10px] tracking-[0.18em] text-muted-foreground hover:text-foreground"
            >
              {t("container.add.cancel")}
            </button>
            <button
              type="submit"
              className="rounded border border-signal bg-signal px-3 py-1 font-mono text-[10px] tracking-[0.18em] text-signal-foreground hover:opacity-90"
            >
              {t("item.edit.save")}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
