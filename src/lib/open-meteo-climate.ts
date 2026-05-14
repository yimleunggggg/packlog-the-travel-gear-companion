/**
 * Approximate climate string from Open-Meteo (geocoding + weekly forecast).
 * Fails gracefully — callers should handle null.
 */

const FETCH_MS = 14_000;

async function fetchJson<T>(url: string): Promise<T | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

async function geocodeFirstHit(query: string): Promise<{
  latitude: number;
  longitude: number;
  name: string;
} | null> {
  const q = query.trim();
  if (!q) return null;

  const langParams = ["", "zh", "en"] as const;
  for (const lang of langParams) {
    const u = new URL("https://geocoding-api.open-meteo.com/v1/search");
    u.searchParams.set("name", q);
    u.searchParams.set("count", "8");
    if (lang) u.searchParams.set("language", lang);

    const geo = await fetchJson<{
      results?: { latitude: number; longitude: number; name: string }[];
    }>(u.toString());
    const r = geo?.results?.[0];
    if (r && Number.isFinite(r.latitude) && Number.isFinite(r.longitude)) return r;
  }
  return null;
}

export async function fetchApproxClimateLabel(placeName: string): Promise<string | null> {
  const q = placeName.trim();
  if (!q) return null;
  try {
    const r = await geocodeFirstHit(q);
    if (!r) return null;

    const fcUrl = new URL("https://api.open-meteo.com/v1/forecast");
    fcUrl.searchParams.set("latitude", String(r.latitude));
    fcUrl.searchParams.set("longitude", String(r.longitude));
    fcUrl.searchParams.set("daily", "temperature_2m_max,temperature_2m_min");
    fcUrl.searchParams.set("forecast_days", "7");

    const fc = await fetchJson<{
      daily?: {
        temperature_2m_max?: number[];
        temperature_2m_min?: number[];
      };
    }>(fcUrl.toString());
    if (!fc) return null;

    const maxArr = fc.daily?.temperature_2m_max ?? [];
    const minArr = fc.daily?.temperature_2m_min ?? [];
    if (maxArr.length === 0 || minArr.length === 0) return null;

    const hi = Math.round(Math.max(...maxArr.filter((x) => Number.isFinite(x))));
    const lo = Math.round(Math.min(...minArr.filter((x) => Number.isFinite(x))));
    if (!Number.isFinite(hi) || !Number.isFinite(lo)) return null;

    return `≈ ${lo}–${hi}°C · ${r.name} (Open-Meteo)`;
  } catch {
    return null;
  }
}
