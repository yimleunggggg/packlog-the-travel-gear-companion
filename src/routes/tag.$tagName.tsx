import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { TopBar } from "@/components/packlog/TopBar";
import { ArchiveList } from "@/components/packlog/ArchiveList";
import { NewTripDialog } from "@/components/packlog/NewTripDialog";
import { POST_AUTH_EVENT, type PostAuthIntent } from "@/lib/post-auth-intent";
import { usePacklog } from "@/lib/packlog-store";
import { useI18n } from "@/lib/i18n";
import { formatTagForUi, tripTagMatchStrength } from "@/lib/tag-presets";
import { SCROLL_TO_PACK_AFTER_CREATE_KEY } from "@/lib/pack-nav-flags";
import { cn } from "@/lib/utils";
import { packlogBtnTertiary, packlogBtnSm } from "@/lib/packlog-button-classes";

export const Route = createFileRoute("/tag/$tagName")({
  head: ({ params }) => {
    const tag = decodeURIComponent(params.tagName);
    const label = tag.replace(/-/g, " ");
    return {
      meta: [
        { title: `${label} · Trips · PACKLOG` },
        {
          name: "description",
          content: `Browse trips tagged “${label}” on PACKLOG — modular packing lists.`,
        },
        { property: "og:title", content: `${label} · PACKLOG` },
        {
          property: "og:description",
          content: `Trips filtered by tag “${label}”.`,
        },
      ],
    };
  },
  component: TagArchivePage,
});

function TagArchivePage() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const { trips, createTrip } = usePacklog();
  const [newTripOpen, setNewTripOpen] = useState(false);
  const { tagName } = Route.useParams();
  const tagFilter = useMemo(() => decodeURIComponent(tagName), [tagName]);

  const tagFilterFuzzyOnly = useMemo(() => {
    if (!tagFilter?.trim()) return false;
    const hasExact = trips.some((tr) => tripTagMatchStrength(tr.tags, tagFilter) === "exact");
    if (hasExact) return false;
    return trips.some((tr) => tripTagMatchStrength(tr.tags, tagFilter) === "fuzzy");
  }, [trips, tagFilter]);

  useEffect(() => {
    const onResume = (e: Event) => {
      const d = (e as CustomEvent<PostAuthIntent>).detail;
      if (d.kind === "openNewTrip") setNewTripOpen(true);
    };
    window.addEventListener(POST_AUTH_EVENT, onResume as EventListener);
    return () => window.removeEventListener(POST_AUTH_EVENT, onResume as EventListener);
  }, []);

  return (
    <div className="min-h-dvh pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      <TopBar showPhase={false} />
      <main className="mx-auto max-w-[1480px] space-y-6 px-4 py-6 md:px-6">
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-border-strong bg-surface-2 px-3 py-2 font-mono text-[10px] text-muted-foreground">
          <span>
            {t("tag.filter.active")}:{" "}
            <span className="text-foreground">{formatTagForUi(tagFilter, lang)}</span>
          </span>
          {tagFilterFuzzyOnly ? (
            <span className="text-muted-foreground/90">{t("tag.filter.fuzzyHint")}</span>
          ) : null}
          <Link
            to="/"
            search={{ tag: undefined }}
            className={cn(packlogBtnTertiary, packlogBtnSm, "min-h-0 px-2 py-1")}
          >
            {t("tag.filter.clear")}
          </Link>
        </div>
        <ArchiveList
          trips={trips}
          tagFilter={tagFilter}
          onOpen={(id) => {
            const tr = trips.find((x) => x.id === id);
            if (tr?.phase === "PACK") {
              navigate({ to: "/trip/$tripId/pack", params: { tripId: id } });
            } else {
              navigate({ to: "/trip/$tripId", params: { tripId: id } });
            }
          }}
          onNewTrip={() => setNewTripOpen(true)}
        />
      </main>

      <NewTripDialog
        open={newTripOpen}
        onClose={() => setNewTripOpen(false)}
        onCreate={(args) => {
          const fresh = createTrip(args);
          setNewTripOpen(false);
          sessionStorage.setItem(SCROLL_TO_PACK_AFTER_CREATE_KEY, fresh.id);
          navigate({ to: "/trip/$tripId/pack", params: { tripId: fresh.id } });
        }}
      />
    </div>
  );
}
