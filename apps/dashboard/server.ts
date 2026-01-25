import { createServer, IncomingMessage } from "node:http";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { ObservationStore, resolveDbPath } from "@numinous-systems/sensor";
import { parseChaseCSVContent } from "@numinous-systems/finance/dist/chase-csv.js";

const PORT = 3333;

function findWorkspaceRoot(): string {
  let current = process.cwd();
  while (current !== "/") {
    if (existsSync(join(current, ".git"))) {
      return current;
    }
    current = resolve(current, "..");
  }
  return process.cwd();
}

function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor(diffMs / (1000 * 60));

  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  if (diffMins > 0) return `${diffMins}m ago`;
  return "just now";
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function formatShortDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function getStaleness(isoString: string): "fresh" | "stale" | "old" {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (diffDays < 2) return "fresh";
  if (diffDays < 7) return "stale";
  return "old";
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

interface RecentObservation {
  id: string;
  observed_at: string;
  domain: string;
  type: string;
  summary: string;
}

async function getStatusData(node: string) {
  const workspaceRoot = findWorkspaceRoot();
  const dbPath = resolveDbPath(workspaceRoot, node);

  if (!existsSync(dbPath)) {
    return { exists: false, domains: [], recent: [] as RecentObservation[] };
  }

  const store = await ObservationStore.create(dbPath);
  const status = store.getStatus();

  // Get recent observations
  const recentObs = store.queryObservations({ limit: 10 });
  const recent: RecentObservation[] = recentObs.map((o) => ({
    id: o.id.substring(0, 8),
    observed_at: o.observed_at,
    domain: o.domain,
    type: o.type,
    summary: extractSummary(o.domain, o.payload),
  }));

  store.close();

  return { exists: true, ...status, recent };
}

function extractSummary(
  domain: string,
  payload: Record<string, unknown>
): string {
  // Domain-specific summary extraction
  if (domain === "finance") {
    const desc = payload.description_raw as string | undefined;
    const amount = payload.amount_cents as number | undefined;
    if (desc && amount !== undefined) {
      const amountStr =
        amount < 0
          ? `-$${(Math.abs(amount) / 100).toFixed(2)}`
          : `$${(amount / 100).toFixed(2)}`;
      const shortDesc = desc.length > 30 ? desc.substring(0, 30) + "..." : desc;
      return `${amountStr} ${shortDesc}`;
    }
  }
  if (domain === "thought") {
    const content = payload.content as string | undefined;
    if (content) {
      return content.length > 50 ? content.substring(0, 50) + "..." : content;
    }
  }
  // Generic fallback
  const keys = Object.keys(payload);
  if (keys.length > 0) {
    const firstVal = payload[keys[0]];
    if (typeof firstVal === "string") {
      return firstVal.length > 50 ? firstVal.substring(0, 50) + "..." : firstVal;
    }
  }
  return "—";
}

async function readBody(req: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks);
}

function parseMultipart(
  body: Buffer,
  contentType: string
): { filename: string; content: string } | null {
  const boundaryMatch = contentType.match(/boundary=(.+)$/);
  if (!boundaryMatch) return null;

  const boundary = boundaryMatch[1];
  const bodyStr = body.toString("utf-8");

  // Simple multipart parser - find the file content between boundaries
  const parts = bodyStr.split(`--${boundary}`);

  for (const part of parts) {
    if (part.includes('filename="')) {
      const filenameMatch = part.match(/filename="([^"]+)"/);
      const filename = filenameMatch ? filenameMatch[1] : "unknown.csv";

      // Content starts after double newline
      const contentStart = part.indexOf("\r\n\r\n");
      if (contentStart === -1) continue;

      let content = part.slice(contentStart + 4);
      // Remove trailing boundary markers
      content = content.replace(/\r\n--$/, "").replace(/\r\n$/, "");

      return { filename, content };
    }
  }

  return null;
}

