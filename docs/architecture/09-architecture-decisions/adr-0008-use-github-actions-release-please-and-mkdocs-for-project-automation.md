---
title: Use GitHub Actions, release-please, and MkDocs for project automation
summary: Validate changes in GitHub Actions, release the monorepo with release-please, and publish its architecture documentation with MkDocs.
status: accepted
tags:
  - ci
  - cd
  - releases
  - documentation
updated: 2026-11-18
date: 2026-11-18
supersedes: []
superseded-by: null
---

# Use GitHub Actions, release-please, and MkDocs for project automation

## Status
Accepted, 2026-11-18
Supersedes: none
Superseded by: none

## The Problem
We need repeatable validation, semantic versioning, and a published site for the project documentation.

## Context
The project is a pnpm TypeScript monorepo with a root package and two workspace packages. Its architecture documentation is Markdown under docs/architecture. Releases are source releases only; there is no npm publishing requirement. GitHub Actions and GitHub Pages are the selected hosting platform.

## Options Considered
- **GitHub Actions with release-please and MkDocs Material deployed to GitHub Pages**
- GitHub Actions with semantic-release and a custom docs deployment
- Keep validation and documentation rendering as local manual tasks

## Decision
Use GitHub Actions for pull request verification; use release-please for a single semantic version shared by root, core, and server; and build and deploy the MkDocs Material site to GitHub Pages from main. Do not publish packages to npm.

## Rationale
release-please creates a reviewable release PR and changelog, while a shared version reflects that core and server are released together. GitHub Actions and Pages provide an integrated workflow, and MkDocs Material renders the existing Markdown architecture docs.

## Consequences
Conventional commit PR titles are required so release-please can determine version bumps. The workflow must keep package versions in sync, generate a changelog, and run tests and typechecks. GitHub Pages must be enabled with GitHub Actions as its source. MkDocs dependencies need a pinned requirements file, and strict builds will validate documentation links and structure. Releases create tags and GitHub releases only; npm publishing remains out of scope.
