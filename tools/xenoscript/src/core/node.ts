/**
 * Core semantic node types for XenoScript.
 */

export type NodeKind = "convergence" | "relation" | "constraint" | "signal";
export type Provenance = "organic" | "synthetic" | "hybrid" | "unknown";

export type Value =
  | string
  | number
  | boolean
  | null
  | Value[]
  | { [key: string]: Value };

export interface HistoryEntry {
  timestamp: Date;
  action: "created" | "updated" | "spawned";
  field?: string;
  oldValue?: Value;
  newValue?: Value;
  note?: string;
}

export interface SemanticNode {
  id: string;
  kind: NodeKind;
  name: string;
  fields: Record<string, Value>;
  provenance: Provenance;
  created: Date;
  history: HistoryEntry[];
  parent?: string;
  children: string[];
}

export interface Edge {
  id: string;
  from: string;
  to: string;
  type: "spawned" | "depends_on" | "refines" | "contradicts" | "expresses";
  created: Date;
}

/**
 * Create a new semantic node with defaults.
 */
export function createNode(
  kind: NodeKind,
  name: string,
  fields: Record<string, Value> = {},
  provenance: Provenance = "organic"
): SemanticNode {
  const now = new Date();
  const id = generateId(kind, name);

  return {
    id,
    kind,
    name,
    fields,
    provenance,
    created: now,
    history: [
      {
        timestamp: now,
        action: "created",
      },
    ],
    children: [],
  };
}

/**
 * Generate a stable ID from kind and name.
 */
export function generateId(kind: NodeKind, name: string): string {
  const safeName = name.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");
  return `${kind.slice(0, 4)}-${safeName}-${Date.now().toString(36)}`;
}

/**
 * Clone a node at a specific history point.
 */
export function snapshotNode(
  node: SemanticNode,
  version?: number
): SemanticNode {
  if (version === undefined || version >= node.history.length) {
    return { ...node, history: [...node.history], children: [...node.children] };
  }

  // Replay history up to version to reconstruct state
  const snapshot = { ...node, history: node.history.slice(0, version + 1) };
  // For now, just return the node as-is with truncated history
  // Full replay would require storing full field snapshots
  return snapshot;
}
