# Node

The foundational primitive. A boundary where memory, feedback, and learning apply.

## What It Is

A Node is not a container, a user, or a category. It is a boundary — the scope within which signals are coherent and learning is meaningful.

When feedback from one context begins to interfere with another, a boundary forms. That boundary is a Node.

## Why It Exists

A single undifferentiated system cannot learn well. Signals get mixed. Memory becomes tangled. Nodes solve this by creating separation. Each Node accumulates memory and updates models within its own boundary, without contaminating others.

This package provides the type definitions for Nodes. It does not prescribe structure or storage — only the concept of a bounded scope.

## What Lives Here

- **Node type** — the minimal definition of a node (id, name)
- **NodeRef type** — a reference to a node by ID

The boundary itself is not a data field. It is implicit in what the node contains and how it relates to other nodes.

## Relationship to Other Core Packages

- **core/identity** depends on core/node — an identity belongs to a node
- **core/sensor** may become node-aware — observations belong to a node's memory

Nodes are more fundamental than identity or observation. They are the substrate on which those concepts rest.

## Design Principles

- Nodes emerge from necessity, not design
- The boundary is the point, not the structure
- Do not over-specify — let node kinds and shapes emerge from use
