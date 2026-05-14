import type { Item, Trip } from "./packlog-data";
import { effectiveSystemGroup, isBig3Group } from "./packlog-system-groups";

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

/** Big3（庇护 + 睡眠系统 + 主包）在「启发式/显式 systemGroup」下的合计克数。 */
export function tripBig3Grams(trip: Trip): number {
  return tripAllItems(trip).reduce((sum, it) => {
    const g = effectiveSystemGroup(it);
    return sum + (isBig3Group(g) ? itemLineGrams(it) : 0);
  }, 0);
}

/** Big3 占基础重量比例 0–100；基础重量为 0 时返回 null。 */
export function tripBig3PctOfBase(trip: Trip): number | null {
  const base = tripBaseGrams(trip);
  if (base <= 0) return null;
  return Math.min(100, Math.round((tripBig3Grams(trip) / base) * 100));
}

export function containerItemsGrams(containerId: string, trip: Trip): number {
  const c = trip.containers.find((x) => x.id === containerId);
  if (!c) return 0;
  return c.items.reduce((s, i) => s + itemLineGrams(i), 0);
}
