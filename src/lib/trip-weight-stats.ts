import type { Item, Trip } from "./packlog-data";
import { effectiveSystemGroup, isBig3Group } from "./packlog-system-groups";
import { tripScenariosIncludeOutdoorPacking } from "./outdoor-packing-scenarios";

export function itemLineGrams(item: Item): number {
  return item.weightG * item.qty;
}

export function tripAllItems(trip: Trip): Item[] {
  return trip.containers.flatMap((c) => c.items);
}

export function tripTotalGrams(trip: Trip): number {
  return tripAllItems(trip).reduce((s, i) => s + itemLineGrams(i), 0);
}

/** Items explicitly marked as worn on body — excluded from base weight. */
export function tripWornGrams(trip: Trip): number {
  return tripAllItems(trip)
    .filter((i) => i.isWorn === true)
    .reduce((s, i) => s + itemLineGrams(i), 0);
}

/** Consumables (food, fuel canisters, etc.) — excluded from base weight per product spec. */
export function tripConsumableGrams(trip: Trip): number {
  return tripAllItems(trip)
    .filter((i) => i.isConsumable === true)
    .reduce((s, i) => s + itemLineGrams(i), 0);
}

export function tripBaseGrams(trip: Trip): number {
  return Math.max(0, tripTotalGrams(trip) - tripWornGrams(trip) - tripConsumableGrams(trip));
}

/** Big3 仅在有户外类场景的行程中统计（与系统分组视图一致）。 */
export function tripBig3Grams(trip: Trip): number {
  if (!tripScenariosIncludeOutdoorPacking(trip)) return 0;
  return tripAllItems(trip).reduce((sum, it) => {
    const g = effectiveSystemGroup(it);
    return sum + (isBig3Group(g) ? itemLineGrams(it) : 0);
  }, 0);
}

/** Big3 占基础重量比例 0–100；非户外行程或基础重量为 0 时返回 null。 */
export function tripBig3PctOfBase(trip: Trip): number | null {
  if (!tripScenariosIncludeOutdoorPacking(trip)) return null;
  const base = tripBaseGrams(trip);
  if (base <= 0) return null;
  return Math.min(100, Math.round((tripBig3Grams(trip) / base) * 100));
}

export function containerItemsGrams(containerId: string, trip: Trip): number {
  const c = trip.containers.find((x) => x.id === containerId);
  if (!c) return 0;
  return c.items.reduce((s, i) => s + itemLineGrams(i), 0);
}
