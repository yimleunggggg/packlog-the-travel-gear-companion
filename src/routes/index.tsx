import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TopBar } from "@/components/packlog/TopBar";
import { ArchiveList } from "@/components/packlog/ArchiveList";
import { NewTripDialog } from "@/components/packlog/NewTripDialog";
import { POST_AUTH_EVENT, type PostAuthIntent } from "@/lib/post-auth-intent";
import { usePacklog } from "@/lib/packlog-store";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PACKLOG · 行前志 — Modular gear lifecycle for travelers" },
      {
        name: "description",
        content:
          "PACKLOG is a parametric, modular packing system that turns each trip into reusable gear-DNA. From plan, to pack, to debrief — your gear is professionally taken over.",
      },
      { property: "og:title", content: "PACKLOG · 行前志" },
      {
        property: "og:description",
        content:
          "Container-based packing, lifecycle states, community blueprints. Built for travelers who treat gear as a system.",
      },
    ],
  }),
  component: ArchivePage,
});

function ArchivePage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { trips, createTrip } = usePacklog();
  const [newTripOpen, setNewTripOpen] = useState(false);

  useEffect(() => {
    const onResume = (e: Event) => {
      const d = (e as CustomEvent<PostAuthIntent>).detail;
      if (d.kind === "openNewTrip") setNewTripOpen(true);
    };
    window.addEventListener(POST_AUTH_EVENT, onResume as EventListener);
    return () => window.removeEventListener(POST_AUTH_EVENT, onResume as EventListener);
  }, []);

  return (
    <div className="min-h-dvh pb-[calc(6rem+env(safe-area-inset-bottom))]">
      <TopBar showPhase={false} />
      <main className="mx-auto max-w-[1480px] space-y-6 px-4 py-6 md:px-6">
        <ArchiveList
          trips={trips}
          onOpen={(id) => navigate({ to: "/trip/$tripId", params: { tripId: id } })}
          onNewTrip={() => setNewTripOpen(true)}
        />
      </main>

      <NewTripDialog
        open={newTripOpen}
        onClose={() => setNewTripOpen(false)}
        onCreate={(args) => {
          const fresh = createTrip(args);
          setNewTripOpen(false);
          navigate({ to: "/trip/$tripId", params: { tripId: fresh.id } });
        }}
      />
    </div>
  );
}
