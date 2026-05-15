import type { Item, ReviewVerdict, Trip, WeightSource } from "@/lib/packlog-data";
import type { Lang } from "@/lib/i18n";
import { pickName } from "@/lib/i18n";
import { formatDestinations } from "@/lib/destinations";
import { tripScenarios } from "@/lib/trip-scenarios";
import { formatKgFromGrams } from "@/lib/weight-provenance";
import { itemLineGrams, tripBaseGrams, tripTotalGrams } from "@/lib/trip-weight-stats";

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
      const extras: string[] = [];
      if (it.brand?.trim()) extras.push(it.brand.trim());
      if (it.model?.trim()) extras.push(it.model.trim());
      if (it.sku?.trim()) extras.push(it.sku.trim());
      if (it.note?.trim()) extras.push(it.note.trim());
      const suffix = extras.length ? ` (${extras.join(" · ")})` : "";
      lines.push(
        `${mark} ${nm}${suffix} ×${it.qty} · ${it.weightG}g · ${t(`cat.${it.category}`)} · ${t(`own.${it.ownership}`)}`,
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

const CSV_SEP = ",";

function csvCell(value: string): string {
  if (/[",\r\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function csvRow(cells: string[]): string {
  return cells.map(csvCell).join(CSV_SEP);
}

function weightSourceExportLabel(t: (key: string) => string, src: WeightSource | undefined): string {
  if (!src) return "";
  switch (src) {
    case "user":
      return t("weight.tier.user");
    case "ai_estimate":
      return t("weight.tier.ai");
    case "community_median":
      return t("weight.tier.community");
    case "library":
      return t("export.csv.weightSource.library");
    case "spec":
      return t("export.csv.weightSource.spec");
    default:
      return "";
  }
}

function verdictExportLabel(t: (key: string) => string, v: ReviewVerdict): string {
  if (v == null) return "";
  return t(`review.verdict.${v}`);
}

function yn(t: (key: string) => string, v: boolean | undefined): string {
  return v ? t("export.csv.val.yes") : t("export.csv.val.no");
}

function itemExportCells(
  lang: Lang,
  t: (key: string) => string,
  bagCol: string,
  it: Item,
): string[] {
  const nm = pickName(lang, it);
  const lineG = itemLineGrams(it);
  return [
    bagCol,
    nm,
    it.brand?.trim() ?? "",
    it.model?.trim() ?? "",
    it.sku?.trim() ?? "",
    it.note?.trim() ?? "",
    String(it.qty),
    String(it.weightG),
    String(lineG),
    formatKgFromGrams(lineG),
    t(`cat.${it.category}`),
    t(`own.${it.ownership}`),
    it.status === "packed" ? t("export.csv.val.yes") : t("export.csv.val.no"),
    weightSourceExportLabel(t, it.weightSource),
    verdictExportLabel(t, it.verdict),
    it.utility == null ? "" : String(it.utility),
    yn(t, it.isWorn),
    yn(t, it.isConsumable),
    it.reviewConfirmed ? t("export.csv.val.yes") : t("export.csv.val.no"),
  ];
}

/**
 * UTF-8 CSV (RFC 4180): comma-separated columns with quoted fields when needed.
 * BOM is added in `downloadManifestFile` so Numbers / Excel / Sheets split columns reliably.
 */
export function buildTripManifestCsvForExcel(trip: Trip, lang: Lang, t: (key: string) => string): string {
  const rows: string[] = [];

  const pushMeta = (label: string, value: string) => rows.push(csvRow([label, value]));
  pushMeta(t("trips.create.name"), trip.title);
  pushMeta(t("trips.create.dest"), formatDestinations(trip.destinations, lang));
  pushMeta(`${t("brief.tape.dep")} / ${t("brief.tape.dur")}`, `${trip.startDate} · ${trip.days} ${t("brief.days")}`);
  pushMeta(t("trips.create.climate"), trip.climate);
  pushMeta(
    t("trips.create.scenarios"),
    tripScenarios(trip)
      .map((s) => t(`scenario.${s}`))
      .join(" · "),
  );
  rows.push("");

  const headerCells = [
    t("export.csv.col.bag"),
    t("export.csv.col.item"),
    t("export.csv.col.brand"),
    t("export.csv.col.model"),
    t("export.csv.col.sku"),
    t("export.csv.col.note"),
    t("export.csv.col.qty"),
    t("export.csv.col.unitWeightG"),
    t("export.csv.col.lineWeightG"),
    t("export.csv.col.lineWeightKg"),
    t("export.csv.col.category"),
    t("export.csv.col.ownership"),
    t("export.csv.col.packed"),
    t("export.csv.col.weightSource"),
    t("export.csv.col.verdict"),
    t("export.csv.col.utility"),
    t("export.csv.col.worn"),
    t("export.csv.col.consumable"),
    t("export.csv.col.reviewConfirmed"),
  ];
  const dataColCount = headerCells.length;
  rows.push(csvRow(headerCells));

  const padSummary = (label: string, value: string) =>
    csvRow([label, value, ...Array(Math.max(0, dataColCount - 2)).fill("")]);

  for (const c of trip.containers) {
    const cname = lang === "zh" ? (c.nameZh ?? c.name) : c.name;
    const limit = c.type === "checked" ? `（≤${c.maxKg}kg）` : "";
    const bagCol = `${cname}${limit}`;
    if (c.items.length === 0) {
      rows.push(
        csvRow([
          bagCol,
          t("export.csv.emptyBag"),
          ...Array(Math.max(0, dataColCount - 2)).fill(""),
        ]),
      );
      continue;
    }
    for (const it of c.items) {
      rows.push(csvRow(itemExportCells(lang, t, bagCol, it)));
    }
  }

  rows.push("");
  const sumG = tripTotalGrams(trip);
  const baseG = tripBaseGrams(trip);
  rows.push(padSummary(t("export.csv.summary.totalKg"), formatKgFromGrams(sumG)));
  rows.push(padSummary(t("export.csv.summary.baseKg"), formatKgFromGrams(baseG)));
  rows.push(padSummary(t("export.csv.summary.bags"), String(trip.containers.length)));

  return rows.join("\r\n");
}

export function downloadManifestFile(
  tripId: string,
  title: string,
  content: string,
  fileKind: "csv" | "txt" = "csv",
): void {
  const base = safeManifestBasename(title, tripId);
  const stamp = new Date().toISOString().slice(0, 10);
  const ext = fileKind === "csv" ? "csv" : "txt";
  const filename = `PACKLOG-${base}-${stamp}.${ext}`;
  const mime = fileKind === "csv" ? "text/csv;charset=utf-8" : "text/plain;charset=utf-8";
  const blob = new Blob(["\uFEFF", content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 3000);
}
