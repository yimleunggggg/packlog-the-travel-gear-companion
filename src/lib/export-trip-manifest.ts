import type { Trip } from "@/lib/packlog-data";
import type { Lang } from "@/lib/i18n";
import { pickName } from "@/lib/i18n";
import { formatDestinations } from "@/lib/destinations";
import { tripScenarios } from "@/lib/trip-scenarios";
import { formatKgFromGrams } from "@/lib/weight-provenance";
import { tripBaseGrams, tripTotalGrams } from "@/lib/trip-weight-stats";

/** Strip characters unsafe in filenames (cross-platform). */
export function safeManifestBasename(title: string, tripId: string): string {
  const s = title.replace(/[/\\?%*:|"<>]/g, "_").trim();
  return (s.length > 0 ? s : tripId).slice(0, 72);
}

/**
 * Plain-text packing manifest for download / print.
 * `t` must be the same i18n function used in UI (for labels).
 */
export function buildTripManifestText(trip: Trip, lang: Lang, t: (key: string) => string): string {
  const lines: string[] = [];
  lines.push(`PACKLOG · ${trip.title}`);
  lines.push(`${t("trips.create.dest")}: ${formatDestinations(trip.destinations, lang)}`);
  lines.push(`${t("brief.tape.dep")} ${trip.startDate} · ${trip.days} ${t("brief.days")}`);
  lines.push(`${t("trips.create.climate")}: ${trip.climate}`);
  lines.push(
    `${t("trips.create.scenarios")}: ${tripScenarios(trip)
      .map((s) => t(`scenario.${s}`))
      .join(" · ")}`,
  );
  lines.push("");

  const sumG = tripTotalGrams(trip);
  const baseG = tripBaseGrams(trip);
  for (const c of trip.containers) {
    const cname = lang === "zh" ? (c.nameZh ?? c.name) : c.name;
    const limit = c.type === "checked" ? `（≤${c.maxKg}kg）` : "";
    lines.push(`── ${cname}${limit} ──`);
    for (const it of c.items) {
      const nm = pickName(lang, it);
      const mark = it.status === "packed" ? "✓" : "✗";
      lines.push(
        `${mark} ${nm} ×${it.qty} · ${it.weightG}g · ${t(`cat.${it.category}`)} · ${t(`own.${it.ownership}`)}`,
      );
    }
    if (c.items.length === 0) lines.push("  —");
    lines.push("");
  }

  lines.push(
    `${t("brief.stat.mass")} ${formatKgFromGrams(sumG)} kg · ${t("brief.stat.baseMass")} ${formatKgFromGrams(baseG)} kg`,
  );
  lines.push(`${t("brief.stat.bags")}: ${String(trip.containers.length).padStart(2, "0")}`);
  return lines.join("\n");
}

export function downloadManifestFile(tripId: string, title: string, content: string): void {
  const base = safeManifestBasename(title, tripId);
  const stamp = new Date().toISOString().slice(0, 10);
  const filename = `PACKLOG-${base}-${stamp}.txt`;
  const blob = new Blob(["\uFEFF", content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
