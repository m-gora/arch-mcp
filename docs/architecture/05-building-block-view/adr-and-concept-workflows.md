---
title: ADR and Concept Workflows
summary: Structured handlers enforce ADR lifecycle and template rules and maintain concept metadata and generated sections.
status: active
tags: []
updated: 2026-11-17
level: component
---

# ADR and Concept Workflows

## Description
The document workflow layer implements the richer collection-specific behavior. ADR handling assigns sequence numbers, validates the combined Nygard/ITD fields, enforces accepted-content immutability, and updates supersede links. Concept handling validates kinds and references and renders status and Related decisions sections.

## Diagram
```mermaid
flowchart LR
ADRTools --> ADRWorkflow
ConceptTools --> ConceptWorkflow
ADRWorkflow --> Core
ConceptWorkflow --> Core
```

## Responsibilities
- Create, read, edit, and supersede ADRs
- Create, read, and edit architecture concepts
- Validate references and render canonical generated sections

## Interfaces
- Chapter 9 and chapter 8 MCP tools
- Local chapter Markdown files
- Shared core document functions
