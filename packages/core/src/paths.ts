import { access, mkdir, readdir, realpath } from "node:fs/promises";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { chapters, type ChapterNumber } from "./types.js";

export function chapterForNumber(number: number) {
  const chapter = chapters.find((item) => item.number === number);
  if (!chapter) throw new Error(`Unknown arc42 chapter: ${number}`);
  return chapter;
}

export function slugify(value: string): string {
  const slug = value.normalize("NFKD").toLowerCase().replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  if (!slug) throw new Error("Title must contain at least one letter or number");
  return slug;
}

export async function ensureArchitectureLayout(root: string): Promise<void> {
  await mkdir(root, { recursive: true });
  await Promise.all(chapters.map(({ slug }) => mkdir(join(root, slug), { recursive: true })));
}

export async function resolveDocumentPath(root: string, chapter: ChapterNumber, slug: string): Promise<string> {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error("slug must contain lowercase letters, digits and hyphens only");
  const folder = chapterForNumber(chapter).slug;
  const rootReal = await realpath(root);
  const target = resolve(rootReal, folder, `${slug}.md`);
  const rel = relative(rootReal, target);
  if (rel.startsWith(`..${sep}`) || rel === ".." || resolve(rootReal, rel) !== target) throw new Error("Document path escapes architecture root");
  return target;
}

export async function resolveExistingDocument(root: string, id: string): Promise<string> {
  const match = id.match(/^(\d{2})\/(.+)$/);
  if (!match) throw new Error("Document id must have the form '08/slug' or '09/adr-0001-slug'");
  const chapter = Number(match[1]);
  const item = chapterForNumber(chapter);
  const slug = match[2]!;
  const path = await resolveDocumentPath(root, chapter as ChapterNumber, slug);
  const rootReal = await realpath(root);
  const actual = await realpath(path);
  const rel = relative(rootReal, actual);
  if (rel.startsWith(`..${sep}`) || rel === "..") throw new Error("Document path escapes architecture root");
  await access(actual);
  return actual;
}

export async function listMarkdownFiles(root: string, chapterNumber?: number): Promise<Array<{ path: string; relativePath: string; id: string; chapter: number }>> {
  const rootReal = await realpath(root);
  const selected = chapterNumber === undefined ? chapters : [chapterForNumber(chapterNumber)];
  const results: Array<{ path: string; relativePath: string; id: string; chapter: number }> = [];
  for (const chapter of selected) {
    const folder = join(rootReal, chapter.slug);
    let entries;
    try { entries = await readdir(folder, { withFileTypes: true }); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") continue;
      throw error;
    }
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
      const path = join(folder, entry.name);
      results.push({ path, relativePath: relative(rootReal, path).split(sep).join("/"), id: `${String(chapter.number).padStart(2, "0")}/${basename(entry.name, ".md")}`, chapter: chapter.number });
    }
  }
  return results.sort((a, b) => a.id.localeCompare(b.id));
}
