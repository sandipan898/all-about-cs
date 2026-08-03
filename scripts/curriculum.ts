/**
 * Curriculum manager — keeps `content/curriculum.json` honest and AI-refreshable.
 *
 * This is the missing "research" step: curriculum.json is no longer a hand-typed
 * seed. Three modes:
 *
 *   --audit   (default) Reconcile the curriculum with the files on disk:
 *             list tutorials missing from the curriculum, planned-but-unwritten
 *             topics, and objective slug-quality issues. Deterministic, free.
 *
 *   --prompt  Emit an ELITE, self-contained research brief (to
 *             automation-output/curriculum-brief.md) embedding the live
 *             inventory + rules. Paste it into ANY AI chat to get a researched,
 *             SEO-optimised curriculum back as JSON. Free — uses your agent.
 *
 *   --apply <file>  Validate an AI-produced curriculum JSON and write it to
 *             curriculum.json. Refuses to drop/rename an existing PUBLISHED slug
 *             unless --allow-slug-changes is passed (protects live URLs / SEO).
 *
 * Usage:
 *   npm run auto -- curriculum
 *   npm run auto -- curriculum --prompt
 *   npm run auto -- curriculum --apply automation-output/curriculum.candidate.json
 */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { discoverTutorials, publishedSlugs, type Tutorial } from "./lib/content";
import { log, writeStepSummary } from "./lib/log";

const CURRICULUM_PATH = path.join(process.cwd(), "content", "curriculum.json");

interface PlannedItem {
  slug: string;
  title: string;
  /** SEO metadata the AI planner writes so `next-topic --by=opportunity` can rank. */
  keyword?: string;
  intent?: "informational" | "how-to" | "comparison" | "reference" | string;
  opportunity?: "high" | "medium" | "low";
}
interface Pillar {
  label: string;
  priority: "anchor" | "spoke";
  planned: PlannedItem[];
}
interface Curriculum {
  _meta?: unknown;
  anchor: string;
  pillars: Record<string, Pillar>;
}

function loadCurriculum(): Curriculum {
  return JSON.parse(fs.readFileSync(CURRICULUM_PATH, "utf-8")) as Curriculum;
}

/** Objective, non-destructive slug-quality checks (advisory only). */
function slugIssues(slug: string): string[] {
  const issues: string[] = [];
  if (/_/.test(slug)) issues.push("uses underscores (Google prefers hyphens)");
  if (/[A-Z]/.test(slug)) issues.push("has uppercase letters");
  if (!/^[a-z0-9-]+$/.test(slug)) issues.push("has non-URL-safe characters");
  if (slug.split("-").length > 7) issues.push("very long (>7 words)");
  return issues;
}

// ── Mode: audit ────────────────────────────────────────────────────
export function runAudit(): number {
  const curriculum = loadCurriculum();
  const tutorials = discoverTutorials();
  const published = publishedSlugs(tutorials);
  const filesByCategory = new Map<string, Tutorial[]>();
  for (const t of tutorials) {
    filesByCategory.set(t.category, [...(filesByCategory.get(t.category) ?? []), t]);
  }

  const lines: string[] = [];
  let orphanCount = 0;

  for (const [key, pillar] of Object.entries(curriculum.pillars)) {
    const plannedSlugs = new Set(pillar.planned.map((p) => p.slug));
    const files = filesByCategory.get(key) ?? [];

    // Files on disk missing from the curriculum.
    const orphans = files.filter((f) => !plannedSlugs.has(f.slug));
    orphanCount += orphans.length;

    // Curriculum entries with no file yet (future work).
    const future = pillar.planned.filter((p) => !published.has(p.slug));

    // Slug quality across planned items.
    const flagged = pillar.planned
      .map((p) => ({ slug: p.slug, issues: slugIssues(p.slug) }))
      .filter((x) => x.issues.length > 0);

    lines.push(`\n### ${pillar.label} (${key})`);
    lines.push(
      `- Files on disk: ${files.length} · Planned: ${pillar.planned.length} · Published: ${
        files.filter((f) => f.frontmatter.published !== false).length
      }`
    );
    lines.push(
      orphans.length
        ? `- ⚠️ On disk but NOT in curriculum (${orphans.length}): ${orphans
            .map((o) => `\`${o.slug}\``)
            .join(", ")}`
        : `- ✅ Every file is represented in the curriculum.`
    );
    lines.push(
      future.length
        ? `- 📝 Planned (no file yet, ${future.length}): ${future
            .map((f) => `\`${f.slug}\``)
            .join(", ")}`
        : `- ✅ No pending planned topics.`
    );
    if (flagged.length) {
      lines.push(`- 🔧 Slug-quality flags (fix WITH a 301 redirect if already live):`);
      for (const f of flagged) lines.push(`    - \`${f.slug}\` — ${f.issues.join("; ")}`);
    }

    // SEO-metadata coverage (keyword + opportunity written by the planner).
    const withMeta = pillar.planned.filter((p) => p.opportunity || p.keyword).length;
    lines.push(
      withMeta === pillar.planned.length
        ? `- 🎯 SEO metadata: all ${pillar.planned.length} items carry keyword/opportunity.`
        : `- 🎯 SEO metadata: ${withMeta}/${pillar.planned.length} items scored — run \`--prompt\` to enrich the rest.`
    );
  }

  const report = `## Curriculum audit\n${lines.join("\n")}\n`;
  log.info(report);
  writeStepSummary(report);
  if (orphanCount > 0) {
    log.warn(
      `${orphanCount} tutorial file(s) are not in the curriculum. Run \`--prompt\` and refresh it.`
    );
  } else {
    log.success("Curriculum is in sync with the content folder.");
  }
  return 0;
}

