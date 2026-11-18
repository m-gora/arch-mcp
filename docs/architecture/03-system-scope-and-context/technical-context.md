---
title: Technical Context
summary: The harness communicates with a local stdio process, which resolves registered architecture roots and operates on Markdown files.
updated: 2026-11-17
---

# Technical Context

## Communication

- The coding harness starts arch-mcp as a child process and uses JSON-RPC messages over stdin/stdout via MCP stdio.
- Tool calls target a registered architecture ID when multiple roots are configured.

## Data access

- The server reads and writes files beneath the registered local architecture root.
- The global JSON registry maps short architecture IDs to local paths.
- Chapter documents use YAML frontmatter followed by a Markdown body.
- The server does not access application databases, remote Git repositories, or external services.

## Publication

Static-site tooling can consume the Markdown directly. No site generator is selected or bundled by the server.
