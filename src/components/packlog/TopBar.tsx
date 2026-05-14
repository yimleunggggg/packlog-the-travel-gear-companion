import { Link } from "@tanstack/react-router";
import { AccountMenu } from "@/components/auth/AccountMenu";
import { useI18n, type Lang } from "@/lib/i18n";

export function TopBar({
  showPhase: _showPhase = false,
}: {
  phase?: "PACK" | "REVIEW";
  onPhase?: (p: "PACK" | "REVIEW") => void;
  /** @deprecated Phase switching moved to trip briefing; kept for API compatibility. */
  showPhase?: boolean;
}) {
  const { t, lang, setLang } = useI18n();
  const langs: Lang[] = ["en", "zh", "ja"];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <div className="mx-auto flex max-w-[1480px] items-center gap-3 px-4 py-2.5 md:gap-5 md:px-6">
        {/* Logo — compact, tagline hidden on small screens */}
        <Link to="/" className="flex shrink-0 items-center gap-2">
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

        {/* Nav — clearer separation, more presence */}
        <nav className="flex items-center gap-0.5 rounded-md border border-border-strong bg-surface p-0.5">
          <Link
            to="/"
            activeOptions={{ exact: true }}
            className="flex min-h-10 min-w-0 items-center justify-center rounded px-2.5 py-2 font-mono text-[10px] tracking-[0.18em] text-muted-foreground transition hover:text-foreground md:min-h-0 md:py-1 [&.active]:bg-foreground [&.active]:text-background"
          >
            {t("nav.archive")}
          </Link>
          <Link
            to="/library"
            className="flex min-h-10 min-w-0 items-center justify-center rounded px-2.5 py-2 font-mono text-[10px] tracking-[0.18em] text-muted-foreground transition hover:text-foreground md:min-h-0 md:py-1 [&.active]:bg-foreground [&.active]:text-background"
          >
            {t("nav.library")}
          </Link>
          <Link
            to="/community"
            className="flex min-h-10 min-w-0 items-center justify-center rounded px-2.5 py-2 font-mono text-[10px] tracking-[0.18em] text-muted-foreground transition hover:text-foreground md:min-h-0 md:py-1 [&.active]:bg-foreground [&.active]:text-background"
          >
            {t("nav.community")}
          </Link>
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <AccountMenu />
          {/* Lang switcher — subtle */}
          <div className="flex shrink-0 items-center gap-0.5 rounded-md border border-border-strong bg-surface p-0.5">
            {langs.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                className={`min-h-10 min-w-[2.25rem] px-1.5 py-2 font-mono text-[10px] tracking-[0.15em] transition md:min-h-0 md:min-w-0 md:py-0.5 ${
                  lang === l
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
