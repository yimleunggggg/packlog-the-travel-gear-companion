import { createFileRoute, Outlet } from "@tanstack/react-router";
import { TopBar } from "@/components/packlog/TopBar";

export const Route = createFileRoute("/community")({
  component: CommunityLayout,
});

function CommunityLayout() {
  return (
    <div className="min-h-dvh pb-[calc(6rem+env(safe-area-inset-bottom))]">
      <TopBar showPhase={false} />
      <Outlet />
    </div>
  );
}
