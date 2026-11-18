---
title: ADR Lifecycle and Superseding
summary: Treat accepted ADR decision content as immutable and record a changed decision by creating a superseding ADR.
status: accepted
tags:
  - adr
  - lifecycle
  - audit
updated: 2026-11-17
kind: guideline
scope: system
applies-to:
  - 05/adr-and-concept-workflows
decisions:
  - 09/adr-0005-use-a-structured-nygard-and-itd-adr-template-and-freeze-accepted-decision-content
  - 09/adr-0006-defer-deletion-move-and-legacy-migration-workflows-from-the-mcp-server-v1
---

# ADR Lifecycle and Superseding

## Status
Accepted, 2026-11-17

## Purpose
Keep architecture decisions auditable as a chronological record rather than rewriting the rationale for past choices.

## Description
An ADR is created with the Nygard and ITD sections, an assigned sequence number, and an initial status. Proposed ADRs may be accepted or rejected. Accepted decision content is not edited; a changed decision is captured in a new ADR that links to the old one. Superseding updates the old and new records together, while rejected and superseded records remain available for context.

## Guidelines
- State the decision in the title.
- Keep The Problem to one sentence.
- List at least two considered options and mark exactly one selected, except for a rejected ADR.
- Keep Rationale to the decisive factors and include both positive and negative consequences.
- Use collection_add with type='adr' and a supersedes object to replace an accepted decision.
- Do not delete rejected or superseded ADRs.

## Related decisions
- [adr-0005-use-a-structured-nygard-and-itd-adr-template-and-freeze-accepted-decision-content](../09-architecture-decisions/adr-0005-use-a-structured-nygard-and-itd-adr-template-and-freeze-accepted-decision-content.md)
- [adr-0006-defer-deletion-move-and-legacy-migration-workflows-from-the-mcp-server-v1](../09-architecture-decisions/adr-0006-defer-deletion-move-and-legacy-migration-workflows-from-the-mcp-server-v1.md)
