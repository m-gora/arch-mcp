---
title: Glossary
summary: Concise definitions of architecture terms used by arch-mcp.
updated: 2026-11-18
---

# Glossary

## ADR

Architecture Decision Record: a durable record of an important architecture decision, its context, alternatives, rationale, and consequences.

Aliases: Architecture Decision Record

## arc42

A template and set of conventions for documenting software architecture in twelve chapters.

## Building block

A coherent part of a software system or architecture description with defined responsibilities and interfaces.

## Coding harness

The coding-agent environment that launches MCP servers and makes their tools available to an AI agent.

## Concept

A crosscutting architecture instruction describing a pattern, principle, guideline, convention, or other way that aspects of the architecture work.

## Frontmatter

A YAML mapping at the start of a Markdown file that contains structured metadata used for validation, filtering, and compact context.

## ITD

Important Technical Decision: a lean, decision-first record template with The Problem, Options Considered, Rationale, and optional Notes.

## MCP

Model Context Protocol: a protocol through which an AI application discovers and invokes tools and other capabilities exposed by a server.

## Optimistic concurrency

A write strategy that allows work to proceed without locking during reads, then verifies a version or content hash before accepting an edit.

## Static-site generator

A build tool that transforms Markdown and metadata into a browsable, usually static, documentation website.

## stdio transport

An MCP transport that exchanges protocol messages through a child process's standard input and standard output.
