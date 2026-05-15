import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthGate } from "@/components/auth/AuthGate";
import { usePacklog } from "@/lib/packlog-store";
import { useI18n, pickName } from "@/lib/i18n";
import type { Item, Trip } from "@/lib/packlog-data";
import { packlogSubscriptionTier } from "@/lib/packlog-subscription-tier";
import { containerDisplayLabel } from "@/lib/container-label";
import { tripShortSelectLabel } from "@/lib/trip-list-label";
import { LIBRARY_CATEGORY_ORDER } from "@/lib/library-category-stats";
import { assignableContainers, unassignedContainerId } from "@/lib/unassigned-container";
import { packlogBtnPrimary, packlogBtnSm, packlogSectionTitle } from "@/lib/packlog-button-classes";
import { cn } from "@/lib/utils";
import { PACKLOG_CATEGORY_HEX } from "@/lib/packlog-category-colors";

type UrlImportRow = {
  name: string;
  name_zh: string | null;
  brand: string | null;
  weight_g: number | null;
  quantity: number;
  category: Item["category"];
  note: string | null;
};

const ownColor: Record<Item["ownership"], string> = {
  owned: "var(--success)",
  wishlist: "var(--info)",
  borrowed: "var(--warn)",
  undecided: "var(--muted-foreground)",
};

const ownershipOptions: Item["ownership"][] = ["owned", "wishlist", "borrowed", "undecided"];

function rowToItemDraft(row: UrlImportRow, ownership: Item["ownership"]): Omit<Item, "id"> {
  const weightG = row.weight_g != null ? Math.max(1, Math.round(row.weight_g)) : 1;
  return {
    gearId: null,
    name: row.name,
    nameEn: row.name,
    nameZh: row.name_zh ?? "",
    qty: row.quantity,
    weightG,
    weightSource: row.weight_g != null ? "user" : "ai_estimate",
    category: row.category,
    status: "todo",
    verdict: null,
    utility: null,
    ownership,
    brand: row.brand ?? undefined,
    note: row.note ?? undefined,
  };
}

