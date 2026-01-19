Repo Projector MVP (v0)
Goal

Render a human-readable projection of the repo by surfacing directory READMEs (and a few other surface docs) while hiding implementation details.

Non-goals

No GitHub API

No auth, no comments system

No source code browsing

No perfect ontology/metadata system (optional light frontmatter only)

Inputs

The repo filesystem (local at build time)

A config file: projection.yml (root)

projection.yml (minimal)

sections: map section name → path prefix

exclude: glob patterns for plumbing directories

surfaceFiles: list of filenames to treat as “public surfaces”

maxDepth: integer

Example (conceptual fields, keep it tiny):

sections: root: ".", core: "core", org: "org", nodes: "nodes", artifacts: "artifacts", docs: "docs"

exclude: ["**/src/**","**/dist/**","**/build/**","**/node_modules/**","**/.git/**","**/scripts/**"]

surfaceFiles: ["README.md","about.md","overview.md","index.md"]

maxDepth: 3

Core Concepts
Surface

A markdown file that represents a directory’s public explanation (README/about/etc).

Gallery Page

A page for a directory that:

renders its surface markdown

lists child directories that also have surfaces (as “exhibits”)

Output

A build-generated index file:

public/projection/index.json

This drives all navigation.

index.json minimal schema
{
  "generatedAt": "...",
  "items": [
    {
      "id": "core",
      "section": "core",
      "type": "directory",
      "title": "Core",
      "path": "core",
      "surfacePath": "core/README.md",
      "children": ["core/sensor", "core/whatever"]
    }
  ]
}


ID rule: id = normalized directory path (e.g. core/sensor)

Title rule: first H1 in the surface markdown, else folder name.

App Routes (Next.js)
1) / — Map

Show the sections as big links/cards.

Each section links to /s/[section].

2) /s/[section] — Section index

Lists top-level surfaced directories inside that section (depth = 1 under section root).

Each item links to /p/[id].

3) /p/[...id] — Gallery page

Given an id (directory path):

Render markdown from surfacePath.

Show child surfaced directories (cards/list).

Show breadcrumb from id segments.

Build Step

A single script: scripts/generateProjectionIndex.ts

Responsibilities

Read projection.yml

Walk the repo directories under each section path

Ignore excluded globs + ignore non-markdown files

For each directory:

find first matching surface file in priority order (e.g. about.md > README.md > … or vice versa)

if found, add item to index

Populate children relationships for surfaced dirs

Write public/projection/index.json

Markdown Rendering

Render markdown → HTML using your preferred library (MDX optional).

Minimum requirements:

headings

links

code blocks (fine to show in docs, but you’re not showing source files)

Visibility Rules (v0)

A directory is visible only if it has a surface file

A child is listed only if it also has a surface

Files that aren’t “surfaces” are never shown

That single rule prevents “repo tree” vibes.

Styling (v0)

Clean, minimal:

Section cards on /

Gallery page: markdown content + “Exhibits” list below

Breadcrumb at top

No fancy visuals needed yet.

Success Criteria

You can:

click Core

read Core’s layman README

click into a child package that also has a README

never see source code or raw file listings

feel the hierarchy via breadcrumbs + galleries

Optional Nice-to-haves (still fast)

“Open on GitHub” link on each page (direct link to surfacePath)

Show “Last updated” using git commit time later (skip for v0)