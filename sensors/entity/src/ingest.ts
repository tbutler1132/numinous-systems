import type { IngestContext, IngestResult } from "@numinous-systems/sensor";
import type { Observation } from "@numinous-systems/memory";
import { parseMarkdownTableContent } from "./parser.js";
import type { EntityEventPayload } from "./types.js";

/**
 * Ingest markdown table content into the observation store.
 *
 * Parses the table, creates "registered" events for each entity,
 * and stores with identity-based deduplication.
 */
export async function ingest(
  content: string,
  context: IngestContext
): Promise<IngestResult> {
  const { store, nodeId, filename } = context;

  const parseResult = parseMarkdownTableContent(content, filename);

  if (parseResult.entities.length === 0) {
    return {
      success: false,
      message: "No valid entities found in file",
    };
  }

  const runId = store.startIngestRun(filename, "entity");
  const ingestedAt = new Date().toISOString();
  const observedAt = ingestedAt.split("T")[0]; // Use date only for observed_at

  // Convert entities to observations
  const observations: Observation[] = parseResult.entities.map((entity) => {
    const payload: EntityEventPayload = {
      entity_type: parseResult.entityType,
      entity_key: entity.key,
      event_type: "registered",
      state: entity.state,
    };

    return {
      identity: {
        // Same entity + same day + same event type = same observation
        values: [
          parseResult.entityType,
          entity.key,
          observedAt,
          "registered",
        ],
      },
      node_id: nodeId,
      domain: "entity",
      source: "markdown_table",
      type: "event",
      observed_at: observedAt,
      schema_version: 1,
      payload,
      ingested_at: ingestedAt,
    };
  });

  const result = store.insertObservations(observations);

  store.finishIngestRun(runId, {
    rowsRead: parseResult.rowCount,
    rowsInserted: result.inserted,
    rowsSkipped: result.skipped,
    minObserved: observedAt,
    maxObserved: observedAt,
    status: "success",
  });

  return {
    success: true,
    message: `Ingested ${result.inserted} ${parseResult.entityType} entities`,
    details: {
      filename,
      rowsRead: parseResult.rowCount,
      inserted: result.inserted,
      skipped: result.skipped,
      dateRange: observedAt,
      warnings: result.warnings.length,
    },
  };
}
