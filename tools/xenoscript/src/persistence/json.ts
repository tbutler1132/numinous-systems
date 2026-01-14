/**
 * JSON serialization for XenoScript graphs.
 */

import { SemanticGraph } from "../core/graph.ts";

/**
 * Serialize a graph to JSON string.
 */
export function serializeGraph(graph: SemanticGraph): string {
  const data = graph.toJSON();
  return JSON.stringify(data, null, 2);
}

/**
 * Deserialize a graph from JSON string.
 */
export function deserializeGraph(json: string): SemanticGraph {
  const data = JSON.parse(json);
  return SemanticGraph.fromJSON(data);
}

/**
 * Get statistics about a serialized graph.
 */
export function getSerializationStats(json: string): {
  bytes: number;
  nodeCount: number;
  edgeCount: number;
} {
  const data = JSON.parse(json);
  return {
    bytes: new TextEncoder().encode(json).length,
    nodeCount: data.nodes?.length ?? 0,
    edgeCount: data.edges?.length ?? 0,
  };
}
