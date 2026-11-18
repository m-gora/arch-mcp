---
title: Collection and Chapter Tool Design
summary: A compact generic tool surface preserves domain meaning through type-specific descriptions, on-demand guidance, and validation hints.
status: accepted
tags:
  - mcp-tools
  - context
  - collections
updated: 2026-11-18
kind: principle
scope: system
applies-to:
  - 05/mcp-tool-registration
  - 05/chapter-document-workflows
decisions:
  - 09/adr-0007-group-collection-operations-and-fixed-chapter-operations-into-a-compact-mcp-tool-surface
---

# Collection and Chapter Tool Design

## Status
Accepted, 2026-11-18

## Purpose
Keep the always-advertised MCP tool list small without losing clear guidance about when each collection or chapter operation applies.

## Description
The external interface groups operations into collection_add/read/edit for ADRs, concepts, building blocks, runtime scenarios, deployment views, quality pages, and risks, plus chapter_read/edit for the fixed arc42 pages and glossary. The type parameter selects the document semantics.

arch_describe provides the type-specific purpose, filter fields, section rules, diagram requirements, examples, and writing guidance only when requested. Tool-side validation collects field problems, suggests likely misspellings, and returns corrective hints. ADR superseding is a supported option of collection_add.

## Guidelines
- Use arch_overview for broad discovery and summaries.
- Use collection_read or chapter_read to inspect one item or section.
- Call arch_describe before creating an unfamiliar type.
- Pass only lightweight discovery/filter metadata in fields; keep content in sections.
- Treat a validation error as a set of actionable fixes and correct them together.

## Related decisions
- [adr-0007-group-collection-operations-and-fixed-chapter-operations-into-a-compact-mcp-tool-surface](../09-architecture-decisions/adr-0007-group-collection-operations-and-fixed-chapter-operations-into-a-compact-mcp-tool-surface.md)
