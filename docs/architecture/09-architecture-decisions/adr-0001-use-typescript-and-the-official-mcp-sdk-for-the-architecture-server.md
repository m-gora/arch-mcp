---
title: Use TypeScript and the official MCP SDK for the architecture server
summary: We will implement the server in TypeScript using the official MCP SDK, Zod, and YAML tooling
status: accepted
tags:
  - implementation
  - typescript
  - mcp
updated: 2026-11-18
date: 2026-11-17
supersedes: []
superseded-by: null
---

# Use TypeScript and the official MCP SDK for the architecture server

## Status
Accepted, 2026-11-17
Supersedes: none
Superseded by: none

## The Problem
We need an implementation stack for a local MCP server that makes arc42 architecture documentation directly usable by coding harnesses.

## Context
The server needs chapter-specific MCP tool schemas, frontmatter validation, Markdown/YAML handling, predictable stdio startup, and room for a later migration CLI that can share document logic.

## Options Considered
- Go with a Go MCP SDK and YAML tooling
- **TypeScript with the official MCP SDK, Zod, and YAML tooling**

## Decision
We will implement the server in TypeScript using the official MCP SDK, Zod, and YAML tooling.

## Rationale
The TypeScript MCP SDK and Zod provide direct support for tool schemas and validation, which are central to exposing clear per-chapter interfaces. TypeScript also has mature YAML and Markdown libraries, enabling the server to validate frontmatter separately from document bodies.

## Consequences
The server depends on a Node.js runtime and package installation. The chosen stack favors schema and MCP iteration speed over a single static binary. Shared document logic can later be reused by a companion CLI.
