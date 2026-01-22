#!/usr/bin/env npx tsx
/**
 * Artifact Graph Generator
 *
 * Parses frontmatter from all artifacts and generates an interactive
 * force-directed graph visualization.
 *
 * Usage:
 *   npx tsx scripts/generate-graph.ts
 *   open artifacts-graph.html
 */

import * as fs from 'fs'
import * as path from 'path'
import matter from 'gray-matter'

const ROOT = path.resolve(import.meta.dirname, '..')
const ARTIFACTS_PATH = path.join(ROOT, 'nodes/org/artifacts')
const OUTPUT_PATH = path.join(ROOT, 'artifacts-graph.html')

// Color palette by category
const CATEGORY_COLORS: Record<string, string> = {
  core: '#e63946',      // red - central philosophy
  essay: '#f4a261',     // orange - supporting arguments
  aesthetic: '#e9c46a', // yellow - sensory
  song: '#2a9d8f',      // teal - musical
  story: '#9b5de5',     // purple - narrative
  app: '#00b4d8',       // blue - applications
  reference: '#6c757d', // gray - frameworks
  uncategorized: '#adb5bd',
}

interface Artifact {
  slug: string
  title: string
  category: string
  status: string
  relates_to: string[]
  path: string
}

interface GraphData {
  nodes: { id: string; title: string; category: string; status: string }[]
  links: { source: string; target: string }[]
}

function findArtifactFiles(): string[] {
  const files: string[] = []

  function walk(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(fullPath)
      } else if (entry.name === 'about.md') {
        files.push(fullPath)
      }
    }
  }

  walk(ARTIFACTS_PATH)
  return files
}

function parseArtifact(filePath: string): Artifact | null {
  const relativePath = path.relative(ARTIFACTS_PATH, filePath)
  const depth = relativePath.split('/').length

  // Skip category-level index files
  if (depth < 2) return null

  const content = fs.readFileSync(filePath, 'utf-8')
  const { data } = matter(content)

  const slug = path.basename(path.dirname(filePath))

  return {
    slug,
    title: data.title || slug,
    category: data.category || 'uncategorized',
    status: data.status || 'draft',
    relates_to: data.relates_to || [],
    path: relativePath,
  }
}

function buildGraphData(artifacts: Artifact[]): GraphData {
  const slugSet = new Set(artifacts.map(a => a.slug))

  const nodes = artifacts.map(a => ({
    id: a.slug,
    title: a.title,
    category: a.category,
    status: a.status,
  }))

  const links: { source: string; target: string }[] = []

  for (const artifact of artifacts) {
    for (const target of artifact.relates_to) {
      // Only create links to artifacts that exist
      if (slugSet.has(target)) {
        links.push({ source: artifact.slug, target })
      }
    }
  }

  return { nodes, links }
}

function generateHTML(data: GraphData): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Numinous Systems — Artifact Graph</title>
  <script src="https://d3js.org/d3.v7.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0a0a0a;
      color: #e0e0e0;
      overflow: hidden;
    }
    #graph { width: 100vw; height: 100vh; }
    .node { cursor: pointer; }
    .node circle { stroke: #fff; stroke-width: 1.5px; }
    .node text {
      font-size: 11px;
      fill: #e0e0e0;
      pointer-events: none;
      text-shadow: 0 0 3px #0a0a0a, 0 0 6px #0a0a0a;
    }
    .link { stroke: #444; stroke-opacity: 0.6; }
    .link.highlighted { stroke: #fff; stroke-opacity: 1; stroke-width: 2px; }
    .node.dimmed circle { opacity: 0.2; }
    .node.dimmed text { opacity: 0.2; }
    .link.dimmed { stroke-opacity: 0.1; }

    #legend {
      position: fixed;
      top: 20px;
      left: 20px;
      background: rgba(20, 20, 20, 0.9);
      padding: 16px;
      border-radius: 8px;
      font-size: 13px;
    }
    #legend h3 { margin-bottom: 12px; font-weight: 500; }
    .legend-item { display: flex; align-items: center; margin: 6px 0; }
    .legend-dot { width: 12px; height: 12px; border-radius: 50%; margin-right: 8px; }

    #info {
      position: fixed;
      bottom: 20px;
      left: 20px;
      background: rgba(20, 20, 20, 0.9);
      padding: 16px;
      border-radius: 8px;
      font-size: 13px;
      max-width: 300px;
      display: none;
    }
    #info h4 { margin-bottom: 8px; }
    #info .category { opacity: 0.6; margin-bottom: 8px; }
    #info .connections { margin-top: 8px; }

    #stats {
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(20, 20, 20, 0.9);
      padding: 16px;
      border-radius: 8px;
      font-size: 13px;
      text-align: right;
    }
    #stats .number { font-size: 24px; font-weight: 300; }
  </style>
