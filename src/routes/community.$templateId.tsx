import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { POST_AUTH_EVENT, type PostAuthIntent } from "@/lib/post-auth-intent";
import { CloneSheet } from "@/components/packlog/CloneSheet";
import { usePacklog } from "@/lib/packlog-store";
import { useI18n } from "@/lib/i18n";
import { communityTemplates } from "@/lib/packlog-data";
import { packlogBtnPrimary, packlogBtnSm } from "@/lib/packlog-button-classes";
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
    };
    window.addEventListener(POST_AUTH_EVENT, onResume as EventListener);
    return () => window.removeEventListener(POST_AUTH_EVENT, onResume as EventListener);
  }, [targetTripId, templateId, cloneCommunity]);

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
      <div className="flex flex-wrap items-end justify-between gap-4">
        <Link
          to="/community"
          search={{ tag: undefined, kind: undefined }}
          className="font-mono text-[10px] tracking-[0.2em] text-signal hover:underline"
        >
          {t("community.detail.back")}
        </Link>
        {trips.length > 0 && (
          <div className="rounded-md border border-border bg-surface-2 p-2">
            <div className="font-mono text-[9px] tracking-[0.2em] text-muted-foreground">
              {t("community.merge.target")}
            </div>
            <select
              value={targetTripId}
              onChange={(e) => setTargetTripId(e.target.value)}
              className="mt-1 max-w-[min(100%,18rem)] bg-transparent font-mono text-xs focus:outline-none"
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
          onClose={() =>
            void navigate({ to: "/community", search: { tag: undefined, kind: undefined } })
          }
          onCommit={(idx, target, own) => {
            cloneCommunity(targetTripId, tpl, idx, target, own);
          }}
        />
      )}
    </main>
  );
}
