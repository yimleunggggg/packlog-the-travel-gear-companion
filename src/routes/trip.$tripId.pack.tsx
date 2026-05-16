import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { TripPackWorkspace } from "@/components/packlog/TripPackWorkspace";
import { TripPackPageFoldout } from "@/components/packlog/TripPackPageFoldout";
import { POST_AUTH_EVENT, type PostAuthIntent } from "@/lib/post-auth-intent";
import { communityTemplates } from "@/lib/packlog-data";
import { usePacklog } from "@/lib/packlog-store";
import { useI18n } from "@/lib/i18n";
import { tripTotalGrams } from "@/lib/trip-weight-stats";
import { formatKgFromGrams } from "@/lib/weight-provenance";
import {
  packlogBtnBlock,
  packlogBtnPrimary,
  packlogBtnSecondary,
  packlogBtnTertiary,
  packlogItemWeight,
  packlogSectionTitle,
} from "@/lib/packlog-button-classes";
import { tripTitleDisplay } from "@/lib/trip-list-label";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/trip/$tripId/pack")({
  component: TripPackPage,
});

function TripPackPage() {
  const { tripId } = Route.useParams();
  const navigate = useNavigate();
  const { t, lang } = useI18n();
  const store = usePacklog();
  const trip = store.getTrip(tripId);

  useEffect(() => {
    const onResume = (e: Event) => {
      const d = (e as CustomEvent<PostAuthIntent>).detail;
      if (d.kind === "communityClone" && d.tripId === tripId) {
        const tpl = communityTemplates.find((x) => x.id === d.templateId);
        if (tpl) {
          store.cloneCommunity(tripId, tpl, d.selectedIdx, d.targetContainerId, d.ownership);
          const n = d.selectedIdx.length;
          if (n > 0) {
            toast.success(t("community.merge.successToast").replace("{n}", String(n)));
          }
        }
        return;
      }
      if (d.kind === "saveItemToLibrary" && d.tripId === tripId) {
        const tr = store.getTrip(tripId);
        const c = tr?.containers.find((x) => x.id === d.containerId);
        const item = c?.items.find((x) => x.id === d.itemId);
        if (item) store.addToLibrary(item);
        return;
      }
      if (d.kind === "tripSharing" && d.tripId === tripId) {
        store.patchTrip(tripId, d.patch);
      }
    };
    window.addEventListener(POST_AUTH_EVENT, onResume as EventListener);
    return () => window.removeEventListener(POST_AUTH_EVENT, onResume as EventListener);
  }, [tripId, store, t]);

  if (!trip) {
    return (
      <div className="min-h-dvh overscroll-y-none bg-background pb-[env(safe-area-inset-bottom)]">
        <header className="border-b border-border px-4 py-3 pt-[env(safe-area-inset-top)]">
          <Link
            to="/"
            search={{ tag: undefined }}
            className="font-mono text-[10px] tracking-[0.2em] text-link underline-offset-2 hover:underline"
          >
            {t("archive.back")}
          </Link>
          <p className="mt-2 text-sm text-muted-foreground">{t("archive.empty")}</p>
        </header>
      </div>
    );
  }

  const phase = trip.phase;
  const totalItems = trip.containers.reduce((s, c) => s + c.items.length, 0);
  const packedItems = trip.containers.reduce(
    (s, c) => s + c.items.filter((i) => i.status === "packed").length,
    0,
  );
  const pct = totalItems ? (packedItems / totalItems) * 100 : 0;
  const totalG = tripTotalGrams(trip);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const scrollPackTarget = useMemo(() => (isDesktop ? "pack-by-bag" : "pack-checklist"), [isDesktop]);

  return (
    <div className="min-h-dvh overscroll-y-none bg-background pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-8">
      <header className="sticky top-0 z-30 border-b border-[#E8E2D9] bg-background/95 pt-[env(safe-area-inset-top)] backdrop-blur-md">
        <div className="mx-auto flex max-w-[1480px] items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() =>
              void navigate({
                to: "/trip/$tripId",
                params: { tripId: trip.id },
                hash: phase === "REVIEW" ? "trip-review-panel" : undefined,
              })
            }
            className="shrink-0 font-mono text-[10px] tracking-[0.2em] text-link hover:underline"
          >
            {t("pack.page.back")}
          </button>
          <div className="min-w-0 flex-1 text-center">
            <motion.div className={cn(packlogSectionTitle, "truncate text-center")}>
              {tripTitleDisplay(trip, lang)}
            </motion.div>
            <div className={cn(packlogItemWeight, "mt-0.5 text-center")}>
              {packedItems}/{totalItems} ✓ · {formatKgFromGrams(totalG)}kg
            </div>
          </div>
          <div className="w-10 shrink-0" aria-hidden />
        </div>
        <div className="px-4 pb-2">
          <div className="relative h-1.5 overflow-hidden rounded bg-surface-3">
            <motion.div
              className={`absolute inset-y-0 left-0 ${pct >= 100 ? "bg-success" : "bg-signal"}`}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
            />
          </div>
        </div>
      </header>

      {phase === "PACK" ? (
        <TripPackPageFoldout
          trip={trip}
          onOpenClone={() => navigate({ to: "/community", search: { tag: undefined, kind: undefined } })}
          onSharingPatch={(patch) => store.patchTrip(trip.id, patch)}
          onEnterReview={() => store.setPhase(trip.id, "REVIEW")}
        />
      ) : null}

      <main>
        <TripPackWorkspace trip={trip} variant="page" />
      </main>

      <motion.div className="fixed bottom-0 left-0 right-0 z-30 border-t border-[#E8E2D9] bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md max-md:fixed md:static md:z-auto md:mt-8 md:border-t md:bg-transparent md:pb-0 md:backdrop-blur-none">
        <div className="mx-auto flex max-w-[1480px] flex-col gap-2 px-4 py-3 md:flex-row md:items-center md:justify-end md:gap-3 md:px-[var(--page-padding)]">
          {phase === "REVIEW" ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
              <Link
                to="/trip/$tripId"
                params={{ tripId: trip.id }}
                hash="trip-review-panel"
                className={cn(packlogBtnPrimary, packlogBtnBlock, "inline-flex flex-1 justify-center no-underline")}
              >
                {t("pack.page.reviewCtaOverview")}
              </Link>
              <Link
                to="/community"
                search={{ tag: undefined, kind: undefined }}
                className={cn(
                  packlogBtnTertiary,
                  packlogBtnBlock,
                  "inline-flex flex-1 items-center justify-center border border-border-strong bg-surface-2/80 py-2.5 font-mono text-[11px] tracking-[0.12em] no-underline hover:bg-surface-2 md:py-2 md:text-[10px]",
                )}
              >
                {t("pack.footer.reviewBrowseCommunity")}
              </Link>
            </div>
          ) : (
            <>
              <div className="flex gap-2 md:flex-initial">
                <button
                  type="button"
                  className={cn(packlogBtnPrimary, packlogBtnBlock, "flex-1 md:flex-initial")}
                  onClick={() =>
                    document.getElementById(scrollPackTarget)?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    })
                  }
                >
                  {isDesktop ? t("pack.footer.scrollBags") : t("pack.footer.scrollChecklist")}
                </button>
                <button
                  type="button"
                  className={cn(packlogBtnSecondary, packlogBtnBlock, "flex-1 md:flex-initial")}
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
              <Link
                to="/community"
                search={{ tag: undefined, kind: undefined }}
                className="text-center font-mono text-[10px] text-link underline underline-offset-2"
              >
                {t("brief.cta.clone")}
              </Link>
            </>
          )}
          {t("pack.page.footerHint").trim() ? (
            <p className="text-center font-mono text-[9px] text-muted-foreground">{t("pack.page.footerHint")}</p>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
}
