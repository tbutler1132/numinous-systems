/**
 * A Node is a boundary where memory, feedback, and learning apply.
 *
 * Nodes are not containers, users, or categories. They are scopes
 * within which signals are coherent and learning is meaningful.
 *
 * The structure of a node is not prescribed — only its identity
 * and the fact that it represents a distinct boundary.
 */
export interface Node {
  /** Unique identifier for this node */
  id: string;
  /** Human-readable name */
  name?: string;
  /** Optional description of what this node's boundary encompasses */
  description?: string;
}

/**
 * A reference to a node by ID.
 * Used when you need to point to a node without the full object.
 */
export type NodeRef = string;

/**
 * Relationship between nodes.
 * Nodes can relate to each other in various ways — this captures
 * that one node has some relationship to another.
 */
export interface NodeRelation {
  /** The node that has the relationship */
  fromNodeId: NodeRef;
  /** The node being related to */
  toNodeId: NodeRef;
  /** The kind of relationship (e.g., 'supports', 'contributes-to', 'derives-from') */
  kind: string;
  /** When this relationship was established (ISO-8601) */
  establishedAt?: string;
}
