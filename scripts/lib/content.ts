/**
 * Standalone content reader for automation scripts.
 *
 * Deliberately independent of `src/lib/mdx.ts` so the CLI never pulls in Next.js
 * runtime code. Reads every `content/tutorials/**\/*.mdx`, parses frontmatter
 * with gray-matter, and exposes helpers for validation and topic planning.
 */
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export const CONTENT_DIR = path.join(process.cwd(), "content", "tutorials");

/** YouTube IDs that are known placeholders and must never ship on a published page. */
export const PLACEHOLDER_YOUTUBE_IDS = ["dQw4w9WgXcQ"];

export interface TutorialFrontmatter {
  title?: string;
  description?: string;
  date?: string;
  youtubeId?: string;
  tags?: string[];
  author?: string;
  published?: boolean;
  playground?: boolean;
}

export interface Tutorial {
  slug: string;
  category: string;
  filePath: string;
  /** Path relative to the repo root, POSIX-style, for annotations. */
  relPath: string;
  raw: string;
  frontmatter: TutorialFrontmatter;
  content: string;
}

export interface SeriesRef {
  seriesName: string;
  currentPart: number;
  totalParts: number;
  slugs: string[];
}

/** Recursively read and parse every tutorial MDX file. */
export function discoverTutorials(): Tutorial[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  const out: Tutorial[] = [];

  function scan(dir: string, category: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scan(full, entry.name);
      } else if (entry.name.endsWith(".mdx")) {
        const raw = fs.readFileSync(full, "utf-8");
        const { data, content } = matter(raw);
        out.push({
          slug: entry.name.replace(/\.mdx$/, ""),
          category,
          filePath: full,
          relPath: path.relative(process.cwd(), full).split(path.sep).join("/"),
          raw,
          frontmatter: data as TutorialFrontmatter,
          content,
        });
      }
    }
  }

  scan(CONTENT_DIR, "general");
  return out;
}

/** Slugs that are published (published !== false). */
export function publishedSlugs(tutorials: Tutorial[]): Set<string> {
  return new Set(
    tutorials.filter((t) => t.frontmatter.published !== false).map((t) => t.slug)
  );
}

/** Extract every `<SeriesNavigation ... />` reference found in a tutorial body. */
export function extractSeries(content: string): SeriesRef[] {
  const refs: SeriesRef[] = [];
  const tagRe = /<SeriesNavigation\b([^>]*)\/>/g;
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(content)) !== null) {
    const attrs = m[1];
    const get = (name: string) =>
      new RegExp(`${name}="([^"]*)"`).exec(attrs)?.[1] ?? "";
    const slugs = get("slugs")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    refs.push({
      seriesName: get("seriesName"),
      currentPart: Number(get("currentPart")) || 0,
      totalParts: Number(get("totalParts")) || slugs.length,
      slugs,
    });
  }
  return refs;
}

/** Extract internal `/tutorials/<slug>` links referenced in Markdown/MDX body. */
export function extractTutorialLinks(content: string): string[] {
  const links = new Set<string>();
  const re = /\]\(\/tutorials\/([a-z0-9-]+)\)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    links.add(m[1]);
  }
  return [...links];
}
