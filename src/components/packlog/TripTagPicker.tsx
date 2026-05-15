import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";
import {
  canonicalTagKey,
  filterPresetsByQuery,
  isPresetTagId,
  listPresetGroups,
  tagKeysMatch,
  formatTagForUi,
  type TagPresetGroup,
} from "@/lib/tag-presets";
import { cn } from "@/lib/utils";

const MAX_TAGS = 16;
const MAX_CUSTOM_LEN = 24;

export function TripTagPicker({
  value,
  onChange,
  disabled,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}) {
  const { t, lang } = useI18n();
  const [q, setQ] = useState("");
  const [customDraft, setCustomDraft] = useState("");

  const filtered = useMemo(() => filterPresetsByQuery(q, lang), [q, lang]);

  const byGroup = useMemo(() => {
    const m = new Map<TagPresetGroup, typeof filtered>();
    for (const g of listPresetGroups()) m.set(g, []);
    for (const row of filtered) {
      m.get(row.group)!.push(row);
    }
    return m;
  }, [filtered]);

  const remove = (tag: string) => {
    onChange(value.filter((x) => !tagKeysMatch(x, tag)));
  };

  const addPreset = (id: string) => {
    const canon = canonicalTagKey(id);
    if (value.length >= MAX_TAGS) return;
    if (value.some((x) => tagKeysMatch(x, canon))) return;
    onChange([...value, canon]);
  };

  const commitCustom = () => {
    const raw = customDraft.replace(/^#/, "").trim().replace(/[,，]/g, "");
    if (!raw || raw.length > MAX_CUSTOM_LEN) return;
    if (value.length >= MAX_TAGS) return;
    if (isPresetTagId(raw)) {
      addPreset(raw);
      setCustomDraft("");
      return;
    }
    if (value.some((x) => tagKeysMatch(x, raw))) return;
    onChange([...value, raw]);
    setCustomDraft("");
  };

  return (
    <div className={cn("space-y-3", disabled && "pointer-events-none opacity-50")}>
      {value.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {value.map((tag) => {
            const preset = isPresetTagId(tag);
            return (
              <button
                key={tag}
                type="button"
                disabled={disabled}
                onClick={() => remove(tag)}
                className={cn(
                  "rounded border px-2 py-0.5 text-left font-mono text-[10px] tracking-[0.06em] transition hover:border-destructive hover:text-destructive",
                  preset
                    ? "border-border-strong bg-surface text-foreground"
                    : "border-dashed border-muted-foreground/70 bg-transparent text-muted-foreground",
                )}
                title={t("tag.picker.removeHint")}
              >
                {formatTagForUi(tag, lang)} ×
              </button>
            );
          })}
        </div>
      ) : null}

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t("tag.picker.searchPlaceholder")}
        disabled={disabled}
        className="w-full rounded border border-border-strong bg-background px-2 py-1.5 font-mono text-[11px] outline-none focus:border-[#C8956C]"
      />

      <div className="max-h-[min(50vh,20rem)] space-y-3 overflow-y-auto overscroll-y-contain pr-0.5">
        {listPresetGroups().map((group) => {
          const rows = byGroup.get(group) ?? [];
          if (rows.length === 0) return null;
          return (
            <div key={group}>
              <div className="mb-1.5 font-mono text-[9px] tracking-[0.18em] text-muted-foreground">
                {t(`tag.group.${group}`)}
              </div>
              <div className="flex flex-wrap gap-1">
                {rows.map((row) => {
                  const on = value.some((x) => tagKeysMatch(x, row.id));
                  return (
                    <button
                      key={row.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => (on ? remove(row.id) : addPreset(row.id))}
                      className={cn(
                        "rounded border px-2 py-0.5 font-mono text-[10px] tracking-[0.06em] transition",
                        on
                          ? "border-signal bg-signal-soft text-foreground"
                          : "border-border-strong bg-surface text-muted-foreground hover:border-foreground/25 hover:text-foreground",
                      )}
                    >
                      {row.labels[lang] ?? row.labels.en}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-border pt-2">
        <div className="mb-1 font-mono text-[9px] tracking-[0.15em] text-muted-foreground">
          {t("tag.picker.customLabel")}
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            value={customDraft}
            onChange={(e) => setCustomDraft(e.target.value.slice(0, MAX_CUSTOM_LEN))}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitCustom();
              }
            }}
            placeholder={t("tag.picker.customPlaceholder")}
            disabled={disabled}
            className="min-w-[8rem] flex-1 rounded border border-dashed border-muted-foreground/50 bg-background px-2 py-1.5 font-mono text-[11px] outline-none focus:border-[#C8956C]"
          />
          <button
            type="button"
            disabled={disabled || value.length >= MAX_TAGS}
            onClick={() => commitCustom()}
            className="rounded border border-border-strong bg-surface px-2 py-1.5 font-mono text-[10px] tracking-[0.12em] text-muted-foreground hover:border-foreground/25 hover:text-foreground disabled:opacity-40"
          >
            {t("tag.picker.addCustom")}
          </button>
        </div>
        <p className="mt-1 font-mono text-[9px] text-muted-foreground">
          {t("tag.picker.customHint")}
        </p>
      </div>
    </div>
  );
}
