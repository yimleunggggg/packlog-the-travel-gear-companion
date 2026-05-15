import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { ContainerModule } from "@/components/packlog/ContainerModule";
import { PackChecklistPanel } from "@/components/packlog/PackChecklistPanel";
import { AddContainerSheet } from "@/components/packlog/AddContainerSheet";
import { TripScenarioAssist } from "@/components/packlog/TripScenarioAssist";
import type { Trip } from "@/lib/packlog-data";
import { usePacklog } from "@/lib/packlog-store";
import { useI18n } from "@/lib/i18n";
import type { PackViewFilter } from "@/lib/pack-view-filter";
import {
  packlogBtnBlock,
  packlogBtnPrimary,
  packlogBtnSecondary,
  packlogHint,
  packlogSectionTitle,
} from "@/lib/packlog-button-classes";
import { cn } from "@/lib/utils";
import { isUnassignedContainer } from "@/lib/unassigned-container";

/**
 * Shared packing surface: filters + bag weight cards + checklist + add bag.
 * - `page`: used under `/trip/:id/pack` (filter bar full-width, then padded main column).
 * - `embedded`: used on `/trip/:id` below briefing (`#trip-pack-workspace` for scroll).
 */
export function TripPackWorkspace({
  trip,
  variant,
}: {
  trip: Trip;
  variant: "embedded" | "page";
}) {
  const { t } = useI18n();
  const store = usePacklog();
  const [addBagOpen, setAddBagOpen] = useState(false);
  const [packViewFilter, setPackViewFilter] = useState<PackViewFilter>("all");

  const main = useMemo(
    () => (trip.containers ?? []).filter((c) => !isUnassignedContainer(c, trip.id)),
    [trip],
  );

  const packFilterCounts = useMemo(() => {
    const items = trip.containers.flatMap((c) => c.items);
    return {
      all: items.length,
      todo: items.filter((i) => i.status !== "packed").length,
      packed: items.filter((i) => i.status === "packed").length,
      wishlist: items.filter((i) => i.ownership === "wishlist").length,
    };
  }, [trip]);

  const phase = trip.phase;

  const filterRow =
    phase !== "REVIEW" ? (
      <div
        className={
          variant === "embedded"
            ? "rounded-md border border-border bg-surface/60 px-3 py-2 md:px-4"
            : "border-b border-[#E8E2D9] bg-background/90 px-4 py-2 md:px-6"
        }
      >
        <div className="mx-auto flex max-w-[1480px] flex-wrap gap-1.5">
          {(
            [
              ["all", packFilterCounts.all] as const,
              ["todo", packFilterCounts.todo] as const,
              ["packed", packFilterCounts.packed] as const,
              ["wishlist", packFilterCounts.wishlist] as const,
            ] as const
          ).map(([key, n]) => (
            <button
              key={key}
              type="button"
              onClick={() => setPackViewFilter(key)}
              className={`min-h-10 rounded-md border px-3 py-2 text-xs tracking-wide transition md:min-h-9 md:px-2.5 md:py-1.5 md:font-mono md:text-[10px] md:tracking-[0.12em] ${
                packViewFilter === key
                  ? "border-signal bg-signal text-signal-foreground"
                  : "border-border-strong bg-surface text-muted-foreground hover:border-foreground/25 hover:text-foreground"
              }`}
            >
              {t(`pack.filter.${key}`).replace("{n}", String(n))}
            </button>
          ))}
        </div>
      </div>
    ) : null;

  const grid = (
    <AnimatePresence mode="wait">
      {phase !== "REVIEW" ? (
        <motion.div
          key="containers"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="grid grid-cols-1 gap-6 md:grid-cols-2"
        >
          <div className="md:col-span-2 border-b border-border pb-2">
            <div className="font-mono text-[10px] tracking-[0.22em] text-muted-foreground">{t("bags.sectionKicker")}</div>
            <h3 className={cn("mt-1", packlogSectionTitle)}>{t("bags.sectionTitle")}</h3>
            {t("bags.sectionHint").trim() ? (
              <p className="mt-1 text-sm text-muted-foreground">{t("bags.sectionHint")}</p>
            ) : null}
          </div>
          {main[0] ? (
            <div className="md:col-span-2">
              <ContainerModule
                container={main[0]}
                phase={phase}
                tripId={trip.id}
                packViewFilter={packViewFilter}
                onToggle={(cid, iid) => store.toggleItem(trip.id, cid, iid)}
                onVerdict={(cid, iid, v) => store.setVerdict(trip.id, cid, iid, v)}
                onUtility={(cid, iid, u) => store.setUtility(trip.id, cid, iid, u)}
                onAdd={(cid, item) => store.addItem(trip.id, cid, item)}
                onRemove={(cid, iid) => store.removeItem(trip.id, cid, iid)}
                onMove={(from, iid, to) => store.moveItem(trip.id, from, iid, to)}
                onDropFromPool={(cid, item) => store.addItem(trip.id, cid, item)}
                onCycleOwnership={(cid, iid) => store.cycleOwnership(trip.id, cid, iid)}
                onUpdate={(cid, iid, patch) => store.updateItem(trip.id, cid, iid, patch)}
                onSaveToLibrary={(item) => store.addToLibrary(item)}
                isInLibrary={(item) =>
                  store.library.some((g) => g.name === item.name && (g.brand ?? "") === (item.brand ?? ""))
                }
                variant="wide"
              />
            </div>
          ) : null}
          {main.slice(1).map((c) => (
            <ContainerModule
              key={c.id}
              container={c}
              phase={phase}
              tripId={trip.id}
              packViewFilter={packViewFilter}
              onToggle={(cid, iid) => store.toggleItem(trip.id, cid, iid)}
              onVerdict={(cid, iid, v) => store.setVerdict(trip.id, cid, iid, v)}
              onUtility={(cid, iid, u) => store.setUtility(trip.id, cid, iid, u)}
              onAdd={(cid, item) => store.addItem(trip.id, cid, item)}
              onRemove={(cid, iid) => store.removeItem(trip.id, cid, iid)}
              onMove={(from, iid, to) => store.moveItem(trip.id, from, iid, to)}
              onDropFromPool={(cid, item) => store.addItem(trip.id, cid, item)}
              onCycleOwnership={(cid, iid) => store.cycleOwnership(trip.id, cid, iid)}
              onUpdate={(cid, iid, patch) => store.updateItem(trip.id, cid, iid, patch)}
              onSaveToLibrary={(item) => store.addToLibrary(item)}
              isInLibrary={(item) =>
                store.library.some((g) => g.name === item.name && (g.brand ?? "") === (item.brand ?? ""))
              }
            />
          ))}
          <div className="md:col-span-2">
            <button
              type="button"
              onClick={() => setAddBagOpen(true)}
              className="flex w-full min-h-11 items-center justify-center gap-2 rounded-md border border-dashed border-border-strong bg-surface/50 py-3 font-mono text-[11px] tracking-[0.2em] text-muted-foreground transition hover:border-foreground/25 hover:bg-surface-2 hover:text-foreground"
            >
              {t("container.add.bag")}
            </button>
          </div>
          <div className="md:col-span-2 mt-2 border-t border-border pt-6">
            <PackChecklistPanel
              trip={trip}
              phase={phase}
              tripId={trip.id}
              packViewFilter={packViewFilter}
              onToggle={(cid, iid) => store.toggleItem(trip.id, cid, iid)}
              onSetOwnership={(cid, iid, o) => store.setOwnership(trip.id, cid, iid, o)}
              onRemove={(cid, iid) => store.removeItem(trip.id, cid, iid)}
              onMoveItem={(from, iid, to) => store.moveItem(trip.id, from, iid, to)}
              onUpdate={(cid, iid, patch) => store.updateItem(trip.id, cid, iid, patch)}
              onAddToContainer={(cid, item) => store.addItem(trip.id, cid, item)}
              onSaveToLibrary={(item) => store.addToLibrary(item)}
              isInLibrary={(item) =>
                store.library.some((g) => g.name === item.name && (g.brand ?? "") === (item.brand ?? ""))
              }
            />
          </div>
        </motion.div>
      ) : variant === "page" ? (
        <motion.div
          key="review-hint"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4 rounded-md border border-border bg-surface p-4 md:p-5"
        >
          <p className={packlogHint}>{t("pack.page.reviewHint")}</p>
          <Link
            to="/trip/$tripId"
            params={{ tripId: trip.id }}
            hash="trip-review-panel"
            className={cn(packlogBtnPrimary, packlogBtnBlock, "inline-flex w-full justify-center no-underline")}
          >
            {t("pack.page.reviewCtaOverview")}
          </Link>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );

  const embeddedFooter =
    variant === "embedded" && phase !== "REVIEW" ? (
      <div className="mt-6 flex flex-col gap-2 border-t border-border pt-4 sm:flex-row">
        <button
          type="button"
          className={cn(packlogBtnPrimary, packlogBtnBlock, "flex-1")}
          onClick={() =>
            document.getElementById("pack-checklist")?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            })
          }
        >
          {t("pack.footer.scrollChecklist")}
        </button>
        <button
          type="button"
          className={cn(packlogBtnSecondary, packlogBtnBlock, "flex-1")}
          onClick={() =>
            document.getElementById("pack-checklist-add")?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            })
          }
        >
          {t("pack.footer.addGear")}
        </button>
      </div>
    ) : null;

  const scenarioAssist =
    phase !== "REVIEW" ? (
      <TripScenarioAssist
        trip={trip}
        onQuickAdd={(name, w, cat) => store.quickAdd(trip.id, name, w, cat)}
      />
    ) : null;

  const sheet = (
    <AddContainerSheet
      open={addBagOpen}
      onClose={() => setAddBagOpen(false)}
      onCommit={(draft) => store.addContainer(trip.id, draft)}
    />
  );

  if (variant === "embedded") {
    return (
      <section
        id="trip-pack-workspace"
        className="scroll-mt-[calc(5rem+env(safe-area-inset-top))] space-y-4 border-t border-border pt-8"
      >
        <div className="font-mono text-[10px] tracking-[0.22em] text-muted-foreground">{t("packChecklist.kicker")}</div>
        <h2 className={packlogSectionTitle}>{t("pack.page.embeddedTitle")}</h2>
        {t("pack.page.embeddedHint").trim() ? (
          <p className={packlogHint}>{t("pack.page.embeddedHint")}</p>
        ) : null}
        {filterRow}
        <div className="mt-4 space-y-6">{grid}</div>
        {embeddedFooter}
        {scenarioAssist}
        {sheet}
      </section>
    );
  }

  return (
    <>
      {filterRow}
      <div className="mx-auto max-w-[1480px] space-y-6 px-[var(--page-padding)] py-4">
        {grid}
        {scenarioAssist}
      </div>
      {sheet}
    </>
  );
}
