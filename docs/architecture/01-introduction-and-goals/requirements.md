---
title: Requirements Overview
summary: arch-mcp provides a compact collection/chapter tool surface for authoring and browsing arc42 architecture documentation.
updated: 2026-11-17
---

# Requirements Overview

## Functional requirements

- Register one or more local architecture documentation roots.
- Provide compact frontmatter-based overviews so agents can discover relevant architecture context without scanning every Markdown body.
- Create, read, and edit typed collections or fixed chapter pages using compact tool envelopes and server-side validation.
- Manage ADR numbering, required sections, lifecycle status, and superseding links.
- Manage concepts such as patterns, principles, and guidelines, including their links to ADRs and building blocks.
- Preserve files as readable Markdown with YAML frontmatter so both agents and static-site generators can consume them.

## Quality requirements

- Reject stale edits by checking the content hash returned by a read operation.
- Keep frontmatter-backed generated sections consistent with metadata.
- Avoid deleting or moving records through the v1 MCP interface.
- Support local stdio execution by coding harnesses.
