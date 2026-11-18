import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { basename, dirname } from "node:path";
import {
  contentHash, listMarkdownFiles, parseMarkdownDocument, readMarkdownDocument,
  resolveDocumentPath, resolveExistingDocument, writeMarkdownDocument,
} from "@arch-mcp/core";
import { getArchitecture } from "./registry.js";
import {
  collectionDefinitions, collectionTypes, isCollectionType, normalizeDiagram,
  validateCollectionInput, validationMessage, type CollectionType, type ContentMap,
} from "./definitions.js";

const fixedPages: Record<string, Record<string, { file: string; title: string; summary: string }>> = {
  introduction: {
    requirements: { file: "requirements", title: "Requirements Overview", summary: "Functional and quality requirements for the system." },
    "quality-goals": { file: "quality-goals", title: "Quality Goals", summary: "Prioritized quality characteristics and motivations." },
    stakeholders: { file: "stakeholders", title: "Stakeholders", summary: "Stakeholders and their architecture concerns." },
  },
  constraints: {
    technical: { file: "technical-constraints", title: "Technical Constraints", summary: "Technical constraints that limit solution design." },
    organizational: { file: "organizational-constraints", title: "Organizational Constraints", summary: "Organizational and process constraints." },
    conventions: { file: "conventions", title: "Documentation and Tool Conventions", summary: "Conventions used by the architecture and its documentation." },
  },
  context: {
    business: { file: "business-context", title: "Business Context", summary: "Business actors, system boundaries, and value." },
    technical: { file: "technical-context", title: "Technical Context", summary: "Technical interfaces and neighboring systems." },
  },
  strategy: {
    strategy: { file: "strategy", title: "Solution Strategy", summary: "Key strategies for realizing the architecture." },
  },
};

const chapterTypes: Record<string, number> = { introduction: 1, constraints: 2, context: 3, strategy: 4, glossary: 12 };
const adrStatuses = ["proposed", "accepted", "rejected", "deprecated", "superseded"];
const statusTransitions: Record<string, string[]> = {
  proposed: ["accepted", "rejected"], accepted: ["deprecated", "superseded"], rejected: [], deprecated: [], superseded: [],
};

export interface CollectionInput {
  doc?: string;
  type: CollectionType;
  title: string;
  summary: string;
  tags?: string[];
  fields?: ContentMap;
  sections?: ContentMap;
  diagram?: string;
  supersedes?: { id: string; hash: string; reason: string };
}

export async function addCollection(input: CollectionInput): Promise<any> {
  const architecture = await getArchitecture(input.doc);
  if (input.supersedes && input.type !== "adr") throw new Error("supersedes is supported only for collection type 'adr'. Use collection_add with type='adr', or omit supersedes.");
  const fields: ContentMap = { ...(input.fields ?? {}) };
  const sections: ContentMap = { ...(input.sections ?? {}) };
  if (input.type === "quality" && Array.isArray(sections.Scenarios)) sections.Scenarios = assignScenarioIds(sections.Scenarios, String(fields["quality-attribute"] ?? "Q"));
  if (input.type === "adr" && input.supersedes) fields.status = "accepted";
  else if (fields.status === undefined) fields.status = input.type === "adr" ? "proposed" : input.type === "concept" ? "draft" : "active";
  const validation = await validateCollectionInput(input.type, { ...input, fields, sections });
  if (validation.problems.length) throw new Error(validationMessage(input.type, validation.problems));
  await validateReferences(architecture.path, input.type, fields);

  let superseded: { path: string; raw: string; frontmatter: Record<string, unknown>; body: string; id: string } | undefined;
  if (input.supersedes) {
    const oldPath = await resolveExistingDocument(architecture.path, normalizeId(9, input.supersedes.id));
    const old = await readMarkdownDocument(oldPath);
    if (old.hash !== input.supersedes.hash) throw new Error(`supersedes.id ${input.supersedes.id}: the ADR changed since it was read. Call collection_read for type='adr' and retry with its current hash.`);
    if (old.frontmatter.status !== "accepted") throw new Error(`supersedes.id ${input.supersedes.id}: only an accepted ADR can be superseded; current status is '${String(old.frontmatter.status)}'.`);
    superseded = { path: oldPath, raw: old.raw, frontmatter: old.frontmatter, body: old.body, id: `09/${basename(oldPath, ".md")}` };
    if (!input.supersedes.reason.trim()) throw new Error("supersedes.reason: provide a concise reason why the accepted ADR is being replaced.");
  }

  const files = await listMarkdownFiles(architecture.path, collectionDefinitions[input.type].chapter);
  let slug: string;
  if (input.type === "adr") {
    const highest = Math.max(0, ...files.map((file) => Number(file.id.match(/adr-(\d+)/)?.[1] ?? 0)));
    slug = `adr-${String(highest + 1).padStart(4, "0")}-${slugify(input.title)}`;
  } else if (input.type === "quality") {
    slug = slugify(String(fields["quality-attribute"]));
  } else {
    slug = slugify(input.title);
  }
  const chapter = collectionDefinitions[input.type].chapter as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  const path = await resolveDocumentPath(architecture.path, chapter, slug);
  const today = new Date().toISOString().slice(0, 10);
  const frontmatter = createFrontmatter(input.type, input.title, input.summary, input.tags ?? [], fields, today, superseded?.id);
  if (input.type === "adr" && input.supersedes) {
    sections.Notes = [sections.Notes, `Supersedes ${superseded!.id}: ${input.supersedes.reason.trim()}`].filter(Boolean).join("\n\n");
  }
  const body = renderCollectionBody(input.type, frontmatter, sections, input.diagram);
  const writeValidation = await validateCollectionInput(input.type, { title: input.title, summary: input.summary, fields, sections, diagram: input.diagram });
  if (writeValidation.problems.length) throw new Error(validationMessage(input.type, writeValidation.problems));
  let createdHash: string;
  try { createdHash = await writeMarkdownDocument(path, { frontmatter, body }, null); }
  catch (error) {
    if ((error as Error).message === "Document already exists") throw new Error(`${input.type} '${slug}' already exists. Choose a different title or quality-attribute, or read the existing item and edit it.`);
    throw error;
  }
  const id = `${String(chapter).padStart(2, "0")}/${slug}`;

  if (superseded) {
    try {
      const nextFm = { ...superseded.frontmatter, status: "superseded", "superseded-by": id, updated: today };
      const nextBody = updateGeneratedSections("adr", superseded.body, nextFm);
      await writeMarkdownDocument(superseded.path, { frontmatter: nextFm, body: nextBody }, input.supersedes!.hash);
    } catch (error) {
      await unlinkIfUnchanged(path, createdHash);
      throw new Error(`ADR supersede failed and the new record was removed if unchanged: ${(error as Error).message}`);
    }
  }
  return { id, hash: createdHash, ...(validation.warnings.length ? { warnings: validation.warnings } : {}) };
}

