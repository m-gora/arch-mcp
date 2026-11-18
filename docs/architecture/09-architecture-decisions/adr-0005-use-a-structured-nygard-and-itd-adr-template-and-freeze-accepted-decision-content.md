---
title: Use a structured Nygard and ITD ADR template and freeze accepted decision content
summary: We will use a structured combination of the Michael Nygard and ITD templates. Once accepted, the decision statement and its supporting Problem, Context, Options, and Rationale are immutable; a changed decision is recorded by superseding the ADR
status: accepted
tags:
  - adr
  - decision-record
  - validation
updated: 2026-11-18
date: 2026-11-17
supersedes: []
superseded-by: null
---

# Use a structured Nygard and ITD ADR template and freeze accepted decision content

## Status
Accepted, 2026-11-17
Supersedes: none
Superseded by: none

## The Problem
Architecture decisions need enough context and rationale to be reviewable while remaining consistent and reliable as a historical record.

## Context
The Nygard format captures Context, Decision, and Consequences. The ITD template adds a concise problem statement, considered options, decisive rationale, and optional notes. The server can validate structured sections, generate the Markdown, and manage status transitions.

## Options Considered
- Use unstructured ADR prose and permit edits to accepted decisions
- **Combine Nygard and ITD sections, generate the record from structured inputs, and require superseding accepted decisions**

## Decision
We will use a structured combination of the Michael Nygard and ITD templates. Once accepted, the decision statement and its supporting Problem, Context, Options, and Rationale are immutable; a changed decision is recorded by superseding the ADR.

## Rationale
The combined template retains the decision context and consequences while making the problem, options, and decisive factors easy to scan. Treating accepted decision content as immutable preserves a trustworthy decision history.

## Consequences
ADR tools must enforce required sections, option selection, status transitions, and supersede links. Consequences, notes, and metadata can still be maintained where appropriate. The generated Status section mirrors frontmatter.
