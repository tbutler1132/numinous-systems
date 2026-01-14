/**
 * REPL for XenoScript.
 */

import { SemanticGraph } from "../core/graph.ts";
import { execute, type ExecutorState } from "../executor/executor.ts";
import { loadGraph, saveGraph } from "../persistence/store.ts";
import { loadFile } from "../loader/loader.ts";
import { renderOutput, renderPrompt, renderWelcome } from "./render.ts";

const VERSION = "0.3.0-dev";

/**
 * Start the REPL.
 */
export async function startRepl(
  namespaceName?: string,
  existingGraph?: SemanticGraph
): Promise<void> {
  // Use existing graph, load from disk, or create new
  let graph: SemanticGraph;
  
  if (existingGraph) {
    graph = existingGraph;
  } else if (namespaceName) {
    const loaded = await loadGraph(namespaceName);
    graph = loaded ?? new SemanticGraph(namespaceName);
  } else {
    graph = new SemanticGraph("default");
  }

  const state: ExecutorState = {
    graph,
    provenance: "organic", // REPL input is organic by default
  };

  // Print welcome
  console.log(renderWelcome(VERSION, graph.namespace, state.provenance));

  // REPL loop
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  let running = true;
  let buffer = "";

  while (running) {
    // Print prompt
    await Deno.stdout.write(encoder.encode(renderPrompt(graph.namespace)));

    // Read line
    const line = await readLine();
    
    if (line === null) {
      // EOF
      console.log("\nGoodbye.");
      break;
    }

    buffer = line;

    // Handle multi-line input (blocks)
    if (buffer.includes("{") && !buffer.includes("}")) {
      // Read until we get the closing brace
      while (!buffer.includes("}")) {
        await Deno.stdout.write(encoder.encode("... "));
        const continuation = await readLine();
        if (continuation === null) break;
        buffer += "\n" + continuation;
      }
    }

    // Execute
    const result = execute(state, buffer);

    // Handle output
    if (result.output) {
      console.log(renderOutput(result.output, !result.success));
    }

    // Handle special commands
    if (result.shouldExit) {
      running = false;
    }

    // Handle save command
    if (buffer.trim().startsWith("save")) {
      await saveGraph(graph);
    }

    // Handle run command
    if (buffer.trim().startsWith("run ")) {
      const file = buffer.trim().slice(4).trim();
      if (file) {
        try {
          const loadResult = await loadFile(file, graph);
          if (loadResult.errors.length > 0) {
            console.log(renderOutput(loadResult.errors.join("\n"), true));
          } else {
            console.log(renderOutput(`Loaded ${loadResult.nodesCreated} objects from ${file}`, false));
          }
        } catch (e) {
          console.log(renderOutput(`Error loading ${file}: ${e}`, true));
        }
      }
    }

    buffer = "";
  }
}

/**
 * Read a line from stdin.
 */
async function readLine(): Promise<string | null> {
  const buf = new Uint8Array(1024);
  const n = await Deno.stdin.read(buf);
  
  if (n === null) {
    return null;
  }

  const decoder = new TextDecoder();
  const line = decoder.decode(buf.subarray(0, n));
  
  // Remove trailing newline
  return line.replace(/\r?\n$/, "");
}

/**
 * Run a single command (for testing or scripting).
 */
export function runCommand(graph: SemanticGraph, input: string): string {
  const state: ExecutorState = {
    graph,
    provenance: "organic",
  };

  const result = execute(state, input);
  return result.output;
}