// ── Compact SEO-signals summary for AI prompt ─────────────────────
// Keeps prompt focused: top 10 queries, 5 low-CTR, 5 gaps + CWV scores.
// Much shorter than the raw JSON; more useful for the AI.
function summarizeSignalsForPrompt(raw: string): string {
  try {
    const s = JSON.parse(raw) as {
      generated?: string;
      gsc?: {
        period?: string;
        topQueries?: { query?: string; impressions?: number; ctr?: number; position?: number }[];
        lowCtrOpportunities?: { query?: string; impressions?: number; ctr?: number; position?: number }[];
        contentGaps?: { query?: string; impressions?: number }[];
      } | null;
      cwv?: {
        pages?: { url?: string; lab?: { performanceScore?: number; lcp_ms?: number }; alerts?: string[] }[];
      } | null;
    };
    const lines: string[] = [`_Data as of ${(s.generated ?? "").slice(0, 10)}_`];
    if (s.gsc) {
      const { period, topQueries = [], lowCtrOpportunities = [], contentGaps = [] } = s.gsc;
      if (period) lines.push(`\nPeriod: ${period}`);
      if (topQueries.length) {
        lines.push("\n**Top queries by impressions (signal: high demand = write about this):**");
        topQueries.slice(0, 10).forEach((q) =>
          lines.push(`- "${q.query}" — ${q.impressions} imp · ${((q.ctr ?? 0) * 100).toFixed(1)}% CTR · pos ${(q.position ?? 0).toFixed(1)}`)
        );
      }
      if (lowCtrOpportunities.length) {
        lines.push("\n**Low-CTR opportunities (page ranks but title/meta needs improving):**");
        lowCtrOpportunities.slice(0, 5).forEach((q) =>
          lines.push(`- "${q.query}" — ${q.impressions} imp · ${((q.ctr ?? 0) * 100).toFixed(1)}% CTR`)
        );
      }
      if (contentGaps.length) {
        lines.push("\n**Content gaps (impressions, 0 clicks — missing tutorials for these searches):**");
        contentGaps.slice(0, 5).forEach((g) =>
          lines.push(`- "${g.query}" — ${g.impressions} impressions`)
        );
      }
    }
    if (s.cwv?.pages?.length) {
      lines.push("\n**Core Web Vitals (lab, mobile):**");
      s.cwv.pages.forEach((p) => {
        const score = p.lab?.performanceScore !== undefined ? Math.round(p.lab.performanceScore * 100) : "—";
        const flag = (p.alerts?.length ?? 0) > 0 ? ` ⚠️ ${p.alerts![0]}` : " ✅";
        lines.push(`- ${p.url}: score ${score}${flag}`);
      });
    }
    return lines.join("\n");
  } catch {
    return raw.slice(0, 1500); // fallback truncated
  }
}

