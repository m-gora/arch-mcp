---
title: Organizational Constraints
summary: The v1 scope prioritizes local dogfooding and structured authoring; legacy conversion and destructive file operations are separate concerns.
updated: 2026-11-17
---

# Organizational Constraints

- Legacy documents without frontmatter are not accepted as managed documents in v1. A separate CLI migration path is intended because conversion requires Markdown parsing and section splitting.
- The MCP interface does not provide delete or move operations. ADRs are superseded rather than deleted; concepts can be deprecated.
- Git synchronization and publishing are outside the server's responsibilities.
- The repository is currently used for local development and dogfooding; installation from the checkout is a testing convenience, not an architecture constraint.
