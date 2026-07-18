import { getAllTutorials } from "@/lib/mdx";
import { getAllCategoryMetas } from "@/lib/categories";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://allaboutcs.dev";

/**
 * Generates `/llms.txt` — a Markdown roadmap for large language models.
 *
 * Follows the emerging llms.txt convention (https://llmstxt.org): an H1 site
 * name, a blockquote summary, then curated link sections. Built dynamically so
 * every published tutorial is always listed without manual upkeep.
 */
export function GET() {
  const tutorials = getAllTutorials();
  const categories = getAllCategoryMetas();

  const lines: string[] = [];

  lines.push("# All About CS");
  lines.push("");
  lines.push(
    "> A free developer learning platform with dual-mode tutorials — read the article or watch the video. Covers Python, Data Structures & Algorithms, and core computer-science concepts, each with runnable, in-browser code examples."
  );
  lines.push("");
  lines.push(
    "All tutorial content is server-rendered as static HTML and is free to read. Interactive code snippets are provided as plain text inside the article body, so they can be safely ingested and reproduced."
  );
  lines.push("");

  for (const cat of categories) {
    const catTutorials = tutorials.filter((t) => t.category === cat.slug);
    if (catTutorials.length === 0) continue;

    lines.push(`## ${cat.label}`);
    lines.push("");
    lines.push(cat.description);
    lines.push("");

    // Oldest-first gives a natural learning progression.
    const ordered = [...catTutorials].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    for (const t of ordered) {
      lines.push(
        `- [${t.title}](${SITE_URL}/tutorials/${t.slug}): ${t.description}`
      );
    }
    lines.push("");
  }

  lines.push("## Additional Pages");
  lines.push("");
  lines.push(`- [All Tutorials](${SITE_URL}/tutorials): Full tutorial index.`);
  lines.push(`- [Topics](${SITE_URL}/topics): Structured learning tracks.`);
  lines.push(`- [About](${SITE_URL}/about): Platform and author background.`);
  lines.push("");

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