export async function readCollection(input: { doc?: string; type: CollectionType; id?: string; section?: string; filters?: ContentMap; tag?: string; status?: string }): Promise<any> {
  const architecture = await getArchitecture(input.doc);
  const chapter = collectionDefinitions[input.type].chapter;
  if (input.filters) {
    const allowed = new Set(["status", ...Object.keys(collectionDefinitions[input.type].filters)]);
    const unknown = Object.keys(input.filters).filter((key) => !allowed.has(key));
    if (unknown.length) throw new Error(`filters.${unknown[0]} is not a filter for collection '${input.type}'. Available filters: ${[...allowed].join(", ")}. Call arch_describe for this type's metadata fields.`);
  }
  if (input.id) {
    const path = await resolveExistingDocument(architecture.path, normalizeId(chapter, input.id));
    const document = await readMarkdownDocument(path);
    if (input.section) {
      const content = extractSections(document.body)[input.section];
      if (content === undefined) throw new Error(`${input.type}.section '${input.section}' was not found. Use collection_read without section to inspect available headings, or arch_describe for the template.`);
      return { id: `${String(chapter).padStart(2, "0")}/${basename(path, ".md")}`, title: document.frontmatter.title, section: input.section, content, hash: document.hash };
    }
    return { id: `${String(chapter).padStart(2, "0")}/${basename(path, ".md")}`, frontmatter: document.frontmatter, body: document.body, hash: document.hash };
  }
  const files = await listMarkdownFiles(architecture.path, chapter);
  const documents = [];
  for (const file of files) {
    try {
      const document = await readMarkdownDocument(file.path);
      const fm = document.frontmatter;
      if (input.tag && !stringArray(fm.tags).includes(input.tag)) continue;
      if (input.status && fm.status !== input.status) continue;
      if (input.filters && Object.entries(input.filters).some(([key, value]) => JSON.stringify(fm[key]) !== JSON.stringify(value))) continue;
      documents.push({
        id: file.id, title: fm.title, summary: fm.summary, status: fm.status,
        tags: stringArray(fm.tags), ...filterMetadata(input.type, fm),
        ...(input.type === "quality" ? { scenarioCount: parseQualityScenarios(document.body).length } : {}),
      });
    } catch { /* malformed files are surfaced by arch_lint */ }
  }
  return { architecture: architecture.id, collection: input.type, documents };
}

