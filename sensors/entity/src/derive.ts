import type { StoredObservation, ObservationStore } from "@numinous-systems/memory";
import type { Entity, EntityEventPayload } from "./types.js";

/**
 * Derive current entity state from a stream of entity observations.
 * Folds events chronologically: registered → updated* → retired?
 */
export function deriveEntity(observations: StoredObservation[]): Entity | null {
  if (observations.length === 0) {
    return null;
  }

  // Sort by observed_at ascending
  const sorted = [...observations].sort((a, b) =>
    a.observed_at.localeCompare(b.observed_at)
  );

  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const firstPayload = first.payload as unknown as EntityEventPayload;
  const lastPayload = last.payload as unknown as EntityEventPayload;

  // Fold state through all observations
  let state: Record<string, unknown> = {};
  for (const obs of sorted) {
    const payload = obs.payload as unknown as EntityEventPayload;
    // Merge state from each event
    state = { ...state, ...payload.state };
  }

  return {
    type: firstPayload.entity_type,
    key: firstPayload.entity_key,
    state,
    first_observed: first.observed_at,
    last_observed: last.observed_at,
    retired: lastPayload.event_type === "retired",
  };
}

/**
 * List all entities of a given type from the store.
 * Groups observations by entity key and derives current state.
 */
export function listEntities(
  store: ObservationStore,
  entityType: string
): Entity[] {
  // Query all entity observations of this type
  const observations = store.queryObservations({
    domain: "entity",
    type: "event",
  });

  // Filter to matching entity type and group by key
  const byKey = new Map<string, StoredObservation[]>();

  for (const obs of observations) {
    const payload = obs.payload as unknown as EntityEventPayload;
    if (payload.entity_type !== entityType) {
      continue;
    }

    const key = payload.entity_key;
    if (!byKey.has(key)) {
      byKey.set(key, []);
    }
    byKey.get(key)!.push(obs);
  }

  // Derive entity for each key
  const entities: Entity[] = [];
  for (const observations of byKey.values()) {
    const entity = deriveEntity(observations);
    if (entity) {
      entities.push(entity);
    }
  }

  // Sort by key for stable output
  return entities.sort((a, b) => a.key.localeCompare(b.key));
}

/**
 * Get a single entity by type and key.
 */
export function getEntity(
  store: ObservationStore,
  entityType: string,
  entityKey: string
): Entity | null {
  const observations = store.queryObservations({
    domain: "entity",
    type: "event",
  });

  const matching = observations.filter((obs: StoredObservation) => {
    const payload = obs.payload as unknown as EntityEventPayload;
    return (
      payload.entity_type === entityType && payload.entity_key === entityKey
    );
  });

  return deriveEntity(matching);
}
