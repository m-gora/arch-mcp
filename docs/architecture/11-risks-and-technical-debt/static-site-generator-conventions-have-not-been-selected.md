---
title: MkDocs rendering conventions require ongoing validation
summary: MkDocs is selected for publication; strict site builds must keep its navigation, frontmatter, and Markdown rendering aligned with architecture documents.
status: active
tags:
  - static-site
  - markdown
  - mkdocs
updated: 2026-11-18
kind: risk
severity: medium
mitigation-status: mitigating
---

# MkDocs rendering conventions require ongoing validation

## Description
MkDocs Material has been selected for publishing the architecture documentation. The build configuration must account for the existing chapter layout, frontmatter, Mermaid diagrams, and relative links; changes to documents or MkDocs dependencies can still break rendering.

## Mitigation
Run `mkdocs build --strict` in CI for documentation changes and before deploying to GitHub Pages. Keep navigation synchronized with the arc42 chapter files, and review rendered output when changing MkDocs or Markdown extensions.
