import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { POST_AUTH_EVENT, type PostAuthIntent } from "@/lib/post-auth-intent";
import { CloneSheet } from "@/components/packlog/CloneSheet";
import { usePacklog } from "@/lib/packlog-store";
import { useI18n } from "@/lib/i18n";
import { communityTemplates } from "@/lib/packlog-data";
import { packlogBtnPrimary, packlogBtnSecondary, packlogBtnSm, packlogFieldLabel } from "@/lib/packlog-button-classes";
import { cn } from "@/lib/utils";
import { tripShortSelectLabel } from "@/lib/trip-list-label";

export const Route = createFileRoute("/community/$templateId")({
  head: ({ params }) => {
    const tpl = communityTemplates.find((x) => x.id === params.templateId);
    const title = tpl ? `${tpl.title} · PACKLOG` : "Community · PACKLOG";
    const desc = tpl ? tpl.intro.slice(0, 200) : "Community packing blueprint.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        ...(tpl
          ? ([
              { property: "og:title", content: tpl.title },
              { property: "og:description", content: tpl.intro.slice(0, 240) },
              { property: "og:type", content: "article" },
            ] as const)
          : []),
      ],
    };
  },
  component: CommunityTemplateDetailPage,
});

function CommunityTemplateDetailPage() {
  const navigate = useNavigate();
  const { templateId } = Route.useParams();
  const { t, lang } = useI18n();
  const { trips, cloneCommunity, library } = usePacklog();
  const tpl = useMemo(
    () => communityTemplates.find((x) => x.id === templateId) ?? null,
    [templateId],
  );
  const [targetTripId, setTargetTripId] = useState<string>(
    () => trips.find((tr) => tr.phase !== "REVIEW")?.id ?? trips[0]?.id ?? "",
  );
  const targetTrip = trips.find((x) => x.id === targetTripId);

  useEffect(() => {
    if (trips.length === 0) return;
    if (!trips.some((tr) => tr.id === targetTripId)) {
      setTargetTripId(trips.find((tr) => tr.phase !== "REVIEW")?.id ?? trips[0]!.id);
    }
  }, [trips, targetTripId]);

  useEffect(() => {
    const onResume = (e: Event) => {
      const d = (e as CustomEvent<PostAuthIntent>).detail;
      if (d.kind !== "communityClone" || d.tripId !== targetTripId || d.templateId !== templateId)
        return;
      const found = communityTemplates.find((x) => x.id === d.templateId);
      if (!found) return;
      cloneCommunity(d.tripId, found, d.selectedIdx, d.targetContainerId, d.ownership);
      const n = d.selectedIdx.length;
      if (n > 0) {
        toast.success(t("community.merge.successToast").replace("{n}", String(n)));
      }
    };
    window.addEventListener(POST_AUTH_EVENT, onResume as EventListener);
    return () => window.removeEventListener(POST_AUTH_EVENT, onResume as EventListener);
  }, [targetTripId, templateId, cloneCommunity, t]);

  if (!tpl) {
    return (
      <main className="mx-auto max-w-lg px-4 py-12 text-center">
        <p className="text-sm text-muted-foreground">{t("community.detail.notFound")}</p>
        <Link
          to="/community"
          search={{ tag: undefined, kind: undefined }}
          className={cn(packlogBtnPrimary, packlogBtnSm, "mt-6 inline-flex")}
        >
          {t("community.detail.back")}
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1480px] space-y-6 px-4 py-6 md:px-6">
      <div
        className={cn(
          "sticky z-30 -mx-4 flex flex-col gap-3 border-b border-border/90 bg-background/95 px-4 py-3 backdrop-blur-sm supports-[backdrop-filter]:bg-background/88",
          "top-[calc(env(safe-area-inset-top)+3.25rem)] md:top-[calc(env(safe-area-inset-top)+3.5rem)]",
          "md:-mx-6 md:flex-row md:items-stretch md:justify-between md:gap-4 md:px-6",
        )}
      >
        <Link
          to="/community"
          search={{ tag: undefined, kind: undefined }}
          className={cn(
            packlogBtnSecondary,
            "inline-flex w-full min-h-[var(--touch-target)] shrink-0 items-center justify-center gap-2 px-4 py-3 text-[11px] tracking-[0.14em] touch-manipulation md:w-auto md:min-w-[12rem] md:justify-start md:py-2.5",
          )}
        >
          <ArrowLeft className="size-[1.125rem] shrink-0 opacity-90" aria-hidden />
          {t("community.detail.back")}
        </Link>
        {trips.length > 0 && (
          <div className="flex min-h-[var(--touch-target)] min-w-0 flex-1 flex-col justify-center rounded-md border border-border bg-surface-2 p-3 md:max-w-md md:shrink-0">
            <label htmlFor="community-detail-target-trip" className={cn(packlogFieldLabel, "mb-0")}>
              {t("community.merge.pickTrip")}
            </label>
            <select
              id="community-detail-target-trip"
              value={targetTripId}
              onChange={(e) => setTargetTripId(e.target.value)}
              className="mt-2 min-h-11 w-full max-w-full cursor-pointer rounded-md border border-transparent bg-transparent font-mono text-base text-foreground focus:border-[#C8956C]/50 focus:outline-none md:mt-1.5 md:min-h-0 md:max-w-[min(100%,18rem)] md:text-sm"
            >
              {trips.map((tr) => (
                <option key={tr.id} value={tr.id}>
                  {tripShortSelectLabel(tr, lang)}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {trips.length === 0 || !targetTrip ? (
        <div className="module corner-tick p-6 text-center">
          <p className="font-mono text-[11px] text-muted-foreground">{t("archive.empty")}</p>
          <Link
            to="/"
            search={{ tag: undefined }}
            className={cn(packlogBtnPrimary, packlogBtnSm, "mt-3 inline-flex")}
          >
            {t("archive.back")}
          </Link>
        </div>
      ) : (
        <CloneSheet
          template={tpl}
          trips={trips}
          targetTripId={targetTripId}
          onTargetTripChange={setTargetTripId}
          containers={targetTrip.containers}
          library={library}
          presentation="page"
          commitCloses={false}
          onClose={() => void navigate({ to: "/community", search: { tag: undefined, kind: undefined } })}
          onCommit={(idx, target, own) => {
            cloneCommunity(targetTripId, tpl, idx, target, own);
          }}
        />
      )}
    </main>
  );
}
