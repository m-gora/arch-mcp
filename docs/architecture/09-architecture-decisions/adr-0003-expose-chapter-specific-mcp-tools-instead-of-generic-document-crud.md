---
title: Expose chapter-specific MCP tools instead of generic document CRUD
summary: We will expose dedicated tools per arc42 chapter and document type, with chapter-appropriate input schemas and behavior
status: superseded
tags:
  - mcp-tools
  - chapters
  - llm-context
updated: 2026-11-18
date: 2026-11-17
supersedes: []
superseded-by: 09/adr-0007-group-collection-operations-and-fixed-chapter-operations-into-a-compact-mcp-tool-surface
---

# Expose chapter-specific MCP tools instead of generic document CRUD

## Status
Superseded, 2026-11-17
Supersedes: none
Superseded by: [adr-0007-group-collection-operations-and-fixed-chapter-operations-into-a-compact-mcp-tool-surface](./adr-0007-group-collection-operations-and-fixed-chapter-operations-into-a-compact-mcp-tool-surface.md)

## The Problem
Coding agents need to select and edit architecture content correctly without repeatedly searching for chapter rules.

## Context
A generic tool with a chapter selector would need to describe a union of unrelated schemas and behaviors. Chapters such as ADRs, concepts, quality scenarios, and glossary terms have distinct validation and lifecycle rules.

## Options Considered
- Expose generic read, create, update, and delete tools parameterized by chapter
- **Expose distinct tools with chapter-specific names, schemas, and descriptions**

## Decision
We will expose dedicated tools per arc42 chapter and document type, with chapter-appropriate input schemas and behavior.

## Rationale
Specific tool names and schemas put the relevant domain vocabulary directly in the harness context and reduce ambiguity about fields and operations. Shared implementation code can still support the tools internally without making the external interface generic.

## Consequences
The server exposes more tool definitions, so chapter filtering is provided to limit the set where desired. Adding chapters requires maintaining their dedicated tool contracts and descriptions.
