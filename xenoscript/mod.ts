/**
 * XenoScript v0.3
 * A semantic programming language for meaning-first development.
 */

import { startRepl } from "./src/repl/repl.ts";
import { loadFile } from "./src/loader/loader.ts";
import { provenanceSymbol } from "./src/core/provenance.ts";
import { lintFile, formatDiagnostics } from "./src/linter/linter.ts";

const VERSION = "0.3.0-dev";

if (import.meta.main) {
  const args = Deno.args;

  // Handle --help
  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
XenoScript v${VERSION}

Usage:
  xeno                     Start the REPL
  xeno <file.xeno>         Load a .xeno file and start REPL
  xeno run <file.xeno>     Run a .xeno file (no REPL)
  xeno lint <file.xeno>    Check a .xeno file for issues
  xeno --help              Show this help

Examples:
  xeno examples/hello.xeno
  xeno run examples/project.xeno
  xeno lint examples/expressions.xeno
`);
    Deno.exit(0);
  }

  // Handle "lint" command
  if (args[0] === "lint" && args[1]) {
    const result = await lintFile(args[1]);
    console.log(formatDiagnostics(result));
    
    const hasErrors = result.diagnostics.some((d) => d.severity === "error");
    Deno.exit(hasErrors ? 1 : 0);
  }

  // Handle "run" command (load file, print results, exit)
  if (args[0] === "run" && args[1]) {
    const result = await loadFile(args[1]);
    
    if (result.errors.length > 0) {
      console.error("Errors:");
      result.errors.forEach((e) => console.error(`  ${e}`));
      Deno.exit(1);
    }

    console.log(`Loaded ${result.nodesCreated} objects from ${args[1]}`);
    console.log("");
    
    // Print the graph
    for (const node of result.graph.list()) {
      const symbol = provenanceSymbol(node.provenance);
      const horizon = node.fields.horizon ?? "?";
      console.log(`${symbol} ${node.name} [h${horizon}] — ${node.fields.focus ?? ""}`);
    }
    
    Deno.exit(0);
  }

  // Handle file argument (load file then start REPL)
  if (args[0] && args[0].endsWith(".xeno")) {
    console.log(`XenoScript v${VERSION}`);
    console.log(`Loading ${args[0]}...`);
    
    const result = await loadFile(args[0]);
    
    if (result.errors.length > 0) {
      console.error("Errors:");
      result.errors.forEach((e) => console.error(`  ${e}`));
    } else {
      console.log(`Loaded ${result.nodesCreated} objects`);
    }
    console.log("");
    
    await startRepl(undefined, result.graph);
  } else {
    // Default: start REPL
    console.log(`XenoScript v${VERSION}`);
    await startRepl();
  }
}

export { VERSION };
export { SemanticGraph } from "./src/core/graph.ts";
export { type SemanticNode } from "./src/core/node.ts";
export { parse } from "./src/parser/parser.ts";
export { loadFile } from "./src/loader/loader.ts";
export { lintFile, lintContent, formatDiagnostics, type LintResult, type LintDiagnostic } from "./src/linter/linter.ts";