---
title: Interoperability
summary: Managed documents retain ordinary Markdown bodies and YAML frontmatter that can be read by standard tooling.
status: active
tags:
  - markdown
  - static-site
updated: 2026-11-18
quality-attribute: interoperability
priority: medium
---

# Interoperability

## Description
This page groups the quality scenarios for interoperability. Each row describes a stimulus, required response, and observable measure.

## Scenarios
| ID | Scenario | Stimulus | Response | Measure | Priority |
| --- | --- | --- | --- | --- | --- |
| INT-01 | Markdown files remain usable outside the MCP server | A static-site generator or repository reader opens a document produced by arch-mcp. | The tool-generated file can be parsed as frontmatter plus a Markdown body, with status and reference sections visible in the body. | A YAML parser can parse the frontmatter mapping and a Markdown renderer displays the headings, lists, and relative links without server-specific processing. | medium |
