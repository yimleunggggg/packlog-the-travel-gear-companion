import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { TopBar } from "@/components/packlog/TopBar";
import { ArchiveList } from "@/components/packlog/ArchiveList";
import { NewTripDialog } from "@/components/packlog/NewTripDialog";
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

  return (
    <div className="min-h-screen pb-24">
      <TopBar showPhase={false} />
      <main className="mx-auto max-w-[1480px] space-y-6 px-4 py-6 md:px-6">
        <ArchiveList
          trips={trips}
          onOpen={(id) => navigate({ to: "/trip/$tripId", params: { tripId: id } })}
          onNewTrip={() => setNewTripOpen(true)}
        />

        <footer className="module corner-tick relative grid grid-cols-2 gap-6 p-6 md:grid-cols-4">
          {[
            [t("footer.doc"), "PACKLOG · ARCHIVE"],
            [t("footer.build"), "PL · 0.7.0 · FIELD"],
            [t("footer.encoding"), "UTF-8 / KGM / ML"],
            [t("footer.signed"), "@you · 2026.04.25"],
          ].map(([k, v]) => (
            <div key={k}>
              <div className="font-mono text-[9px] tracking-[0.22em] text-muted-foreground">{k}</div>
              <div className="mt-1 font-mono text-xs">{v}</div>
            </div>
          ))}
        </footer>
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
