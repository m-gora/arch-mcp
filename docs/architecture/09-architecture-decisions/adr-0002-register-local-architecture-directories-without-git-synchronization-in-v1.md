---
title: Register local architecture directories without Git synchronization in v1
summary: We will register local filesystem directories only in v1 and will not clone, pull, or synchronize Git repositories
status: accepted
tags:
  - registry
  - filesystem
  - scope
updated: 2026-11-18
date: 2026-11-17
supersedes: []
superseded-by: null
---

# Register local architecture directories without Git synchronization in v1

## Status
Accepted, 2026-11-17
Supersedes: none
Superseded by: none

## The Problem
The MCP server needs a safe and understandable way to locate architecture documentation on disk.

## Context
The primary use case is a coding harness working in a local repository. Git source URLs, checkout caches, synchronization, branch handling, and write-back behavior would add separate lifecycle and failure concerns.

## Options Considered
- Support local directories and Git-backed architecture sources in the first version
- **Register local filesystem directories only in the first version**

## Decision
We will register local filesystem directories only in v1 and will not clone, pull, or synchronize Git repositories.

## Rationale
The harness already operates in a local workspace, so a canonical local path is enough to read and update documentation. Deferring Git synchronization avoids introducing unclear checkout and write-back semantics before the local workflow is proven.

## Consequences
Users must ensure the documentation directory is present locally. Git repositories remain usable when already checked out, because the server treats them as ordinary local paths. Git synchronization can be considered later as a separate capability.
