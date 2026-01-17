/**
 * Output rendering for XenoScript REPL.
 */

// ANSI color codes
const COLORS = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

/**
 * Render output with syntax highlighting.
 */
export function renderOutput(output: string, isError: boolean = false): string {
  if (isError) {
    return `${COLORS.red}${output}${COLORS.reset}`;
  }

  // Highlight provenance symbols
  let result = output
    .replace(/◉/g, `${COLORS.green}◉${COLORS.reset}`)
    .replace(/○/g, `${COLORS.cyan}○${COLORS.reset}`)
    .replace(/◐/g, `${COLORS.yellow}◐${COLORS.reset}`);

  // Highlight warnings
  result = result.replace(/⚠/g, `${COLORS.yellow}⚠${COLORS.reset}`);

  // Highlight section headers like [tasks], [graph], [reflection]
  result = result.replace(/\[(tasks|graph|reflection|outline)\]/g, 
    `${COLORS.magenta}[$1]${COLORS.reset}`);

  return result;
}

/**
 * Render the prompt.
 */
export function renderPrompt(namespace: string): string {
  return `${COLORS.dim}${namespace}${COLORS.reset} ${COLORS.cyan}>${COLORS.reset} `;
}

/**
 * Render a welcome message.
 */
export function renderWelcome(version: string, namespace: string, provenance: string): string {
  const lines: string[] = [];
  lines.push(`${COLORS.bold}XenoScript v${version}${COLORS.reset}`);
  lines.push(`${COLORS.dim}namespace: ${namespace}${COLORS.reset}`);
  lines.push(`${COLORS.dim}provenance: ${provenance}${COLORS.reset}`);
  lines.push("");
  return lines.join("\n");
}

/**
 * Clear formatting from a string.
 */
export function stripColors(text: string): string {
  return text.replace(/\x1b\[[0-9;]*m/g, "");
}
