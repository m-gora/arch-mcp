---
title: Defer deletion, move, and legacy migration workflows from the MCP server v1
summary: We will defer delete and move operations and keep legacy-document migration out of the MCP server. Migration may be implemented later as a separate CLI workflow
status: accepted
tags:
  - scope
  - migration
  - safety
updated: 2026-11-18
date: 2026-11-17
supersedes: []
superseded-by: null
---

# Defer deletion, move, and legacy migration workflows from the MCP server v1

## Status
Accepted, 2026-11-17
Supersedes: none
Superseded by: none

## The Problem
The first server version needs a bounded and safe document-authoring scope while preserving existing architecture records.

## Context
Deletion and moves require reference updates and recovery behavior. Legacy documents without frontmatter require parsing and splitting as a distinct migration workflow. ADRs are intended to remain historical records rather than be deleted.

## Options Considered
- Include delete, move, and legacy document migration tools in the initial MCP server
- **Limit v1 to registration, browsing, structured creation, and editing; handle migration separately**

## Decision
We will defer delete and move operations and keep legacy-document migration out of the MCP server. Migration may be implemented later as a separate CLI workflow.

## Rationale
This keeps the initial tool surface focused on structured authoring and avoids unsafe destructive operations or mixing bulk conversion with interactive editing. Legacy migration has different parsing and text-splitting requirements.

## Consequences
There is no MCP delete or move operation in v1, and existing legacy Markdown must be migrated separately before the server manages it. ADR superseding and concept deprecation provide non-destructive lifecycle alternatives.
