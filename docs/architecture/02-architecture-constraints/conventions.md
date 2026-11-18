---
title: Documentation and Tool Conventions
summary: Chapter directories and typed tool inputs keep documents predictable; frontmatter is canonical and generated body sections are server-managed.
updated: 2026-11-17
---

# Documentation and Tool Conventions

- Use the arc42 chapter directories numbered 01 through 12.
- Use lowercase kebab-case filenames and IDs such as 09/adr-0001-use-typescript.
- Every managed Markdown file starts with YAML frontmatter containing at least title and summary.
- Keep the Markdown body independently useful to readers and static-site generators.
- Treat frontmatter as authoritative for duplicated generated sections such as ADR/concept status and concept decision links.
- Use collection tools for typed record collections and chapter tools for fixed pages; select the type through the tool parameter.
- Reads return a SHA-256 hash; edits of existing records require that hash.
- Keep legacy migration outside the interactive MCP write path.
