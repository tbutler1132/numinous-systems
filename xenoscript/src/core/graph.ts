/**
 * Semantic Graph - the core data structure for XenoScript.
 */

import {
  createNode,
  type Edge,
  type NodeKind,
  type Provenance,
  type SemanticNode,
  snapshotNode,
  type Value,
} from "./node.ts";
import { recordSpawn, recordUpdate } from "./history.ts";
import { spawnProvenance } from "./provenance.ts";

export interface DriftResult {
  hasDrift: boolean;
  driftClass: "cosmetic" | "structural" | "telic" | "none";
  field?: string;
  oldValue?: Value;
  newValue?: Value;
  message?: string;
}

export interface QueryResult {
  node: SemanticNode;
  childCount: number;
  descendantCount: number;
  hasDrift: boolean;
  summary: string;
}

/**
 * The Semantic Graph holds all nodes and edges in a namespace.
 */
export class SemanticGraph {
  nodes: Map<string, SemanticNode> = new Map();
  edges: Edge[] = [];
  namespace: string;
  private nodesByName: Map<string, string> = new Map(); // name -> id

  constructor(namespace: string = "default") {
    this.namespace = namespace;
  }

  /**
   * Create a new node in the graph.
   */
  create(
    kind: NodeKind,
    name: string,
    fields: Record<string, Value> = {},
    provenance: Provenance = "organic"
  ): SemanticNode {
    const node = createNode(kind, name, fields, provenance);
    this.nodes.set(node.id, node);
    this.nodesByName.set(name, node.id);
    return node;
  }

  /**
   * Get a node by ID or name.
   */
  get(idOrName: string): SemanticNode | undefined {
    // Try direct ID lookup first
    let node = this.nodes.get(idOrName);
    if (node) return node;

    // Try name lookup
    const id = this.nodesByName.get(idOrName);
    if (id) {
      node = this.nodes.get(id);
    }
    return node;
  }

  /**
   * Check if a node exists by ID or name.
   */
  has(idOrName: string): boolean {
    return this.get(idOrName) !== undefined;
  }

  /**
   * Spawn a child node from a parent.
   */
  spawn(parentIdOrName: string, childName: string): SemanticNode | null {
    const parent = this.get(parentIdOrName);
    if (!parent) return null;

    // Child inherits parent's kind, or defaults to "node"
    const childKind = parent.kind === "node" ? "node" : parent.kind;

    const child = this.create(
      childKind,
      childName,
      {},
      spawnProvenance(parent)
    );

    // Link parent and child
    child.parent = parent.id;
    parent.children.push(child.id);

    // Record in history
    recordSpawn(parent, childName);

    // Create edge
    this.edges.push({
      id: `edge-${parent.id}-${child.id}`,
      from: parent.id,
      to: child.id,
      type: "spawned",
      created: new Date(),
    });

    return child;
  }

  /**
   * Update a field on a node, returning drift information.
   */
  update(
    idOrName: string,
    field: string,
    value: Value
  ): DriftResult {
    const node = this.get(idOrName);
    if (!node) {
      return {
        hasDrift: false,
        driftClass: "none",
        message: `Node not found: ${idOrName}`,
      };
    }

    const oldValue = node.fields[field];
    const driftClass = classifyDrift(field, oldValue, value);

    // Record the update
    recordUpdate(node, field, oldValue, value);
    node.fields[field] = value;

    return {
      hasDrift: driftClass !== "none" && driftClass !== "cosmetic",
      driftClass,
      field,
      oldValue,
      newValue: value,
      message:
        driftClass === "telic"
          ? `Telic drift: ${field} changed from "${oldValue}" to "${value}"`
          : undefined,
    };
  }

  /**
   * Query information about a node.
   */
  query(idOrName: string): QueryResult | null {
    const node = this.get(idOrName);
    if (!node) return null;

    const descendantCount = this.countDescendants(node.id);

    return {
      node,
      childCount: node.children.length,
      descendantCount,
      hasDrift: false, // TODO: implement drift detection
      summary: this.summarizeNode(node),
    };
  }

  /**
   * Get a snapshot of a node at a specific version.
   */
  snapshot(idOrName: string, version?: number): SemanticNode | null {
    const node = this.get(idOrName);
    if (!node) return null;
    return snapshotNode(node, version);
  }

  /**
   * List all nodes in the graph.
   */
  list(): SemanticNode[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Get all root nodes (no parent).
   */
  roots(): SemanticNode[] {
    return this.list().filter((n) => !n.parent);
  }

  /**
   * Count all descendants of a node.
   */
  private countDescendants(id: string): number {
    const node = this.nodes.get(id);
    if (!node) return 0;

    let count = node.children.length;
    for (const childId of node.children) {
      count += this.countDescendants(childId);
    }
    return count;
  }

  /**
   * Generate a summary string for a node.
   */
  private summarizeNode(node: SemanticNode): string {
    const about = node.fields.about ?? node.fields.focus ?? node.name;
    const lines = [
      `${node.name} is a ${node.kind}.`,
      `About: "${about}"`,
      `Provenance: ${node.provenance}`,
      `Children: ${node.children.length}`,
    ];
    return lines.join("\n");
  }

  /**
   * Export the graph to a serializable format.
   */
  toJSON(): object {
    return {
      namespace: this.namespace,
      nodes: Array.from(this.nodes.values()),
      edges: this.edges,
    };
  }

  /**
   * Import from a serialized format.
   */
  static fromJSON(data: {
    namespace: string;
    nodes: SemanticNode[];
    edges: Edge[];
  }): SemanticGraph {
    const graph = new SemanticGraph(data.namespace);
    for (const node of data.nodes) {
      // Convert date strings back to Date objects
      node.created = new Date(node.created);
      node.history = node.history.map((h) => ({
        ...h,
        timestamp: new Date(h.timestamp),
      }));
      graph.nodes.set(node.id, node);
      graph.nodesByName.set(node.name, node.id);
    }
    graph.edges = data.edges.map((e) => ({
      ...e,
      created: new Date(e.created),
    }));
    return graph;
  }
}

/**
 * Classify the type of drift a field change represents.
 */
function classifyDrift(
  field: string,
  oldValue: Value,
  newValue: Value
): "cosmetic" | "structural" | "telic" | "none" {
  // No change
  if (JSON.stringify(oldValue) === JSON.stringify(newValue)) {
    return "none";
  }

  // Telic fields affect purpose/intent
  const telicFields = ["focus", "horizon", "outcomes", "vector"];
  if (telicFields.includes(field)) {
    return "telic";
  }

  // Structural fields affect relationships
  const structuralFields = ["depends_on", "refines", "parent", "children"];
  if (structuralFields.includes(field)) {
    return "structural";
  }

  // Everything else is cosmetic
  return "cosmetic";
}
