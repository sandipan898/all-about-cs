/**
 * Social promo draft generator.
 *
 * Given a tutorial (a `--slug=...` or, by default, the most recent published one)
 * produces platform-tuned promo drafts. Output is **draft-for-review** — printed
 * to stdout and written to `automation-output/social-<slug>.md`. Nothing is
 * auto-posted; wiring a scheduler (Buffer/Typefully) is a later, opt-in step.
 *
 * Usage:
 *   tsx scripts/social.ts                 # latest published tutorial
 *   tsx scripts/social.ts --slug=python-loops
 */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { discoverTutorials, type Tutorial } from "./lib/content";
import { log, writeStepSummary } from "./lib/log";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://allaboutcs.dev";

interface PlatformProfile {
  id: string;
  label: string;
  render: (t: Tutorial, url: string) => string;
}

function tags(t: Tutorial, max: number, prefix = "#"): string {
  return (t.frontmatter.tags ?? [])
    .slice(0, max)
    .map((tag) => `${prefix}${tag.replace(/[^a-z0-9]/gi, "")}`)
    .join(" ");
}

const PROFILES: PlatformProfile[] = [
  {
    id: "x",
    label: "X / Twitter",
    render: (t, url) =>
      `${t.frontmatter.title} 🧵\n\n${(t.frontmatter.description ?? "").slice(0, 180)}\n\nRead or watch → ${url}\n\n${tags(t, 3)}`,
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    render: (t, url) =>
      `${t.frontmatter.title}\n\n${t.frontmatter.description ?? ""}\n\n` +
      `On All About CS you can read it as an article or watch the video — switch anytime, no signup.\n\n` +
      `👉 ${url}\n\n${tags(t, 5)}`,
  },
  {
    id: "reddit",
    label: "Reddit (value-first, low-promo)",
    render: (t, url) =>
      `**${t.frontmatter.title}**\n\n${t.frontmatter.description ?? ""}\n\n` +
      `I put together a walkthrough with runnable examples. Happy to answer questions in the comments.\n\n` +
      `Link (free, no signup): ${url}`,
  },
  {
    id: "devto",
    label: "Dev.to / Hashnode (canonical cross-post)",
    render: (t, url) =>
      `> Canonical: ${url}\n\n# ${t.frontmatter.title}\n\n${t.frontmatter.description ?? ""}\n\n` +
      `_Set \`canonical_url\` to the link above so SEO credit flows back to allaboutcs.dev._\n\n${tags(t, 4)}`,
  },
  {
    id: "newsletter",
    label: "Newsletter blurb",
    render: (t, url) =>
      `### ${t.frontmatter.title}\n${t.frontmatter.description ?? ""}\n[Read or watch →](${url})`,
  },
];

export function generateSocial(slug?: string): { tutorial: Tutorial; markdown: string } | null {
  const published = discoverTutorials()
    .filter((t) => t.frontmatter.published !== false)
    .sort(
      (a, b) =>
        new Date(b.frontmatter.date ?? 0).getTime() -
        new Date(a.frontmatter.date ?? 0).getTime()
    );
  if (published.length === 0) return null;

  const tutorial = slug ? published.find((t) => t.slug === slug) : published[0];
  if (!tutorial) return null;

  const url = `${SITE}/tutorials/${tutorial.slug}`;
  const blocks = PROFILES.map(
    (p) => `### ${p.label}\n\n\`\`\`\n${p.render(tutorial, url)}\n\`\`\`\n`
  );
  const markdown =
    `# Social drafts — ${tutorial.frontmatter.title}\n\n` +
    `> Source: ${url} · generated ${new Date().toISOString().slice(0, 10)} · **review before posting**\n\n` +
    blocks.join("\n");

  return { tutorial, markdown };
}

export function runSocial(argv: string[] = []): number {
  const slug = /--slug=([a-z0-9-]+)/.exec(argv.join(" "))?.[1];
  const result = generateSocial(slug);
  if (!result) {
    log.warn("No published tutorial found to promote.");
    return 0;
  }

  const outDir = path.join(process.cwd(), "automation-output");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `social-${result.tutorial.slug}.md`);
  fs.writeFileSync(outFile, result.markdown, "utf-8");

  log.info(result.markdown);
  log.success(`Wrote social drafts: automation-output/social-${result.tutorial.slug}.md`);
  writeStepSummary(result.markdown);
  return 0;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(runSocial(process.argv.slice(2)));
}
