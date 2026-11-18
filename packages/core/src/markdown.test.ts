import { describe, expect, it } from "vitest";
import { contentHash, parseMarkdownDocument, renderMarkdownDocument } from "./markdown.js";

describe("markdown frontmatter", () => {
  it("round-trips frontmatter and markdown body deterministically", () => {
    const source = "---\ntitle: Example\ntags:\n  - one\n---\n\n# Body\n\nText.\n";
    const parsed = parseMarkdownDocument(source);
    expect(renderMarkdownDocument(parsed.frontmatter, parsed.body)).toBe(source);
  });

  it("rejects documents without a frontmatter mapping", () => {
    expect(() => parseMarkdownDocument("# No metadata\n" )).toThrow(/frontmatter/i);
    expect(() => parseMarkdownDocument("---\n- invalid\n---\nBody\n")).toThrow(/mapping/i);
  });

  it("uses a stable sha256 hash", () => {
    expect(contentHash("same")).toBe(contentHash("same"));
    expect(contentHash("same")).not.toBe(contentHash("different"));
  });
});
