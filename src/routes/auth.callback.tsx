import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { packlogBtnPrimary, packlogBtnSm } from "@/lib/packlog-button-classes";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-client";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      const client = getSupabaseBrowserClient();
      if (!client) {
        setError("Supabase not configured");
        return;
      }

      const sp0 = new URLSearchParams(window.location.search);
      const nextRaw = sp0.get("next");
      const safe = nextRaw && nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : "/";

      const url = window.location.href;
      const hasCode = sp0.has("code");

      if (hasCode) {
        const { error: ex } = await client.auth.exchangeCodeForSession(url);
        if (ex) {
          setError(ex.message);
          return;
        }
      } else {
        const { error: ex } = await client.auth.getSession();
        if (ex) {
          setError(ex.message);
          return;
        }
      }

      navigate({ href: safe });
    };

    void run();
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-4">
      <div className="font-mono text-[10px] tracking-[0.22em] text-signal">AUTH · CALLBACK</div>
      <p className="text-sm text-muted-foreground">{error ? error : "Completing sign-in…"}</p>
      {error && (
        <button
          type="button"
          onClick={() => navigate({ to: "/", search: { tag: undefined } })}
          className={cn(packlogBtnPrimary, packlogBtnSm)}
        >
          Back home
        </button>
      )}
    </div>
  );
}
