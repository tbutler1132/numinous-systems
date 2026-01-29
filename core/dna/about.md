# DNA

The genetic code. What does not change.

Changes to this file are mutations to the species, not adjustments to any single component. If something here needs to change, it should be deliberate and acknowledged.

See `ontology.md` for explanations of what these concepts mean. This file specifies what is invariant about them.

---

## Primitives

These are the foundational types. Everything else is built on them.

| Primitive | Package | Invariant |
|-----------|---------|-----------|
| **Node** | `@numinous-systems/node` | A boundary where memory and learning apply. Everything belongs to a node. |
| **Identity** | `@numinous-systems/identity` | Who someone is and which node they belong to. |
| **Surface** | `@numinous-systems/dna` | A place someone can go. Belongs to a node. |
| **Observation** | `@numinous-systems/memory` | A record of something that occurred. Immutable once stored. |
| **Artifact** | `@numinous-systems/dna` | A durable output. Folder with about.md, notes.md, page.md, manifest.md. |

---

## Relationships

These relationships are structural, not optional.

```
Node
 ├── has Identities (who operates from this boundary)
 ├── has Surfaces (where you can go within this node)
 ├── has Artifacts (what this node has produced)
 └── has Observations (what this node remembers)
```

- An Identity belongs to exactly one Node
- A Surface belongs to exactly one Node
- An Observation belongs to exactly one Node
- Artifacts live within a Node's directory

---

## Bootstrap Rules

When a node is created, these things must exist.

| Rule | Rationale |
|------|-----------|
| Every node has a **home surface** | There must be somewhere to arrive |
| Every node has a **home artifact** | There must be something to encounter |

A node without a home is not yet a node.

---

## Access Levels

Access is a hierarchy. Each level includes all permissions below it.

```
anonymous → viewer → supporter → contributor → collaborator
```

| Level | Meaning |
|-------|---------|
| anonymous | No identity, public access only |
| viewer | Has an identity, can access low-gate content |
| supporter | Paid or equivalent, production access |
| contributor | Active participant, workshop access |
| collaborator | Deep relationship, canon access |

These levels do not change. New levels would be inserted, not appended.

---

## Surface Schema

Surfaces are defined in `nodes/{node}/entities/surfaces.md`. This is the schema.

| Field | Required | Type | Values |
|-------|----------|------|--------|
| Name | yes | string | — |
| Node | yes | NodeRef | — |
| Type | yes | enum | `internal`, `external` |
| Kind | yes | enum | `location`, `device` |
| Category | no | enum | `plaza`, `exhibit`, *null* |
| Path | yes | string | URL path or external URL |
| Status | yes | enum | `active`, `inactive` |
| Visibility | yes | enum | `public`, `private` |
| Access | yes | AccessLevel | see above |
| If Locked | no | enum | `hide`, `show` |

---

## Artifact Structure

Every artifact is a folder. The folder may contain:

| File | Purpose | Required |
|------|---------|----------|
| `about.md` | The concept — what this artifact IS | yes |
| `notes.md` | Working material — drafts, arguments, open questions | no |
| `page.md` | The encounter — what someone meets when engaging | no |
| `manifest.md` | Structure tracking — for artifacts with source material | no |

This structure separates concept from content from encounter from structure.

An artifact with only `about.md` is valid. An artifact without `about.md` is not.

---

*This file is the tripwire. If you're changing it, you're changing the rules of the world.*
