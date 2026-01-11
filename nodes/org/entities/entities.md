# Entities

This folder contains tracked objects owned or managed by the Org.

Each file represents a type of entity. The filename is the type name.

Entities are things with identity that persist over time and need to be tracked — domains, accounts, songs, contracts, etc.

---

## Principles

- One file per entity type (e.g., `domains.md`, `accounts.md`)
- Each file uses a structure appropriate to that type
- Schemas are descriptive, not enforced — they document current conventions
- If a type grows complex enough, it can become a subfolder with individual files per instance

---

## Schema Registry

Documents the current field conventions for each entity type.

### domains

Tracks registered domain names.

| Field | Description |
|-------|-------------|
| Domain | The domain name |
| Registrar | Where the domain is registered |
| Auto-Renew | Whether auto-renewal is enabled |
| Expires | Expiration date (YYYY-MM) |
| Purpose | What the domain is used for |

---

*Add new types here as they emerge.*
