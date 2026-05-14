import { useEffect, useMemo, useState } from "react";
import type { Item, LifecyclePhase, Trip } from "@/lib/packlog-data";
import { ItemWeightLabel } from "@/components/packlog/ItemWeightLabel";
import { AddGearForm, EditItemDialog } from "@/components/packlog/ContainerModule";
import { useAuth } from "@/lib/auth-context";
import { useI18n, pickName } from "@/lib/i18n";
import { formatKgFromGrams } from "@/lib/weight-provenance";
import { containerDisplayLabel } from "@/lib/container-label";
import { preferredContainerIdForCategory } from "@/lib/preferred-container-for-category";
import {
  POOL_SEED_MIME,
  filterSeedsNotInTrip,
  mergedScenarioSeedsForTrip,
  poolSeedToItemDraft,
} from "@/lib/packing-pool";
import type { SeedItem } from "@/lib/scenario-templates";
import type { PackViewFilter } from "@/lib/pack-view-filter";
import { itemMatchesPackViewFilter } from "@/lib/pack-view-filter";

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

const CATEGORY_SECTION_ORDER: Item["category"][] = [
  "doc",
  "health",
  "apparel",
  "tech",
  "optic",
  "misc",
];

type ItemWithCtx = Item & { _containerId: string };

export function PackChecklistPanel({
  trip,
  phase,
  tripId,
  onToggle,
  onCycleOwnership,
  onRemove,
  onMoveItem,
  onUpdate,
  onAddToContainer,
  onSaveToLibrary,
  isInLibrary,
  packViewFilter = "all",
}: {
  trip: Trip;
  phase: LifecyclePhase;
  tripId: string;
  onToggle: (containerId: string, itemId: string) => void;
  onCycleOwnership: (containerId: string, itemId: string) => void;
  onRemove: (containerId: string, itemId: string) => void;
  onMoveItem: (fromContainerId: string, itemId: string, toContainerId: string) => void;
  onUpdate: (containerId: string, itemId: string, patch: Partial<Item>) => void;
  onAddToContainer: (containerId: string, draft: Omit<Item, "id">) => void;
  onSaveToLibrary: (item: Item) => void;
  isInLibrary: (item: Item) => boolean;
  packViewFilter?: PackViewFilter;
}) {
  const { t, lang } = useI18n();
  const { requestAuth } = useAuth();
  const [bagFilter, setBagFilter] = useState<string>("all");
  const [editing, setEditing] = useState<{ cid: string; item: Item } | null>(null);
  const [adding, setAdding] = useState<{
    containerId: string;
    category: Item["category"];
    source: "section" | "footer";
  } | null>(null);

  /** Bag filter changes the target container; dismiss inline add to avoid a stale target. */
  useEffect(() => {
    setAdding(null);
  }, [bagFilter]);

  const defaultContainerId = trip.containers[0]?.id ?? "";

  const { itemsByCategory, seedsByCategory, unaddedCount } = useMemo(() => {
    const itemsByCategory: Partial<Record<Item["category"], ItemWithCtx[]>> = {};
    trip.containers.forEach((c) => {
      if (bagFilter !== "all" && c.id !== bagFilter) return;
      c.items.forEach((it) => {
        if (!itemMatchesPackViewFilter(it, packViewFilter)) return;
        const list = itemsByCategory[it.category] ?? [];
        list.push({ ...it, _containerId: c.id });
        itemsByCategory[it.category] = list;
      });
    });

    const merged = mergedScenarioSeedsForTrip(trip);
    const unadded = filterSeedsNotInTrip(trip, merged);
    const seedsByCategory: Partial<Record<Item["category"], SeedItem[]>> = {};
    const showSeeds = packViewFilter === "all" || packViewFilter === "todo";
    if (showSeeds) {
      for (const s of unadded) {
        const list = seedsByCategory[s.category] ?? [];
        list.push(s);
        seedsByCategory[s.category] = list;
      }
    }

    return {
      itemsByCategory,
      seedsByCategory,
      unaddedCount: showSeeds ? unadded.length : 0,
    };
  }, [trip, bagFilter, packViewFilter]);

  if (phase === "REVIEW") return null;

  return (
    <section id="pack-checklist" className="module corner-tick relative scroll-mt-28 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="font-mono text-[10px] tracking-[0.22em] text-signal">
            {t("packChecklist.kicker")}
          </div>
          <h2 className="mt-1 font-display text-xl leading-tight">{t("packChecklist.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("packChecklist.subtitle")}</p>
        </div>
        <div className="flex shrink-0 flex-col gap-1 sm:items-end">
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
            {t("categoryView.filterLabel")}
          </span>
          <select
            value={bagFilter}
            onChange={(e) => setBagFilter(e.target.value)}
            className="max-w-full rounded-md border border-border-strong bg-background px-2 py-1.5 font-mono text-[11px]"
          >
            <option value="all">{t("categoryView.filterAll")}</option>
            {trip.containers.map((c) => (
              <option key={c.id} value={c.id}>
                {containerDisplayLabel(c, lang, t)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {unaddedCount > 0 ? (
        <p className="mt-2 font-mono text-[10px] text-muted-foreground">
          {t("pool.unaddedBadge").replace("{n}", String(unaddedCount))}
        </p>
      ) : null}

      <p className="mt-3 text-[11px] leading-snug text-muted-foreground">
        {t("packChecklist.hint")}
      </p>

      <div className="mt-4 space-y-3">
        {CATEGORY_SECTION_ORDER.map((cat) => {
          const tripItems = itemsByCategory[cat] ?? [];
          const seeds = seedsByCategory[cat] ?? [];
          const tripG = tripItems.reduce((s, i) => s + i.weightG * i.qty, 0);
          const seedG = seeds.reduce((s, sd) => s + sd.weightG * (sd.qty ?? 1), 0);
          const catKg = formatKgFromGrams(tripG + seedG);
          const addTargetId =
            bagFilter !== "all"
              ? bagFilter
              : (preferredContainerIdForCategory(trip, cat) ?? defaultContainerId);
          return (
            <details key={cat} className="rounded-md border border-border bg-surface/40" open>
              <summary className="cursor-pointer select-none px-3 py-2 font-mono text-[11px] tracking-[0.14em] text-signal hover:bg-surface-2">
                {t(`cat.${cat}`)}
                <span className="ml-2 text-muted-foreground">
                  ({tripItems.length + seeds.length}) · {catKg}kg
                </span>
              </summary>
              <ul className="space-y-1 border-t border-border px-2 py-2">
                {tripItems.map((it) => (
                  <li
                    key={it.id}
                    className="grid grid-cols-1 gap-2 rounded-sm border border-transparent px-2 py-1.5 hover:border-border hover:bg-surface-2 sm:grid-cols-[minmax(0,1fr)_minmax(17.5rem,17.5rem)] sm:items-center sm:gap-3"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onToggle(it._containerId, it.id)}
                        className={`h-4 w-4 shrink-0 rounded-sm border ${
                          it.status === "packed"
                            ? "border-signal bg-signal"
                            : "border-border-strong bg-background"
                        }`}
                      >
                        {it.status === "packed" && (
                          <span className="block text-center font-mono text-[9px] text-signal-foreground">
                            ✓
                          </span>
                        )}
                      </button>
                      <span
                        className="h-2 w-2 shrink-0 rounded-[1px]"
                        style={{ background: catColor[it.category] }}
                      />
                      <button
                        type="button"
                        onClick={() => setEditing({ cid: it._containerId, item: it })}
                        className="min-w-0 flex-1 truncate text-left font-mono text-[12px] hover:text-signal"
                      >
                        {pickName(lang, it)}
                        <span className="ml-1 font-mono text-[9px] text-signal opacity-70">✎</span>
                      </button>
                      <span className="shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground">
                        ×{it.qty} <ItemWeightLabel item={it} className="inline text-[10px]" />
                      </span>
                    </div>
                    <div className="flex w-full max-w-full shrink-0 flex-wrap items-center justify-start gap-2 justify-self-stretch pl-8 sm:flex-nowrap sm:justify-end sm:pl-0">
                      <select
                        value={it._containerId}
                        onChange={(e) => {
                          const to = e.target.value;
                          if (to !== it._containerId) onMoveItem(it._containerId, it.id, to);
                        }}
                        className="w-full shrink-0 rounded border border-border-strong bg-background px-2 py-1 font-mono text-[10px] sm:w-[11rem] sm:min-w-[11rem] sm:flex-none"
                        aria-label={t("categoryView.pickBag")}
                      >
                        {trip.containers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {containerDisplayLabel(c, lang, t)}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => onCycleOwnership(it._containerId, it.id)}
                        className="rounded border px-1.5 py-0.5 font-mono text-[9px]"
                        style={{
                          borderColor: ownColor[it.ownership],
                          color: ownColor[it.ownership],
                        }}
                      >
                        {t(`own.${it.ownership}`)}
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemove(it._containerId, it.id)}
                        className="font-mono text-[10px] text-muted-foreground hover:text-destructive"
                      >
                        ✕
                      </button>
                    </div>
                  </li>
                ))}

                {seeds.map((seed) => (
                  <li
                    key={seed.en}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData(POOL_SEED_MIME, JSON.stringify(seed));
                      e.dataTransfer.effectAllowed = "copy";
                    }}
                    className="grid grid-cols-1 gap-2 rounded-sm border border-dashed border-border px-2 py-1.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-3"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-2 w-2 shrink-0 rounded-[1px]"
                        style={{ background: catColor[seed.category] }}
                      />
                      <span className="min-w-0 flex-1 truncate font-mono text-[12px] text-muted-foreground">
                        {pickName(lang, { nameEn: seed.en, nameZh: seed.zh, name: seed.en })}
                      </span>
                      <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                        {seed.weightG}g{seed.qty && seed.qty > 1 ? ` ×${seed.qty}` : ""}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 pl-8 sm:flex-nowrap sm:justify-end sm:pl-0">
                      {trip.containers.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          className="rounded border border-border bg-background px-2 py-0.5 font-mono text-[10px] hover:border-signal hover:bg-signal-soft"
                          onClick={() => onAddToContainer(c.id, poolSeedToItemDraft(seed))}
                        >
                          {containerDisplayLabel(c, lang, t)}
                        </button>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
              {addTargetId ? (
                <div className="border-t border-border px-2 py-2">
                  {!(
                    adding?.source === "section" &&
                    adding.category === cat &&
                    adding.containerId === addTargetId
                  ) ? (
                    <button
                      type="button"
                      onClick={() =>
                        setAdding({ containerId: addTargetId, category: cat, source: "section" })
                      }
                      className="w-full rounded-md border border-dashed border-border-strong py-2 font-mono text-[10px] tracking-[0.16em] text-muted-foreground hover:border-signal hover:bg-signal-soft hover:text-signal"
                    >
                      {t("packChecklist.addInCategory")}
                    </button>
                  ) : null}
                  {adding?.source === "section" &&
                  adding.category === cat &&
                  adding.containerId === addTargetId ? (
                    <div className="mt-2 rounded-md border border-signal/45 bg-surface-2/90 p-3">
                      <div className="mb-2 font-mono text-[10px] tracking-[0.18em] text-signal">
                        {t("container.add")} →{" "}
                        {containerDisplayLabel(
                          trip.containers.find((c) => c.id === adding.containerId) ??
                            trip.containers[0]!,
                          lang,
                          t,
                        )}
                        <span className="text-muted-foreground">
                          {" "}
                          · {t(`cat.${adding.category}`)}
                        </span>
                      </div>
                      <AddGearForm
                        key={`${adding.containerId}-${adding.category}-section`}
                        initialCategory={adding.category}
                        onCancel={() => setAdding(null)}
                        onCommit={(draft) => {
                          onAddToContainer(adding.containerId, draft);
                          setAdding(null);
                        }}
                      />
                    </div>
                  ) : null}
                </div>
              ) : null}
            </details>
          );
        })}
      </div>

      {defaultContainerId ? (
        <div id="pack-checklist-add" className="mt-4 scroll-mt-28 border-t border-border pt-4">
          {!(adding?.source === "footer") ? (
            <button
              type="button"
              onClick={() =>
                setAdding({
                  containerId: bagFilter !== "all" ? bagFilter : defaultContainerId,
                  category: "misc",
                  source: "footer",
                })
              }
              className="w-full rounded-md border border-dashed border-border-strong py-2.5 font-mono text-[11px] tracking-[0.18em] text-muted-foreground hover:border-signal hover:bg-signal-soft hover:text-signal"
            >
              {t("packChecklist.addCustom")}
            </button>
          ) : null}
          {adding?.source === "footer" ? (
            <div className="mt-2 rounded-md border border-signal/45 bg-surface-2/90 p-3">
              <div className="mb-2 font-mono text-[10px] tracking-[0.18em] text-signal">
                {t("container.add")} →{" "}
                {containerDisplayLabel(
                  trip.containers.find((c) => c.id === adding.containerId) ?? trip.containers[0]!,
                  lang,
                  t,
                )}
                <span className="text-muted-foreground"> · {t(`cat.${adding.category}`)}</span>
              </div>
              <AddGearForm
                key={`${adding.containerId}-${adding.category}-footer`}
                initialCategory={adding.category}
                onCancel={() => setAdding(null)}
                onCommit={(draft) => {
                  onAddToContainer(adding.containerId, draft);
                  setAdding(null);
                }}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {editing ? (
        <EditItemDialog
          item={editing.item}
          inLibrary={isInLibrary(editing.item)}
          onClose={() => setEditing(null)}
          onSave={(patch) => {
            onUpdate(editing.cid, editing.item.id, patch);
            setEditing(null);
          }}
          onDelete={() => {
            onRemove(editing.cid, editing.item.id);
            setEditing(null);
          }}
          onSaveToLibrary={() => {
            const it = editing.item;
            requestAuth(() => onSaveToLibrary(it), {
              v: 1,
              kind: "saveItemToLibrary",
              tripId,
              containerId: editing.cid,
              itemId: it.id,
            });
          }}
        />
      ) : null}
    </section>
  );
}
