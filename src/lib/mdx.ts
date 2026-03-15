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
}

/**
 * Returns all .mdx file slugs from the content/tutorials directory.
 */
export function getTutorialSlugs(): string[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];

  return fs
    .readdirSync(CONTENT_DIR)
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => file.replace(/\.mdx$/, ""));
}

/**
 * Reads a single tutorial's raw source and parsed frontmatter by slug.
 * Returns null if the file doesn't exist.
 */
export function getTutorialBySlug(slug: string) {
  const filePath = path.join(CONTENT_DIR, `${slug}.mdx`);

  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  return {
    frontmatter: data as TutorialFrontmatter,
    content,
    slug,
  };
}

/**
 * Returns metadata for all tutorials, sorted newest-first.
 * Filters out unpublished tutorials in production.
 */
export function getAllTutorials(): TutorialMeta[] {
  const slugs = getTutorialSlugs();

  const tutorials = slugs
    .map((slug) => {
      const tutorial = getTutorialBySlug(slug);
      if (!tutorial) return null;

      const { frontmatter } = tutorial;

      if (process.env.NODE_ENV === "production" && frontmatter.published === false) {
        return null;
      }

      return { ...frontmatter, slug };
    })
    .filter((t): t is TutorialMeta => t !== null);

  return tutorials.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}