</head>
<body>
  <div id="graph"></div>

  <div id="legend">
    <h3>Categories</h3>
    ${Object.entries(CATEGORY_COLORS).filter(([k]) => k !== 'uncategorized').map(([cat, color]) => `
    <div class="legend-item">
      <div class="legend-dot" style="background: ${color}"></div>
      <span>${cat}</span>
    </div>`).join('')}
  </div>

  <div id="stats">
    <div><span class="number">${data.nodes.length}</span> artifacts</div>
    <div><span class="number">${data.links.length}</span> connections</div>
  </div>

  <div id="info">
    <h4 id="info-title"></h4>
    <div class="category" id="info-category"></div>
    <div class="connections" id="info-connections"></div>
  </div>

  <script>
    const data = ${JSON.stringify(data)};
    const colors = ${JSON.stringify(CATEGORY_COLORS)};

    const width = window.innerWidth;
    const height = window.innerHeight;

    const svg = d3.select("#graph")
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    // Add zoom behavior
    const g = svg.append("g");
    svg.call(d3.zoom()
      .scaleExtent([0.2, 4])
      .on("zoom", (event) => g.attr("transform", event.transform)));

    const simulation = d3.forceSimulation(data.nodes)
      .force("link", d3.forceLink(data.links).id(d => d.id).distance(80))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(30));

    const link = g.append("g")
      .selectAll("line")
      .data(data.links)
      .join("line")
      .attr("class", "link");

    const node = g.append("g")
      .selectAll("g")
      .data(data.nodes)
      .join("g")
      .attr("class", "node")
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    // Size nodes by connection count
    const connectionCount = {};
    data.links.forEach(l => {
      connectionCount[l.source.id || l.source] = (connectionCount[l.source.id || l.source] || 0) + 1;
      connectionCount[l.target.id || l.target] = (connectionCount[l.target.id || l.target] || 0) + 1;
    });

    node.append("circle")
      .attr("r", d => 6 + (connectionCount[d.id] || 0) * 1.5)
      .attr("fill", d => colors[d.category] || colors.uncategorized);

    node.append("text")
      .attr("dx", d => 10 + (connectionCount[d.id] || 0) * 1.5)
      .attr("dy", 4)
      .text(d => d.title);

    // Hover interactions
    node.on("mouseenter", function(event, d) {
      const connected = new Set([d.id]);
      data.links.forEach(l => {
        if (l.source.id === d.id) connected.add(l.target.id);
        if (l.target.id === d.id) connected.add(l.source.id);
      });

      node.classed("dimmed", n => !connected.has(n.id));
      link.classed("dimmed", l => l.source.id !== d.id && l.target.id !== d.id);
      link.classed("highlighted", l => l.source.id === d.id || l.target.id === d.id);

      // Show info panel
      const info = document.getElementById("info");
      document.getElementById("info-title").textContent = d.title;
      document.getElementById("info-category").textContent = d.category;

      const connections = [];
      data.links.forEach(l => {
        if (l.source.id === d.id) connections.push("→ " + l.target.title);
        if (l.target.id === d.id) connections.push("← " + l.source.title);
      });
      document.getElementById("info-connections").textContent =
        connections.length ? connections.join("\\n") : "No connections";
      info.style.display = "block";
    });

    node.on("mouseleave", function() {
      node.classed("dimmed", false);
      link.classed("dimmed", false);
      link.classed("highlighted", false);
      document.getElementById("info").style.display = "none";
    });

    simulation.on("tick", () => {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      node.attr("transform", d => \`translate(\${d.x},\${d.y})\`);
    });

    function dragstarted(event) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }
  </script>
</body>
</html>`
}

function main() {
  const files = findArtifactFiles()
  const artifacts = files.map(parseArtifact).filter((a): a is Artifact => a !== null)

  console.log(`Found ${artifacts.length} artifacts`)

  const graphData = buildGraphData(artifacts)
  console.log(`Graph: ${graphData.nodes.length} nodes, ${graphData.links.length} edges`)

  const html = generateHTML(graphData)
  fs.writeFileSync(OUTPUT_PATH, html)

  console.log(`\n✨ Generated: ${OUTPUT_PATH}`)
  console.log(`   Open in browser to explore your artifact graph`)
}

main()