// ── Mode: prompt (the elite AI research brief) ─────────────────────
export function buildPrompt(): string {
  const curriculum = loadCurriculum();
  const tutorials = discoverTutorials();
  const inventory = Object.entries(curriculum.pillars)
    .map(([key, pillar]) => {
      const existing = tutorials
        .filter((t) => t.category === key && t.frontmatter.published !== false)
        .map((t) => `- \`${t.slug}\` — ${t.frontmatter.title ?? ""}`)
        .join("\n");
      return `#### Pillar: ${pillar.label} (\`${key}\`, ${pillar.priority})\nAlready published:\n${existing || "- (none)"}`;
    })
    .join("\n\n");

  // Optionally embed real SEO signals if a prior step dropped them (e.g. a GSC
  // export at automation-output/seo-signals.json). Compact human-readable summary
  // keeps the AI grounded in YOUR actual search demand instead of guessed numbers
  // while staying within reasonable prompt length.
  const signalsPath = path.join(process.cwd(), "automation-output", "seo-signals.json");
  const signalsSummary = fs.existsSync(signalsPath)
    ? summarizeSignalsForPrompt(fs.readFileSync(signalsPath, "utf-8"))
    : "";

  return `# Curriculum research brief — All About CS

You are a **senior CS-education content strategist and technical SEO expert**.
Design a complete, gap-free learning curriculum for the site **All About CS**
(https://allaboutcs.dev), a free dual-mode (read/watch) tutorial platform.

## Mission
Produce a JSON curriculum that (1) covers each pillar end-to-end in the correct
pedagogical order, (2) fills real market/skill gaps informed by **live keyword
demand and current trends**, and (3) uses SEO-optimised, search-intent-matched
slugs. Every topic must be **ranked by opportunity** so writing can follow ROI.

## Research method (do this before proposing topics)
1. **Keyword & demand research** — for each candidate topic, identify the primary
   keyword learners actually search and its relative demand. If you have live
   web/search tools, USE them. If a "Real SEO signals" section appears below,
   treat it as the highest-authority source (it is this site's own Search Console
   data). **Do NOT invent precise search-volume numbers** — if you lack real
   data, give a qualitative \`opportunity\` rating and say so.
2. **Trend analysis** — factor current momentum (new language/runtime features,
   framework shifts, seasonal interview cycles). Prefer durable topics over fads.
3. **Search intent** — classify each topic (informational / how-to / comparison /
   reference) so the content format matches what ranks.
4. **Competition & gap** — favour topics where a focused, runnable tutorial can
   realistically rank, and that fill a hole in the current inventory.
5. **Pedagogical ordering** — keep prerequisites before advanced topics; never
   sacrifice a sane learning path just to chase a high-volume keyword. Use
   \`opportunity\` for prioritisation WITHIN a sensible order.

## Hard constraints (do not violate)
1. **URLs are FLAT**: every tutorial lives at \`/tutorials/<slug>\` — there is NO
   \`/topics/<pillar>/\` path segment. Therefore each slug MUST carry its own
   topic keyword (e.g. \`python-...\`) so the keyword appears in the URL.
2. **Never rename an existing PUBLISHED slug** (listed below) — those URLs are
   indexed. If you believe a rename is worth it, list it separately under
   \`"proposedRenames"\` with \`{ from, to, reason }\` and a note that a 301
   redirect is required. Do NOT change it inside \`planned\`.
3. Slugs: \`[a-z0-9-]\` kebab-case only, ≤ ~6 words, no stop-word padding,
   match how learners actually search (e.g. \`python-list-comprehension\` not
   \`understanding-the-concept-of-list-comprehension\`).
4. Strategy = **depth-first topical authority**: finish the anchor pillar
   (\`${curriculum.anchor}\`) before widening spokes.

## Output format (return ONLY this JSON, no prose)
Every planned item MUST include \`keyword\`, \`intent\`, and \`opportunity\`.
\`\`\`json
{
  "anchor": "${curriculum.anchor}",
  "pillars": {
    "<pillarKey>": {
      "label": "<display name>",
      "priority": "anchor" | "spoke",
      "planned": [
        {
          "slug": "<seo-slug>",
          "title": "<clear title>",
          "keyword": "<primary search keyword>",
          "intent": "informational" | "how-to" | "comparison" | "reference",
          "opportunity": "high" | "medium" | "low"
        }
      ]
    }
  },
  "proposedRenames": [ { "from": "", "to": "", "reason": "" } ]
}
\`\`\`

## Current inventory (ground truth — preserve these published slugs)
${inventory}
${signalsSummary ? `\n## Real SEO signals (your Search Console data — authoritative source)\n${signalsSummary}\n` : ""}
## Task
- Keep every published slug above (add \`keyword\`/\`intent\`/\`opportunity\` for each).
- Add the missing intermediate/advanced topics a learner needs to go from zero to
  job-ready in each pillar, plus trending topics you can justify with the research.
- For NEW topics, invent the best SEO slug per the rules above.
- Order each \`planned\` array so prerequisites come first; set \`opportunity\` so
  \`next-topic --by=opportunity\` surfaces the highest-ROI gap.
- Return the JSON only.`;
}

export function runPrompt(): number {
  const prompt = buildPrompt();
  const outDir = path.join(process.cwd(), "automation-output");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, "curriculum-brief.md");
  fs.writeFileSync(outFile, prompt, "utf-8");
  log.info(prompt);
  log.success(
    "Wrote automation-output/curriculum-brief.md — paste it into any AI chat, then " +
      "save the JSON reply and run: npm run auto -- curriculum --apply <file>"
  );
  return 0;
}

