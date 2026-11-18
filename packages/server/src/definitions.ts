export const collectionTypes = ["adr", "concept", "building_block", "runtime_scenario", "deployment", "quality", "risk"] as const;
export type CollectionType = (typeof collectionTypes)[number];
export type ContentValue = string | string[] | Array<Record<string, unknown>>;
export type ContentMap = Record<string, unknown>;

export interface ValidationProblem {
  field: string;
  problem: string;
  hint: string;
}

export interface FieldDefinition {
  type: "string" | "string[]" | "enum";
  required?: boolean;
  values?: string[];
  description: string;
  example?: unknown;
}

export interface CollectionDefinition {
  chapter: number;
  use: string;
  filters: Record<string, FieldDefinition>;
  sections: Record<string, { required?: boolean; description: string; example?: unknown }>;
  diagram?: "required" | "optional";
  customSections?: boolean;
  example: Record<string, unknown>;
}

const text = (description: string, required = true, example?: string): FieldDefinition => ({ type: "string", required, description, ...(example ? { example } : {}) });
const list = (description: string, required = true, example?: string[]): FieldDefinition => ({ type: "string[]", required, description, ...(example ? { example } : {}) });
const choice = (values: string[], description: string, required = true): FieldDefinition => ({ type: "enum", required, values, description, example: values[0] });

