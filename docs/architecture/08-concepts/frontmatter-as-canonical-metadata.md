---
title: Frontmatter as Canonical Metadata
summary: Frontmatter is the canonical machine-readable metadata, and duplicated reader-facing sections are generated from it.
status: accepted
tags:
  - frontmatter
  - markdown
  - authoring
updated: 2026-11-17
kind: principle
scope: system
applies-to:
  - 05/core-document-model
  - 05/adr-and-concept-workflows
  - 05/chapter-document-workflows
decisions:
  - 09/adr-0004-keep-frontmatter-authoritative-and-render-reader-facing-metadata-into-markdown-bodies
---

# Frontmatter as Canonical Metadata

## Status
Accepted, 2026-11-17

## Purpose
Keep agent discovery and human/static-site rendering aligned without asking authors to maintain the same metadata in two places.

## Description
Every managed file has a YAML frontmatter mapping followed by a Markdown body. Fields such as title, summary, status, date, and references are validated as structured data. When a reader-facing body section duplicates those values, the server renders it from frontmatter and linting checks for drift.

The body remains ordinary Markdown and should be understandable without the MCP server. The server owns generated blocks such as ADR and concept status and the concept Related decisions list; prose sections remain authored content.

## Guidelines
- Keep machine-filterable fields in frontmatter.
- Do not independently hand-maintain generated status or link sections.
- Keep descriptive prose and examples in the Markdown body.
- Use the matching collection_edit or chapter_edit operation to update metadata so generated body sections are refreshed.
- Run architecture lint after out-of-band edits.

## Related decisions
- [adr-0004-keep-frontmatter-authoritative-and-render-reader-facing-metadata-into-markdown-bodies](../09-architecture-decisions/adr-0004-keep-frontmatter-authoritative-and-render-reader-facing-metadata-into-markdown-bodies.md)
