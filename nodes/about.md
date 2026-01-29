# About Nodes

(A system of cells interlinked within cells interlinked within one stem. Dreadfully distinct.)

Nodes emerge from necessity, not design.

When feedback from one context begins to interfere with another, a boundary forms. That boundary is a Node.

## Why Nodes Exist

A single undifferentiated system cannot learn well. Signals get mixed. Feedback meant for one purpose distorts another. Memory becomes tangled.

Nodes solve this by creating separation. Each Node learns within its own boundary, accumulating memory and updating models without contaminating others.

Nodes are not users, roles, or containers. They do not imply ownership or hierarchy.

## When to Create a Node

Create a Node when:

- feedback from one domain should not influence another
- distinct baselines need to be maintained
- learning in one area has begun to interfere with learning in another

Do not create a Node:

- to organize or categorize
- to represent temporary states
- when a simpler boundary (a tag, a folder) would suffice

## The Shape of a Node

A Node has no prescribed structure. It may contain documents, sub-nodes, processes, or nothing at all.

What defines a Node is not its contents but its boundary: the scope within which its memory, feedback, and regulation apply.

## Interrelation

Nodes are distinct but not isolated. They may reference each other, share context, or participate in larger systems.

The boundaries between Nodes are permeable where useful and firm where necessary.

## Node Structure

Every node has a minimum viable structure that gives it presence in the system.

### Required Elements

1. **about.md** — Describes what the node is, its purpose, and operating principles. Lives at `nodes/<node>/about.md`.

2. **Home artifact** — The default entry point for encountering the node. Lives at `nodes/<node>/artifacts/home/` and contains:
   - `about.md` — Describes the home (what visitors encounter)
   - `page.md` — The content rendered when visiting

3. **Home surface** — A surface entry in `nodes/<node>/entities/surfaces.md` that routes to the home artifact. This is typically the first entry in the surfaces table.

### Why This Structure

A node without a home is a node that cannot be visited. The home artifact ensures every node has a "physical" place — somewhere to arrive, something to see.

The home can be minimal (a name, a single sentence) or elaborate, but it must exist.

### Example

```
nodes/org/
  about.md                    # What the org node is
  artifacts/
    home/
      about.md                # Describes the atrium
      page.md                 # What visitors see
  entities/
    surfaces.md               # Includes home surface at path "/"
```

The org node's home is called "Atrium" — but the location is standardized at `artifacts/home/`.
