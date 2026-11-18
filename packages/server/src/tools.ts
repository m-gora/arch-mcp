import { access, mkdir, realpath } from "node:fs/promises";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ensureArchitectureLayout } from "@arch-mcp/core";
import { collectionTypes } from "./definitions.js";
import {
  addCollection, describeType, editChapter, editCollection, lintArchitecture,
  readArchitectureOverview, readChapter, readCollection,
} from "./generic-documents.js";
import { normalizeArchitecturePath, readRegistry, writeRegistry } from "./registry.js";

const collectionType = z.enum(collectionTypes);
const chapterType = z.enum(["introduction", "constraints", "context", "strategy", "glossary"]);
const commonDoc = { doc: z.string().optional().describe("Registered architecture ID; omit when exactly one architecture is registered") };

function success(value: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }] };
}

function failure(error: unknown) {
  return { isError: true, content: [{ type: "text" as const, text: (error as Error).message }] };
}

function register(server: McpServer, name: string, description: string, schema: z.ZodRawShape, handler: (input: any) => Promise<unknown>) {
  server.registerTool(name, { description, inputSchema: schema }, async (input) => {
    try { return success(await handler(input)); }
    catch (error) { return failure(error); }
  });
}

export function registerTools(server: McpServer): void {
  register(server, "arch_registry", "Manage local architecture roots. Use action=list to discover roots, action=register to add one, and action=unregister to remove a registry entry without deleting files.", {
    action: z.enum(["list", "register", "unregister"]),
    id: z.string().optional().describe("Short ID for register or unregister"),
    path: z.string().optional().describe("Local architecture directory for register"),
    scaffold: z.boolean().optional().describe("Create the 12 chapter directories; defaults to true"),
  }, async ({ action, id, path, scaffold }) => {
    const entries = await readRegistry();
    if (action === "list") return { architectures: entries };
    if (action === "unregister") {
      const problems: string[] = [];
      if (!id?.trim()) problems.push("id: required for unregister; pass the registered architecture ID.");
      if (problems.length) throw new Error(`arch_registry rejected:\n${problems.map((problem) => `- ${problem}`).join("\n")}`);
      const next = entries.filter((entry) => entry.id !== id);
      if (next.length === entries.length) throw new Error(`id '${id}' was not found. Call arch_registry with action='list' to see registered IDs.`);
      await writeRegistry(next);
      return { unregistered: id, remaining: next.map((entry) => entry.id) };
    }
    const problems: string[] = [];
    if (!id?.trim()) problems.push("id: required. Choose a short unique architecture name, for example 'payments'.");
    if (!path?.trim()) problems.push("path: required. Provide the local architecture root, for example '/repo/docs/architecture'.");
    if (id && entries.some((entry) => entry.id === id)) problems.push(`id '${id}' is already registered; choose another ID or unregister the existing one first.`);
    if (problems.length) throw new Error(`arch_registry rejected (${problems.length} problems):\n${problems.map((problem, index) => `${index + 1}. ${problem}`).join("\n")}`);
    const absolute = normalizeArchitecturePath(path!);
    await mkdir(absolute, { recursive: true });
    await access(absolute);
    const canonical = await realpath(absolute);
    const collision = entries.find((entry) => entry.path === canonical);
    if (collision) throw new Error(`path is already registered as '${collision.id}'. Call arch_registry with action='list' or reuse that ID.`);
    if (scaffold !== false) await ensureArchitectureLayout(canonical);
    const registration = { id: id!.trim(), path: canonical, registeredAt: new Date().toISOString() };
    await writeRegistry([...entries, registration]);
    return registration;
  });

  register(server, "arch_overview", "Start here for broad questions. Returns only document IDs, titles, summaries, statuses, tags, and filter metadata across an architecture; use collection_read or chapter_read for full content.", {
    ...commonDoc,
    chapter: z.number().int().min(1).max(12).optional(),
    type: z.string().optional().describe("Collection or chapter type filter, such as concept or building_block"),
    tag: z.string().optional(), status: z.string().optional(),
  }, readArchitectureOverview);

  register(server, "arch_describe", "On-demand authoring guidance. Call this before creating or editing an unfamiliar collection or chapter type to get its purpose, fields, sections, rules, and a valid example.", {
    type: z.enum([...collectionTypes, "introduction", "constraints", "context", "strategy", "glossary"]),
  }, async ({ type }) => describeType(type));

  register(server, "arch_lint", "Validate all architecture documents using the same collection definitions as collection_add and collection_edit, including required sections, references, ADR lifecycle rules, and Mermaid syntax.", {
    ...commonDoc,
  }, async ({ doc }) => lintArchitecture(doc));

  register(server, "collection_add", "Create one item in a typed collection. Types: adr (numbered decision record), concept (pattern or principle), building_block (chapter 5 view with required Mermaid diagram), runtime_scenario (chapter 6 sequence view with required diagram), deployment (chapter 7 topology with required diagram), quality (one quality-attribute page with a scenario table), risk (one risk/debt item). Pass content in sections and filter metadata in fields. Validation errors collect all problems and hints.", {
    ...commonDoc, type: collectionType, title: z.string(), summary: z.string(), tags: z.array(z.string()).optional(),
    fields: z.record(z.unknown()).optional().describe("Lightweight filter metadata specific to the collection; see arch_describe"),
    sections: z.record(z.unknown()).optional().describe("Body content keyed by section heading; see arch_describe"),
    diagram: z.string().optional().describe("Mermaid source without a code fence; required for building_block, runtime_scenario, and deployment"),
    supersedes: z.object({ id: z.string().optional(), hash: z.string().optional(), reason: z.string().optional() }).optional().describe("For ADR only: accepted ADR ID, its read hash, and replacement reason"),
  }, async (input) => {
    if (input.supersedes) {
      const issues: string[] = [];
      if (!input.supersedes.id?.trim()) issues.push("supersedes.id: provide the accepted ADR ID.");
      if (!input.supersedes.hash?.trim()) issues.push("supersedes.hash: read the old ADR and provide its current hash.");
      if (!input.supersedes.reason?.trim()) issues.push("supersedes.reason: explain why this decision replaces the old one.");
      if (issues.length) throw new Error(`ADR supersede rejected (${issues.length} problems):\n${issues.map((issue, index) => `${index + 1}. ${issue}`).join("\n")}`);
    }
    return addCollection(input);
  });

  register(server, "collection_read", "List a collection using lightweight title/summary/filter metadata, or read one item by ID. Add section to return only one body section and its hash. Types include adr, concept, building_block, runtime_scenario, deployment, quality, and risk.", {
    ...commonDoc, type: collectionType, id: z.string().optional(), section: z.string().optional(),
    tag: z.string().optional(), status: z.string().optional(), filters: z.record(z.unknown()).optional(),
  }, readCollection);

  register(server, "collection_edit", "Edit one collection item using its read hash. Supply only changed fields/sections; quality pages also accept scenario upsert/remove operations by scenario ID. Accepted ADR decision content is immutable; use collection_add with supersedes to replace it. Errors include field-level hints.", {
    ...commonDoc, type: collectionType, id: z.string(), hash: z.string(), title: z.string().optional(), summary: z.string().optional(), tags: z.array(z.string()).optional(),
    fields: z.record(z.unknown()).optional(), sections: z.record(z.unknown()).optional(), diagram: z.string().optional(),
    operations: z.array(z.record(z.unknown())).optional().describe("For quality pages, operations are {operation:'upsert'|'remove', id, title, stimulus, response, measure, priority}"),
  }, async (input) => editCollection(input as Parameters<typeof editCollection>[0]));

  register(server, "chapter_read", "Read a fixed arc42 chapter page or one section. Without a page, lists valid pages; for glossary, returns the term headings without full definitions unless a term ID or section is supplied.", {
    ...commonDoc, chapter: chapterType, page: z.string().optional(), id: z.string().optional(), section: z.string().optional(),
  }, readChapter);

  register(server, "chapter_edit", "Make a hash-checked section-scoped edit to a fixed arc42 page or glossary. Use replace/append/remove for page sections; use upsert/remove with a glossary term heading. Read first, then pass the returned hash.", {
    ...commonDoc, chapter: chapterType, page: z.string().optional(), hash: z.string().optional(),
    section: z.string(), operation: z.enum(["replace", "append", "remove", "upsert"]), content: z.string().optional(),
  }, editChapter);
}
