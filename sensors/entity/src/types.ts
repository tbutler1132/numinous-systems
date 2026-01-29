/**
 * Entity event types - lifecycle stages of an entity
 */
export type EntityEventType = "registered" | "updated" | "retired";

/**
 * Entity event payload - what gets stored in observation.payload
 */
export interface EntityEventPayload extends Record<string, unknown> {
  /** Entity type: "domain", "account", "surface" */
  entity_type: string;
  /** Unique key within type */
  entity_key: string;
  /** Event type */
  event_type: EntityEventType;
  /** Fields at time of observation */
  state: Record<string, unknown>;
  /** Optional note about this event */
  note?: string;
}

/**
 * Derived entity - current state computed from event stream
 */
export interface Entity {
  type: string;
  key: string;
  state: Record<string, unknown>;
  first_observed: string;
  last_observed: string;
  retired: boolean;
}

/**
 * Result of parsing a markdown table
 */
export interface ParseResult {
  /** Entity type derived from filename */
  entityType: string;
  /** Parsed entities */
  entities: Array<{
    key: string;
    state: Record<string, unknown>;
  }>;
  /** Column headers */
  headers: string[];
  /** Number of rows parsed */
  rowCount: number;
}
