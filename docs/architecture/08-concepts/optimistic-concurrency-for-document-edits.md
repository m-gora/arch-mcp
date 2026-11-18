---
title: Optimistic Concurrency for Document Edits
summary: Require the content hash from a read when editing an existing document so stale agent changes fail instead of overwriting newer content.
status: accepted
tags:
  - concurrency
  - integrity
  - editing
updated: 2026-11-17
kind: pattern
scope: system
applies-to:
  - 05/core-document-model
  - 05/adr-and-concept-workflows
  - 05/chapter-document-workflows
decisions: []
---

# Optimistic Concurrency for Document Edits

## Status
Accepted, 2026-11-17

## Purpose
Prevent a harness from silently replacing a file that changed after the agent read it.

## Description
A read operation returns a SHA-256 hash of the exact file content. An edit operation supplies that hash. Before replacement, the server compares it with the current file hash and returns a conflict if they differ. Writes are serialized by path inside a server process and use atomic replacement through a temporary file.

This protects against stale reads and partially written files for one server process. The in-memory per-path lock does not coordinate separate arch-mcp processes, so users should avoid concurrent writers to the same architecture root until cross-process locking is added.

## Guidelines
- Always read immediately before editing and pass the returned hash unchanged.
- If an edit reports that the document changed, read again, reconcile the new content, and retry with the new hash.
- Never retry a stale write by reusing the old hash.
- Do not run multiple server processes as concurrent writers against one architecture root.

## Related decisions
None
