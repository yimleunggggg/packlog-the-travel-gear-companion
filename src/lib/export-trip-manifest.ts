import type { Trip } from "@/lib/packlog-data";
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

const CSV_SEP = ";";

function csvCell(value: string): string {
  if (/[";\r\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function csvRow(cells: string[]): string {
  return cells.map(csvCell).join(CSV_SEP);
}

/** kg string with comma decimal (German Excel / locale DE style). */
function formatKgCommaFromGrams(grams: number): string {
  return formatKgFromGrams(grams).replace(".", ",");
}

/**
 * UTF-8 CSV tuned for Excel (German-style): first line `sep=;`, semicolon columns,
 * comma decimals in kg column. Open directly in Excel; save as .xlsx if needed.
 */
export function buildTripManifestCsvForExcel(
  trip: Trip,
  lang: Lang,
  t: (key: string) => string,
): string {
  const rows: string[] = [];
  rows.push(`sep=${CSV_SEP}`);

  const pushMeta = (label: string, value: string) => rows.push(csvRow([label, value]));
  pushMeta(t("trips.create.name"), trip.title);
  pushMeta(t("trips.create.dest"), formatDestinations(trip.destinations, lang));
  pushMeta(
    `${t("brief.tape.dep")} / ${t("brief.tape.dur")}`,
    `${trip.startDate} · ${trip.days} ${t("brief.days")}`,
  );
  pushMeta(t("trips.create.climate"), trip.climate);
  pushMeta(
    t("trips.create.scenarios"),
    tripScenarios(trip)
      .map((s) => t(`scenario.${s}`))
      .join(" · "),
  );
  rows.push("");

  rows.push(
    csvRow([
      t("export.csv.col.bag"),
      t("export.csv.col.item"),
      t("export.csv.col.qty"),
      t("export.csv.col.unitWeightG"),
      t("export.csv.col.lineWeightG"),
      t("export.csv.col.lineWeightKgDe"),
      t("export.csv.col.category"),
      t("export.csv.col.ownership"),
      t("export.csv.col.packed"),
    ]),
  );

  for (const c of trip.containers) {
    const cname = lang === "zh" ? (c.nameZh ?? c.name) : c.name;
    const limit = c.type === "checked" ? `（≤${c.maxKg}kg）` : "";
    const bagCol = `${cname}${limit}`;
    if (c.items.length === 0) {
      rows.push(csvRow([bagCol, t("export.csv.emptyBag"), "", "", "", "", "", "", ""]));
      continue;
    }
    for (const it of c.items) {
      const nm = pickName(lang, it);
      const lineG = itemLineGrams(it);
      rows.push(
        csvRow([
          bagCol,
          nm,
          String(it.qty),
          String(it.weightG),
          String(lineG),
          formatKgCommaFromGrams(lineG),
          t(`cat.${it.category}`),
          t(`own.${it.ownership}`),
          it.status === "packed" ? t("export.csv.val.yes") : t("export.csv.val.no"),
        ]),
      );
    }
  }

  rows.push("");
  const sumG = tripTotalGrams(trip);
  const baseG = tripBaseGrams(trip);
  rows.push(
    csvRow([
      t("export.csv.summary.totalKg"),
      formatKgCommaFromGrams(sumG),
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ]),
  );
  rows.push(
    csvRow([
      t("export.csv.summary.baseKg"),
      formatKgCommaFromGrams(baseG),
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ]),
  );
  rows.push(
    csvRow([
      t("export.csv.summary.bags"),
      String(trip.containers.length),
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ]),
  );

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
