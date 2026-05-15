import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AuthGate } from "@/components/auth/AuthGate";
import { usePacklog } from "@/lib/packlog-store";
import { useI18n, pickName } from "@/lib/i18n";
import type { Item, Trip } from "@/lib/packlog-data";
import { packlogSubscriptionTier } from "@/lib/packlog-subscription-tier";
import { containerDisplayLabel } from "@/lib/container-label";
import { tripShortSelectLabel, tripTitleDisplay } from "@/lib/trip-list-label";
import { LIBRARY_CATEGORY_ORDER } from "@/lib/library-category-stats";
import {
  assignableContainers,
  unassignedContainerId,
} from "@/lib/unassigned-container";
import {
  packlogBtnBlock,
  packlogBtnPrimary,
  packlogBtnSm,
  packlogCardMono,
  packlogFieldLabel,
  packlogHint,
  packlogItemName,
  packlogKicker,
  packlogSectionTitle,
} from "@/lib/packlog-button-classes";
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
  tripPicker = "visible",
}: {
  trips: Trip[];
  targetTripId: string;
  onTargetTripChange?: (tripId: string) => void;
  tripPicker?: "visible" | "hidden";
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
  const bags = useMemo(
    () => (targetTrip ? assignableContainers(targetTrip) : []),
    [targetTrip],
  );

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
    let added = 0;
    for (const i of selected) {
      const row = rows[i];
      if (!row) continue;
      addItem(targetTrip.id, targetCid, rowToItemDraft(row, ownership));
      added += 1;
    }
    if (added > 0) {
      toast.success(t("community.urlImport.successToast").replace("{n}", String(added)));
    }
    setRows([]);
    setSelected([]);
    setUrl("");
    setErr(null);
    setOwnership("owned");
  }, [addItem, targetTrip, targetCid, selected, rows, ownership, t]);

  if (!targetTrip) return null;

  const fieldControl =
    "min-h-[var(--touch-target)] w-full rounded-md border border-border-strong bg-background px-3 py-2.5 font-mono text-base text-foreground focus:border-[#C8956C] focus:outline-none md:min-h-0 md:py-2 md:text-sm";

  return (
    <section className="module corner-tick corner-tick-br p-4 md:p-6">
      <div className={cn(packlogKicker, "text-signal")}>{t("community.urlImport.kicker")}</div>
      <h2 className={cn(packlogSectionTitle, "mt-2 max-w-prose text-pretty")}>
        {t("community.urlImport.title")}
      </h2>
      {tripPicker === "hidden" ? (
        <p className={cn(packlogHint, "mt-2 max-w-prose text-pretty text-muted-foreground")}>
          {t("community.urlImport.embeddedHint")}
        </p>
      ) : null}
      {t("community.urlImport.proHint").trim() ? (
        <p className={cn(packlogCardMono, "mt-2 text-muted-foreground")}>{t("community.urlImport.proHint")}</p>
      ) : null}
      {t("community.urlImport.hint").trim() ? (
        <p className={cn(packlogHint, "mt-2 max-w-prose text-muted-foreground")}>{t("community.urlImport.hint")}</p>
      ) : null}

      {tripPicker === "visible" ? (
        <label className="mt-5 block">
          <span className={packlogFieldLabel}>{t("community.merge.pickTrip")}</span>
          <select
            value={targetTripId}
            onChange={(e) => onTargetTripChange?.(e.target.value)}
            className={fieldControl}
          >
            {trips.map((tr) => (
              <option key={tr.id} value={tr.id}>
                {tripShortSelectLabel(tr, lang)}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <p className={cn(packlogCardMono, "mt-4 rounded-md border border-border/80 bg-surface-2/50 px-3 py-2.5 text-foreground")}>
          <span className="text-muted-foreground">{t("community.merge.pickTrip")} · </span>
          {tripTitleDisplay(targetTrip, lang)}
        </p>
      )}

      <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-end md:gap-4">
        <label className="min-w-0 flex-1">
          <span className={packlogFieldLabel}>{t("community.urlImport.urlLabel")}</span>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={t("community.urlImport.placeholder")}
            className={fieldControl}
            inputMode="url"
            autoComplete="url"
            autoCapitalize="none"
          />
        </label>
        <button
          type="button"
          disabled={busy || !url.trim()}
          onClick={() => void runExtract()}
          className={cn(
            packlogBtnPrimary,
            packlogBtnBlock,
            "shrink-0 px-6 disabled:cursor-not-allowed disabled:opacity-40 md:min-h-[var(--touch-target)] md:w-auto md:min-w-[9rem]",
          )}
        >
          {busy ? t("community.urlImport.busy") : t("community.urlImport.cta")}
        </button>
      </div>
      {err ? (
        <p className={cn(packlogCardMono, "mt-3 font-medium text-destructive")}>{err}</p>
      ) : null}

      {rows.length > 0 ? (
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
            <div className={cn(packlogKicker, "text-signal")}>{t("community.merge.itemsSection")}</div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
              <button
                type="button"
                className={cn(
                  packlogCardMono,
                  "min-h-10 rounded-md px-2 font-medium text-link underline-offset-4 hover:text-link-hover hover:underline md:min-h-0",
                )}
                onClick={() => setSelected(rows.map((_, i) => i))}
              >
                {t("community.merge.checkAll")}
              </button>
              <span className="text-border-strong" aria-hidden>
                |
              </span>
              <button
                type="button"
                className={cn(
                  packlogCardMono,
                  "min-h-10 rounded-md px-2 font-medium text-link underline-offset-4 hover:text-link-hover hover:underline md:min-h-0",
                )}
                onClick={() => setSelected([])}
              >
                {t("community.merge.uncheckAll")}
              </button>
              <span className="text-border-strong" aria-hidden>
                |
              </span>
              <button
                type="button"
                className={cn(
                  packlogCardMono,
                  "min-h-10 rounded-md px-2 font-medium text-link underline-offset-4 hover:text-link-hover hover:underline md:min-h-0",
                )}
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

          <div className="overflow-hidden rounded-lg border border-border">
            {grouped.map(({ category, list }, gi) => (
              <section key={category} className={gi > 0 ? "border-t border-border" : ""}>
                <div className="flex items-center gap-2 border-b border-border bg-surface-2/85 px-3 py-2.5">
                  <span
                    className="h-2 w-2 shrink-0 rounded-[1px]"
                    style={{ background: PACKLOG_CATEGORY_HEX[category] }}
                  />
                  <span className={cn(packlogKicker, "text-signal")}>{t(`cat.${category}`)}</span>
                  <span className={cn(packlogCardMono, "text-muted-foreground")}>({list.length})</span>
                </div>
                <ul className="divide-y divide-border">
                  {list.map(({ row, i }) => {
                    const on = selected.includes(i);
                    return (
                      <li
                        key={`${i}-${row.name}`}
                        className={cn(
                          "flex gap-3 px-3 py-3 transition md:items-center md:gap-4",
                          on ? "bg-surface" : "bg-surface-2/40",
                        )}
                      >
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={on}
                          onClick={() => toggle(i)}
                          className={cn(
                            "mt-0.5 grid shrink-0 place-items-center rounded-md border transition md:mt-0",
                            "min-h-11 min-w-11 md:h-9 md:w-9",
                            on ? "border-signal bg-signal" : "border-border-strong bg-background",
                          )}
                          aria-label={t("community.urlImport.toggle")}
                        >
                          {on ? (
                            <span className="font-mono text-sm leading-none text-signal-foreground md:text-xs">
                              ✓
                            </span>
                          ) : null}
                        </button>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="h-1.5 w-1.5 shrink-0"
                              style={{ background: PACKLOG_CATEGORY_HEX[row.category] }}
                            />
                            <span className={cn(packlogItemName, "break-words [overflow-wrap:anywhere]")}>
                              {pickName(lang, {
                                name: row.name,
                                nameEn: row.name,
                                nameZh: row.name_zh ?? row.name,
                              })}
                            </span>
                          </div>
                          {row.note ? (
                            <div className={cn(packlogHint, "mt-1 max-w-prose text-pretty text-muted-foreground")}>
                              {row.note}
                            </div>
                          ) : null}
                          <div className={cn(packlogCardMono, "mt-2 flex flex-wrap gap-x-4 gap-y-1 md:hidden")}>
                            <span>×{row.quantity}</span>
                            <span>{row.weight_g != null ? `${row.weight_g}g` : "—"}</span>
                          </div>
                        </div>
                        <div
                          className={cn(
                            packlogCardMono,
                            "hidden shrink-0 tabular-nums text-muted-foreground md:block md:w-16 md:text-right",
                          )}
                        >
                          ×{row.quantity}
                        </div>
                        <div
                          className={cn(
                            packlogCardMono,
                            "hidden shrink-0 tabular-nums text-muted-foreground md:block md:w-20 md:text-right",
                          )}
                        >
                          {row.weight_g != null ? `${row.weight_g}g` : "—"}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>

          <div className="flex flex-col gap-4 border-t border-border pt-5 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0 flex-1 space-y-5">
              <div>
                <div className={packlogFieldLabel}>{t("community.merge.ownership")}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {ownershipOptions.map((o) => {
                    const active = ownership === o;
                    return (
                      <button
                        key={o}
                        type="button"
                        onClick={() => setOwnership(o)}
                        className={cn(
                          "min-h-[var(--touch-target)] rounded-md border px-3 py-2 font-mono text-xs font-medium transition md:min-h-0 md:px-2.5 md:py-1.5 md:text-[11px]",
                          active &&
                            (o === "owned"
                              ? "border-success/90 text-[color:var(--success)]"
                              : "border-signal bg-signal-soft text-foreground"),
                          !active && "border-border-strong text-muted-foreground hover:text-foreground",
                        )}
                        style={!active ? { borderColor: ownColor[o], color: ownColor[o] } : undefined}
                      >
                        {t(`own.${o}`)}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <div className={packlogFieldLabel}>{t("community.merge.target")}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetCid(unassignedId)}
                    className={cn(
                      "min-h-10 max-w-[min(100%,14rem)] truncate rounded-md border px-3 py-2 font-mono text-xs tracking-wide transition md:min-h-0 md:py-1.5 md:text-[11px]",
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
                        "min-h-10 max-w-[min(100%,14rem)] truncate rounded-md border px-3 py-2 font-mono text-xs tracking-wide transition md:min-h-0 md:py-1.5 md:text-[11px]",
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
                  <p className={cn(packlogHint, "mt-2 max-w-prose text-muted-foreground")}>
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
                  packlogBtnBlock,
                  "px-6 disabled:cursor-not-allowed disabled:opacity-40 md:min-w-[12rem]",
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