export async function editCollection(input: {
  doc?: string; type: CollectionType; id: string; hash: string; title?: string; summary?: string; tags?: string[];
  fields?: ContentMap; sections?: ContentMap; diagram?: string;
  operations?: Array<{ operation: "upsert" | "remove"; id: string; title?: string; stimulus?: string; response?: string; measure?: string; priority?: string }>;
}): Promise<any> {
  const architecture = await getArchitecture(input.doc);
  const chapter = collectionDefinitions[input.type].chapter;
  const path = await resolveExistingDocument(architecture.path, normalizeId(chapter, input.id));
  const current = await readMarkdownDocument(path);
  if (current.hash !== input.hash) throw new Error(`${input.type} '${input.id}' is stale: the document changed since it was read. Call collection_read with the same type and id, reconcile, then retry with the new hash.`);
  const previousStatus = String(current.frontmatter.status ?? "");
  const fields = { ...filterMetadata(input.type, current.frontmatter), ...((input.fields ?? {}) as ContentMap) };
  const title = input.title ?? String(current.frontmatter.title);
  const summary = input.summary ?? String(current.frontmatter.summary);
  const parsed = extractSections(current.body);
  let sections: ContentMap = { ...parsed };
  const oldDiagram = extractDiagram(parsed.Diagram);
  delete sections.Diagram;
  delete sections.Status;
  delete sections["Related decisions"];
  if (input.type === "quality") sections.Scenarios = parseQualityScenarios(current.body);
  if (input.type === "quality" && input.operations?.length) {
    const scenarios = [...(sections.Scenarios as Array<Record<string, unknown>> ?? [])];
    const operationProblems: string[] = [];
    for (const operation of input.operations as Array<Record<string, unknown>>) {
      if (!["upsert", "remove"].includes(String(operation.operation))) {
        operationProblems.push(`operations.operation: expected 'upsert' or 'remove', got '${String(operation.operation)}'.`);
        continue;
      }
      const opId = typeof operation.id === "string" ? operation.id : "";
      if (operation.operation === "remove" && !opId) {
        operationProblems.push("operations.id: required to remove a quality scenario. Read the quality page and copy an existing scenario ID.");
        continue;
      }
      const index = scenarios.findIndex((scenario) => scenario.id === opId);
      if (operation.operation === "remove") {
        if (index < 0) { operationProblems.push(`operations.id '${opId}' was not found. Read the quality page and use an existing scenario ID.`); continue; }
        scenarios.splice(index, 1);
      } else {
        const replacement = { ...(index >= 0 ? scenarios[index] : {}), ...operation } as Record<string, unknown>;
        delete replacement.operation;
        const unknownKeys = Object.keys(replacement).filter((key) => !["id", "title", "stimulus", "response", "measure", "priority"].includes(key));
        for (const key of unknownKeys) operationProblems.push(`operations.${key}: is not a scenario field. Use id, title, stimulus, response, measure, or priority.`);
        if (!opId) {
          const generated = nextScenarioId(scenarios, String(fields["quality-attribute"] ?? input.type));
          replacement.id = generated;
        }
        for (const key of ["title", "stimulus", "response", "measure"]) {
          if (typeof replacement[key] !== "string" || !String(replacement[key]).trim()) operationProblems.push(`operations.${opId || "new"}.${key}: required. ${key} should be a concise, non-empty scenario statement.`);
          else if (String(replacement[key]).includes("\n")) operationProblems.push(`operations.${opId || "new"}.${key}: must be one line for the scenario table.`);
        }
        if (!["low", "medium", "high", "critical"].includes(String(replacement.priority))) operationProblems.push(`operations.${opId || "new"}.priority: choose low, medium, high, or critical.`);
        if (index < 0) scenarios.push(replacement);
        else scenarios[index] = replacement;
      }
    }
    if (operationProblems.length) throw new Error(`quality operations rejected (${operationProblems.length} problems):\n${operationProblems.map((problem, index) => `${index + 1}. ${problem}`).join("\n")}\nCall collection_read for type='quality' to inspect scenario IDs and arch_describe with type='quality' for the table schema.`);
    sections.Scenarios = scenarios;
  }
  if (input.sections) sections = { ...sections, ...input.sections };
  const diagram = input.diagram === undefined ? oldDiagram : input.diagram;
  const nextStatus = String(fields.status ?? previousStatus);
  if (input.type === "adr") {
    const changedDecisionSections = ["The Problem", "Context", "Options Considered", "Decision", "Rationale"].filter((heading) => input.sections?.[heading] !== undefined);
    if (["accepted", "superseded"].includes(previousStatus) && (changedDecisionSections.length || input.title !== undefined)) {
      throw new Error(`adr '${input.id}' is ${previousStatus}; decision content is immutable. Use collection_add with type='adr' and supersedes: {id, hash, reason} to record a changed decision.`);
    }
    if (nextStatus === "superseded" && previousStatus !== "superseded") throw new Error("ADR status cannot be set to superseded directly. Use collection_add with type='adr' and the supersedes object so the records are linked.");
    if (nextStatus !== previousStatus && !(statusTransitions[previousStatus] ?? []).includes(nextStatus)) throw new Error(`Invalid ADR status transition '${previousStatus}' -> '${nextStatus}'. Proposed ADRs may be accepted or rejected; accepted ADRs may be deprecated or superseded through the supersedes workflow.`);
  }
  const validation = await validateCollectionInput(input.type, { title, summary, fields, sections, diagram }, filterMetadata(input.type, current.frontmatter));
  if (validation.problems.length) throw new Error(validationMessage(input.type, validation.problems));
  await validateReferences(architecture.path, input.type, fields, input.id);
  const today = new Date().toISOString().slice(0, 10);
  const frontmatter = createFrontmatter(input.type, title, summary, input.tags ?? stringArray(current.frontmatter.tags), fields, today,
    typeof current.frontmatter.supersedes === "string" ? current.frontmatter.supersedes : undefined);
  for (const key of ["date", "supersedes", "superseded-by"]) if (current.frontmatter[key] !== undefined) frontmatter[key] = current.frontmatter[key];
  const body = renderCollectionBody(input.type, frontmatter, sections, diagram);
  const hash = await writeMarkdownDocument(path, { frontmatter, body }, input.hash);
  return { id: `${String(chapter).padStart(2, "0")}/${basename(path, ".md")}`, hash, ...(validation.warnings.length ? { warnings: validation.warnings } : {}) };
}

