---
title: Keep frontmatter authoritative and render reader-facing metadata into Markdown bodies
summary: We will treat validated YAML frontmatter as the source of truth and render duplicated reader-facing sections, such as status and related-decision links, from it
status: accepted
tags:
  - frontmatter
  - markdown
  - static-site
updated: 2026-11-18
date: 2026-11-17
supersedes: []
superseded-by: null
---

# Keep frontmatter authoritative and render reader-facing metadata into Markdown bodies

## Status
Accepted, 2026-11-17
Supersedes: none
Superseded by: none

## The Problem
Architecture files must support both compact machine indexing and direct reading or static-site rendering without metadata drifting between representations.

## Context
Harnesses benefit from concise frontmatter summaries and typed metadata. Human readers and static page generators need visible status, dates, and links in the Markdown body. Editing both copies independently would create inconsistency.

## Options Considered
- Store metadata only in frontmatter and rely on custom site rendering
- Store metadata only in Markdown body sections
- **Treat frontmatter as canonical and generate matching body sections from it**

## Decision
We will treat validated YAML frontmatter as the source of truth and render duplicated reader-facing sections, such as status and related-decision links, from it.

## Rationale
This preserves cheap, structured context for tools while keeping the files browsable as ordinary Markdown. Server-generated sections can be validated for drift and refreshed on edits.

## Consequences
The server must own and re-render generated sections. Manual edits to those sections can be detected by linting and may be replaced by tool writes. The resulting files remain Markdown documents suitable for static-site generators.
