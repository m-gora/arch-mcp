---
title: Solution Strategy
summary: Use a compact collection/chapter MCP surface over shared definitions, local Markdown, and lightweight discovery metadata.
updated: 2026-11-17
---

# Solution Strategy

1. **Keep storage portable.** Store each architecture item as a Markdown file with YAML frontmatter rather than in a server-specific database.
2. **Keep the tool list compact without losing meaning.** Group operations into collection and chapter tools; provide type-specific guidance and validation on demand through arch_describe and actionable errors.
3. **Separate metadata from prose.** Parse frontmatter and body independently, validate metadata, and generate reader-facing body sections from canonical fields.
4. **Protect edits.** Require the last-read content hash for updates and replace files atomically.
5. **Treat ADRs as records.** Assign numbers, validate the combined Nygard/ITD template, enforce accepted-content immutability, and link superseding decisions.
6. **Keep v1 local and focused.** Use stdio and local paths; defer Git synchronization, destructive operations, and legacy migration.