export function CommunityUrlImport({
  trips,
  targetTripId,
  onTargetTripChange,
}: {
  trips: Trip[];
  targetTripId: string;
  onTargetTripChange: (tripId: string) => void;
}) {
  const { t, lang } = useI18n();
  const { addItem } = usePacklog();
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [rows, setRows] = useState<UrlImportRow[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [targetCid, setTargetCid] = useState("");
  const [ownership, setOwnership] = useState<Item["ownership"]>("owned");

  const targetTrip = trips.find((tr) => tr.id === targetTripId) ?? null;
  const unassignedId = targetTrip ? unassignedContainerId(targetTrip.id) : "";
  const bags = useMemo(() => (targetTrip ? assignableContainers(targetTrip) : []), [targetTrip]);

  useEffect(() => {
    const trip = trips.find((tr) => tr.id === targetTripId);
    if (!trip) {
      setTargetCid("");
      return;
    }
    setTargetCid(unassignedContainerId(trip.id));
  }, [targetTripId, trips]);

  const grouped = useMemo(() => {
    const byCat = new Map<Item["category"], { row: UrlImportRow; i: number }[]>();
    for (const c of LIBRARY_CATEGORY_ORDER) byCat.set(c, []);
    rows.forEach((row, i) => {
      byCat.get(row.category)?.push({ row, i });
    });
    const out: { category: Item["category"]; list: { row: UrlImportRow; i: number }[] }[] = [];
    for (const c of LIBRARY_CATEGORY_ORDER) {
      const list = byCat.get(c);
      if (list && list.length) out.push({ category: c, list });
    }
    return out;
  }, [rows]);

  const toggle = (i: number) =>
    setSelected((cur) => (cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i]));

  const runExtract = useCallback(async () => {
    setErr(null);
    const u = url.trim();
    if (!u) return;
    if (packlogSubscriptionTier() !== "pro") {
      setErr(t("community.urlImport.needPro"));
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/ai/import-url", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: u, subscriptionTier: packlogSubscriptionTier() }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        code?: string;
        message?: string;
        items?: UrlImportRow[];
      };
      if (!body.ok) {
        const code = body.code ?? "";
        if (code === "PRO_REQUIRED") {
          setErr(t("community.urlImport.needPro"));
        } else if (code === "FETCH_FAILED" || code === "EMPTY_PAGE") {
          setErr(t("community.urlImport.fetchBlocked"));
        } else {
          setErr(body.message?.trim() || code || t("community.urlImport.error"));
        }
        setRows([]);
        setSelected([]);
        return;
      }
      const next = Array.isArray(body.items) ? body.items : [];
      setRows(next);
      setSelected(next.map((_, i) => i));
      if (next.length === 0) setErr(t("community.urlImport.empty"));
    } catch {
      setErr(t("community.urlImport.fetchBlocked"));
      setRows([]);
      setSelected([]);
    } finally {
      setBusy(false);
    }
  }, [url, t]);

  const commit = useCallback(() => {
    if (!targetTrip || !targetCid) return;
    for (const i of selected) {
      const row = rows[i];
      if (!row) continue;
      addItem(targetTrip.id, targetCid, rowToItemDraft(row, ownership));
    }
    setRows([]);
    setSelected([]);
    setUrl("");
    setErr(null);
    setOwnership("owned");
  }, [addItem, targetTrip, targetCid, selected, rows, ownership]);

  if (!targetTrip) return null;

  return (
    <section className="module corner-tick p-5">
      <div className="font-mono text-[10px] tracking-[0.22em] text-signal">
        {t("community.urlImport.kicker")}
      </div>
      <h2 className={cn("mt-1", packlogSectionTitle)}>{t("community.urlImport.title")}</h2>
      {t("community.urlImport.proHint").trim() ? (
        <p className="mt-1 font-mono text-[10px] text-muted-foreground">
          {t("community.urlImport.proHint")}
        </p>
      ) : null}
      {t("community.urlImport.hint").trim() ? (
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          {t("community.urlImport.hint")}
        </p>
      ) : null}

      <label className="mt-4 block">
        <span className="mb-1 block font-mono text-[9px] tracking-[0.18em] text-muted-foreground">
          {t("community.merge.pickTrip")}
        </span>
        <select
          value={targetTripId}
          onChange={(e) => onTargetTripChange(e.target.value)}
          className="w-full max-w-md rounded border border-border-strong bg-background px-2 py-1.5 font-mono text-xs focus:border-[#C8956C] focus:outline-none"
        >
          {trips.map((tr) => (
            <option key={tr.id} value={tr.id}>
              {tripShortSelectLabel(tr, lang)}
            </option>
          ))}
        </select>
      </label>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
        <label className="min-w-0 flex-1">
          <span className="mb-1 block font-mono text-[9px] tracking-[0.15em] text-muted-foreground">
            URL
          </span>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={t("community.urlImport.placeholder")}
            className="w-full rounded-md border border-border-strong bg-background px-3 py-2 font-mono text-xs focus:border-[#C8956C] focus:outline-none"
          />
        </label>
        <button
          type="button"
          disabled={busy || !url.trim()}
          onClick={() => void runExtract()}
          className={cn(
            packlogBtnPrimary,
            packlogBtnSm,
            "shrink-0 px-4 py-2 disabled:cursor-not-allowed disabled:opacity-40",
          )}
        >
          {busy ? t("community.urlImport.busy") : t("community.urlImport.cta")}
        </button>
      </div>
      {err ? <p className="mt-2 font-mono text-[11px] text-destructive">{err}</p> : null}

      {rows.length > 0 ? (
        <div className="mt-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="font-mono text-[10px] tracking-[0.2em] text-signal">
              {t("community.merge.itemsSection")}
            </div>
            <div className="flex gap-2 font-mono text-[10px]">
              <button
                type="button"
                className="text-muted-foreground hover:text-[#6B5234]"
                onClick={() => setSelected(rows.map((_, i) => i))}
              >
                {t("community.merge.checkAll")}
              </button>
              <span className="text-border-strong">|</span>
              <button
                type="button"
                className="text-muted-foreground hover:text-[#6B5234]"
                onClick={() => setSelected([])}
              >
                {t("community.merge.uncheckAll")}
              </button>
              <span className="text-border-strong">|</span>
              <button
                type="button"
                className="text-muted-foreground hover:text-[#6B5234]"
                onClick={() => {
                  setRows([]);
                  setSelected([]);
                  setErr(null);
                }}
              >
                {t("community.urlImport.clear")}
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-md border border-border">
            {grouped.map(({ category, list }, gi) => (
              <section key={category} className={gi > 0 ? "border-t border-border" : ""}>
                <div className="flex items-center gap-2 border-b border-border bg-surface-2/85 px-3 py-2">
                  <span
                    className="h-2 w-2 shrink-0 rounded-[1px]"
                    style={{ background: PACKLOG_CATEGORY_HEX[category] }}
                  />
                  <span className="font-mono text-[10px] tracking-[0.18em] text-signal">
                    {t(`cat.${category}`)}
                  </span>
                  <span className="font-mono text-[9px] text-muted-foreground">
                    ({list.length})
                  </span>
                </div>
                <ul className="divide-y divide-border">
                  {list.map(({ row, i }) => {
                    const on = selected.includes(i);
                    return (
                      <li
                        key={`${i}-${row.name}`}
                        className={`grid grid-cols-12 items-start gap-2 px-3 py-2 transition ${on ? "bg-surface" : "bg-surface-2/40"}`}
                      >
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={on}
                          onClick={() => toggle(i)}
                          className={`col-span-1 mt-1 h-4 w-4 shrink-0 border ${on ? "border-signal bg-signal" : "border-border-strong bg-background"}`}
                          aria-label={t("community.urlImport.toggle")}
                        >
                          {on ? (
                            <span className="block text-center text-[10px] leading-4 text-signal-foreground">
                              ✓
                            </span>
                          ) : null}
                        </button>
                        <div className="col-span-11 sm:col-span-6">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="h-1.5 w-1.5"
                              style={{ background: PACKLOG_CATEGORY_HEX[row.category] }}
                            />
                            <span className="text-sm font-medium">
                              {pickName(lang, {
                                name: row.name,
                                nameEn: row.name,
                                nameZh: row.name_zh ?? row.name,
                              })}
                            </span>
                          </div>
                          {row.note ? (
                            <div className="mt-0.5 font-mono text-[10px] leading-relaxed text-muted-foreground">
                              {row.note}
                            </div>
                          ) : null}
                        </div>
                        <div className="col-span-6 text-right font-mono text-[10px] text-muted-foreground tabular-nums sm:col-span-2 sm:col-start-8">
                          ×{row.quantity}
                        </div>
                        <div className="col-span-6 text-right font-mono text-[10px] text-muted-foreground tabular-nums sm:col-span-2">
                          {row.weight_g != null ? `${row.weight_g}g` : "—"}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>

          <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1 space-y-3">
              <div>
                <div className="font-mono text-[9px] tracking-[0.2em] text-muted-foreground">
                  {t("community.merge.ownership")}
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {ownershipOptions.map((o) => {
                    const active = ownership === o;
                    return (
                      <button
                        key={o}
                        type="button"
                        onClick={() => setOwnership(o)}
                        className={cn(
                          "rounded border px-2 py-1 font-mono text-[9px]",
                          active &&
                            (o === "owned"
                              ? "border-success/90 text-[color:var(--success)]"
                              : "border-signal bg-signal-soft text-foreground"),
                          !active &&
                            "border-border-strong text-muted-foreground hover:text-foreground",
                        )}
                        style={
                          !active ? { borderColor: ownColor[o], color: ownColor[o] } : undefined
                        }
                      >
                        {t(`own.${o}`)}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <div className="font-mono text-[9px] tracking-[0.2em] text-muted-foreground">
                  {t("community.merge.target")}
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() => setTargetCid(unassignedId)}
                    className={cn(
                      "max-w-[min(100%,11rem)] truncate border px-2 py-1 font-mono text-[10px] tracking-[0.15em]",
                      targetCid === unassignedId
                        ? "border-signal bg-signal text-signal-foreground"
                        : "border-border-strong bg-transparent text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                    )}
                  >
                    {t("community.merge.unassigned")}
                  </button>
                  {bags.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setTargetCid(c.id)}
                      className={cn(
                        "max-w-[min(100%,11rem)] truncate border px-2 py-1 font-mono text-[10px] tracking-[0.15em]",
                        targetCid === c.id
                          ? "border-signal bg-signal text-signal-foreground"
                          : "border-border-strong bg-transparent text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                      )}
                    >
                      {containerDisplayLabel(c, lang, t)}
                    </button>
                  ))}
                </div>
                {targetCid === unassignedId && t("community.merge.unassignedHint").trim() ? (
                  <p className="mt-1.5 font-mono text-[10px] leading-relaxed text-muted-foreground">
                    {t("community.merge.unassignedHint")}
                  </p>
                ) : null}
              </div>
            </div>
            <AuthGate pendingAction={commit}>
              <button
                type="button"
                disabled={selected.length === 0 || !targetCid}
                className={cn(
                  packlogBtnPrimary,
                  "w-full px-4 py-2.5 text-[10px] tracking-[0.2em] disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto",
                )}
              >
                {t("community.urlImport.addSelected")}
              </button>
            </AuthGate>
          </div>
        </div>
      ) : null}
    </section>
  );
}
