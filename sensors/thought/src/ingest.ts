import type { Observation } from "@numinous-systems/memory";
import type { IngestContext, IngestResult } from "@numinous-systems/sensor";
import { parseInboxContent } from "./inbox-parser.js";
import type { ThoughtEntryPayload } from "./types.js";

/**
 * Ingest inbox markdown content into the observation store.
 *
 * Parses the markdown content, deduplicates against existing observations,
 * and records the ingest run for tracking.
 */
export async function ingest(
  content: string,
  context: IngestContext
): Promise<IngestResult> {
  const { store, nodeId, filename } = context;

  const parseResult = parseInboxContent(content);

  if (parseResult.entries.length === 0) {
    return {
      success: false,
      message: "No valid entries found in file",
    };
  }

  const ingestedAt = new Date().toISOString();

  // Convert parsed entries to observations with identity declaration
  // Memory computes fingerprint from: domain|source|type|identity.values
  const observations: Observation[] = parseResult.entries.map((entry) => {
    const payload: ThoughtEntryPayload = {
      text: entry.text,
      text_normalized: entry.text_normalized,
      tags: entry.tags,
      week_context: entry.week_context,
    };

    return {
      identity: {
        values: [entry.text_normalized],
      },
      node_id: nodeId,
      domain: "thought",
      source: "inbox_md",
      type: "entry",
      observed_at: entry.observed_at,
      schema_version: 1,
      payload,
      ingested_at: ingestedAt,
    };
  });

  const runId = store.startIngestRun(filename, "thought");

  const result = store.insertObservations(observations);

  store.finishIngestRun(runId, {
    rowsRead: parseResult.entryCount,
    rowsInserted: result.inserted,
    rowsSkipped: result.skipped,
    minObserved: parseResult.minObserved,
    maxObserved: parseResult.maxObserved,
    status: "success",
  });

  return {
    success: true,
    message: `Ingested ${result.inserted} entries`,
    details: {
      filename,
      rowsRead: parseResult.entryCount,
      inserted: result.inserted,
      skipped: result.skipped,
      dateRange:
        parseResult.minObserved && parseResult.maxObserved
          ? `${parseResult.minObserved} to ${parseResult.maxObserved}`
          : null,
      warnings: result.warnings.length,
    },
  };
}
