# arch-mcp

An MCP server for authoring and browsing arc42 architecture documentation. The server exposes a compact, stable tool surface over local Markdown files; type-specific validation and writing guidance are provided on demand.

## Requirements

- Node.js 20 or newer
- pnpm 10+

## Build and verify

```sh
pnpm install
pnpm build
pnpm test
pnpm typecheck
```

## CI, releases, and documentation

GitHub Actions runs typechecking and tests on pull requests and pushes to `main`. Pull request titles must use [Conventional Commit](https://www.conventionalcommits.org/) format, for example `feat: add architecture export` or `fix(server): handle empty registry`.

When changes are merged to `main`, release-please opens or updates a release pull request based on those commit titles. Merging that release pull request updates the root and workspace package versions together, updates `CHANGELOG.md`, and creates a `v*` tag and GitHub release. Releases are not published to npm. The configured baseline is `0.1.0`; under pre-1.0 versioning, a feature release increments the minor version. GitHub does not automatically start other workflows for PRs created with its default token, so CI will not run automatically on the generated release PR; use a GitHub App or PAT token in the release workflow if you need release-PR checks.

The architecture documentation is rendered with MkDocs Material. Run `python -m pip install -r requirements-docs.txt` followed by `mkdocs build --strict` to build it locally; the generated site is written to `site/`. GitHub Actions checks documentation changes and deploys the site from `main` to GitHub Pages. Enable GitHub Pages in the repository settings and select **GitHub Actions** as the build and deployment source.

Start the stdio MCP server with `pnpm --filter @arch-mcp/server start` after building. For MCP clients that launch a process, use:

```json
{
  "mcpServers": {
    "arch-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/arch-mcp/packages/server/dist/index.js"]
    }
  }
}
```

For a machine-local global command from this checkout, build first and install the repository root:

```sh
pnpm build
npm install --global .
```

This root package's `arch-mcp` executable points to `packages/server/dist/index.js`. The global link therefore depends on this checkout staying at the same path and remaining built. `npx run arch-mcp` is not the right invocation; use `arch-mcp` or `npx arch-mcp` after installation.

The registry is stored at `~/.config/arch-mcp/registry.json`. Set `ARCH_MCP_CONFIG` to override the registry file location, for example in tests or isolated environments. Registry entries point to local architecture roots; the server does not clone or synchronize Git repositories.

The server always exposes the same nine tools. Collection and chapter types are parameters, not separate tool registrations.

## Architecture documentation layout

`arch_registry` creates the arc42 chapter directories by default. Collection items are Markdown files in their chapter directory. ADR and concept IDs use the form `09/adr-0001-use-postgresql` and `08/transactional-outbox`. Quality requirements are one page per quality attribute, with scenarios in a body table. Glossary entries are H2 sections in one Markdown page.

Every managed file starts with YAML frontmatter:

```markdown
---
title: Example
summary: A short description for compact architecture overviews.
---

# Document body
```

Frontmatter is a lightweight discovery header. Content belongs in the body; generated metadata sections are rendered from frontmatter where needed for human-readable output. Writes use atomic file replacement, and edits require the SHA-256 hash returned from a read to detect stale content.

## Tools currently implemented

The server exposes nine tools:

- `arch_registry`: list, register, or unregister local roots.
- `arch_overview`: list document IDs, titles, summaries, and filter metadata without returning bodies.
- `arch_describe`: on-demand templates, writing rules, and examples for a collection or fixed chapter type.
- `arch_lint`: validate content and metadata using the same definitions as writes, including Mermaid diagrams.
- `collection_add`, `collection_read`, `collection_edit`: operate on ADRs, concepts, building blocks, runtime scenarios, deployments, quality pages, and risks.
- `chapter_read`, `chapter_edit`: inspect or section-edit introduction, constraints, context, strategy, and glossary pages.

Collection tools accept a small envelope and validate type-specific fields in the server. Errors list multiple field-level problems with hints and point to `arch_describe`. Reads return only frontmatter, body, and hash (or only a requested section); list mode returns summaries only. ADR superseding is performed through `collection_add` with a `supersedes` object. Accepted ADR decision content remains immutable. Legacy-document migration remains out of scope and is intended for a separate CLI.
