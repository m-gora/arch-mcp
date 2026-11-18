---
title: Usability
summary: An overview call returns compact frontmatter summaries and identifiers without requiring the agent to read every document body.
status: active
tags:
  - overview
  - agent-context
updated: 2026-11-18
quality-attribute: usability
priority: high
---

# Usability

## Description
This page groups the quality scenarios for usability. Each row describes a stimulus, required response, and observable measure.

## Scenarios
| ID | Scenario | Stimulus | Response | Measure | Priority |
| --- | --- | --- | --- | --- | --- |
| USA-01 | Overview provides low-cost architecture context | An agent starts a task and requests an overview filtered to a relevant chapter or tag. | The server returns matching IDs, titles, summaries, statuses, and tags in a compact response. | The result contains frontmatter-derived fields only and omits document bodies; filters exclude non-matching records. | high |
| USA-02 | Compact tool inventory | A harness connects to the server and requests the available MCP tools. | The server exposes a fixed, concise set of generic registry, overview, guidance, collection, chapter, and lint tools. | Exactly nine tools are listed by the MCP tools/list response. | high |
