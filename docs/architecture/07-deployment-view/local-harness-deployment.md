---
title: Local Harness Deployment
summary: A coding harness launches the Node.js MCP server over stdio, with registry and architecture documents stored on the local filesystem.
status: active
tags:
  - local
  - stdio
  - deployment
updated: 2026-11-17
environment: Local developer workstation
location: Same host as the coding harness and target repository
---

# Local Harness Deployment

## Description
All nodes run on the developer workstation. The harness launches the MCP server as a child process and exchanges JSON-RPC messages over stdin/stdout.

The server reads the registry at startup and operates only within registered local architecture roots.

The globally linked npm command points to this checkout for local testing; it is not required for deployment and does not change the runtime topology.

## Diagram
```mermaid
flowchart LR
H[Coding harness] -->|launches / MCP stdio| S[arch-mcp Node.js process]
S -->|read and write| R[(User registry JSON)]
S -->|read and write| A[(Registered architecture Markdown)]
H --- W[Developer workstation]
S --- W
R --- W
A --- W
```
