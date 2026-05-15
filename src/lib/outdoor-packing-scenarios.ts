import type { ScenarioKey } from "@/lib/scenario-templates";
import type { Trip } from "@/lib/packlog-data";
import { tripScenarios } from "@/lib/trip-scenarios";

/**
 * 行程含任一场景时：打包清单 + 重量分布使用「户外系统分组」与 Big3 启发式（不改 DB）。
 * 与产品 SPEC：露营 / 徒步 / 越野跑 / 山地高山 / 潜水浮潜 / 滑雪单板 对齐。
 */
export const OUTDOOR_SCENARIO_KEYS_LIST: readonly ScenarioKey[] = [
  "camping",
  "hiking",
  "trail-run",
  "alpine",
  "ski",
  "dive",
  "desert",
];

export const OUTDOOR_SCENARIO_KEYS: ReadonlySet<ScenarioKey> = new Set(OUTDOOR_SCENARIO_KEYS_LIST);

export function tripScenariosIncludeOutdoorPacking(trip: Trip): boolean {
  return tripScenarios(trip).some((s) => OUTDOOR_SCENARIO_KEYS.has(s));
}
