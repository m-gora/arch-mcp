---
title: Loose collection envelopes depend on thorough tool-side validation
summary: Generic fields and sections cannot express all type-specific constraints in the MCP JSON schema, so missed server validation could admit malformed content.
status: active
tags:
  - validation
  - tool-schema
  - correctness
updated: 2026-11-18
kind: risk
severity: high
mitigation-status: mitigating
---

# Loose collection envelopes depend on thorough tool-side validation

## Description
The compact tool surface deliberately uses permissive JSON objects for type-specific fields and sections. Correctness therefore relies on shared collection definitions validating required fields, unknown keys, Mermaid syntax, tables, lifecycle transitions, and references before every write.

## Mitigation
Use the same definitions in collection_add, collection_edit, arch_describe, and arch_lint. Collect all field errors with corrective hints, and keep tests for each type's required content and invalid input cases.
