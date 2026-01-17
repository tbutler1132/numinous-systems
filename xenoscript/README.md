# XenoScript

A semantic programming language for meaning-first development.

## What It Is

XenoScript is a language where **meaning is the primitive**. You declare semantic nodes, the system builds a graph, and you can project that graph into different views.

**What makes it different:**
- **Provenance tracking** — knows if something was human-created or generated
- **Semantic drift detection** — notices when changes affect meaning
- **Projections** — same graph, multiple views (tree, list, questions)
- **History as meaning** — tracks semantic changes, not just text edits

## Requirements

- [Deno](https://deno.land/) v1.40+ 

Install Deno:
```bash
curl -fsSL https://deno.land/install.sh | sh
```

## Quick Start

```bash
# Run the REPL
deno task dev

# Load a file and start REPL
deno task dev examples/hello.xeno

# Run a file (no REPL)
deno run --allow-read --allow-write --allow-env mod.ts run examples/hello.xeno
```

## Example Session

```
$ deno task dev
XenoScript v0.3.0-dev
namespace: default
provenance: organic

> node Project { about: "build something cool" }
◉ created: Project [organic]

> Project.spawn("Design")
○ created: Design [synthetic, ← Project]

> Project.spawn("Build")
○ created: Build [synthetic, ← Project]

> Project → tree
  ◉ Project
    ├── ○ Design
    └── ○ Build

> Project → list
[list] Project

  □ Project
    └── □ Design
    └── □ Build

  3 items

> ?Project
Project is a node.
Focus: "build something cool"
Provenance: organic
Children: 2

> ls
◉ Project              [organic, 2 children]
○ Design               [synthetic]
○ Build                [synthetic]

> save
saved to ~/.xeno/default.json
```

## Syntax

### Nodes

The universal primitive. Any fields you want.

```xeno
node ProjectName {
  about: "what this is"
  status: "in progress"
  tags: ["a", "b", "c"]
}
```

### Edges / Relations

Connect nodes together.

```xeno
relation {
  from: ProjectName
  to: SubProject
  type: spawned
}
```

### Constraints

Define rules (for documentation/validation).

```xeno
constraint MustHaveAnchor {
  rule: "at least one organic node must exist"
}
```

### Values

```xeno
"strings"
123
true / false
null
[arrays, of, values]
{ nested: "objects" }
ReferenceName    # bare name = reference to another node
```

## Provenance

Every node tracks its origin:

- **◉ organic** — human-created (you typed it)
- **○ synthetic** — generated (spawned from another node)
- **◐ hybrid** — mixed authorship

```
> node Foo { about: "I typed this" }
◉ created: Foo [organic]

> Foo.spawn("Bar")
○ created: Bar [synthetic, ← Foo]
```

## Projections

Transform the graph into different views:

```xeno
Node → tree       # Hierarchical tree view
Node → list       # Flat list with children
Node → questions  # Reflective questions about the node
```

## Commands

| Command | Description |
|---------|-------------|
| `node Name { fields }` | Create a node |
| `Name.spawn("child")` | Spawn a child node |
| `Name.field = value` | Update a field |
| `Name → tree` | Project as tree |
| `Name → list` | Project as list |
| `Name → questions` | Project as questions |
| `?Name` | Query node info |
| `?drift` | Check for drift |
| `history Name` | Show node history |
| `ls` | List all nodes |
| `run file.xeno` | Load a .xeno file |
| `save` | Save namespace |
| `help` | Show help |
| `exit` | Exit REPL |

## Files

Write `.xeno` files with declarations:

```xeno
# project.xeno

node MyProject {
  about: "the main thing"
}

node SubTask {
  about: "part of the main thing"
}

relation {
  from: MyProject
  to: SubTask
  type: spawned
}
```

Load them:

```bash
deno task dev project.xeno
```

Or from the REPL:

```
> run project.xeno
Loaded 2 objects from project.xeno
```

## Running Tests

```bash
deno task test
```

## Philosophy

XenoScript is designed to:

- **Keep meaning explicit** — nodes are semantic, not just data
- **Track provenance** — know what's human vs generated
- **Detect drift** — notice when intent changes
- **Support multiple views** — same graph, different projections

It's a language for thinking about what things mean, not just what they do.