export async function readArchitectureOverview(input: { doc?: string; chapter?: number; type?: string; tag?: string; status?: string }): Promise<any> {
  const architecture = await getArchitecture(input.doc);
  const validTypes = [...collectionTypes, "introduction", "constraints", "context", "strategy", "glossary"];
  if (input.type && !validTypes.includes(input.type)) throw new Error(`type '${input.type}' is not recognized. Choose one of: ${validTypes.join(", ")}.`);
  const files = await listMarkdownFiles(architecture.path, input.chapter);
  const documents = [];
  for (const file of files) {
    try {
      const { frontmatter } = await readMarkdownDocument(file.path);
      const type = collectionTypes.find((candidate) => collectionDefinitions[candidate].chapter === file.chapter) ?? "chapter";
      if (input.type && input.type !== type && input.type !== String(file.chapter)) continue;
      if (input.tag && !stringArray(frontmatter.tags).includes(input.tag)) continue;
      if (input.status && frontmatter.status !== input.status) continue;
      documents.push({ id: file.id, type, chapter: file.chapter, title: frontmatter.title, summary: frontmatter.summary, status: frontmatter.status, tags: stringArray(frontmatter.tags), ...filterMetadata(type === "chapter" ? undefined : type, frontmatter) });
    } catch { /* malformed files are surfaced by arch_lint */ }
  }
  return { architecture: architecture.id, documents };
}

export async function describeType(type: string): Promise<any> {
  if (isCollectionType(type)) return (await import("./definitions.js")).describeCollection(type);
  if (type in chapterTypes) {
    const pages = fixedPages[type] ? Object.entries(fixedPages[type]!).map(([id, page]) => ({ id, title: page.title, summary: page.summary })) : undefined;
    return {
      type, chapter: chapterTypes[type], whenToUse: type === "glossary" ? "Read or edit the chapter 12 glossary as term headings in a single Markdown page." : `Read or section-edit arc42 chapter ${chapterTypes[type]} content.`,
      frontmatter: ["title", "summary", "updated"], pages,
      rules: type === "glossary" ? ["Each term is an H2 heading with its definition in the body.", "Do not copy the term list or definitions into frontmatter."] : ["Keep page content in the body.", "Use chapter_edit with a section and operation to make a focused change."],
      example: type === "glossary" ? { chapter: type, section: "Building block", operation: "upsert", content: "A coherent part of a system with defined responsibilities." } : { chapter: type, page: pages?.[0]?.id, section: "Overview", operation: "append", content: "Additional architecture explanation." },
    };
  }
  throw new Error(`Unknown type '${type}'. Call arch_describe with one of: ${[...collectionTypes, ...Object.keys(chapterTypes)].join(", ")}.`);
}

export async function readChapter(input: { doc?: string; chapter: string; page?: string; id?: string; section?: string }): Promise<any> {
  const architecture = await getArchitecture(input.doc);
  if (input.chapter === "glossary") {
    const path = await resolveExistingDocument(architecture.path, "12/index");
    const document = await readMarkdownDocument(path);
    const sections = extractSections(document.body);
    if (input.id) {
      const content = sections[input.id];
      if (content === undefined) throw new Error(`Glossary term '${input.id}' was not found. Call chapter_read with chapter='glossary' to list term headings.`);
      return { id: `12/${input.id}`, title: input.id, content, hash: document.hash };
    }
    if (input.section) {
      const content = sections[input.section];
      if (content === undefined) throw new Error(`Glossary term '${input.section}' was not found.`);
      return { id: "12/index", section: input.section, content, hash: document.hash };
    }
    return { chapter: "glossary", terms: Object.keys(sections), summary: document.frontmatter.summary };
  }
  const pages = fixedPages[input.chapter];
  if (!pages) throw new Error(`Unknown chapter '${input.chapter}'. Use introduction, constraints, context, strategy, or glossary.`);
  if (!input.page) return { chapter: input.chapter, pages: Object.entries(pages).map(([id, page]) => ({ id, title: page.title, summary: page.summary })) };
  const page = pages[input.page];
  if (!page) throw new Error(`Unknown page '${input.page}' for chapter '${input.chapter}'. Use chapter_read to list valid pages.`);
  const number = chapterTypes[input.chapter]!;
  const path = await resolveExistingDocument(architecture.path, `${String(number).padStart(2, "0")}/${page.file}`);
  const document = await readMarkdownDocument(path);
  if (input.section) {
    const content = input.section === "Body" ? bodyWithoutTitle(document.body) : extractSections(document.body)[input.section];
    if (content === undefined) throw new Error(`Section '${input.section}' was not found. Read the page without section to inspect its headings.`);
    return { id: `${String(number).padStart(2, "0")}/${page.file}`, title: document.frontmatter.title, section: input.section, content, hash: document.hash };
  }
  return { id: `${String(number).padStart(2, "0")}/${page.file}`, frontmatter: document.frontmatter, body: document.body, hash: document.hash };
}

