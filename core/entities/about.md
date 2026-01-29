# Entities

Global [entities](../ontology.md#entity) shared across all nodes in the network.

Unlike node-scoped entities (which belong to a specific node), global entities are shared infrastructure. Any node can reference them, but no single node owns them.

---

## Principles

- One file per entity type (e.g., `sensors.md`)
- Each file uses a structure appropriate to that type
- Schemas are descriptive, not enforced — they document current conventions
- Global entities define capabilities; nodes declare which capabilities they use

---

## Current Global Entity Types

- **sensors** — perception capabilities that convert external data into observations

---

_Add new global entity types here as they emerge._
