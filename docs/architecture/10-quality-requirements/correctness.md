---
title: Correctness
summary: ADR creation refuses records that violate required section, sentence, or selected-option rules.
status: active
tags:
  - adr
  - validation
updated: 2026-11-18
quality-attribute: correctness
priority: high
---

# Correctness

## Description
This page groups the quality scenarios for correctness. Each row describes a stimulus, required response, and observable measure.

## Scenarios
| ID | Scenario | Stimulus | Response | Measure | Priority |
| --- | --- | --- | --- | --- | --- |
| COR-01 | Invalid ADR structure is rejected at creation | An agent submits an ADR with a missing required field, fewer than two options, multiple selected options, or a multi-sentence problem statement. | The server rejects creation with an actionable validation message and creates no ADR file. | Each invalid input fails; the ADR directory contains no partial output for the failed request. | high |
