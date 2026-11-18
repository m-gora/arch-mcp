---
title: arch-mcp System
summary: Nine stable MCP tools expose registry, discovery, guidance, typed collection, and fixed chapter operations over a shared document core.
status: active
tags: []
updated: 2026-11-18
level: system
---

# arch-mcp System

## Description
The diagram shows the main runtime and code boundaries. The harness launches the MCP server through stdio. The server exposes root tools plus generic collection and chapter operations. Type-specific definitions provide validation and rendering; handlers share the core document model to access local Markdown. The registry remains server-owned local configuration.

## Diagram
```mermaid
flowchart LR
  H[Coding harness] <-->|MCP stdio| S[arch-mcp server]
  S --> T[9 MCP tools]
  T --> R[Registry and discovery tools]
  T --> C[Collection operations]
  T --> P[Chapter operations]
  C --> D[Type definitions and validation]
  P --> D
  D --> W[Document workflows]
  W --> M[Core document model]
  M --> F[(Local Markdown files)]
  S --> J[(Registry JSON)]
```

## Responsibilities
- Expose the nine-tool MCP interface
- Validate collection and chapter content
- Preserve readable Markdown with lightweight discovery metadata

## Interfaces
- Coding harness through MCP stdio
- Local registry JSON file
- Local architecture Markdown directories
