---
title: Business Context
summary: The server helps coding harnesses consume and maintain architecture documentation as part of software engineering work.
updated: 2026-11-17
---

# Business Context

## System boundary

arch-mcp is an authoring and discovery adapter around local arc42 Markdown documentation. It does not own application runtime behavior, source-code changes, Git operations, static-site generation, or legacy-document conversion.

## External actors

- A coding harness launches the stdio server and routes tool calls from an AI coding agent.
- An architecture author or maintainer registers a documentation root and reviews generated Markdown.
- A static-site generator may read the same Markdown files to publish human-facing architecture documentation.

## Value

The MCP tools provide typed, low-friction operations and compact overviews while keeping the files portable and reviewable outside the server.
