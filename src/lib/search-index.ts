import { getTutorialSlugs, getTutorialBySlug } from "./mdx";

export interface SearchEntry {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  headings: string[];
  body: string;
  category: "tutorial";
}

/**
 * Strips markdown/JSX from raw MDX content to plain text for indexing.
 */
function stripMarkdown(raw: string): string {
  let text = raw;

  // Remove frontmatter (already parsed separately)
  text = text.replace(/^---[\s\S]*?---\s*/m, "");

  // Remove code fences and their content
  text = text.replace(/```[\s\S]*?```/g, "");

  // Remove inline code
  text = text.replace(/`[^`]+`/g, "");

  // Remove JSX/MDX components (self-closing and with children)
  text = text.replace(/<[A-Za-z][A-Za-z0-9]*\s*[^/>]*\/>/g, "");
  text = text.replace(/<[A-Za-z][A-Za-z0-9]*\s*[^>]*>[\s\S]*?<\/[A-Za-z][A-Za-z0-9]*>/g, "");

  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, "");

  // Remove markdown headers but keep the text (## Heading -> Heading)
  text = text.replace(/^#{1,6}\s+/gm, "");

  // Remove bold/italic
  text = text.replace(/\*\*([^*]+)\*\*/g, "$1");
  text = text.replace(/\*([^*]+)\*/g, "$1");
  text = text.replace(/__([^_]+)__/g, "$1");
  text = text.replace(/_([^_]+)_/g, "$1");

  // Remove links but keep link text [text](url) -> text
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  // Remove blockquote markers
  text = text.replace(/^>\s+/gm, "");

  // Remove list markers
  text = text.replace(/^[\s]*[-*+]\s+/gm, "");
  text = text.replace(/^[\s]*\d+\.\s+/gm, "");

  // Collapse whitespace and trim
  text = text.replace(/\s+/g, " ").trim();

  return text;
}

/**
 * Extracts ## and ### headings from raw MDX content.
 */
function extractHeadings(raw: string): string[] {
  const headings: string[] = [];
  const regex = /^#{2,3}\s+(.+)$/gm;
  let match;
  while ((match = regex.exec(raw)) !== null) {
    const heading = match[1].replace(/\*+|\`+/g, "").trim();
    if (heading) headings.push(heading);
  }
  return headings;
}

/**
 * Builds the search index from all published MDX tutorials.
 * Used at build time to generate public/search-index.json.
 */
export function generateSearchIndex(): SearchEntry[] {
  const slugs = getTutorialSlugs();
  const entries: SearchEntry[] = [];

  for (const slug of slugs) {
    const tutorial = getTutorialBySlug(slug);
    if (!tutorial) continue;

    const { frontmatter, content } = tutorial;

    if (process.env.NODE_ENV === "production" && frontmatter.published === false) {
      continue;
    }

    entries.push({
      slug,
      title: frontmatter.title,
      description: frontmatter.description,
      tags: frontmatter.tags ?? [],
      headings: extractHeadings(content),
      body: stripMarkdown(content),
      category: "tutorial",
    });
  }

  return entries;
}
