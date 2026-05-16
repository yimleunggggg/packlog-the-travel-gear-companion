import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Check, Globe, Menu } from "lucide-react";
import { AccountMenu } from "@/components/auth/AccountMenu";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navLinkClass =
  "flex min-h-11 items-center rounded-md px-3 font-mono text-[11px] tracking-[0.18em] text-foreground transition hover:bg-surface-2";

export function TopBar({
  showPhase: _showPhase = false,
}: {
  phase?: "PACK" | "REVIEW";
  onPhase?: (p: "PACK" | "REVIEW") => void;
  /** @deprecated Phase switching moved to trip briefing; kept for API compatibility. */
  showPhase?: boolean;
}) {
  const { t, lang, setLang } = useI18n();
  const { user, authConfigured, ready, openLoginUi, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const userLabel =
    user?.email ?? user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? user?.phone ?? "";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <div className="mx-auto flex max-w-[1480px] items-center gap-3 px-4 py-2.5 md:gap-5 md:px-6">
        <Link to="/" search={{ tag: undefined }} className="flex shrink-0 items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-md border border-border-strong bg-surface text-foreground shadow-sm">
            <span className="font-mono text-[12px] font-bold">PL</span>
          </div>
          <div className="leading-tight">
            <div className="font-mono text-[11px] tracking-[0.22em] text-foreground">PACKLOG</div>
            {t("brand.tagline").trim() ? (
              <div className="hidden font-mono text-[9px] tracking-[0.3em] text-muted-foreground lg:block">
                {t("brand.tagline")}
              </div>
            ) : null}
          </div>
        </Link>

        <nav className="hidden items-center gap-0.5 rounded-md border border-border-strong bg-surface p-0.5 md:flex">
          <Link
            to="/"
            search={{ tag: undefined }}
            activeOptions={{ exact: true }}
            className="flex min-h-0 min-w-0 items-center justify-center rounded px-2.5 py-1 font-mono text-[10px] tracking-[0.18em] text-muted-foreground transition hover:text-foreground [&.active]:bg-foreground [&.active]:text-background"
          >
            {t("nav.archive")}
          </Link>
          <Link
            to="/library"
            className="flex min-h-0 min-w-0 items-center justify-center rounded px-2.5 py-1 font-mono text-[10px] tracking-[0.18em] text-muted-foreground transition hover:text-foreground [&.active]:bg-foreground [&.active]:text-background"
          >
            {t("nav.library")}
          </Link>
          <Link
            to="/community"
            search={{ tag: undefined, kind: undefined }}
            className="flex min-h-0 min-w-0 items-center justify-center rounded px-2.5 py-1 font-mono text-[10px] tracking-[0.18em] text-muted-foreground transition hover:text-foreground [&.active]:bg-foreground [&.active]:text-background"
          >
            {t("nav.community")}
          </Link>
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <div className="hidden md:block">
            <AccountMenu />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={t("lang.switcher.aria")}
                className={cn(
                  "grid h-10 w-10 shrink-0 place-items-center rounded-md border border-border-strong bg-surface text-muted-foreground transition",
                  "hover:border-foreground/30 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/50 md:h-9 md:w-9",
                )}
              >
                <Globe className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[11rem]">
              <DropdownMenuItem
                className="flex cursor-pointer items-center justify-between gap-3 font-sans text-sm"
                onSelect={() => setLang("zh")}
              >
                <span>{t("lang.menu.zh")}</span>
                {lang === "zh" ? (
                  <Check className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                ) : null}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex cursor-pointer items-center justify-between gap-3 font-sans text-sm"
                onSelect={() => setLang("en")}
              >
                <span>{t("lang.menu.en")}</span>
                {lang === "en" ? (
                  <Check className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                ) : null}
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled
                className="flex cursor-not-allowed flex-col items-stretch gap-0.5 py-2 font-sans text-sm text-muted-foreground"
              >
                <span className="flex items-center justify-between gap-3">
                  <span>{t("lang.menu.ja")}</span>
                </span>
                <span className="text-[10px] leading-tight text-muted-foreground/90">
                  {t("lang.menu.comingSoon")}
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label={t("nav.mobile.menuAria")}
                aria-expanded={mobileOpen}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-border-strong bg-surface text-muted-foreground transition hover:border-foreground/30 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/50 md:hidden"
              >
                <Menu className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
              </button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[min(100vw-2rem,20rem)] border-l border-border p-0"
            >
              <SheetTitle className="sr-only">{t("nav.mobile.sheetTitle")}</SheetTitle>
              <nav
                className="flex flex-col gap-0.5 px-3 pb-6 pt-12"
                aria-label={t("nav.mobile.label")}
              >
                <SheetClose asChild>
                  <Link
                    to="/"
                    search={{ tag: undefined }}
                    activeOptions={{ exact: true }}
                    className={cn(
                      navLinkClass,
                      "[&.active]:bg-foreground [&.active]:text-background",
                    )}
                  >
                    {t("nav.archive")}
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link
                    to="/library"
                    className={cn(
                      navLinkClass,
                      "[&.active]:bg-foreground [&.active]:text-background",
                    )}
                  >
                    {t("nav.library")}
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link
                    to="/community"
                    search={{ tag: undefined, kind: undefined }}
                    className={cn(
                      navLinkClass,
                      "[&.active]:bg-foreground [&.active]:text-background",
                    )}
                  >
                    {t("nav.community")}
                  </Link>
                </SheetClose>

                <div className="my-3 border-t border-border" />

                {authConfigured && ready ? (
                  user ? (
                    <>
                      <div className="break-all px-3 py-2 font-mono text-[10px] leading-snug text-muted-foreground">
                        {userLabel}
                      </div>
                      <SheetClose asChild>
                        <button
                          type="button"
                          className={cn(
                            navLinkClass,
                            "w-full text-left text-destructive hover:bg-destructive/10",
                          )}
                          onClick={() => void signOut()}
                        >
                          {t("nav.signOut")}
                        </button>
                      </SheetClose>
                    </>
                  ) : (
                    <SheetClose asChild>
                      <button
                        type="button"
                        className={cn(navLinkClass, "w-full text-left")}
                        onClick={() => openLoginUi()}
                      >
                        {t("nav.signIn")}
                      </button>
                    </SheetClose>
                  )
                ) : null}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
