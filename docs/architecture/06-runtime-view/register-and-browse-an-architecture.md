---
title: Register and Browse an Architecture
summary: A coding harness registers a local architecture root and then obtains compact chapter-aware context through the MCP server.
status: active
tags:
  - registry
  - overview
  - discovery
updated: 2026-11-17
---

# Register and Browse an Architecture

## Trigger
An author configures arch-mcp for a repository that contains an architecture documentation directory.

## Participants
- Coding harness
- AI coding agent
- arch-mcp stdio server
- Local architecture directory
- Global registry file

## Diagram
```mermaid
sequenceDiagram
actor Author
participant Agent as Coding agent
participant Harness
participant Server as arch-mcp
participant Registry
participant Docs as Architecture files
Author->>Harness: Configure local architecture root
Harness->>Server: Launch process / MCP stdio
Agent->>Server: arch_register(id, path)
Server->>Docs: Create missing chapter directories
Server->>Registry: Persist id and canonical path
Agent->>Server: arch_overview(filters)
Server->>Docs: Read frontmatter only
Docs-->>Server: Metadata summaries
Server-->>Agent: Compact IDs and summaries
    Agent->>Server: collection_read or chapter_read(id)
Server->>Docs: Read selected Markdown file
Docs-->>Agent: Frontmatter, body, and hash
```

## Steps
The diagram shows registration followed by progressive discovery. The overview keeps the initial response compact; the agent reads a full body only after selecting a relevant document. The server communicates with the harness over stdio and operates on local registry and documentation files.

## Outcome
The agent has a registered local architecture, a compact index, and the full relevant document without broad repository searches.
