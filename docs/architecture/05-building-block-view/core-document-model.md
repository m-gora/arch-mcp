---
title: Core Document Model
summary: Shared frontmatter parsing, Markdown rendering, chapter paths, and content hashes used by the server.
status: active
tags: []
updated: 2026-11-17
level: container
---

# Core Document Model

## Description
The core package contains the shared file model used by the server. It parses YAML frontmatter separately from the Markdown body, renders deterministic documents, resolves arc42 chapter paths, lists Markdown files, and writes through temporary-file replacement. Per-path in-process serialization and expected hashes protect normal single-server edits.

## Diagram
```mermaid
flowchart LR
  Workflows --> Core
  Core --> FrontmatterParser
  Core --> PathResolver
  Core --> AtomicWriter
  AtomicWriter --> MarkdownFiles
```

## Responsibilities
- Parse and render Markdown files with YAML frontmatter
- Resolve chapter directories and safe document IDs
- Compute content hashes and perform atomic, hash-checked writes

## Interfaces
- Exports from packages/core/src/index.ts
- Local filesystem paths
