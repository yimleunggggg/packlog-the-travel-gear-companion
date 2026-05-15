import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { TopBar } from "@/components/packlog/TopBar";
import { GearLibraryPanel } from "@/components/packlog/GearLibraryPanel";
import { POST_AUTH_EVENT, type PostAuthIntent } from "@/lib/post-auth-intent";
import { usePacklog } from "@/lib/packlog-store";
import { useI18n } from "@/lib/i18n";
import { packlogHint, packlogPageTitle } from "@/lib/packlog-button-classes";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "Gear Library · PACKLOG" },
      {
        name: "description",
        content: "Your standing arsenal — long-lived gear with usage history across every trip.",
      },
    ],
  }),
  component: LibraryPage,
});

function LibraryPage() {
  const { t } = useI18n();
  const { trips, library, addFromLibrary } = usePacklog();

  useEffect(() => {
    const onResume = (e: Event) => {
      const d = (e as CustomEvent<PostAuthIntent>).detail;
      if (d.kind !== "libraryAddGear") return;
      const target = trips.find((tr) => tr.id === d.tripId);
      if (!target || target.phase === "REVIEW") return;
      const g = library.find((x) => x.id === d.gearId);
      if (g) addFromLibrary(target.id, g);
    };
    window.addEventListener(POST_AUTH_EVENT, onResume as EventListener);
    return () => window.removeEventListener(POST_AUTH_EVENT, onResume as EventListener);
  }, [trips, library, addFromLibrary]);

  return (
    <div className="min-h-dvh pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      <TopBar showPhase={false} />
      <main className="mx-auto max-w-[1480px] space-y-6 px-4 py-6 md:px-6">
        <header className="flex items-end justify-between gap-4">
          <div>
            <div className="font-mono text-[10px] tracking-[0.28em] text-signal">
              {t("library.head")}
            </div>
            <h1 className={cn("mt-2", packlogPageTitle)}>{t("library.title")}</h1>
            <p className={cn("mt-2 max-w-md", packlogHint)}>{t("library.subtitle")}</p>
          </div>
        </header>

        <GearLibraryPanel
          trips={trips}
          library={library}
          onAddToTrip={(tripId, g) => addFromLibrary(tripId, g)}
        />
      </main>
    </div>
  );
}
