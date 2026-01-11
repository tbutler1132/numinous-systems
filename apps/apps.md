# Apps

This directory contains deployable applications built on top of the Vital Systems artifacts.

Apps are distinct from artifacts — they are functional tools rather than philosophical outputs. Each app lives in its own subdirectory with everything needed to run and deploy it.

## Current Apps

### [expressions/](expressions/)

A web app that generates personalized expressions of philosophical artifacts using Claude.

- **Stack**: Vanilla JS + Vercel Edge Functions
- **Purpose**: Validate whether personalized presentations of artifacts resonate with readers
- **Status**: V1 — minimal implementation for validation

See [expressions/README.md](expressions/README.md) for setup and deployment.

## Philosophy

Apps in this project follow a few principles:

1. **Minimal viable scope** — Build the smallest thing that answers the core question
2. **No premature abstraction** — Frameworks and infrastructure only when earned
3. **Artifacts as source** — Apps consume artifact content, they don't duplicate it
4. **Ship to learn** — Feedback from real usage beats speculation

## Adding New Apps

Create a new subdirectory with:

- Its own README explaining purpose and setup
- Self-contained deployment configuration
- Clear connection to one or more artifacts
