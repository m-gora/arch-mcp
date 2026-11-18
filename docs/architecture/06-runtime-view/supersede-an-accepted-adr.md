---
title: Supersede an Accepted ADR
summary: A changed architecture decision creates a new ADR and updates the accepted predecessor with reciprocal supersede links.
status: active
tags:
  - adr
  - supersede
  - atomicity
updated: 2026-11-17
---

# Supersede an Accepted ADR

## Trigger
An author determines that a previously accepted ADR no longer represents the desired architecture decision.

## Participants
- AI coding agent
- ADR tools
- MCP server
- Chapter 9 Markdown files

## Diagram
```mermaid
sequenceDiagram
actor Agent as Coding agent
participant MCP as ADR tools
participant Server as arch-mcp
participant Old as Accepted ADR file
participant New as New ADR file
Agent->>MCP: adr_read(old ADR)
MCP-->>Agent: ADR content and current hash
    Agent->>MCP: collection_add(type=adr, supersedes={old ID, hash, reason})
MCP->>Server: Validate old status and hash
Server->>New: Create numbered ADR with supersedes link
Server->>Old: Mark superseded and add superseded-by link
alt Both guarded writes succeed
Server-->>Agent: New ADR ID and hash
else A write fails
Server->>Old: Restore only if unchanged by another writer
Server->>New: Remove only if still the created version
Server-->>Agent: Report failure / rollback outcome
end
```

## Steps
The supersede tool coordinates the two records: the replacement points back to the accepted ADR, while the old ADR points forward and displays its new status. The server uses guarded writes and attempts rollback if the second update fails; this is a best-effort multi-file operation, not a filesystem-wide transaction. Run arch_lint afterward to check the chain.

## Outcome
The new and old ADRs are linked in frontmatter and generated Status sections, or the operation reports failure and rolls back its writes where unchanged.
