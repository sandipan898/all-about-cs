/**
 * Content validator — the blocking quality gate for tutorials.
 *
 * Rules (errors fail the build, warnings do not):
 *  - Required frontmatter present: title, description, date, youtubeId, tags.
 *  - `published` tutorials must NOT use a placeholder youtubeId (broken Watch Mode).
 *  - `date` must be a valid date.
 *  - Every `<SeriesNavigation slugs="a, b" />` slug must resolve to a real file.
 *  - Every internal `/tutorials/<slug>` link must resolve to a real file.
 *  - No duplicate slugs across categories.
 *
 * Usage: `tsx scripts/validate-content.ts`  (or `npm run validate`)
 * Exit code 1 when any error is found.
 */
import { pathToFileURL } from "node:url";
import {
  discoverTutorials,
  extractSeries,
  extractTutorialLinks,
  PLACEHOLDER_YOUTUBE_IDS,
  type Tutorial,
} from "./lib/content";
import { log, writeStepSummary } from "./lib/log";

interface Problem {
  level: "error" | "warning";
  file: string;
  message: string;
}

export function validateContent(): { errors: number; warnings: number; problems: Problem[] } {
  const tutorials = discoverTutorials();
  const problems: Problem[] = [];
  const allSlugs = new Set(tutorials.map((t) => t.slug));
  const seen = new Map<string, string>();

  const err = (file: string, message: string) =>
    problems.push({ level: "error", file, message });
  const warn = (file: string, message: string) =>
    problems.push({ level: "warning", file, message });

  const required: (keyof Tutorial["frontmatter"])[] = [
    "title",
    "description",
    "date",
    "youtubeId",
  ];

  for (const t of tutorials) {
    const fm = t.frontmatter;

    // Duplicate slug detection.
    if (seen.has(t.slug)) {
      err(t.relPath, `Duplicate slug "${t.slug}" (also in ${seen.get(t.slug)})`);
    } else {
      seen.set(t.slug, t.relPath);
    }

    // Required frontmatter.
    for (const key of required) {
      const value = fm[key];
      if (value === undefined || value === null || value === "") {
        err(t.relPath, `Missing required frontmatter: "${key}"`);
      }
    }
    if (!fm.tags || fm.tags.length === 0) {
      warn(t.relPath, `No "tags" — hurts SEO and topic clustering`);
    }
    if (!fm.description || fm.description.length < 50) {
      warn(t.relPath, `"description" is short (<50 chars) — weakens meta/SEO`);
    }

    // Valid date.
    if (fm.date && Number.isNaN(new Date(fm.date).getTime())) {
      err(t.relPath, `Invalid "date": ${fm.date}`);
    }

    // Placeholder video on a published tutorial => broken Watch Mode.
    const isPublished = fm.published !== false;
    if (isPublished && fm.youtubeId && PLACEHOLDER_YOUTUBE_IDS.includes(fm.youtubeId)) {
      err(
        t.relPath,
        `Published tutorial uses placeholder youtubeId "${fm.youtubeId}". ` +
          `Replace with a real video or set "published: false".`
      );
    }

    // Series references resolve.
    for (const series of extractSeries(t.content)) {
      for (const s of series.slugs) {
        if (!allSlugs.has(s)) {
          err(t.relPath, `SeriesNavigation references missing tutorial "${s}"`);
        }
      }
      if (series.slugs.length !== series.totalParts) {
        warn(
          t.relPath,
          `SeriesNavigation totalParts=${series.totalParts} but lists ${series.slugs.length} slugs`
        );
      }
    }

    // Internal links resolve.
    for (const link of extractTutorialLinks(t.content)) {
      if (!allSlugs.has(link)) {
        err(t.relPath, `Broken internal link: /tutorials/${link}`);
      }
    }
  }

  const errors = problems.filter((p) => p.level === "error").length;
  const warnings = problems.length - errors;
  return { errors, warnings, problems };
}

export function runValidate(): number {
  const { errors, warnings, problems } = validateContent();

  for (const p of problems) {
    const line = `${p.file}: ${p.message}`;
    if (p.level === "error") log.error(line);
    else log.warn(line);
  }

  const summary =
    `## Content validation\n\n` +
    `- Errors: **${errors}**\n- Warnings: **${warnings}**\n` +
    (problems.length
      ? `\n${problems
          .map((p) => `- ${p.level === "error" ? "❌" : "⚠️"} \`${p.file}\` — ${p.message}`)
          .join("\n")}\n`
      : `\nAll tutorials passed. ✅\n`);
  writeStepSummary(summary);

  if (errors > 0) {
    log.error(`Content validation failed: ${errors} error(s), ${warnings} warning(s).`);
    return 1;
  }
  log.success(`Content validation passed (${warnings} warning(s)).`);
  return 0;
}

// Run directly (not when imported by auto.ts / tests).
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(runValidate());
}
