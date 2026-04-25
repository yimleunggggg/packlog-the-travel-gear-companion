import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/packlog/TopBar";
import { GearLibraryPanel } from "@/components/packlog/GearLibraryPanel";
import { usePacklog } from "@/lib/packlog-store";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "Gear Library · PACKLOG" },
      { name: "description", content: "Your standing arsenal — long-lived gear with usage history across every trip." },
    ],
  }),
  component: LibraryPage,
});

function LibraryPage() {
  const { t } = useI18n();
  const { trips, library, addFromLibrary } = usePacklog();
  // No "current trip" on this page — pick the most recent non-REVIEW trip as default target.
  const defaultTrip = trips.find((tr) => tr.phase !== "REVIEW") ?? trips[0];

  return (
    <div className="min-h-screen pb-24">
      <TopBar showPhase={false} />
      <main className="mx-auto max-w-[1480px] space-y-6 px-4 py-6 md:px-6">
        <header className="flex items-end justify-between gap-4">
          <div>
            <div className="font-mono text-[10px] tracking-[0.28em] text-signal">
              {t("library.head")}
            </div>
            <h1 className="mt-2 font-display text-4xl leading-[1.05] md:text-5xl">
              {t("library.title")}
            </h1>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              {t("library.subtitle")}
            </p>
          </div>
          {defaultTrip && (
            <div className="text-right font-mono text-[10px] tracking-[0.18em] text-muted-foreground">
              <div>+ ADD → </div>
              <div className="mt-0.5 text-foreground">{defaultTrip.title}</div>
            </div>
          )}
        </header>

        <GearLibraryPanel
          library={library}
          onAddToTrip={(g) => defaultTrip && addFromLibrary(defaultTrip.id, g)}
        />
      </main>
    </div>
  );
}
