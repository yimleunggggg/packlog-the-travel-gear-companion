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
  packlogItemName,
  packlogItemWeight,
  packlogSectionTitle,
} from "@/lib/packlog-button-classes";
import { cn } from "@/lib/utils";
import {
  defaultItemCategoryForPackDisplayGroup,
  itemPackDisplayGroup,
  packDisplayGroupLabel,
  packGroupOrder,
  type PackDisplayGroup,
} from "@/lib/pack-display-groups";
import {
  POOL_SEED_MIME,
  filterSeedsNotInTrip,
  mergedScenarioSeedsForTrip,
  poolSeedToItemDraft,
} from "@/lib/packing-pool";
import type { SeedItem } from "@/lib/scenario-templates";
import type { PackViewFilter } from "@/lib/pack-view-filter";
import { itemMatchesPackViewFilter } from "@/lib/pack-view-filter";
import { isUnassignedContainer, unassignedContainerId } from "@/lib/unassigned-container";
import { PACKLOG_CATEGORY_HEX } from "@/lib/packlog-category-colors";

const ownColor: Record<Item["ownership"], string> = {
  owned: "var(--success)",
  wishlist: "var(--info)",
  borrowed: "var(--warn)",
  undecided: "var(--muted-foreground)",
};

type ItemWithCtx = Item & { _containerId: string };

