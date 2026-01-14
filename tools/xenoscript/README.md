# XenoScript

A semantic programming language for meaning-first development.

## What It Is

XenoScript is a language where **intent is the primitive**. You declare what things mean, the system builds a semantic graph, and you project that graph into different forms (tasks, outlines, reflections, code).

Unlike traditional programming languages that execute behavior, XenoScript lets you **inhabit** a space of meaning and navigate it.

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

# Or directly
deno run --allow-read --allow-write --allow-env mod.ts
```

## Example Session

```
$ deno task dev
XenoScript v0.3.0-dev
namespace: default
provenance: organic

> convergence Becoming { focus: "make meaning persist", horizon: 4 }
◉ created: Becoming [organic, h4]

> Becoming.spawn("Write essay")
○ created: Write_essay [synthetic, h3, ← Becoming]

> Becoming → task
[tasks] Becoming (horizon 4)

  □ make meaning persist
    └── □ Write_essay [h3]

  1 actionable items

> Becoming → graph
  [Becoming] ◉ h4
  └──spawned──▶ [Write_essay] ○ h3

> ?Becoming
Becoming is a convergence at horizon 4.
Focus: "make meaning persist"
Provenance: organic
Children: 1

> ls
◉ Becoming             [organic, h4, 1 children]
○ Write_essay          [synthetic, h3]

> save
saved to ~/.xeno/default.json
  2 objects
  1 relations
```

## Core Concepts

### Convergence

An intentional unit — a goal, action, directive, or orientation.

```xeno
convergence ProjectName {
  focus: "what this is about"
  horizon: 3
  context: ["relevant", "context"]
}
```

### Horizon

Abstraction level from 1 (immediate/actionable) to 5 (abstract/orienting).

- **h1**: Immediate action, can be done now
- **h2**: Near-term task
- **h3**: Project or goal
- **h4**: Strategic direction
- **h5**: Orienting principle

### Provenance

Tracks origin of semantic objects:

- **◉ organic**: Human-created, required effort
- **○ synthetic**: Generated/spawned
- **◐ hybrid**: Mixed authorship

### Projections

Transform semantic graphs into different views:

```xeno
Node → task       # Actionable task list
Node → graph      # Visual tree structure
Node → reflection # Reflective questions
```

### Drift Detection

The system detects when changes affect intent:

```xeno
> Foo.focus = "ship fast"

⚠ telic drift detected
  old: "make meaning persist"
  new: "ship fast"
```

## Commands

| Command | Description |
|---------|-------------|
| `convergence Name { ... }` | Create a convergence |
| `Name.spawn("child")` | Spawn a child convergence |
| `Name.field = value` | Update a field |
| `Name → projector` | Project as task/graph/reflection |
| `?Name` | Query node info |
| `?drift` | Check for drift |
| `history Name` | Show node history |
| `ls` | List all nodes |
| `save` | Save namespace |
| `load namespace` | Load namespace |
| `help` | Show help |
| `exit` | Exit REPL |

## Running Tests

```bash
deno task test
```

## Architecture

```
src/
├── core/           # Semantic graph engine
│   ├── graph.ts    # SemanticGraph class
│   ├── node.ts     # Node types
│   ├── history.ts  # History tracking
│   └── provenance.ts
├── parser/         # XenoScript parser
│   ├── lexer.ts    # Tokenizer
│   ├── parser.ts   # Recursive descent parser
│   └── ast.ts      # AST types
├── executor/       # Command execution
│   ├── executor.ts # Main executor
│   ├── commands.ts # Built-in commands
│   └── drift.ts    # Drift detection
├── projectors/     # Output projectors
│   ├── projector.ts
│   ├── task.ts
│   ├── graph.ts
│   └── reflection.ts
├── repl/           # Interactive REPL
│   ├── repl.ts
│   ├── render.ts
│   └── completion.ts
└── persistence/    # Save/load
    ├── store.ts
    └── json.ts
```

## Philosophy

XenoScript is designed to:

- **Preserve intent** across acceleration
- **Make drift detectable** at the level of meaning
- **Support multiple interpretations** of the same semantic core

It's a language you can think in, not just type in.