export async function editChapter(input: {
  doc?: string; chapter: string; page?: string; hash?: string; section: string; operation: "replace" | "append" | "remove" | "upsert"; content?: string;
}): Promise<any> {
  const architecture = await getArchitecture(input.doc);
  if (input.chapter === "glossary") {
    if (!input.section.trim()) throw new Error("section: provide the glossary term heading to edit.");
    if (/\r|\n|^#/.test(input.section.trim())) throw new Error("section: use a single glossary term, without Markdown heading markers. The server renders it as an H2 heading.");
    const path = await resolveDocumentPath(architecture.path, 12, "index");
    let frontmatter: Record<string, unknown> = { title: "Glossary", summary: "Architecture terms and definitions." };
    let body = "# Glossary\n";
    let currentHash: string | undefined;
    try {
      const current = await readMarkdownDocument(path);
      frontmatter = current.frontmatter; body = current.body; currentHash = current.hash;
      if (!input.hash) throw new Error("The glossary exists. Call chapter_read with chapter='glossary' and pass its hash before editing.");
      if (current.hash !== input.hash) throw new Error("The glossary changed since it was read. Read it again and retry with the new hash.");
    } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
    const sections = extractSections(body);
    if (input.operation === "remove") {
      if (sections[input.section] === undefined) throw new Error(`Glossary term '${input.section}' does not exist. Read the glossary to see current terms.`);
      delete sections[input.section];
    } else {
      if (!input.content?.trim()) throw new Error("content: provide a non-empty term definition.");
      if (hasTopLevelH2(input.content)) throw new Error("content: an H2 heading would split the glossary term. Use prose, lists, or H3 subheadings instead.");
      sections[input.section] = input.operation === "append" && sections[input.section]
        ? `${sections[input.section]}\n\n${input.content.trim()}`
        : input.content.trim();
    }
    const today = new Date().toISOString().slice(0, 10);
    frontmatter = { title: "Glossary", summary: `${Object.keys(sections).length} architecture terms.`, updated: today };
    body = `# Glossary\n\n${Object.entries(sections).map(([term, definition]) => `## ${term}\n\n${definition}`).join("\n\n")}\n`;
    await mkdir(dirname(path), { recursive: true });
    const hash = await writeMarkdownDocument(path, { frontmatter, body }, currentHash ? input.hash! : null);
    return { id: "12/index", hash };
  }
  const pages = fixedPages[input.chapter];
  if (!pages) throw new Error(`Unknown chapter '${input.chapter}'.`);
  if (!input.page || !pages[input.page]) throw new Error(`page: choose one of ${Object.keys(pages).join(", ")} for chapter '${input.chapter}'.`);
  if (!input.section.trim() || /[\r\n]|^#+\s/.test(input.section.trim())) throw new Error("section: use a plain single-line section name without Markdown heading markers.");
  const page = pages[input.page]!;
  const number = chapterTypes[input.chapter]! as 1 | 2 | 3 | 4;
  const path = await resolveDocumentPath(architecture.path, number, page.file);
  let frontmatter: Record<string, unknown> = { title: page.title, summary: page.summary };
  let body = `# ${page.title}\n`;
  let currentHash: string | undefined;
  try {
    const current = await readMarkdownDocument(path);
    frontmatter = current.frontmatter; body = current.body; currentHash = current.hash;
    if (!input.hash) throw new Error("This page already exists. Read it and provide its hash before editing.");
    if (current.hash !== input.hash) throw new Error("The page changed since it was read. Read it again, reconcile, and retry with the new hash.");
  } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
  const today = new Date().toISOString().slice(0, 10);
  const sections = extractSections(body);
  if (input.section === "Body") {
    if (input.operation === "remove") body = `# ${String(frontmatter.title ?? page.title)}\n`;
    else {
      if (!input.content?.trim()) throw new Error("content: provide non-empty Markdown, or use remove to clear the body.");
      body = `# ${String(frontmatter.title ?? page.title)}\n\n${input.content.trim()}\n`;
    }
  } else {
    if (input.operation === "remove") {
      if (!(input.section in sections)) throw new Error(`Section '${input.section}' does not exist on ${input.page}.`);
      delete sections[input.section];
    } else {
      if (!input.content?.trim()) throw new Error("content: provide non-empty Markdown for the section operation.");
      if (hasTopLevelH2(input.content)) throw new Error("content: an H2 heading would split this page section. Use H3 headings inside a section.");
      sections[input.section] = input.operation === "append" && sections[input.section]
        ? `${sections[input.section]}\n\n${input.content.trim()}`
        : input.content.trim();
    }
    body = renderPageBody(String(frontmatter.title ?? page.title), sections);
  }
  frontmatter = { ...frontmatter, title: String(frontmatter.title ?? page.title), summary: String(frontmatter.summary ?? page.summary), updated: today };
  await mkdir(dirname(path), { recursive: true });
  const hash = await writeMarkdownDocument(path, { frontmatter, body }, currentHash ? input.hash! : null);
  return { id: `${String(number).padStart(2, "0")}/${page.file}`, hash };
}

export async function lintArchitecture(doc?: string): Promise<any> {
  const architecture = await getArchitecture(doc);
  const files = await listMarkdownFiles(architecture.path);
  const diagnostics: Array<{ id: string; severity: "error" | "warning"; message: string }> = [];
  const frontmatterById = new Map<string, Record<string, unknown>>();
  const adrNumbers: number[] = [];
  for (const file of files) {
    try {
      const document = await readMarkdownDocument(file.path);
      const fm = document.frontmatter;
      frontmatterById.set(file.id, fm);
      if (typeof fm.title !== "string" || !fm.title.trim()) diagnostics.push({ id: file.id, severity: "error", message: "Missing title in frontmatter" });
      if (typeof fm.summary !== "string" || !fm.summary.trim()) diagnostics.push({ id: file.id, severity: "error", message: "Missing summary in frontmatter" });
      const type = collectionTypes.find((candidate) => collectionDefinitions[candidate].chapter === file.chapter);
      if (type) {
        const allowedFrontmatter = new Set(["title", "summary", "status", "tags", "updated", ...Object.keys(collectionDefinitions[type].filters), ...(type === "adr" ? ["date", "supersedes", "superseded-by"] : [])]);
        for (const key of Object.keys(fm)) if (!allowedFrontmatter.has(key)) diagnostics.push({ id: file.id, severity: "error", message: `Frontmatter field '${key}' is not a discovery/filter field for collection '${type}'. Keep content in the Markdown body.` });
        const sections: ContentMap = extractSections(document.body);
        const diagram = extractDiagram(sections.Diagram);
        const statusSection = sections.Status;
        const decisionsSection = sections["Related decisions"];
        delete sections.Diagram; delete sections.Status; delete sections["Related decisions"];
        if (type === "quality") sections.Scenarios = parseQualityScenarios(document.body);
        const { problems } = await validateCollectionInput(type, {
          title: String(fm.title ?? ""), summary: String(fm.summary ?? ""), fields: filterMetadata(type, fm), sections, diagram,
        });
        for (const problem of problems) diagnostics.push({ id: file.id, severity: "error", message: `${problem.field}: ${problem.problem}. ${problem.hint}` });
        for (const target of stringArray(fm.related)) if (!await documentExists(architecture.path, target)) diagnostics.push({ id: file.id, severity: "warning", message: `Broken related reference: ${target}` });
        if (type === "adr") {
          const number = Number(file.id.match(/adr-(\d+)/)?.[1]);
          if (number) adrNumbers.push(number);
          const renderedStatus = statusSection;
          if (typeof renderedStatus !== "string" || !renderedStatus.startsWith(`${capitalize(String(fm.status))}, ${String(fm.date)}`)) diagnostics.push({ id: file.id, severity: "error", message: "Generated ADR Status section does not match frontmatter status and date" });
          for (const target of [...stringArray(fm.supersedes), ...stringArrayValue(fm["superseded-by"])]) {
            if (!await documentExists(architecture.path, target, 9)) diagnostics.push({ id: file.id, severity: "error", message: `Broken ADR supersede reference: ${target}` });
          }
          for (const target of stringArray(fm.supersedes)) {
            const prior = frontmatterById.get(canonicalId(9, target));
            if (prior && !stringArrayValue(prior["superseded-by"]).includes(file.id)) diagnostics.push({ id: file.id, severity: "error", message: `ADR supersede link is not reciprocal: ${target} does not name this ADR in superseded-by.` });
          }
          for (const target of stringArrayValue(fm["superseded-by"])) {
            const next = frontmatterById.get(canonicalId(9, target));
            if (next && !stringArray(next.supersedes).includes(file.id)) diagnostics.push({ id: file.id, severity: "error", message: `ADR superseded-by link is not reciprocal: ${target} does not name this ADR in supersedes.` });
          }
        }
        if (type === "concept") {
          for (const target of stringArray(fm.decisions)) if (!await documentExists(architecture.path, target, 9)) diagnostics.push({ id: file.id, severity: "error", message: `Broken ADR reference: ${target}` });
          if (typeof statusSection !== "string" || statusSection !== `${capitalize(String(fm.status))}, ${String(fm.updated)}`) diagnostics.push({ id: file.id, severity: "error", message: "Generated concept Status section does not match frontmatter status and updated date" });
          const expected = renderRelatedDecisions(fm.decisions);
          if (typeof decisionsSection !== "string" || decisionsSection !== expected) diagnostics.push({ id: file.id, severity: "error", message: "Generated Related decisions section does not match frontmatter decisions" });
        }
      }
      if (!type && file.chapter === 12 && file.id.endsWith("/index")) {
        const allowed = new Set(["title", "summary", "tags", "updated"]);
        for (const key of Object.keys(fm)) if (!allowed.has(key)) diagnostics.push({ id: file.id, severity: "error", message: `Glossary frontmatter field '${key}' is not discovery metadata. Keep terms and definitions in body headings.` });
        if (Object.keys(extractSections(document.body)).length === 0) diagnostics.push({ id: file.id, severity: "warning", message: "Glossary body has no H2 term headings." });
      }
    } catch (error) {
      diagnostics.push({ id: file.id, severity: "error", message: `Could not parse or validate document: ${(error as Error).message}` });
    }
  }
  const ordered = [...new Set(adrNumbers)].sort((a, b) => a - b);
  for (let index = 1; index <= (ordered.at(-1) ?? 0); index++) if (!ordered.includes(index)) diagnostics.push({ id: "09", severity: "warning", message: `ADR numbering gap: ${String(index).padStart(4, "0")}` });
  for (const file of files.filter((item) => item.chapter === 8)) {
    const fm = frontmatterById.get(file.id);
    if (!fm) continue;
    for (const target of stringArray(fm.decisions)) {
      const targetFm = frontmatterById.get(canonicalId(9, target));
      if (targetFm && ["rejected", "superseded"].includes(String(targetFm.status))) diagnostics.push({ id: file.id, severity: "warning", message: `Concept references a ${String(targetFm.status)} ADR: ${target}` });
    }
  }
  return { architecture: architecture.id, diagnostics, errorCount: diagnostics.filter((item) => item.severity === "error").length, warningCount: diagnostics.filter((item) => item.severity === "warning").length };
}

export function extractSections(body: string): Record<string, string> {
  const result: Record<string, string> = {};
  const lines = body.split(/\r?\n/);
  let current: string | undefined;
  let inFence = false;
  for (const line of lines) {
    if (/^\s*```/.test(line)) inFence = !inFence;
    const heading = !inFence ? line.match(/^##\s+(.+?)\s*$/)?.[1] : undefined;
    if (heading) { current = heading; result[current] = ""; continue; }
    if (current) result[current] += `${result[current] ? "\n" : ""}${line}`;
  }
  for (const [heading, content] of Object.entries(result)) result[heading] = content.trim();
  return result;
}

export function renderCollectionBody(type: CollectionType, frontmatter: Record<string, unknown>, sections: ContentMap, diagram?: string): string {
  const title = String(frontmatter.title);
  const lines = [`# ${title}`];
  if (type === "adr") {
    lines.push("", "## Status", renderAdrStatus(frontmatter));
  }
  if (type === "concept") {
    lines.push("", "## Status", `${capitalize(String(frontmatter.status))}, ${String(frontmatter.updated)}`);
  }
  const definition = collectionDefinitions[type];
  const sectionOrder = Object.keys(definition.sections);
  const diagramBefore = type === "building_block" ? "Responsibilities" : type === "runtime_scenario" ? "Steps" : undefined;
  for (const heading of sectionOrder) {
    if (diagram && diagramBefore === heading) appendDiagram(lines, diagram);
    const value = sections[heading];
    if (value === undefined || value === null || value === "") continue;
    lines.push("", `## ${heading}`);
    if (type === "quality" && heading === "Scenarios") lines.push(renderQualityTable(value));
    else lines.push(typeof value === "string" ? value.trim() : renderMarkdownList(value));
  }
  if (diagram?.trim() && !diagramBefore) appendDiagram(lines, diagram);
  if (type === "concept") {
    lines.push("", "## Related decisions", renderRelatedDecisions(frontmatter.decisions));
    for (const [heading, value] of Object.entries(sections)) {
      if (heading in definition.sections || ["Status", "Related decisions", "Diagram"].includes(heading) || !value) continue;
      lines.push("", `## ${heading}`, String(value).trim());
    }
  }
  return `${lines.join("\n")}\n`;
}

function renderAdrStatus(frontmatter: Record<string, unknown>): string {
  const supersedes = stringArray(frontmatter.supersedes);
  const supersededBy = stringArrayValue(frontmatter["superseded-by"]);
  return [
    `${capitalize(String(frontmatter.status))}, ${String(frontmatter.date)}`,
    `Supersedes: ${renderAdrLinks(supersedes)}`,
    `Superseded by: ${renderAdrLinks(supersededBy)}`,
  ].join("\n");
}

function updateGeneratedSections(type: CollectionType, body: string, frontmatter: Record<string, unknown>): string {
  const sections = extractSections(body);
  if (type === "adr") sections.Status = renderAdrStatus(frontmatter);
  return renderCollectionBody(type, frontmatter, sections, extractDiagram(sections.Diagram));
}

function renderAdrLinks(ids: string[]): string {
  return ids.length ? ids.map((id) => `[${id.split("/").at(-1)}](./${id.split("/").at(-1)}.md)`).join(", ") : "none";
}

function renderRelatedDecisions(value: unknown): string {
  const ids = stringArray(value);
  return ids.length ? ids.map((id) => `- [${id.split("/").at(-1)}](../09-architecture-decisions/${id.split("/").at(-1)}.md)`).join("\n") : "None";
}

function renderQualityTable(value: unknown): string {
  const scenarios = Array.isArray(value) ? value as Array<Record<string, unknown>> : [];
  const headers = ["ID", "Scenario", "Stimulus", "Response", "Measure", "Priority"];
  const rows = scenarios.map((scenario) => [scenario.id, scenario.title, scenario.stimulus, scenario.response, scenario.measure, scenario.priority]);
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map((cell) => escapeTableCell(String(cell ?? ""))).join(" | ")} |`),
  ].join("\n");
}

export function parseQualityScenarios(body: string): Array<Record<string, unknown>> {
  const table = extractSections(body).Scenarios;
  if (!table) return [];
  const rows = table.split(/\r?\n/).filter((line) => /^\s*\|/.test(line));
  if (rows.length < 3) return [];
  const cells = (line: string) => line.trim().replace(/^\|/, "").replace(/\|$/, "").split(/(?<!\\)\|/).map((cell) => cell.trim().replace(/\\\|/g, "|"));
  return rows.slice(2).map(cells).filter((row) => row.length >= 6).map(([id, title, stimulus, response, measure, priority]) => ({ id, title, stimulus, response, measure, priority }));
}

function assignScenarioIds(scenarios: unknown[], attribute: string): unknown[] {
  const normalized = scenarios.map((scenario) => scenario && typeof scenario === "object" && !Array.isArray(scenario) ? { ...(scenario as Record<string, unknown>) } : scenario);
  for (const scenario of normalized) {
    if (!scenario || typeof scenario !== "object" || Array.isArray(scenario)) continue;
    const record = scenario as Record<string, unknown>;
    if (!String(record.id ?? "").trim()) record.id = nextScenarioId(normalized.filter((item) => item !== scenario) as Array<Record<string, unknown>>, attribute);
  }
  return normalized;
}

function nextScenarioId(scenarios: Array<Record<string, unknown>>, attribute: string): string {
  const prefix = attribute.replace(/[^a-z0-9]/gi, "").slice(0, 3).toUpperCase() || "QSC";
  const max = scenarios.reduce((highest, scenario) => {
    const match = String(scenario.id ?? "").match(new RegExp(`^${prefix}-(\\d+)$`, "i"));
    return Math.max(highest, Number(match?.[1] ?? 0));
  }, 0);
  return `${prefix}-${String(max + 1).padStart(2, "0")}`;
}

export function createFrontmatter(type: CollectionType, title: string, summary: string, tags: string[], fields: ContentMap, updated: string, supersedes?: string): Record<string, unknown> {
  const definition = collectionDefinitions[type];
  const frontmatter: Record<string, unknown> = { title: title.trim(), summary: summary.trim(), status: fields.status ?? (type === "adr" ? "proposed" : type === "concept" ? "draft" : "active"), tags, updated };
  for (const key of Object.keys(definition.filters)) if (fields[key] !== undefined) frontmatter[key] = fields[key];
  if (type === "adr") {
    frontmatter.date = fields.date ?? updated;
    frontmatter.supersedes = supersedes ? [supersedes] : stringArray(fields.supersedes);
    frontmatter["superseded-by"] = fields["superseded-by"] ?? null;
  }
  return frontmatter;
}

function filterMetadata(type: CollectionType | undefined, frontmatter: Record<string, unknown>): ContentMap {
  if (!type) return {};
  const values: ContentMap = {};
  for (const key of Object.keys(collectionDefinitions[type].filters)) if (frontmatter[key] !== undefined) values[key] = frontmatter[key];
  if (frontmatter.status !== undefined) values.status = frontmatter.status;
  return values;
}

function renderMarkdownList(value: unknown): string {
  if (Array.isArray(value)) return value.map((item) => `- ${String(item)}`).join("\n");
  return String(value);
}

function renderPageBody(title: string, sections: Record<string, string>): string {
  const parts = [`# ${title}`];
  for (const [heading, content] of Object.entries(sections)) parts.push("", `## ${heading}`, content);
  return `${parts.join("\n")}\n`;
}

function appendDiagram(lines: string[], diagram: string): void {
  lines.push("", "## Diagram", `\`\`\`mermaid\n${normalizeDiagram(diagram)}\n\`\`\``);
}

function bodyWithoutTitle(body: string): string {
  return body.replace(/^# [^\r\n]*\r?\n+/, "").trim();
}

function hasTopLevelH2(value: string): boolean {
  let inFence = false;
  for (const line of value.split(/\r?\n/)) {
    if (/^\s*```/.test(line)) { inFence = !inFence; continue; }
    if (!inFence && /^##\s/.test(line)) return true;
  }
  return false;
}

function extractDiagram(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  return value.trim().replace(/^```(?:mermaid)?\s*\r?\n/i, "").replace(/\r?\n```\s*$/, "").trim();
}

function escapeTableCell(value: string): string { return value.replace(/\|/g, "\\|").replace(/\r?\n/g, " ").trim(); }
function slugify(value: string): string { const slug = value.normalize("NFKD").toLowerCase().replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""); if (!slug) throw new Error("title: include at least one letter or number to create a file name."); return slug; }
function normalizeId(chapter: number, id: string): string { const slug = id.match(/^(?:0?\d{1,2}\/)?(.+)$/)?.[1] ?? id; return `${String(chapter).padStart(2, "0")}/${slug.replace(/\.md$/, "")}`; }
function canonicalId(chapter: number, id: string): string { return id.includes("/") ? id : `${String(chapter).padStart(2, "0")}/${id}`; }
function stringArray(value: unknown): string[] { return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []; }
function stringArrayValue(value: unknown): string[] { return typeof value === "string" ? [value] : stringArray(value); }
function capitalize(value: string): string { return value ? value[0]!.toUpperCase() + value.slice(1) : value; }
function unfence(value: string): string { return value.trim().replace(/^```(?:mermaid)?\s*\r?\n/i, "").replace(/\r?\n```\s*$/, ""); }

async function validateReferences(root: string, type: CollectionType, fields: ContentMap, currentId?: string): Promise<void> {
  if (type === "concept") {
    for (const target of stringArray(fields.decisions)) if (!await documentExists(root, target, 9)) throw new Error(`fields.decisions: ADR '${target}' was not found. Use an existing ADR ID from collection_read(type='adr').`);
    for (const target of stringArray(fields["applies-to"])) if (!await documentExists(root, target, 5)) throw new Error(`fields.applies-to: building block '${target}' was not found. Use an existing building block ID.`);
  }
  if (type === "building_block" && fields.parent) {
    if (fields.parent === currentId) throw new Error("fields.parent: a building block cannot be its own parent. Choose another block or omit parent.");
    if (!await documentExists(root, String(fields.parent), 5)) throw new Error(`fields.parent: building block '${String(fields.parent)}' was not found. Read the building block collection for valid IDs.`);
  }
}

async function documentExists(root: string, id: string, defaultChapter?: number): Promise<boolean> {
  if (id.includes("/")) { try { await resolveExistingDocument(root, id); return true; } catch { return false; } }
  if (defaultChapter !== undefined) { try { await resolveExistingDocument(root, `${String(defaultChapter).padStart(2, "0")}/${id}`); return true; } catch { return false; } }
  for (let chapter = 1; chapter <= 12; chapter++) { try { await resolveExistingDocument(root, `${String(chapter).padStart(2, "0")}/${id}`); return true; } catch { /* check other chapters */ } }
  return false;
}

async function unlinkIfUnchanged(path: string, expectedHash: string): Promise<void> {
  try { const raw = await readFile(path, "utf8"); if (contentHash(raw) === expectedHash) await unlink(path); } catch { /* preserve original failure */ }
}