export const collectionDefinitions: Record<CollectionType, CollectionDefinition> = {
  adr: {
    chapter: 9,
    use: "A durable record of an architecture decision, its problem, context, options, rationale, and consequences.",
    filters: { status: choice(["proposed", "accepted", "rejected", "deprecated", "superseded"], "Lifecycle state.") },
    sections: {
      "The Problem": { required: true, description: "One sentence stating what must be solved.", example: "We need durable relational persistence." },
      Context: { required: true, description: "Forces, constraints, and assumptions that frame the decision." },
      "Options Considered": { required: true, description: "Markdown list of at least two alternatives; exactly one is bold-selected, except for a rejected ADR." },
      Decision: { required: true, description: "The chosen course of action." },
      Rationale: { required: true, description: "Only the decisive factors that led to the choice." },
      Consequences: { required: true, description: "Positive and negative results, including follow-up work." },
      Deciders: { description: "Optional list of people or roles involved in the decision." },
      Notes: { description: "Optional additional context, constraints, or links." },
    },
    example: { title: "Use PostgreSQL for persistence", summary: "Use PostgreSQL for durable relational storage.", fields: { status: "proposed" }, sections: { "The Problem": "We need durable relational persistence.", Context: "Transactions are required.", "Options Considered": "- SQLite\n- **PostgreSQL**", Decision: "We will use PostgreSQL.", Rationale: "It meets the transactional and operational needs.", Consequences: "We must operate the database and maintain migrations." } },
  },
  concept: {
    chapter: 8,
    use: "A pattern, principle, guideline, convention, or crosscutting instruction explaining how part of the architecture works or should be used.",
    filters: {
      kind: choice(["pattern", "principle", "guideline", "convention", "cross-cutting"], "Concept category."),
      status: choice(["draft", "accepted", "deprecated"], "Concept lifecycle state.", false),
      scope: text("Where the concept applies, such as system, service, or module.", false),
      "applies-to": list("Building block IDs to which the concept applies.", false),
      decisions: list("ADR IDs that justify or constrain this concept.", false),
    },
    sections: {
      Purpose: { required: true, description: "The problem addressed and when this concept applies." },
      Description: { required: true, description: "How the pattern or principle works in this architecture." },
      Guidelines: { description: "Concrete do and don't rules; required for pattern and guideline concepts." },
      Examples: { description: "Optional code, configuration, or diagram examples." },
    },
    customSections: true,
    example: { title: "Transactional outbox", summary: "Publish events reliably from committed transactions.", fields: { kind: "pattern" }, sections: { Purpose: "Avoid losing events when a transaction commits.", Description: "Write events to an outbox in the same transaction.", Guidelines: "Make consumers idempotent." } },
  },
  building_block: {
    chapter: 5,
    use: "A system, container, or component with explicit responsibilities, interfaces, prose explanation, and a Mermaid view of its structure and neighbors.",
    filters: {
      level: choice(["system", "container", "component"], "Decomposition level."),
      parent: text("Parent building block ID, when nested.", false),
    },
    sections: {
      Description: { required: true, description: "Explain the block and its role in the architecture." },
      Responsibilities: { required: true, description: "A Markdown list of responsibilities." },
      Interfaces: { required: true, description: "A Markdown list of provided or consumed interfaces." },
    },
    diagram: "required",
    example: { title: "Order Service", summary: "Owns order lifecycle and persistence.", fields: { level: "component" }, sections: { Description: "Processes order commands and persists their state.", Responsibilities: "- Validate order commands\n- Persist order state", Interfaces: "- HTTP API\n- Event stream" }, diagram: "flowchart LR\n  Client --> OrderService\n  OrderService --> Database" },
  },
  runtime_scenario: {
    chapter: 6,
    use: "A runtime interaction or scenario showing how components collaborate to realize an important behavior.",
    filters: {},
    sections: {
      Trigger: { required: true, description: "Event that starts the scenario." },
      Participants: { required: true, description: "A Markdown list of participating building blocks or actors." },
      Steps: { required: true, description: "Narrative explanation of the interaction, not a substitute for the diagram." },
      Outcome: { required: true, description: "Result and relevant guarantees or failure behavior." },
    },
    diagram: "required",
    example: { title: "Create an order", summary: "The order API validates and persists a new order before publishing an event.", sections: { Trigger: "A client submits a valid order.", Participants: "- Client\n- Order API\n- Order database\n- Event broker", Steps: "The API validates the request, commits the order and outbox record, then publishes asynchronously.", Outcome: "The order is durable before downstream consumers receive its event." }, diagram: "sequenceDiagram\n  actor Client\n  participant API as Order API\n  participant DB as Order database\n  Client->>API: Submit order\n  API->>DB: Commit order and outbox" },
  },
  deployment: {
    chapter: 7,
    use: "A deployment environment and the runtime nodes and connections that realize the architecture, shown with a Mermaid diagram and explanation.",
    filters: { environment: text("Deployment environment, such as production or local development."), location: text("Deployment location or zone.", false) },
    sections: { Description: { required: true, description: "Explain deployment boundaries, placement, and notable operational choices." } },
    diagram: "required",
    example: { title: "Production deployment", summary: "The application runs across two zones behind a managed ingress.", fields: { environment: "production", location: "cloud region" }, sections: { Description: "Two application replicas share the managed ingress and use a multi-zone database." }, diagram: "flowchart TB\n  Ingress --> AppA\n  Ingress --> AppB\n  AppA --> Database\n  AppB --> Database" },
  },
  quality: {
    chapter: 10,
    use: "A page for one quality attribute, containing a description and a readable table of related quality scenarios.",
    filters: {
      "quality-attribute": text("Quality characteristic represented by this page."),
      priority: choice(["low", "medium", "high", "critical"], "Overall priority of this quality attribute."),
    },
    sections: {
      Description: { required: true, description: "Explain why this quality attribute matters for the system." },
      Scenarios: { required: true, description: "Array of scenario objects with id, title, stimulus, response, measure, and priority; an empty array is allowed for a new quality page." },
    },
    example: { title: "Reliability", summary: "Stale edits are rejected without overwriting newer architecture content.", fields: { "quality-attribute": "reliability", priority: "critical" }, sections: { Description: "The server must preserve user changes when agents edit concurrently.", Scenarios: [{ id: "REL-1", title: "Stale edit rejected", stimulus: "An agent edits using an outdated hash.", response: "The server rejects the write and keeps the newer file.", measure: "The file remains byte-identical and a conflict is returned.", priority: "critical" }] } },
  },
  risk: {
    chapter: 11,
    use: "A discrete risk or technical-debt item with a filterable severity and mitigation status.",
    filters: {
      kind: choice(["risk", "debt"], "Whether this is a risk or technical debt."),
      severity: choice(["low", "medium", "high", "critical"], "Impact severity."),
      "mitigation-status": choice(["open", "mitigating", "accepted", "resolved"], "Mitigation lifecycle."),
    },
    sections: {
      Description: { required: true, description: "Explain the risk, its cause, and its consequences." },
      Mitigation: { required: true, description: "Describe prevention, mitigation, or monitoring actions." },
    },
    example: { title: "Cross-process file write race", summary: "Independent server processes can race while updating one architecture file.", fields: { kind: "risk", severity: "high", "mitigation-status": "open" }, sections: { Description: "In-process locks do not coordinate writes from separate server processes.", Mitigation: "Add cross-process locking and a multi-process race test." } },
  },
};

