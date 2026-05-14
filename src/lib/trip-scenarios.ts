import type { ScenarioKey } from "@/lib/scenario-templates";
import type { Trip } from "@/lib/packlog-data";

/** All scenario tags on a trip (supports legacy single `scenario` field). */
export function tripScenarios(trip: Trip): ScenarioKey[] {
  if (trip.scenarios?.length) return trip.scenarios;
  return [trip.scenario];
}

export function primaryScenario(trip: Trip): ScenarioKey {
  return tripScenarios(trip)[0] ?? "general";
}

/** Community templates expose one scenario — match if any trip tag equals it. */
export function tripMatchesTemplateScenario(
  tripOrTags: Trip | ScenarioKey[],
  templateScenario: ScenarioKey,
): boolean {
  const tags = Array.isArray(tripOrTags) ? tripOrTags : tripScenarios(tripOrTags);
  return tags.includes(templateScenario);
}
