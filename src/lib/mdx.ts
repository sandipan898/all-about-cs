import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const CONTENT_DIR = path.join(process.cwd(), "content", "tutorials");

export interface TutorialFrontmatter {
  title: string;
  description: string;
  date: string;
  youtubeId: string;
  tags?: string[];
  author?: string;
  published?: boolean;
}

export interface TutorialMeta extends TutorialFrontmatter {
  slug: string;
  category: string;
}

interface TutorialFile {
  slug: string;
  category: string;
  filePath: string;
}

let _cachedFiles: TutorialFile[] | null = null;

/**
 * Recursively discovers all .mdx files under content/tutorials.
 * Results are cached for the lifetime of the process (cleared on rebuild).
 */
function discoverTutorialFiles(): TutorialFile[] {
  if (_cachedFiles) return _cachedFiles;
  if (!fs.existsSync(CONTENT_DIR)) return [];

  const files: TutorialFile[] = [];

  function scan(dir: string, category: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        scan(path.join(dir, entry.name), entry.name);
      } else if (entry.name.endsWith(".mdx")) {
        files.push({
          slug: entry.name.replace(/\.mdx$/, ""),
          category,
          filePath: path.join(dir, entry.name),
        });
      }
    }
  }

  scan(CONTENT_DIR, "general");
  _cachedFiles = files;
  return files;
}

/**
 * Returns all .mdx file slugs from the content/tutorials directory tree.
 */
export function getTutorialSlugs(): string[] {
  return discoverTutorialFiles().map((f) => f.slug);
}

/**
 * Reads a single tutorial's raw source and parsed frontmatter by slug.
 * Searches across all category subdirectories.
 */
export function getTutorialBySlug(slug: string) {
  const file = discoverTutorialFiles().find((f) => f.slug === slug);
  if (!file) return null;

  const raw = fs.readFileSync(file.filePath, "utf-8");
  const { data, content } = matter(raw);

  return {
    frontmatter: data as TutorialFrontmatter,
    content,
    slug: file.slug,
    category: file.category,
  };
}

/**
 * Returns metadata for all tutorials, sorted newest-first.
 * Filters out unpublished tutorials in production.
 */
export function getAllTutorials(): TutorialMeta[] {
  const files = discoverTutorialFiles();

  const tutorials = files
    .map((file) => {
      const raw = fs.readFileSync(file.filePath, "utf-8");
      const { data } = matter(raw);
      const frontmatter = data as TutorialFrontmatter;

      if (process.env.NODE_ENV === "production" && frontmatter.published === false) {
        return null;
      }

      return { ...frontmatter, slug: file.slug, category: file.category };
    })
    .filter((t): t is TutorialMeta => t !== null);

  return tutorials.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

/**
 * Returns the set of unique categories that have at least one published tutorial.
 */
export function getCategories(): string[] {
  const tutorials = getAllTutorials();
  return [...new Set(tutorials.map((t) => t.category))].sort();
}
