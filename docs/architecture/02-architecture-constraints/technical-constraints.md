---
title: Technical Constraints
summary: The initial server is a local TypeScript stdio process that reads and writes Markdown/YAML files on the local filesystem.
updated: 2026-11-17
---

# Technical Constraints

- Runtime: Node.js 20 or newer.
- Language and tooling: TypeScript, pnpm workspace, official MCP TypeScript SDK, Zod, YAML, and Vitest.
- Transport: stdio MCP transport; no remote HTTP service is required.
- Storage: ordinary Markdown files with YAML frontmatter in a local architecture root.
- Registry: JSON file under the user's configuration directory, overridable with ARCH_MCP_CONFIG.
- Git: no clone, pull, checkout, or synchronization behavior; a checked-out Git working tree is simply a local path.
- Editing: writes use atomic replacement and content hashes for optimistic concurrency. In-process per-path locks do not coordinate multiple server processes.
