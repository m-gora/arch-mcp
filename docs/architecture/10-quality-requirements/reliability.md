---
title: Reliability
summary: A write based on an outdated document hash is rejected and leaves the newer file content intact.
status: active
tags:
  - concurrency
  - integrity
updated: 2026-11-18
quality-attribute: reliability
priority: critical
---

# Reliability

## Description
This page groups the quality scenarios for reliability. Each row describes a stimulus, required response, and observable measure.

## Scenarios
| ID | Scenario | Stimulus | Response | Measure | Priority |
| --- | --- | --- | --- | --- | --- |
| REL-01 | Stale edits do not overwrite newer architecture content | A second writer changes a managed Markdown file after an agent reads it, then the agent submits an edit with the old hash. | The server returns a stale-document conflict and does not replace the changed file. | The on-disk bytes remain equal to the second writer's version; the edit response is an MCP error indicating the document changed since it was read. | critical |
