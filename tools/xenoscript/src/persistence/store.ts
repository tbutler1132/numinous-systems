/**
 * Persistence store for XenoScript graphs.
 */

import { SemanticGraph } from "../core/graph.ts";
import { deserializeGraph, serializeGraph } from "./json.ts";

/**
 * Get the default storage directory.
 */
function getStorageDir(): string {
  const home = Deno.env.get("HOME") ?? Deno.env.get("USERPROFILE") ?? ".";
  return `${home}/.xeno`;
}

/**
 * Ensure the storage directory exists.
 */
async function ensureStorageDir(): Promise<void> {
  const dir = getStorageDir();
  try {
    await Deno.mkdir(dir, { recursive: true });
  } catch (e) {
    if (!(e instanceof Deno.errors.AlreadyExists)) {
      throw e;
    }
  }
}

/**
 * Get the file path for a namespace.
 */
function getFilePath(namespace: string): string {
  const safeName = namespace.replace(/[^a-zA-Z0-9_-]/g, "_");
  return `${getStorageDir()}/${safeName}.json`;
}

/**
 * Save a graph to disk.
 */
export async function saveGraph(graph: SemanticGraph): Promise<string> {
  await ensureStorageDir();
  
  const filePath = getFilePath(graph.namespace);
  const json = serializeGraph(graph);
  
  await Deno.writeTextFile(filePath, json);
  
  const nodeCount = graph.list().length;
  const edgeCount = graph.edges.length;
  
  console.log(`saved to ${filePath}`);
  console.log(`  ${nodeCount} objects`);
  console.log(`  ${edgeCount} relations`);
  
  return filePath;
}

/**
 * Load a graph from disk.
 */
export async function loadGraph(namespace: string): Promise<SemanticGraph | null> {
  const filePath = getFilePath(namespace);
  
  try {
    const json = await Deno.readTextFile(filePath);
    const graph = deserializeGraph(json);
    
    console.log(`loaded: ${namespace} (${graph.list().length} objects)`);
    
    return graph;
  } catch (e) {
    if (e instanceof Deno.errors.NotFound) {
      return null;
    }
    throw e;
  }
}

/**
 * List all saved namespaces.
 */
export async function listNamespaces(): Promise<string[]> {
  const dir = getStorageDir();
  const namespaces: string[] = [];
  
  try {
    for await (const entry of Deno.readDir(dir)) {
      if (entry.isFile && entry.name.endsWith(".json")) {
        namespaces.push(entry.name.slice(0, -5));
      }
    }
  } catch (e) {
    if (!(e instanceof Deno.errors.NotFound)) {
      throw e;
    }
  }
  
  return namespaces;
}

/**
 * Delete a saved namespace.
 */
export async function deleteNamespace(namespace: string): Promise<boolean> {
  const filePath = getFilePath(namespace);
  
  try {
    await Deno.remove(filePath);
    return true;
  } catch (e) {
    if (e instanceof Deno.errors.NotFound) {
      return false;
    }
    throw e;
  }
}