// ── Mode: apply ────────────────────────────────────────────────────
export function runApply(argv: string[]): number {
  const file = argv.find((a) => !a.startsWith("--"));
  const allowSlugChanges = argv.includes("--allow-slug-changes");
  if (!file) {
    log.error("Usage: curriculum --apply <path-to-candidate.json> [--allow-slug-changes]");
    return 2;
  }
  if (!fs.existsSync(file)) {
    log.error(`Candidate file not found: ${file}`);
    return 2;
  }

  let candidate: Curriculum;
  try {
    candidate = JSON.parse(fs.readFileSync(file, "utf-8")) as Curriculum;
  } catch (err) {
    log.error(`Candidate is not valid JSON: ${(err as Error).message}`);
    return 1;
  }

  // Schema checks.
  if (typeof candidate.anchor !== "string" || typeof candidate.pillars !== "object") {
    log.error("Candidate missing required `anchor` (string) or `pillars` (object).");
    return 1;
  }
  const seen = new Set<string>();
  for (const [key, pillar] of Object.entries(candidate.pillars)) {
    if (!Array.isArray(pillar.planned)) {
      log.error(`Pillar "${key}" has no planned[] array.`);
      return 1;
    }
    for (const item of pillar.planned) {
      if (!item.slug || !item.title) {
        log.error(`Pillar "${key}" has an item missing slug/title.`);
        return 1;
      }
      if (!/^[a-z0-9-]+$/.test(item.slug) && !/^[a-z0-9_-]+$/.test(item.slug)) {
        log.error(`Invalid slug "${item.slug}" in pillar "${key}".`);
        return 1;
      }
      if (
        item.opportunity !== undefined &&
        !["high", "medium", "low"].includes(item.opportunity)
      ) {
        log.error(
          `Invalid opportunity "${item.opportunity}" for "${item.slug}" (use high|medium|low).`
        );
        return 1;
      }
      if (seen.has(item.slug)) {
        log.error(`Duplicate slug "${item.slug}" in candidate.`);
        return 1;
      }
      seen.add(item.slug);
    }
  }

  // SEO safety: no published slug may silently disappear.
  const published = publishedSlugs(discoverTutorials());
  const missing = [...published].filter((s) => !seen.has(s));
  if (missing.length > 0 && !allowSlugChanges) {
    log.error(
      `Refusing to apply: ${missing.length} published slug(s) would be dropped/renamed ` +
        `(${missing.map((s) => `"${s}"`).join(", ")}). ` +
        `Add them back, or pass --allow-slug-changes AND set up 301 redirects.`
    );
    return 1;
  }

  fs.writeFileSync(CURRICULUM_PATH, `${JSON.stringify(candidate, null, 2)}\n`, "utf-8");
  log.success(`Applied new curriculum → content/curriculum.json (${seen.size} topics).`);
  return 0;
}

export function runCurriculum(argv: string[] = []): number {
  if (argv.includes("--prompt")) return runPrompt();
  if (argv.includes("--apply")) return runApply(argv.filter((a) => a !== "--apply"));
  return runAudit();
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(runCurriculum(process.argv.slice(2)));
}
