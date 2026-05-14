import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";

export function AccountMenu() {
  const { t } = useI18n();
  const { user, authConfigured, ready, openLoginUi, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  if (!authConfigured || !ready) return null;

  if (!user) {
    return (
      <button
        type="button"
        onClick={openLoginUi}
        className="rounded border border-border-strong bg-surface px-2.5 py-1.5 font-mono text-[10px] tracking-[0.15em] text-muted-foreground hover:border-signal hover:text-foreground"
      >
        {t("nav.signIn")}
      </button>
    );
  }

  const label =
    user.email ?? user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.phone ?? "…";

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex max-w-[min(52vw,11rem)] items-center gap-1.5 rounded border border-border-strong bg-surface px-2 py-1.5 font-mono text-[10px] tracking-[0.12em] text-foreground hover:border-signal"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-signal/20 text-[10px] font-bold text-signal">
          {(label[0] ?? "?").toUpperCase()}
        </span>
        <span className="min-w-0 truncate">{label}</span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+6px)] z-50 min-w-[10rem] rounded-md border border-border-strong bg-background py-1 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            className="block w-full px-3 py-2 text-left font-mono text-[10px] tracking-[0.12em] text-muted-foreground hover:bg-surface-2 hover:text-foreground"
            onClick={() => {
              void signOut();
              setOpen(false);
            }}
          >
            {t("nav.signOut")}
          </button>
        </div>
      )}
    </div>
  );
}
