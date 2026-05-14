import { Link, useRouterState } from "@tanstack/react-router";
import { Backpack, MapPinned, UsersRound } from "lucide-react";
import { useI18n } from "@/lib/i18n";

function hideTabBarForPath(pathname: string): boolean {
  if (pathname.startsWith("/auth")) return true;
  return /^\/trip\/[^/]+\/pack\/?$/.test(pathname);
}

export function MobileTabBar() {
  const { t } = useI18n();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (hideTabBarForPath(pathname)) return null;

  const tripActive = pathname === "/" || pathname.startsWith("/trip/");
  const libraryActive = pathname.startsWith("/library");
  const communityActive = pathname.startsWith("/community");

  const tabClass = (active: boolean) =>
    `flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 border-t-2 px-1 py-1.5 font-mono text-[9px] tracking-[0.12em] transition ${
      active
        ? "border-signal bg-signal-soft/50 text-signal"
        : "border-transparent text-muted-foreground hover:bg-surface-2 hover:text-foreground"
    }`;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
      aria-label={t("nav.mobile.label")}
    >
      <div className="mx-auto flex max-w-lg">
        <Link
          to="/"
          className={tabClass(tripActive)}
          aria-current={tripActive ? "page" : undefined}
        >
          <MapPinned className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
          <span>{t("nav.archive")}</span>
        </Link>
        <Link
          to="/library"
          className={tabClass(libraryActive)}
          aria-current={libraryActive ? "page" : undefined}
        >
          <Backpack className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
          <span>{t("nav.library")}</span>
        </Link>
        <Link
          to="/community"
          className={tabClass(communityActive)}
          aria-current={communityActive ? "page" : undefined}
        >
          <UsersRound className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
          <span>{t("nav.community")}</span>
        </Link>
      </div>
    </nav>
  );
}
