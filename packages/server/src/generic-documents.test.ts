import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ensureArchitectureLayout } from "@arch-mcp/core";
import { addCollection, editChapter, editCollection, lintArchitecture, readChapter, readCollection } from "./generic-documents.js";
import { describeCollection, validateCollectionInput, validationMessage } from "./definitions.js";
import { writeRegistry } from "./registry.js";

let temporary: string;
let architecturePath: string;

beforeEach(async () => {
  temporary = await mkdtemp(join(tmpdir(), "arch-mcp-generic-test-"));
  architecturePath = join(temporary, "architecture");
  await ensureArchitectureLayout(architecturePath);
  process.env.ARCH_MCP_CONFIG = join(temporary, "registry.json");
  await writeRegistry([{ id: "test", path: architecturePath, registeredAt: new Date().toISOString() }]);
});

afterEach(async () => {
  delete process.env.ARCH_MCP_CONFIG;
  await rm(temporary, { recursive: true, force: true });
});

describe("generic collection and chapter tools", () => {
  it("collects actionable validation hints and validates Mermaid syntax", async () => {
    const invalid = await validateCollectionInput("building_block", {
      title: " ", summary: " ", fields: { levl: "system" }, sections: {}, diagram: "flowchart LR\nA; not valid",
    });
    expect(invalid.problems.map((problem) => problem.field)).toContain("fields.level");
    expect(invalid.problems.map((problem) => problem.field)).toContain("sections.Description");
    expect(invalid.problems.map((problem) => problem.field)).toContain("diagram");
    const message = validationMessage("building_block", invalid.problems);
    expect(message).toContain("Did you mean 'level'?");
    expect(message).toContain("arch_describe");
    expect(describeCollection("building_block").example.diagram).toContain("flowchart LR");
  });

  it("stores body content only in Markdown and returns section-sized reads", async () => {
    const created = await addCollection({
      type: "building_block", title: "Order Service", summary: "Owns the order lifecycle and persistence.",
      fields: { level: "component" },
      sections: { Description: "Validates order commands and persists state.", Responsibilities: "- Validate commands\n- Persist orders", Interfaces: "- HTTP API" },
      diagram: "flowchart LR\n  Client --> OrderService\n  OrderService --> Database",
    });
    const full = await readCollection({ type: "building_block", id: created.id });
    expect(full).not.toHaveProperty("raw");
    expect(full.frontmatter).not.toHaveProperty("responsibilities");
    expect(full.body).toContain("```mermaid");
    const section = await readCollection({ type: "building_block", id: created.id, section: "Responsibilities" });
    expect(section).toMatchObject({ section: "Responsibilities", content: "- Validate commands\n- Persist orders", hash: created.hash });
    expect(section).not.toHaveProperty("body");
  });

  it("creates a quality-attribute page with body table and generated scenario IDs", async () => {
    const created = await addCollection({
      type: "quality", title: "Reliability", summary: "Stale edits do not overwrite newer architecture content.",
      fields: { "quality-attribute": "reliability", priority: "critical" },
      sections: { Description: "The server must preserve concurrent user changes.", Scenarios: [{ title: "Stale edit rejected", stimulus: "An agent uses an outdated hash.", response: "The server rejects the edit.", measure: "File bytes remain unchanged and a conflict is returned.", priority: "critical" }] },
    });
    const list = await readCollection({ type: "quality" });
    expect(list.documents).toHaveLength(1);
    expect(list.documents[0]).toMatchObject({ scenarioCount: 1, title: "Reliability" });
    const full = await readCollection({ type: "quality", id: created.id });
    expect(full.frontmatter).not.toHaveProperty("Scenarios");
    expect(full.frontmatter).not.toHaveProperty("scenarios");
    expect(full.body).toContain("REL-01");
    const changed = await editCollection({
      type: "quality", id: created.id, hash: created.hash,
      operations: [{ operation: "upsert", id: "REL-01", title: "Stale writes are rejected", stimulus: "An agent uses an outdated hash.", response: "The file is preserved and an error is returned.", measure: "File bytes are unchanged.", priority: "critical" }],
    });
    const updated = await readCollection({ type: "quality", id: created.id });
    expect(updated.hash).toBe(changed.hash);
    expect(updated.body).toContain("Stale writes are rejected");
  });

  it("creates and supersedes ADRs, enforcing accepted immutability and reciprocal links", async () => {
    const adr = await addCollection({
      type: "adr", title: "Use PostgreSQL for persistence", summary: "Use PostgreSQL for transactional relational storage.", fields: { status: "accepted" },
      sections: {
        "The Problem": "We need durable relational persistence.", Context: "Transactions and operations familiarity are required.",
        "Options Considered": "- SQLite\n- **PostgreSQL**", Decision: "We will use PostgreSQL.",
        Rationale: "It meets the transactional and operational requirements.", Consequences: "We must operate the database and maintain migrations.",
      },
    });
    const read = await readCollection({ type: "adr", id: adr.id });
    expect(read.frontmatter).not.toHaveProperty("Decision");
    await expect(editCollection({ type: "adr", id: adr.id, hash: adr.hash, sections: { Decision: "Use another database." } })).rejects.toThrow(/immutable/i);
    const superseding = await addCollection({
      type: "adr", title: "Use PostgreSQL with partitioning", summary: "Partition large tables to support growth.",
      sections: {
        "The Problem": "The event table is growing beyond operational limits.", Context: "Retention and query needs continue to increase.",
        "Options Considered": "- Archive the entire table\n- **Partition the table**", Decision: "We will partition the table.",
        Rationale: "Partitioning supports retention and query pruning.", Consequences: "Partition maintenance becomes part of operations.",
      },
      supersedes: { id: adr.id, hash: adr.hash, reason: "The original record did not address table growth." },
    });
    const old = await readCollection({ type: "adr", id: adr.id });
    const replacement = await readCollection({ type: "adr", id: superseding.id });
    expect(old.frontmatter.status).toBe("superseded");
    expect(old.frontmatter["superseded-by"]).toBe(superseding.id);
    expect(replacement.frontmatter.supersedes).toEqual([adr.id]);
    const lint = await lintArchitecture();
    expect(lint.errorCount, JSON.stringify(lint.diagnostics)).toBe(0);
  });

  it("supports hash-checked section editing and glossary term operations", async () => {
    const created = await editChapter({ chapter: "introduction", page: "requirements", section: "Body", operation: "replace", content: "## Functional requirements\n\nThe system processes orders." });
    const read = await readChapter({ chapter: "introduction", page: "requirements", section: "Functional requirements" });
    expect(read.content).toBe("The system processes orders.");
    await expect(editChapter({ chapter: "introduction", page: "requirements", section: "Body", operation: "replace", content: "stale", hash: "0".repeat(64) })).rejects.toThrow(/changed since/i);
    const glossary = await editChapter({ chapter: "glossary", section: "ADR", operation: "upsert", content: "Architecture Decision Record." });
    const terms = await readChapter({ chapter: "glossary" });
    expect(terms.terms).toEqual(["ADR"]);
    await editChapter({ chapter: "glossary", section: "ADR", operation: "append", content: "A durable decision log.", hash: glossary.hash });
    expect((await readChapter({ chapter: "glossary", id: "ADR" })).content).toContain("durable decision log");
  });
});