async function handleIngest(
  req: IncomingMessage,
  node: string
): Promise<{ success: boolean; message: string; details?: object }> {
  const contentType = req.headers["content-type"] || "";

  if (!contentType.includes("multipart/form-data")) {
    return { success: false, message: "Expected multipart/form-data" };
  }

  const body = await readBody(req);
  const file = parseMultipart(body, contentType);

  if (!file) {
    return { success: false, message: "No file found in request" };
  }

  if (!file.filename.toLowerCase().endsWith(".csv")) {
    return { success: false, message: "Only CSV files are supported" };
  }

  try {
    // Parse CSV content
    const parseResult = parseChaseCSVContent(file.content, {
      accountLabel: "checking", // Default for now
    });

    if (parseResult.observations.length === 0) {
      return {
        success: false,
        message: "No valid transactions found in file",
      };
    }

    // Store observations
    const workspaceRoot = findWorkspaceRoot();
    const dbPath = resolveDbPath(workspaceRoot, node);
    const store = await ObservationStore.create(dbPath);

    const runId = store.startIngestRun(file.filename, "finance");

    const result = store.insertObservations(parseResult.observations, {
      sourceRowHashes: parseResult.sourceRowHashes,
    });

    store.finishIngestRun(runId, {
      rowsRead: parseResult.rowCount,
      rowsInserted: result.inserted,
      rowsSkipped: result.skipped,
      minObserved: parseResult.minObserved,
      maxObserved: parseResult.maxObserved,
      status: "success",
    });

    store.close();

    return {
      success: true,
      message: `Ingested ${result.inserted} transactions`,
      details: {
        filename: file.filename,
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
  } catch (err) {
    return {
      success: false,
      message: `Parse error: ${err instanceof Error ? err.message : err}`,
    };
  }
}

function renderHTML(
  data: Awaited<ReturnType<typeof getStatusData>>,
  node: string,
  ingestResult?: { success: boolean; message: string; details?: object }
) {
  const domainCards = data.domains
    .map((d) => {
      const staleness = d.lastIngest
        ? getStaleness(d.lastIngest.finishedAt)
        : "old";
      const statusColor =
        staleness === "fresh"
          ? "#22c55e"
          : staleness === "stale"
            ? "#eab308"
            : "#ef4444";

      const coverage =
        d.minObserved && d.maxObserved
          ? formatDate(d.minObserved) === formatDate(d.maxObserved)
            ? formatDate(d.minObserved)
            : `${formatDate(d.minObserved)} – ${formatDate(d.maxObserved)}`
          : "—";

      const lastIngest = d.lastIngest
        ? `${formatRelativeTime(d.lastIngest.finishedAt)} (${formatShortDate(d.lastIngest.finishedAt)})`
        : "unknown";

      return `
      <div class="card">
        <div class="card-header">
          <span class="domain-name">${d.domain}</span>
          <span class="status-dot" style="background: ${statusColor}"></span>
        </div>
        <div class="stats">
          <div class="stat">
            <span class="stat-value">${d.count.toLocaleString()}</span>
            <span class="stat-label">observations</span>
          </div>
          <div class="stat">
            <span class="stat-value">${coverage}</span>
            <span class="stat-label">coverage</span>
          </div>
          <div class="stat">
            <span class="stat-value">${lastIngest}</span>
            <span class="stat-label">last ingest</span>
          </div>
        </div>
      </div>
    `;
    })
    .join("");

  const toast = ingestResult
    ? `<div class="toast ${ingestResult.success ? "success" : "error"}">${ingestResult.message}</div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sensor Dashboard</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0a0a0a;
      color: #fafafa;
      min-height: 100vh;
      padding: 2rem;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
    }
    header {
      margin-bottom: 2rem;
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    }
    h1 {
      font-size: 1.5rem;
      font-weight: 500;
      color: #a1a1aa;
    }
    .node-label {
      font-size: 0.875rem;
      color: #52525b;
    }
    .cards {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .card {
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 8px;
      padding: 1.25rem;
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    .domain-name {
      font-size: 1.125rem;
      font-weight: 500;
    }
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
    }
    .stat {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .stat-value {
      font-size: 0.9375rem;
      color: #fafafa;
    }
    .stat-label {
      font-size: 0.75rem;
      color: #71717a;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .empty {
      text-align: center;
      padding: 3rem;
      color: #52525b;
    }

    /* Drop zone */
    .dropzone {
      border: 2px dashed #27272a;
      border-radius: 8px;
      padding: 2rem;
      text-align: center;
      margin-bottom: 1.5rem;
      transition: all 0.2s;
      cursor: pointer;
    }
    .dropzone:hover {
      border-color: #3f3f46;
      background: #18181b;
    }
    .dropzone.dragover {
      border-color: #22c55e;
      background: rgba(34, 197, 94, 0.1);
    }
    .dropzone.uploading {
      border-color: #3b82f6;
      background: rgba(59, 130, 246, 0.1);
    }
    .dropzone-text {
      color: #71717a;
      font-size: 0.875rem;
    }
    .dropzone-text strong {
      color: #a1a1aa;
    }
    .dropzone input {
      display: none;
    }

    /* Toast */
    .toast {
      padding: 0.75rem 1rem;
      border-radius: 6px;
      margin-bottom: 1rem;
      font-size: 0.875rem;
    }
    .toast.success {
      background: rgba(34, 197, 94, 0.15);
      border: 1px solid rgba(34, 197, 94, 0.3);
      color: #22c55e;
    }
    .toast.error {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #ef4444;
    }

    .refresh {
      font-size: 0.75rem;
      color: #52525b;
      margin-top: 2rem;
      text-align: center;
    }

    /* Recent observations */
    .section-header {
      font-size: 0.875rem;
      font-weight: 500;
      color: #71717a;
      margin: 2rem 0 1rem 0;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .recent-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8125rem;
    }
    .recent-table th {
      text-align: left;
      padding: 0.5rem 0.75rem;
      color: #52525b;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-size: 0.6875rem;
      border-bottom: 1px solid #27272a;
    }
    .recent-table td {
      padding: 0.625rem 0.75rem;
      border-bottom: 1px solid #18181b;
      color: #a1a1aa;
    }
    .recent-table tr:hover td {
      background: #18181b;
    }
    .recent-table .domain-cell {
      color: #71717a;
    }
    .recent-table .summary-cell {
      color: #fafafa;
      max-width: 300px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Sensor Status</h1>
      <span class="node-label">${node}</span>
    </header>

    ${toast}

    <div class="dropzone" id="dropzone">
      <input type="file" id="fileInput" accept=".csv">
      <p class="dropzone-text"><strong>Drop CSV here</strong> or click to select</p>
    </div>

    <div class="cards">
      ${data.domains.length > 0 ? domainCards : '<div class="empty">No observations yet</div>'}
    </div>

    ${data.recent && data.recent.length > 0 ? `
    <h2 class="section-header">Recent Observations</h2>
    <table class="recent-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Domain</th>
          <th>Summary</th>
        </tr>
      </thead>
      <tbody>
        ${data.recent.map((o: RecentObservation) => `
        <tr>
          <td>${formatShortDate(o.observed_at)}</td>
          <td class="domain-cell">${o.domain}</td>
          <td class="summary-cell">${escapeHtml(o.summary)}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
    ` : ''}

    <p class="refresh">Refresh to update</p>
  </div>

  <script>
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');

    dropzone.addEventListener('click', () => fileInput.click());

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        uploadFile(files[0]);
      }
    });

    fileInput.addEventListener('change', () => {
      if (fileInput.files.length > 0) {
        uploadFile(fileInput.files[0]);
      }
    });

    async function uploadFile(file) {
      dropzone.classList.add('uploading');
      dropzone.querySelector('.dropzone-text').innerHTML = '<strong>Uploading...</strong>';

      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch(window.location.href, {
          method: 'POST',
          body: formData
        });

        // Reload page to show results
        window.location.reload();
      } catch (err) {
        alert('Upload failed: ' + err.message);
        dropzone.classList.remove('uploading');
        dropzone.querySelector('.dropzone-text').innerHTML = '<strong>Drop CSV here</strong> or click to select';
      }
    }
  </script>
</body>
</html>`;
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
  const node = url.searchParams.get("node") ?? "personal";

  try {
    let ingestResult: { success: boolean; message: string; details?: object } | undefined;

    // Handle file upload
    if (req.method === "POST") {
      ingestResult = await handleIngest(req, node);
    }

    const data = await getStatusData(node);
    const html = renderHTML(data, node, ingestResult);

    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(html);
  } catch (err) {
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end(`Error: ${err}`);
  }
});

server.listen(PORT, () => {
  console.log(`Dashboard running at http://localhost:${PORT}`);
  console.log(`  ?node=personal (default)`);
  console.log(`  ?node=org`);
});
