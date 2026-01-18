# Apps

This directory is reserved for **system-level platforms** — generic tools that serve the entire repository, not any specific node.

System-level apps are distinct from node-specific app artifacts. A system-level app might:

- Provide a generic projection platform for any node's content
- Offer shared infrastructure used across multiple nodes
- Implement repository-wide tooling

## Current Apps

*None yet.* This directory is reserved for future system-level platforms.

## Node-Specific Apps

Apps that belong to a specific node live within that node's artifacts. For example:

- **Expressions** — lives at `nodes/org/artifacts/apps/expressions/` because it's an org-specific artifact that expresses the org's philosophy

## Philosophy

When adding apps to this directory:

1. **System-level only** — If it serves one node, it belongs in that node's artifacts
2. **Minimal viable scope** — Build the smallest thing that answers the core question
3. **No premature abstraction** — Frameworks and infrastructure only when earned
4. **Artifacts as source** — Apps consume artifact content, they don't duplicate it