const commonFields: Record<string, FieldDefinition> = {
  status: choice(["draft", "active", "proposed", "accepted", "rejected", "deprecated", "superseded"], "Lifecycle or current state.", false),
};
let mermaidParser: typeof import("mermaid").default | undefined;

export function describeCollection(type: CollectionType) {
  const definition = collectionDefinitions[type];
  return {
    type,
    chapter: definition.chapter,
    whenToUse: definition.use,
    frontmatter: { title: "Required short title", summary: "Required discovery summary (aim for one sentence and <=160 characters)", status: "Lifecycle state", tags: "Optional filter labels", updated: "Server-managed date", ...definition.filters },
    sections: definition.sections,
    diagram: definition.diagram ?? "optional; supply Mermaid source without a code fence",
    rules: validationGuidelines(type),
    example: definition.example,
  };
}

export function collectionTypesForChapter(chapter: number): CollectionType[] {
  return collectionTypes.filter((type) => collectionDefinitions[type].chapter === chapter);
}

export function isCollectionType(value: string): value is CollectionType {
  return (collectionTypes as readonly string[]).includes(value);
}

export async function validateCollectionInput(type: CollectionType, input: {
  title: string; summary: string; fields?: ContentMap; sections?: ContentMap; diagram?: string;
}, existingFields: ContentMap = {}): Promise<{ problems: ValidationProblem[]; warnings: string[] }> {
  const definition = collectionDefinitions[type];
  const fields = { ...existingFields, ...(input.fields ?? {}) };
  const sections = input.sections ?? {};
  const problems: ValidationProblem[] = [];
  const warnings: string[] = [];
  const put = (field: string, problem: string, hint: string) => problems.push({ field, problem, hint });

  if (!input.title.trim()) put("title", "is required and cannot be blank", "Provide a concise, descriptive title.");
  if (!input.summary.trim()) put("summary", "is required and cannot be blank", "Add a one-sentence discovery summary.");
  if (input.summary.trim().length > 160) warnings.push(`summary is ${input.summary.trim().length} characters; aim for 160 or fewer so overviews stay compact`);
  if (input.summary.trim().toLowerCase() === input.title.trim().toLowerCase()) warnings.push("summary repeats the title; add a short explanation of what the document covers");
  if ((input.summary.trim().match(/[.!?](?:\s|$)/g) ?? []).length > 1) warnings.push("summary contains multiple sentences; keep it to one sentence for compact discovery");
  if (containsPlaceholder(input.title) || containsPlaceholder(input.summary)) put("title/summary", "contains a placeholder", "Replace TBD, TODO, or PLACEHOLDER with actual content.");

  const allowedFields = { ...commonFields, ...definition.filters };
  validateUnknownKeys("fields", fields, allowedFields, put);
  for (const [key, rule] of Object.entries(allowedFields)) {
    const value = fields[key];
    if (value === undefined || value === null || value === "") {
      if (rule.required) put(`fields.${key}`, "is required", `${rule.description} Example: ${JSON.stringify(rule.example)}.`);
      continue;
    }
    if (typeof value === "string" && containsPlaceholder(value)) put(`fields.${key}`, "contains a placeholder", "Replace TBD, TODO, or PLACEHOLDER with a concrete filter value.");
    if (rule.type === "string" && (typeof value !== "string" || !value.trim())) put(`fields.${key}`, "must be non-empty text", rule.description);
    if (rule.type === "string[]" && (!Array.isArray(value) || !value.every((item) => typeof item === "string" && item.trim()))) put(`fields.${key}`, "must be a list of non-empty strings", rule.description);
    if (rule.type === "enum" && (typeof value !== "string" || !rule.values?.includes(value))) put(`fields.${key}`, `must be one of ${rule.values?.join(", ")}`, `${rule.description} Example: ${rule.values?.[0]}.`);
  }

  const statuses: Record<CollectionType, string[]> = {
    adr: ["proposed", "accepted", "rejected", "deprecated", "superseded"],
    concept: ["draft", "accepted", "deprecated"],
    building_block: ["active", "deprecated"],
    runtime_scenario: ["active", "deprecated"],
    deployment: ["active", "deprecated"],
    quality: ["active", "deprecated"],
    risk: ["active", "deprecated"],
  };
  if (fields.status !== undefined && !statuses[type].includes(String(fields.status))) {
    put("fields.status", `must be one of ${statuses[type].join(", ")}`, `Choose a valid ${type} lifecycle status.`);
  }

  const allowedSections = { ...definition.sections };
  validateUnknownKeys("sections", sections, allowedSections, put, definition.customSections);
  for (const heading of Object.keys(sections)) {
    if (!heading.trim() || /[\r\n]/.test(heading) || /^#+\s/.test(heading)) put(`sections.${heading}`, "is not a safe single-line heading", "Use the plain section name from arch_describe without Markdown heading markers.");
  }
  for (const [heading, rule] of Object.entries(definition.sections)) {
    const value = sections[heading];
    if (value === undefined || value === null || value === "") {
      if (rule.required) put(`sections.${heading}`, "is required", `${rule.description}${rule.example ? ` Example: ${JSON.stringify(rule.example)}.` : ""}`);
      continue;
    }
    if (heading === "Scenarios" && type === "quality") {
      validateScenarios(value, put, warnings);
      continue;
    }
    if (typeof value !== "string" || !value.trim()) {
      put(`sections.${heading}`, "must be non-empty text", rule.description);
      continue;
    }
    if (containsPlaceholder(value)) put(`sections.${heading}`, "contains a placeholder", "Replace TBD, TODO, or PLACEHOLDER with architecture-specific content.");
    if (hasUnfencedH2(value)) put(`sections.${heading}`, "contains an H2 heading that would break section boundaries", "Use H3 headings inside a section; reserve H2 headings for top-level document sections.");
  }

  if (type === "concept") {
    const kind = fields.kind;
    if (["pattern", "guideline"].includes(String(kind)) && !(typeof sections.Guidelines === "string" && sections.Guidelines.trim())) {
      put("sections.Guidelines", `is required for concept kind '${String(kind)}'`, "Add concrete do/don't guidance, for example '- Make consumers idempotent'.");
    }
  }

  if (type === "adr") validateAdrSections(fields, sections, put);

  if (definition.diagram === "required" && !input.diagram?.trim()) {
    put("diagram", "is required", `Add a Mermaid ${type === "runtime_scenario" ? "sequenceDiagram" : "flowchart"} showing the relevant elements and interactions.`);
  }
  if (input.diagram?.trim()) {
    if (hasUnfencedH2(input.diagram)) put("diagram", "must be Mermaid source, not a Markdown heading", "Pass only Mermaid diagram source without a code fence.");
    else {
      try {
        if (!mermaidParser) {
          const globals = globalThis as unknown as Record<string, unknown>;
          if (!globals.window) {
            const { JSDOM } = await import("jsdom");
            const dom = new JSDOM("");
            globals.window = dom.window;
            globals.document = dom.window.document;
            globals.Node = dom.window.Node;
            globals.DOMParser = dom.window.DOMParser;
          }
          mermaidParser = (await import("mermaid")).default;
        }
        await mermaidParser.parse(unfenceMermaid(input.diagram));
      }
      catch (error) { put("diagram", `is not valid Mermaid: ${(error as Error).message}`, "Fix the reported syntax error. Use arch_describe for a valid example; do not use semicolons to separate Mermaid statements."); }
    }
  }

  if (type === "building_block" && fields.parent && fields.parent === input.title) put("fields.parent", "cannot refer to itself", "Choose an existing parent building block ID or omit parent for a root block.");
  return { problems, warnings };
}

export function validationMessage(type: string, problems: ValidationProblem[]): string {
  return `${type} rejected (${problems.length} ${problems.length === 1 ? "problem" : "problems"}):\n${problems.map((problem, index) => `${index + 1}. ${problem.field}: ${problem.problem}. ${problem.hint}`).join("\n")}\nFor the complete template and example, call arch_describe with type="${type}".`;
}

export function validationGuidelines(type: CollectionType): string[] {
  const definition = collectionDefinitions[type];
  return [
    "Use a concise title and a one-sentence summary under 160 characters; the summary is the main discovery signal in list responses.",
    ...Object.entries(definition.sections).filter(([, rule]) => rule.required).map(([heading, rule]) => `sections.${heading}: ${rule.description}`),
    ...(definition.diagram === "required" ? ["diagram: required Mermaid source without a code fence; pair it with explanatory prose."] : []),
    "Content belongs in the body sections, not in frontmatter. Frontmatter is reserved for lightweight discovery and filter metadata.",
  ];
}

export function normalizeDiagram(source: string): string {
  return unfenceMermaid(source).trim();
}

function validateUnknownKeys(path: string, value: ContentMap, allowed: Record<string, unknown>, put: (field: string, problem: string, hint: string) => void, allowCustom = false): void {
  for (const key of Object.keys(value)) {
    if (allowed[key] || allowCustom) continue;
    const closest = Object.keys(allowed).map((candidate) => [candidate, editDistance(key.toLowerCase(), candidate.toLowerCase())] as const).sort((a, b) => a[1] - b[1])[0];
    const suggestion = closest && closest[1] <= Math.max(2, Math.floor(key.length / 3)) ? ` Did you mean '${closest[0]}'?` : "";
    put(`${path}.${key}`, "is not recognized", `Remove it or use a documented field.${suggestion}`);
  }
}

function validateScenarios(value: unknown, put: (field: string, problem: string, hint: string) => void, warnings: string[]): void {
  if (!Array.isArray(value)) {
    put("sections.Scenarios", "must be an array", "Supply scenario objects with id, title, stimulus, response, measure, and priority. An empty array is allowed for a planned quality page.");
    return;
  }
  const ids = new Set<string>();
  value.forEach((item, index) => {
    const scenario = item as Record<string, unknown>;
    const base = `sections.Scenarios[${index}]`;
    for (const key of ["id", "title", "stimulus", "response", "measure"]) {
      if (typeof scenario?.[key] !== "string" || !String(scenario[key]).trim()) put(`${base}.${key}`, "is required", `Provide non-empty ${key} text.`);
      else if (containsPlaceholder(String(scenario[key]))) put(`${base}.${key}`, "contains a placeholder", "Replace TBD, TODO, or PLACEHOLDER with a concrete statement.");
      else if (String(scenario[key]).includes("\n")) put(`${base}.${key}`, "must be one line for table rendering", "Keep this table cell on one line.");
    }
    if (typeof scenario?.measure === "string" && !/(\d|unchanged|equal|less than|greater than|within|at least|at most|returns|rejected|contains|no\s)/i.test(scenario.measure)) {
      warnings.push(`${base}.measure should state an observable outcome or threshold, such as 'under 200 ms', 'file bytes unchanged', or 'a conflict is returned'`);
    }
    if (typeof scenario?.id === "string") {
      if (ids.has(scenario.id)) put(`${base}.id`, `duplicates scenario ID '${scenario.id}'`, "Scenario IDs must be unique within the quality page.");
      ids.add(scenario.id);
    }
    if (!["low", "medium", "high", "critical"].includes(String(scenario?.priority))) put(`${base}.priority`, "must be low, medium, high, or critical", "Choose one of the supported priority values.");
  });
}

function validateAdrSections(fields: ContentMap, sections: ContentMap, put: (field: string, problem: string, hint: string) => void): void {
  const status = String(fields.status ?? "proposed");
  const problem = String(sections["The Problem"] ?? "").trim();
  if (problem && (problem.match(/[.!?](?:\s|$)/g) ?? []).length > 1) put("sections.The Problem", "must be one sentence", "Use one concise sentence stating the problem.");
  const options = String(sections["Options Considered"] ?? "").split(/\r?\n/).filter((line) => /^\s*[-*+]\s+/.test(line));
  if (options.length < 2) put("sections.Options Considered", "must list at least two options", "Use Markdown bullets, for example '- SQLite' and '- **PostgreSQL**'.");
  const selected = options.filter((line) => /^\s*[-*+]\s+\*\*.+\*\*/.test(line)).length;
  if (status === "rejected" ? selected !== 0 : selected !== 1) put("sections.Options Considered", status === "rejected" ? "must not mark an option as selected for a rejected ADR" : "must mark exactly one option in bold", "Wrap the selected option name in exactly one pair of ** markers.");
}

function containsPlaceholder(value: string): boolean { return /\b(TBD|TODO|PLACEHOLDER)\b/i.test(value); }

function hasUnfencedH2(value: string): boolean {
  let inFence = false;
  for (const line of value.split(/\r?\n/)) {
    if (/^\s*```/.test(line)) { inFence = !inFence; continue; }
    if (!inFence && /^##\s/.test(line)) return true;
  }
  return false;
}

function unfenceMermaid(value: string): string {
  return value.trim().replace(/^```(?:mermaid)?\s*\r?\n/i, "").replace(/\r?\n```\s*$/, "");
}

function editDistance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i++) {
    let previous = row[0]!;
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const current = row[j]!;
      row[j] = Math.min(row[j]! + 1, row[j - 1]! + 1, previous + Number(a[i - 1] !== b[j - 1]));
      previous = current;
    }
  }
  return row[b.length]!;
}
