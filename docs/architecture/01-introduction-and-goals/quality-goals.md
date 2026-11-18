---
title: Quality Goals
summary: Correctness, low-context discovery, safe editing, and human-readable Markdown are the primary quality goals.
updated: 2026-11-17
---

# Quality Goals

| Priority | Quality goal | Motivation |
|---|---|---|
| 1 | Correct, validated architecture content | Invalid metadata and malformed ADRs undermine trust in architecture guidance. |
| 2 | Low-cost agent discovery | Lightweight summaries and a compact collection/chapter tool surface should expose useful context without broad grep/find exploration. |
| 3 | Safe concurrent editing | Hash checks reject stale writes; atomic replacement avoids partially written Markdown files. |
| 4 | Human- and generator-readable documents | Architecture remains ordinary Markdown with YAML frontmatter and visible generated status/link sections. |
| 5 | Focused tool context | A compact generic tool set keeps context small; arch_describe and tool-side validation retain type-specific meaning when needed. |
