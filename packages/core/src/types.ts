export const chapters = [
  { number: 1, slug: "01-introduction-and-goals", title: "Introduction and Goals" },
  { number: 2, slug: "02-architecture-constraints", title: "Architecture Constraints" },
  { number: 3, slug: "03-system-scope-and-context", title: "System Scope and Context" },
  { number: 4, slug: "04-solution-strategy", title: "Solution Strategy" },
  { number: 5, slug: "05-building-block-view", title: "Building Block View" },
  { number: 6, slug: "06-runtime-view", title: "Runtime View" },
  { number: 7, slug: "07-deployment-view", title: "Deployment View" },
  { number: 8, slug: "08-concepts", title: "Crosscutting Concepts" },
  { number: 9, slug: "09-architecture-decisions", title: "Architecture Decisions" },
  { number: 10, slug: "10-quality-requirements", title: "Quality Requirements" },
  { number: 11, slug: "11-risks-and-technical-debt", title: "Risks and Technical Debt" },
  { number: 12, slug: "12-glossary", title: "Glossary" },
] as const;

export type ChapterNumber = (typeof chapters)[number]["number"];

export interface ArchitectureRegistration {
  id: string;
  path: string;
  registeredAt: string;
}

export interface DocumentFile {
  path: string;
  relativePath: string;
  id: string;
  chapter: number;
  frontmatter: Record<string, unknown>;
  body: string;
  hash: string;
}
