import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import type { Container, ContainerType } from "@/lib/packlog-data";

type Preset = {
  type: ContainerType;
  glyph: string;
  defaultName: string;
  defaultNameZh: string;
  capacityL: number;
  maxKg: number;
};

// Curated, real-world bag types — covers the user's enumerated cases:
// 托运行李箱、登机箱、随身包、登山包、洗漱包、相机包、化妆包、衣物等.
const PRESETS: Preset[] = [
  {
    type: "checked",
    glyph: "▣",
    defaultName: "Checked Suitcase",
    defaultNameZh: "托运行李箱",
    capacityL: 80,
    maxKg: 23,
  },
  {
    type: "carry",
    glyph: "▤",
    defaultName: "Carry-On",
    defaultNameZh: "登机箱",
    capacityL: 35,
    maxKg: 7,
  },
  {
    type: "personal",
    glyph: "◍",
    defaultName: "Personal Bag",
    defaultNameZh: "随身包",
    capacityL: 18,
    maxKg: 7,
  },
  {
    type: "daypack",
    glyph: "◊",
    defaultName: "City Daypack",
    defaultNameZh: "城市日用包",
    capacityL: 20,
    maxKg: 6,
  },
  {
    type: "hike",
    glyph: "▲",
    defaultName: "Hiking Pack",
    defaultNameZh: "登山包",
    capacityL: 55,
    maxKg: 16,
  },
  {
    type: "camera",
    glyph: "◉",
    defaultName: "Camera Bag",
    defaultNameZh: "相机包",
    capacityL: 12,
    maxKg: 6,
  },
  {
    type: "toiletry",
    glyph: "◐",
    defaultName: "Toiletry Pouch",
    defaultNameZh: "洗漱包",
    capacityL: 4,
    maxKg: 2,
  },
  {
    type: "makeup",
    glyph: "◑",
    defaultName: "Makeup Pouch",
    defaultNameZh: "化妆包",
    capacityL: 3,
    maxKg: 1,
  },
  {
    type: "tech",
    glyph: "◈",
    defaultName: "Tech Pouch",
    defaultNameZh: "数码配件包",
    capacityL: 3,
    maxKg: 2,
  },
  {
    type: "clothing",
    glyph: "◇",
    defaultName: "Clothing Cube",
    defaultNameZh: "衣物收纳袋",
    capacityL: 15,
    maxKg: 5,
  },
  {
    type: "custom",
    glyph: "◯",
    defaultName: "Custom",
    defaultNameZh: "自定义",
    capacityL: 10,
    maxKg: 5,
  },
];

export function AddContainerSheet({
  open,
  onClose,
  onCommit,
}: {
  open: boolean;
  onClose: () => void;
  onCommit: (draft: Omit<Container, "id" | "code" | "items">) => void;
}) {
  const { t, lang } = useI18n();
  const [picked, setPicked] = useState<Preset>(PRESETS[0]);
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState<number>(PRESETS[0].capacityL);
  const [maxKg, setMaxKg] = useState<number>(PRESETS[0].maxKg);

  if (!open) return null;

  const choose = (p: Preset) => {
    setPicked(p);
    setCapacity(p.capacityL);
    setMaxKg(p.maxKg);
    setName("");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim() || (lang === "zh" ? picked.defaultNameZh : picked.defaultName);
    const isZh = /[\u4e00-\u9fa5]/.test(finalName);
    onCommit({
      name: isZh ? picked.defaultName : finalName,
      nameZh: isZh ? finalName : picked.defaultNameZh,
      type: picked.type,
      capacityL: Math.max(1, capacity),
      maxKg: Math.max(1, maxKg),
    });
    onClose();
  };

  return (
    <div
      className="scrim fixed inset-0 z-50 grid touch-none place-items-center overscroll-none p-3 sm:p-4"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="module corner-tick relative max-h-[min(90dvh,calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-2rem))] w-full max-w-lg touch-pan-y space-y-4 overflow-y-auto overscroll-y-contain p-5"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="font-mono text-[10px] tracking-[0.22em] text-signal">
              + {t("container.add.bag")}
            </div>
            <h3 className="mt-1 font-display text-xl">{t("container.new.title")}</h3>
            <p className="mt-1 font-mono text-[10px] text-muted-foreground">
              {t("container.new.subtitle")}
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

        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {PRESETS.map((p) => {
            const active = picked.type === p.type;
            return (
              <button
                type="button"
                key={p.type}
                onClick={() => choose(p)}
                className={`flex items-center gap-2 rounded border px-2.5 py-2 text-left transition ${
                  active
                    ? "border-signal bg-signal-soft text-foreground"
                    : "border-border-strong bg-surface text-muted-foreground hover:border-signal/40 hover:text-foreground"
                }`}
              >
                <span className="font-mono text-base text-signal">{p.glyph}</span>
                <span className="truncate font-mono text-[11px] tracking-[0.1em]">
                  {t(`container.type.${p.type}`)}
                </span>
              </button>
            );
          })}
        </div>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={
            t("container.new.name") +
            " · " +
            (lang === "zh" ? picked.defaultNameZh : picked.defaultName)
          }
          className="w-full rounded border border-border-strong bg-background px-2 py-1.5 text-sm focus:border-signal focus:outline-none"
        />

        <div className="grid grid-cols-2 gap-2">
          <label className="flex items-center gap-2 rounded border border-border-strong bg-background px-2 py-1.5">
            <span className="font-mono text-[10px] text-muted-foreground">
              {t("container.new.capacity")}
            </span>
            <input
              type="number"
              min={1}
              value={capacity}
              onChange={(e) => setCapacity(+e.target.value)}
              className="ml-auto w-16 bg-transparent text-right font-mono text-sm focus:outline-none"
            />
          </label>
          <label className="flex items-center gap-2 rounded border border-border-strong bg-background px-2 py-1.5">
            <span className="font-mono text-[10px] text-muted-foreground">
              {t("container.new.max")}
            </span>
            <input
              type="number"
              min={1}
              value={maxKg}
              onChange={(e) => setMaxKg(+e.target.value)}
              className="ml-auto w-16 bg-transparent text-right font-mono text-sm focus:outline-none"
            />
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-border-strong px-3 py-1 font-mono text-[10px] tracking-[0.18em] text-muted-foreground hover:text-foreground"
          >
            {t("container.add.cancel")}
          </button>
          <button
            type="submit"
            className="rounded border border-signal bg-signal px-3 py-1 font-mono text-[10px] tracking-[0.18em] text-signal-foreground hover:opacity-90"
          >
            {t("container.new.commit")}
          </button>
        </div>
      </form>
    </div>
  );
}
