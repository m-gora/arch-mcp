---
title: Group collection operations and fixed chapter operations into a compact MCP tool surface
summary: Nine stable MCP tools route typed collection and chapter operations with type-specific guidance and validation on demand.
status: accepted
tags:
  - mcp-tools
  - context-cost
  - collections
updated: 2026-11-18
date: 2026-11-18
supersedes:
  - 09/adr-0003-expose-chapter-specific-mcp-tools-instead-of-generic-document-crud
superseded-by: null
---

# Group collection operations and fixed chapter operations into a compact MCP tool surface

## Status
Accepted, 2026-11-18
Supersedes: [adr-0003-expose-chapter-specific-mcp-tools-instead-of-generic-document-crud](./adr-0003-expose-chapter-specific-mcp-tools-instead-of-generic-document-crud.md)
Superseded by: none

## The Problem
The chapter-specific MCP interface exposes too many tool definitions for an agent to keep in context efficiently.

## Context
The server manages several collection types, not only ADRs, and several fixed arc42 chapter pages. Type-specific validation and writing rules still matter, but not every type needs a permanently registered tool name. MCP schemas cannot express all of the content rules, Mermaid requirements, and lifecycle constraints. The server can validate those rules in tool handlers and return actionable errors.

## Options Considered
- Keep a separate tool for every chapter and collection operation
- **Group common operations into collection and chapter tools with a type parameter**
- Use one universal tool for registry, discovery, reads, and writes

## Decision
We will expose nine stable tools: arch_registry, arch_overview, arch_describe, arch_lint, collection_add, collection_read, collection_edit, chapter_read, and chapter_edit. Collection operations take a collection type; fixed-page operations take a chapter type. The server validates type-specific fields and sections, collects problems, and returns hints. ADR superseding is an option on collection_add.

## Rationale
The collection/chapter split reduces always-on tool context while retaining a meaningful boundary between record collections and fixed chapter pages. arch_describe supplies full type-specific guidance only when needed, and errors can explain multiple corrections in one round trip. A universal tool would erase useful distinctions between registry, discovery, and authoring operations.

## Consequences
The external schemas use a small envelope with type-specific validation in the server. Definitions must be shared by writes, arch_describe, and arch_lint. Invalid content can no longer rely on MCP JSON Schema alone, so validation and hint tests are critical. The tool inventory is fixed and no longer filtered by enabledChapters.

## Notes
Supersedes [Expose chapter-specific MCP tools instead of generic document CRUD](./adr-0003-expose-chapter-specific-mcp-tools-instead-of-generic-document-crud.md).

Supersedes 09/adr-0003-expose-chapter-specific-mcp-tools-instead-of-generic-document-crud: The original decision optimized tool meaning but did not account sufficiently for the context cost of registering a separate tool per chapter and operation.
