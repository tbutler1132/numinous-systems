import type { IngestContext, IngestResult } from "@numinous-systems/sensor";
import { parseChaseCSVContent } from "./chase-csv.js";

/**
 * Ingest Chase CSV content into the observation store.
 *
 * Parses the CSV content, deduplicates against existing observations,
 * and records the ingest run for tracking.
 */
export async function ingest(
  content: string,
  context: IngestContext
): Promise<IngestResult> {
  const { store, nodeId, filename } = context;

  const parseResult = parseChaseCSVContent(content, {
    accountLabel: "checking",
    nodeId,
  });

  if (parseResult.observations.length === 0) {
    return {
      success: false,
      message: "No valid transactions found in file",
    };
  }

  const runId = store.startIngestRun(filename, "finance");

  // Source row hashes are in observation payloads; store extracts them automatically
  const result = store.insertObservations(parseResult.observations);

  store.finishIngestRun(runId, {
    rowsRead: parseResult.rowCount,
    rowsInserted: result.inserted,
    rowsSkipped: result.skipped,
    minObserved: parseResult.minObserved,
    maxObserved: parseResult.maxObserved,
    status: "success",
  });

  return {
    success: true,
    message: `Ingested ${result.inserted} transactions`,
    details: {
      filename,
      rowsRead: parseResult.rowCount,
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
