/** Client tier sent in `/api/ai/*` JSON body; server still enforces Pro + optional dev bypass. */
export function packlogSubscriptionTier(): "pro" | "free" {
  const raw = String(import.meta.env.VITE_PACKLOG_SUBSCRIPTION_TIER ?? "")
    .toLowerCase()
    .trim();
  return raw === "pro" ? "pro" : "free";
}
