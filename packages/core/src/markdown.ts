import { createHash, randomUUID } from "node:crypto";
import { readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { stringify, parse } from "yaml";

export interface MarkdownDocument {
  frontmatter: Record<string, unknown>;
  body: string;
}

export function parseMarkdownDocument(content: string): MarkdownDocument {
  const normalized = content.replace(/^\uFEFF/, "");
  const match = normalized.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)([\s\S]*)$/);
  if (!match) throw new Error("Document must start with a YAML frontmatter block delimited by ---");
  const value = parse(match[1] ?? "");
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Frontmatter must be a YAML mapping");
  }
  return { frontmatter: value as Record<string, unknown>, body: match[2] ?? "" };
}

export function renderMarkdownDocument(frontmatter: Record<string, unknown>, body: string): string {
  const yaml = stringify(frontmatter, { lineWidth: 0, sortMapEntries: false }).trimEnd();
  return `---\n${yaml}\n---\n\n${body.replace(/^\n+/, "").replace(/\s*$/, "\n")}`;
}

export function contentHash(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

export async function readMarkdownDocument(path: string): Promise<MarkdownDocument & { hash: string; raw: string }> {
  const raw = await readFile(path, "utf8");
  return { ...parseMarkdownDocument(raw), hash: contentHash(raw), raw };
}

const writeLocks = new Map<string, Promise<void>>();

export async function writeMarkdownDocument(
  path: string,
  document: MarkdownDocument,
  expectedHash?: string | null,
): Promise<string> {
  const previous = writeLocks.get(path) ?? Promise.resolve();
  let release!: () => void;
  const currentLock = new Promise<void>((resolve) => { release = resolve; });
  const queued = previous.then(() => currentLock);
  writeLocks.set(path, queued);
  await previous;
  try {
    return await writeMarkdownDocumentUnlocked(path, document, expectedHash);
  } finally {
    release();
    if (writeLocks.get(path) === queued) writeLocks.delete(path);
  }
}

async function writeMarkdownDocumentUnlocked(
  path: string,
  document: MarkdownDocument,
  expectedHash?: string | null,
): Promise<string> {
  const { readFile: read } = await import("node:fs/promises");
  let current: string | undefined;
  try {
    current = await read(path, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  if (expectedHash === null && current !== undefined) throw new Error("Document already exists");
  if (typeof expectedHash === "string" && (!current || contentHash(current) !== expectedHash)) {
    throw new Error("Document has changed since it was read; read it again before editing");
  }
  const rendered = renderMarkdownDocument(document.frontmatter, document.body);
  const temporary = join(dirname(path), `.${randomUUID()}.tmp`);
  await writeFile(temporary, rendered, { encoding: "utf8", flag: "wx" });
  await rename(temporary, path);
  return contentHash(rendered);
}
