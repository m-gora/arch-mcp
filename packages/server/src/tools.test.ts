import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

describe("MCP tool surface", () => {
  let temporary: string | undefined;

  afterEach(async () => {
    if (temporary) await rm(temporary, { recursive: true, force: true });
  });

  it("registers exactly nine tools and exposes guidance on demand", async () => {
    temporary = await mkdtemp(join(tmpdir(), "arch-mcp-tools-test-"));
    const config = join(temporary, "registry.json");
    await writeFile(config, JSON.stringify({ architectures: [] }), "utf8");
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [resolve("dist/index.js")],
      env: { ...process.env, ARCH_MCP_CONFIG: config },
    });
    const client = new Client({ name: "arch-mcp-test-client", version: "1.0.0" });
    try {
      await client.connect(transport);
      const { tools } = await client.listTools();
      expect(tools).toHaveLength(9);
      expect(tools.map((tool) => tool.name).sort()).toEqual([
        "arch_describe", "arch_lint", "arch_overview", "arch_registry", "chapter_edit", "chapter_read",
        "collection_add", "collection_edit", "collection_read",
      ]);
      const description = await client.callTool({ name: "arch_describe", arguments: { type: "building_block" } });
      expect(JSON.stringify(description)).toContain("Mermaid");
    } finally {
      await client.close();
    }
  });
});
