---
title: Reject a Stale Document Edit
summary: An edit based on an outdated file hash fails safely and requires the agent to reread and reconcile the document.
status: active
tags:
  - concurrency
  - hash
  - safety
updated: 2026-11-17
---

# Reject a Stale Document Edit

## Trigger
The Markdown file changes after the agent reads it but before the agent submits an edit.

## Participants
- AI coding agent
- collection_read and collection_edit or chapter_read and chapter_edit
- MCP server
- Local Markdown file

## Diagram
```mermaid
sequenceDiagram
participant Agent
participant Tool
participant Server
participant File
participant Writer
Agent->>Tool: read document
Tool->>Server: read document
Server->>File: load current bytes
File-->>Server: content and hash h1
Server-->>Tool: content and hash h1
Tool-->>Agent: document and hash h1
Writer->>File: write newer version with hash h2
Agent->>Tool: edit using expected hash h1
Tool->>Server: submit update
Server->>File: compare current version
File-->>Server: current hash h2
Server-->>Tool: stale conflict, do not write
Tool-->>Agent: reject update and preserve newer content
Agent->>Tool: read again and reconcile
Tool-->>Agent: latest document and hash h2
Agent->>Tool: retry using hash h2
Tool->>Server: submit reconciled update
Server->>File: validate hash and write atomically
Server-->>Agent: updated document and new hash
```

## Steps
The diagram shows both the successful read path and the stale-write rejection. The content hash is a version token for the exact file bytes; after a mismatch, the agent rereads and reconciles instead of retrying with the stale token. Per-path serialization is limited to one server process, so independent processes remain a documented concurrency risk.

## Outcome
The newer file is not silently overwritten; the agent receives a conflict and can perform a deliberate merge.
