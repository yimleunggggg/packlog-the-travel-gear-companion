import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TopBar } from "@/components/packlog/TopBar";
import { TripBriefing } from "@/components/packlog/TripBriefing";
import { TripPackOverviewLite } from "@/components/packlog/TripPackOverviewLite";
import { WeightDistributionPanel } from "@/components/packlog/WeightDistributionPanel";
import { PostTripReview } from "@/components/packlog/PostTripReview";
import { ContainerModule } from "@/components/packlog/ContainerModule";
import { POST_AUTH_EVENT, type PostAuthIntent } from "@/lib/post-auth-intent";
import { communityTemplates } from "@/lib/packlog-data";
import { usePacklog } from "@/lib/packlog-store";
import { useI18n } from "@/lib/i18n";
import { SCROLL_TO_PACK_AFTER_CREATE_KEY } from "@/lib/pack-nav-flags";

export const Route = createFileRoute("/trip/$tripId")({
  component: TripDetail,
});

function TripDetail() {
  const { tripId } = Route.useParams();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { t } = useI18n();
  const store = usePacklog();
  const trip = store.getTrip(tripId);

  useEffect(() => {
    const onResume = (e: Event) => {
      const d = (e as CustomEvent<PostAuthIntent>).detail;
      if (d.kind === "communityClone" && d.tripId === tripId) {
        const tpl = communityTemplates.find((x) => x.id === d.templateId);
        if (tpl) store.cloneCommunity(tripId, tpl, d.selectedIdx, d.targetContainerId, d.ownership);
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
  }, [tripId, store]);

  useEffect(() => {
    const pending = sessionStorage.getItem(SCROLL_TO_PACK_AFTER_CREATE_KEY);
    if (pending !== tripId) return;
    const tr = store.getTrip(tripId);
    if (!tr || tr.phase !== "PACK") return;
    sessionStorage.removeItem(SCROLL_TO_PACK_AFTER_CREATE_KEY);
    requestAnimationFrame(() => {
      const el =
        document.getElementById("pack-checklist") ??
        document.getElementById("trip-pack-workspace") ??
        document.getElementById("trip-overview-pack-cta");
      el?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, [tripId, store, trip?.phase]);

  if (!trip) {
    return (
      <div className="min-h-screen">
        <TopBar showPhase={false} />
        <div className="mx-auto max-w-2xl p-12 text-center">
          <div className="font-mono text-[10px] tracking-[0.22em] text-muted-foreground">
            PACKLOG
          </div>
          <h1 className="mt-3 font-display text-3xl">{t("trip.notFound.title")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("trip.notFound.subtitle")}</p>
        </div>
      </div>
    );
  }

  const phase = trip.phase;
  /** Child route `/trip/$tripId/pack` renders the full packing surface (checklist + bags). */
  const isPackSubRoute = /\/pack\/?$/.test(pathname);

  if (isPackSubRoute) {
    return <Outlet />;
  }

  if (phase === "PACK") {
    return (
      <div className="min-h-dvh pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <TopBar showPhase={false} />
        <main className="mx-auto max-w-[1480px] px-[var(--page-padding)] py-8 md:py-10">
          <TripPackOverviewLite
            trip={trip}
            onBack={() => navigate({ to: "/", search: { tag: undefined } })}
            onEnterReview={() => store.setPhase(trip.id, "REVIEW")}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-dvh pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      <TopBar showPhase={false} />

      <main className="mx-auto max-w-[1480px] space-y-6 px-[var(--page-padding)] py-6">
        <TripBriefing
          trip={trip}
          phase={phase}
          onPhase={(p) => store.setPhase(trip.id, p)}
          onBack={() => navigate({ to: "/", search: { tag: undefined } })}
          onOpenClone={() =>
            navigate({ to: "/community", search: { tag: undefined, kind: undefined } })
          }
          onSharingPatch={(patch) => store.patchTrip(trip.id, patch)}
        />

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 space-y-6 lg:col-span-8">
            <AnimatePresence mode="wait">
              <motion.div
                key="review"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-6"
              >
                <PostTripReview trip={trip} onSeal={() => store.sealReview(trip.id)} />
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {(trip.containers ?? []).map((c) => (
                    <ContainerModule
                      key={c.id}
                      container={c}
                      phase={phase}
                      tripId={trip.id}
                      onToggle={(cid, iid) => store.toggleItem(trip.id, cid, iid)}
                      onVerdict={(cid, iid, v) => store.setVerdict(trip.id, cid, iid, v)}
                      onUtility={(cid, iid, u) => store.setUtility(trip.id, cid, iid, u)}
                      onUpdate={(cid, iid, patch) => store.updateItem(trip.id, cid, iid, patch)}
                    />
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="col-span-12 space-y-6 lg:col-span-4">
            <WeightDistributionPanel trip={trip} />
          </div>
        </div>
      </main>
    </div>
  );
}
