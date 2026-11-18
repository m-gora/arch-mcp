---
title: Concurrent server processes can race on the same architecture files
summary: Per-path write serialization is in-process only, so two arch-mcp processes can both pass a hash check before replacing the same file.
status: active
tags:
  - concurrency
  - integrity
  - filesystem
updated: 2026-11-17
kind: risk
severity: high
mitigation-status: open
---

# Concurrent server processes can race on the same architecture files

## Description
The core write helper serializes writers by path within a single Node.js process and uses expected hashes before atomic replacement. The per-path lock map is not shared across processes. If multiple harnesses start independent servers for one architecture root, both may read the same version and race between checking the expected hash and renaming a temporary file.

## Mitigation
Document the single-writer assumption and encourage one server process per architecture root. Add cross-process locking or an OS-level compare-and-swap strategy before supporting multiple concurrent harness processes. Add a multi-process race test when implementing that mitigation.
