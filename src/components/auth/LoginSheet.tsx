import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";

type Props = {
  open: boolean;
  onClose: () => void;
  signInWithOtp: (
    email: string,
    opts?: { marketingOptIn?: boolean },
  ) => Promise<{ error: Error | null }>;
  signInWithGoogle: (opts?: { marketingOptIn?: boolean }) => Promise<{ error: Error | null }>;
  authConfigured: boolean;
};

export function LoginSheet({
  open,
  onClose,
  signInWithOtp,
  signInWithGoogle,
  authConfigured,
}: Props) {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [busy, setBusy] = useState<"otp" | "google" | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [otpCooldownSec, setOtpCooldownSec] = useState(0);

  useEffect(() => {
    if (otpCooldownSec <= 0) return;
    const id = window.setTimeout(() => setOtpCooldownSec((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearTimeout(id);
  }, [otpCooldownSec]);

  useEffect(() => {
    if (!open) return;
    setMarketingOptIn(false);
    setMsg(null);
    setErr(null);
    setOtpCooldownSec(0);
  }, [open]);

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    if (!email.trim()) {
      setErr(t("auth.error.email"));
      return;
    }
    setBusy("otp");
    const { error } = await signInWithOtp(email, { marketingOptIn });
    setBusy(null);
    if (error) {
      setErr(error.message);
      return;
    }
    setMsg(t("auth.otp.sent"));
    setOtpCooldownSec(90);
  };

  const google = async () => {
    setErr(null);
    setMsg(null);
    setBusy("google");
    const { error } = await signInWithGoogle({ marketingOptIn });
    if (error) {
      setBusy(null);
      setErr(error.message);
    }
    // OAuth redirects — leave busy state
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="scrim fixed inset-0 z-[60] flex touch-none flex-col justify-end overscroll-none p-0"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            className="module corner-tick relative max-h-[min(85dvh,560px)] w-full touch-pan-y overflow-y-auto overscroll-y-contain rounded-t-lg border-b-0 border-border bg-background p-6 pb-[max(2.5rem,calc(env(safe-area-inset-bottom)+1.25rem))] shadow-2xl"
          >
            <div className="mx-auto max-w-md">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <div className="font-mono text-[10px] tracking-[0.22em] text-signal">
                    {t("auth.kicker")}
                  </div>
                  <h2 className="mt-1 font-display text-2xl">{t("auth.title")}</h2>
                  <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                    {t("auth.subtitle")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="font-mono text-[10px] text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>

              {!authConfigured && (
                <p className="rounded border border-warn/40 bg-warn/10 px-3 py-2 font-mono text-[11px] text-foreground">
                  {t("auth.error.config")}
                </p>
              )}

              <form onSubmit={sendOtp} className="mt-4 space-y-3">
                <label className="block">
                  <span className="mb-1 block font-mono text-[9px] tracking-[0.15em] text-muted-foreground">
                    {t("auth.email")}
                  </span>
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={!authConfigured || busy !== null || otpCooldownSec > 0}
                    placeholder="you@example.com"
                    className="w-full rounded border border-border-strong bg-background px-3 py-2 text-sm focus:border-signal focus:outline-none"
                  />
                </label>

                <label className="flex cursor-pointer gap-3 rounded border border-border-strong bg-surface/80 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={marketingOptIn}
                    onChange={(e) => setMarketingOptIn(e.target.checked)}
                    disabled={!authConfigured || busy !== null || otpCooldownSec > 0}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-[color:var(--signal)]"
                  />
                  <span className="min-w-0">
                    <span className="block font-mono text-[11px] leading-snug text-foreground">
                      {t("auth.marketing.label")}
                    </span>
                    <span className="mt-1 block font-mono text-[9px] leading-relaxed text-muted-foreground">
                      {t("auth.marketing.hint")}
                    </span>
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={!authConfigured || busy !== null || otpCooldownSec > 0}
                  className="w-full rounded border border-signal bg-signal py-2.5 font-mono text-[11px] tracking-[0.18em] text-signal-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {busy === "otp"
                    ? t("auth.otp.sending")
                    : otpCooldownSec > 0
                      ? t("auth.otp.waitRetry").replace("{s}", String(otpCooldownSec))
                      : t("auth.otp.cta")}
                </button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-background px-2 font-mono text-[9px] tracking-[0.2em] text-muted-foreground">
                    {t("auth.divider")}
                  </span>
                </div>
              </div>

              <button
                type="button"
                disabled={!authConfigured || busy !== null}
                onClick={() => void google()}
                className="flex w-full items-center justify-center gap-2 rounded border border-border-strong bg-surface py-2.5 font-mono text-[11px] tracking-[0.15em] hover:border-signal hover:bg-signal-soft disabled:cursor-not-allowed disabled:opacity-40"
              >
                <GoogleGlyph />
                {busy === "google" ? "…" : t("auth.google")}
              </button>

              <div role="status" aria-live="polite" className="min-h-[1.25rem]">
                {msg && (
                  <p className="mt-4 rounded border border-signal/30 bg-signal-soft/30 px-3 py-2 font-mono text-[11px] text-foreground">
                    {msg}
                  </p>
                )}
                {err && <p className="mt-2 font-mono text-[11px] text-destructive">{err}</p>}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