export function PackChecklistPanel({
  trip,
  phase,
  tripId,
  onToggle,
  onSetOwnership,
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
  onSetOwnership: (containerId: string, itemId: string, ownership: Item["ownership"]) => void;
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
  const [expanded, setExpanded] = useState<{ cid: string; id: string } | null>(null);
  const [editing, setEditing] = useState<{ cid: string; item: Item } | null>(null);
  const [adding, setAdding] = useState<{
    containerId: string;
    category: Item["category"];
    packDisplayGroup?: PackDisplayGroup;
    source: "section" | "footer";
  } | null>(null);

  /** Bag filter changes the target container; dismiss inline add to avoid a stale target. */
  useEffect(() => {
    setAdding(null);
    setExpanded(null);
  }, [bagFilter]);

  /** 打开「添加装备」时滚到表单附近，减少键盘弹出后版面半截不可见 */
  useEffect(() => {
    if (!adding) return;
    const sel = adding.source === "section" ? "[data-pack-inline-add]" : "[data-pack-footer-add]";
    const id = requestAnimationFrame(() => {
      document.querySelector(sel)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
    return () => cancelAnimationFrame(id);
  }, [adding]);

  const defaultContainerId = trip.containers[0]?.id ?? "";

  const {
    itemsByPackGroup,
    seedsByPackGroup,
    unaddedCount,
    unassignedItems,
    groupStatsByPackGroup,
  } = useMemo(() => {
    const itemsByPackGroup: Partial<Record<PackDisplayGroup, ItemWithCtx[]>> = {};
    const groupStatsByPackGroup: Partial<
      Record<PackDisplayGroup, { n: number; totalG: number; packedG: number }>
    > = {};
    const bumpStats = (g: PackDisplayGroup, it: Item) => {
      const line = it.weightG * it.qty;
      const cur = groupStatsByPackGroup[g] ?? { n: 0, totalG: 0, packedG: 0 };
      cur.n += 1;
      cur.totalG += line;
      if (it.status === "packed") cur.packedG += line;
      groupStatsByPackGroup[g] = cur;
    };
    const unassignedId = unassignedContainerId(tripId);
    const unassignedItems: ItemWithCtx[] = [];
    trip.containers.forEach((c) => {
      if (isUnassignedContainer(c, tripId)) {
        if (bagFilter === "all") {
          c.items.forEach((it) => bumpStats(itemPackDisplayGroup(trip, it), it));
          c.items.forEach((it) => {
            if (!itemMatchesPackViewFilter(it, packViewFilter)) return;
            unassignedItems.push({ ...it, _containerId: unassignedId });
          });
        }
        return;
      }
      if (bagFilter !== "all" && c.id !== bagFilter) return;
      c.items.forEach((it) => bumpStats(itemPackDisplayGroup(trip, it), it));
      c.items.forEach((it) => {
        if (!itemMatchesPackViewFilter(it, packViewFilter)) return;
        const g = itemPackDisplayGroup(trip, it);
        const list = itemsByPackGroup[g] ?? [];
        list.push({ ...it, _containerId: c.id });
        itemsByPackGroup[g] = list;
      });
    });

    const merged = mergedScenarioSeedsForTrip(trip);
    const unadded = filterSeedsNotInTrip(trip, merged);
    const seedsByPackGroup: Partial<Record<PackDisplayGroup, SeedItem[]>> = {};
    const showSeeds = packViewFilter === "all" || packViewFilter === "todo";
    if (showSeeds) {
      for (const s of unadded) {
        const g = itemPackDisplayGroup(trip, {
          name: s.en,
          nameEn: s.en,
          nameZh: s.zh,
          category: s.category,
        });
        const list = seedsByPackGroup[g] ?? [];
        list.push(s);
        seedsByPackGroup[g] = list;
      }
    }

    return {
      itemsByPackGroup,
      seedsByPackGroup,
      unaddedCount: showSeeds ? unadded.length : 0,
      unassignedItems,
      groupStatsByPackGroup,
    };
  }, [trip, tripId, bagFilter, packViewFilter]);

  if (phase === "REVIEW") return null;

  return (
    <section id="pack-checklist" className="module corner-tick relative scroll-mt-28 p-4 md:p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-6">
        <div className="min-w-0">
          <div className="font-mono text-[10px] tracking-[0.22em] text-signal">
            {t("packChecklist.kicker")}
          </div>
          <h2 className={cn("mt-1", packlogSectionTitle)}>{t("packChecklist.title")}</h2>
          {t("packChecklist.subtitle").trim() ? (
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground md:text-sm">
              {t("packChecklist.subtitle")}
            </p>
          ) : null}
        </div>
        <div className="flex w-full shrink-0 flex-col gap-1.5 md:w-auto md:items-end">
          <span className="text-xs font-medium text-foreground/80 md:font-mono md:text-[9px] md:uppercase md:tracking-[0.18em] md:text-muted-foreground">
            {t("categoryView.filterLabel")}
          </span>
          <select
            value={bagFilter}
            onChange={(e) => setBagFilter(e.target.value)}
            className="min-h-11 w-full max-w-full rounded-md border border-border-strong bg-background px-3 py-2.5 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/35 md:min-h-0 md:min-w-[12rem] md:py-1.5 md:font-mono md:text-[11px]"
          >
            <option value="all">{t("categoryView.filterAll")}</option>
            {trip.containers
              .filter((c) => !isUnassignedContainer(c, tripId))
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {containerDisplayLabel(c, lang, t)}
                </option>
              ))}
          </select>
        </div>
      </div>

      {unaddedCount > 0 ? (
        <p className="mt-3 text-xs leading-snug text-muted-foreground md:font-mono md:text-[10px]">
          {t("pool.unaddedBadge").replace("{n}", String(unaddedCount))}
        </p>
      ) : null}

      {t("packChecklist.hint").trim() ? (
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground md:text-[11px]">
          {t("packChecklist.hint")}
        </p>
      ) : null}

      <div className="mt-4 space-y-3">
        {packGroupOrder(trip).map((groupKey) => {
          const tripItems = itemsByPackGroup[groupKey] ?? [];
          const seeds = seedsByPackGroup[groupKey] ?? [];
          if (tripItems.length + seeds.length === 0) return null;
          const st = groupStatsByPackGroup[groupKey];
          const packedG = st?.packedG ?? 0;
          const listedTripG = st?.totalG ?? 0;
          const nListed = (st?.n ?? 0) + seeds.length;
          const seedG = seeds.reduce((s, sd) => s + sd.weightG * (sd.qty ?? 1), 0);
          const packedKg = formatKgFromGrams(packedG);
          const listedKg = formatKgFromGrams(listedTripG + seedG);
          const defaultCat = defaultItemCategoryForPackDisplayGroup(groupKey);
          const addTargetId =
            bagFilter !== "all"
              ? bagFilter
              : (preferredContainerIdForCategory(trip, defaultCat) ?? defaultContainerId);
          return (
            <details key={groupKey} className="rounded-md border border-border bg-surface/40" open>
              <summary className="cursor-pointer select-none px-3 py-3 hover:bg-surface-2 md:py-2 [&::-webkit-details-marker]:hidden">
                <span className="block text-[0.9375rem] font-semibold leading-snug text-foreground md:inline md:font-mono md:text-[11px] md:font-normal md:tracking-[0.14em] md:text-signal">
                  {packDisplayGroupLabel(t, groupKey)}
                </span>
                <span className="mt-1 block text-xs leading-snug text-muted-foreground md:mt-0 md:ml-2 md:inline md:font-mono md:text-[11px] md:tracking-[0.1em]">
                  {t("packChecklist.groupWeightSummary")
                    .replace("{n}", String(nListed))
                    .replace("{packed}", packedKg)
                    .replace("{listed}", listedKg)}
                </span>
              </summary>
              <ul className="space-y-1.5 border-t border-border px-2 py-2 md:space-y-1">
                {tripItems.map((it) => {
                  const bagLabel = containerDisplayLabel(
                    trip.containers.find((c) => c.id === it._containerId) ?? trip.containers[0]!,
                    lang,
                    t,
                  );
                  const isOpen = expanded?.cid === it._containerId && expanded?.id === it.id;
                  const brandLine = [it.brand, it.model].filter(Boolean).join(" ").trim();
                  return (
                    <li
                      key={it.id}
                      className="rounded-md border border-transparent hover:border-border/80 hover:bg-surface-2/25"
                    >
                      <div className="flex w-full items-stretch max-md:min-h-[3.25rem] md:max-h-14">
                        <div
                          className="flex w-[3rem] shrink-0 items-center justify-center touch-manipulation sm:w-11"
                          onClick={(e) => e.stopPropagation()}
                          onPointerDown={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            aria-checked={it.status === "packed"}
                            role="checkbox"
                            onClick={() => onToggle(it._containerId, it.id)}
                            className={cn(
                              "flex h-12 w-12 shrink-0 items-center justify-center rounded-md border transition active:scale-[0.98] sm:h-11 sm:w-11",
                              it.status === "packed"
                                ? "border-signal bg-signal"
                                : "border-border-strong bg-background",
                            )}
                          >
                            {it.status === "packed" && (
                              <span className="font-mono text-[13px] leading-none text-signal-foreground">
                                ✓
                              </span>
                            )}
                          </button>
                        </div>
                        <div className="flex min-h-0 min-w-0 flex-1 flex-col justify-center py-1.5 pr-2 md:py-0 md:pr-1">
                          <button
                            type="button"
                            onClick={() =>
                              setExpanded((cur) =>
                                cur?.cid === it._containerId && cur?.id === it.id
                                  ? null
                                  : { cid: it._containerId, id: it.id },
                              )
                            }
                            className={cn(
                              "flex w-full min-w-0 flex-col gap-1.5 text-left outline-none",
                              "rounded-md py-1 hover:bg-surface-2/40 focus-visible:ring-2 focus-visible:ring-signal/40",
                              "md:flex-row md:flex-nowrap md:items-center md:gap-2 md:py-0.5 md:max-h-14 md:overflow-hidden",
                            )}
                          >
                            <span className="flex min-w-0 items-center gap-2 md:max-w-[50%] md:shrink-0">
                              <span
                                className="h-2 w-2 shrink-0 rounded-[1px]"
                                style={{ background: PACKLOG_CATEGORY_HEX[it.category] }}
                                aria-hidden
                              />
                              <span className={cn(packlogItemName, "min-w-0 truncate")}>
                                {pickName(lang, it)}
                              </span>
                            </span>
                            <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1 pl-0 md:ml-auto md:flex-nowrap md:justify-end md:pl-0">
                              <span
                                className={cn(
                                  packlogItemWeight,
                                  "inline-flex shrink-0 items-baseline gap-1 whitespace-nowrap tabular-nums",
                                )}
                              >
                                ×{it.qty}{" "}
                                <ItemWeightLabel
                                  item={it}
                                  className="inline text-[0.8125rem] leading-none md:text-[11px]"
                                />
                              </span>
                              <span className="min-w-0 text-xs leading-snug text-muted-foreground md:max-w-[10rem] md:truncate md:font-mono md:text-[10px] md:leading-tight">
                                <span className="text-foreground/75">{bagLabel}</span>
                                <span className="mx-1 text-border-strong" aria-hidden>
                                  ·
                                </span>
                                <span>{t(`own.${it.ownership}`)}</span>
                              </span>
                            </div>
                          </button>
                          {isOpen ? (
                            <div className="mb-2 mt-1 space-y-2 rounded-md border border-border bg-surface-2/70 px-3 py-2.5">
                              <div>
                                <div className="text-[11px] font-medium tracking-wide text-muted-foreground md:font-mono md:text-[9px] md:tracking-[0.12em]">
                                  {t("packChecklist.row.place")}
                                </div>
                                <div className="mt-1.5 flex flex-wrap gap-1.5">
                                  {trip.containers.map((c) => {
                                    const active = c.id === it._containerId;
                                    const label = containerDisplayLabel(c, lang, t);
                                    return (
                                      <button
                                        key={c.id}
                                        type="button"
                                        title={label}
                                        onClick={() => {
                                          if (!active) {
                                            onMoveItem(it._containerId, it.id, c.id);
                                            setExpanded((cur) =>
                                              cur?.id === it.id ? { cid: c.id, id: it.id } : cur,
                                            );
                                          }
                                        }}
                                        className={cn(
                                          "min-h-10 max-w-[11rem] truncate rounded-md border px-3 py-2 text-xs transition md:min-h-0 md:max-w-[9rem] md:px-2 md:py-1 md:font-mono md:text-[9px] md:tracking-[0.06em]",
                                          active
                                            ? "border-signal bg-signal text-signal-foreground"
                                            : "border-border-strong bg-transparent text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                                        )}
                                      >
                                        {active ? `${label} ✓` : label}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                              <div className="border-t border-border pt-2">
                                <div className="text-[11px] font-medium tracking-wide text-muted-foreground md:font-mono md:text-[9px] md:tracking-[0.12em]">
                                  {t("packChecklist.row.status")}
                                </div>
                                <div className="mt-1.5 flex flex-wrap gap-1.5">
                                  {(["owned", "wishlist", "borrowed", "undecided"] as const).map(
                                    (o) => {
                                      const activeOwn = it.ownership === o;
                                      return (
                                        <button
                                          key={o}
                                          type="button"
                                          onClick={() => {
                                            if (!activeOwn)
                                              onSetOwnership(it._containerId, it.id, o);
                                          }}
                                          className={cn(
                                            "min-h-10 rounded-md border px-3 py-2 text-xs md:min-h-0 md:px-2 md:py-1 md:font-mono md:text-[9px]",
                                            activeOwn &&
                                              (o === "owned"
                                                ? "border-success/90 bg-transparent text-[color:var(--success)]"
                                                : "border-signal bg-signal-soft text-foreground"),
                                            !activeOwn &&
                                              "border-border-strong bg-transparent text-muted-foreground hover:text-foreground",
                                          )}
                                          style={
                                            !activeOwn
                                              ? { borderColor: ownColor[o], color: ownColor[o] }
                                              : undefined
                                          }
                                        >
                                          {activeOwn ? `${t(`own.${o}`)} ✓` : t(`own.${o}`)}
                                        </button>
                                      );
                                    },
                                  )}
                                </div>
                              </div>
                              <div className="border-t border-border pt-2 font-mono text-[11px]">
                                <span className="text-[9px] tracking-[0.1em] text-muted-foreground">
                                  {t("packChecklist.row.brand")}
                                </span>{" "}
                                <span className="text-foreground">{brandLine || "—"}</span>
                              </div>
                              <div className="border-t border-border pt-2">
                                <div className="font-mono text-[9px] tracking-[0.12em] text-muted-foreground">
                                  {t("packChecklist.row.note")}
                                </div>
                                <input
                                  key={`${it.id}-note-${it.note ?? ""}`}
                                  defaultValue={it.note ?? ""}
                                  placeholder={t("packChecklist.row.notePlaceholder")}
                                  className="mt-1 w-full rounded border border-border-strong bg-background px-2 py-1.5 font-mono text-[11px] outline-none focus:border-[#C8956C]"
                                  onClick={(e) => e.stopPropagation()}
                                  onBlur={(e) => {
                                    const v = e.currentTarget.value.trim();
                                    const prev = (it.note ?? "").trim();
                                    if (v !== prev) {
                                      onUpdate(it._containerId, it.id, { note: v || undefined });
                                    }
                                  }}
                                />
                              </div>
                              <div className="flex flex-col gap-2 border-t border-border pt-2 sm:flex-row sm:justify-end">
                                <button
                                  type="button"
                                  className="min-h-10 rounded-md border border-border-strong px-3 py-2 text-sm text-muted-foreground hover:border-foreground/25 hover:text-foreground md:min-h-0 md:px-2 md:py-1 md:font-mono md:text-[10px]"
                                  onClick={() => setEditing({ cid: it._containerId, item: it })}
                                >
                                  {t("packChecklist.row.edit")}
                                </button>
                                <button
                                  type="button"
                                  className="min-h-10 rounded-md border border-border-strong px-3 py-2 text-sm text-muted-foreground hover:border-destructive hover:text-destructive md:min-h-0 md:px-2 md:py-1 md:font-mono md:text-[10px]"
                                  onClick={() => onRemove(it._containerId, it.id)}
                                >
                                  {t("item.edit.delete")}
                                </button>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </li>
                  );
                })}

                {seeds.map((seed) => (
                  <li
                    key={seed.en}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData(POOL_SEED_MIME, JSON.stringify(seed));
                      e.dataTransfer.effectAllowed = "copy";
                    }}
                    className="flex flex-col gap-2 rounded-md border border-dashed border-border px-2 py-3 md:flex-row md:items-center md:gap-2 md:overflow-x-auto md:py-1.5 md:max-h-16"
                  >
                    <div className="flex min-h-[44px] min-w-0 items-center gap-2 md:min-h-0">
                      <span
                        className="h-2 w-2 shrink-0 rounded-[1px]"
                        style={{ background: PACKLOG_CATEGORY_HEX[seed.category] }}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground md:max-w-[50%] md:shrink-0 md:font-mono md:text-[12px] md:font-normal md:text-muted-foreground">
                        {pickName(lang, { nameEn: seed.en, nameZh: seed.zh, name: seed.en })}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2 border-t border-border/70 pt-2 md:flex-1 md:flex-row md:items-center md:justify-end md:gap-2 md:border-t-0 md:pt-0">
                      <span className="shrink-0 whitespace-nowrap font-mono text-sm tabular-nums text-muted-foreground md:text-[11px]">
                        {seed.weightG}g{seed.qty && seed.qty > 1 ? ` ×${seed.qty}` : ""}
                      </span>
                      <div
                        className="flex flex-wrap justify-stretch gap-1.5 md:max-w-[min(42%,11rem)] md:shrink-0 md:justify-end"
                        onClick={(e) => e.stopPropagation()}
                        role="presentation"
                      >
                        {trip.containers.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            className="min-h-10 min-w-[5.5rem] flex-1 truncate rounded-md border border-border bg-background px-2 py-2 text-xs font-medium text-foreground hover:border-foreground/25 hover:bg-surface-2 sm:flex-none md:min-h-0 md:min-w-0 md:max-w-[5.5rem] md:px-1.5 md:py-1 md:font-mono md:text-[9px] md:font-normal"
                            onClick={() => onAddToContainer(c.id, poolSeedToItemDraft(seed))}
                          >
                            {containerDisplayLabel(c, lang, t)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              {addTargetId ? (
                <div className="border-t border-border px-2 py-2">
                  {!(
                    adding?.source === "section" &&
                    adding.packDisplayGroup === groupKey &&
                    adding.containerId === addTargetId
                  ) ? (
                    <button
                      type="button"
                      onClick={() =>
                        setAdding({
                          containerId: addTargetId,
                          category: defaultCat,
                          packDisplayGroup: groupKey,
                          source: "section",
                        })
                      }
                      className="min-h-12 w-full rounded-md border border-dashed border-border-strong px-3 py-3 text-sm font-medium text-muted-foreground hover:border-foreground/25 hover:bg-surface-2 hover:text-foreground md:min-h-0 md:py-2 md:font-mono md:text-[10px] md:font-normal md:tracking-[0.16em]"
                    >
                      {t("packChecklist.addInCategory")}
                    </button>
                  ) : null}
                  {adding?.source === "section" &&
                  adding.packDisplayGroup === groupKey &&
                  adding.containerId === addTargetId ? (
                    <div
                      className="mt-2 rounded-lg border border-signal/40 bg-surface p-4 shadow-sm md:rounded-md md:border-signal/45 md:bg-surface-2/90 md:p-3 md:shadow-none"
                      data-pack-inline-add
                    >
                      <div className="mb-4 flex flex-col gap-1.5 border-b border-border/70 pb-3 text-sm leading-snug text-foreground md:mb-2 md:border-0 md:pb-0 md:font-mono md:text-[10px] md:leading-normal md:tracking-[0.18em] md:text-signal">
                        <span className="font-medium text-signal md:font-normal">
                          {t("container.add")}
                        </span>
                        <span className="text-muted-foreground">
                          <span className="text-foreground/90">
                            {containerDisplayLabel(
                              trip.containers.find((c) => c.id === adding.containerId) ??
                                trip.containers[0]!,
                              lang,
                              t,
                            )}
                          </span>
                          <span className="mx-1.5 text-border-strong" aria-hidden>
                            ·
                          </span>
                          <span>{packDisplayGroupLabel(t, groupKey)}</span>
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
              className="min-h-12 w-full rounded-md border border-dashed border-border-strong px-3 py-3 text-sm font-medium text-muted-foreground hover:border-foreground/25 hover:bg-surface-2 hover:text-foreground md:min-h-0 md:py-2.5 md:font-mono md:text-[11px] md:font-normal md:tracking-[0.18em]"
            >
              {t("packChecklist.addCustom")}
            </button>
          ) : null}
          {adding?.source === "footer" ? (
            <div
              className="mt-2 rounded-lg border border-signal/40 bg-surface p-4 shadow-sm md:rounded-md md:border-signal/45 md:bg-surface-2/90 md:p-3 md:shadow-none"
              data-pack-footer-add
            >
              <div className="mb-4 flex flex-col gap-1.5 border-b border-border/70 pb-3 text-sm leading-snug text-foreground md:mb-2 md:border-0 md:pb-0 md:font-mono md:text-[10px] md:leading-normal md:tracking-[0.18em] md:text-signal">
                <span className="font-medium text-signal md:font-normal">{t("container.add")}</span>
                <span className="text-muted-foreground">
                  <span className="text-foreground/90">
                    {containerDisplayLabel(
                      trip.containers.find((c) => c.id === adding.containerId) ??
                        trip.containers[0]!,
                      lang,
                      t,
                    )}
                  </span>
                  <span className="mx-1.5 text-border-strong" aria-hidden>
                    ·
                  </span>
                  <span>{t(`cat.${adding.category}`)}</span>
                </span>
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
