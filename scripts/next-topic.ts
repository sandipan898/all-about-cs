/**
 * Next-topic resolver — decides what to write next, deterministically.
 *
 * Priority (highest first):
 *   1. Explicit request      — `--topic="..."` (you override everything).
 *   2. Unfinished series     — a SeriesNavigation whose parts aren't all published.
 *   3. Curriculum gap        — next planned slug not yet published, anchor pillar first.
 *   4. Research fallback      — nothing pending; suggests opening the weekly digest.
 *
 * This resolver does NO AI/network work: all SEO/trend intelligence is baked into
 * `content/curriculum.json` by the (AI-driven) `curriculum.ts` planner. Here we
 * just consume it. `--by=opportunity` re-ranks the curriculum gaps by the
 * per-item `opportunity` score the planner wrote — still fully deterministic.
 *
 * Usage:
 *   tsx scripts/next-topic.ts
 *   tsx scripts/next-topic.ts --topic="python generators"
 *   tsx scripts/next-topic.ts --pillar=dsa
 *   tsx scripts/next-topic.ts --by=opportunity
 */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  discoverTutorials,
  extractSeries,
  publishedSlugs,
} from "./lib/content";
import { log, setOutput, writeStepSummary } from "./lib/log";

type Opportunity = "high" | "medium" | "low";

interface PlannedItem {
  slug: string;
  title: string;
  /** Optional SEO metadata written by the curriculum planner. */
  keyword?: string;
  intent?: string;
  opportunity?: Opportunity;
}
interface Pillar {
  label: string;
  priority: "anchor" | "spoke";
  planned: PlannedItem[];
}
interface Curriculum {
  anchor: string;
  pillars: Record<string, Pillar>;
}

/** Rank an opportunity label; missing/unknown sorts lowest. */
function oppRank(o?: string): number {
  switch ((o ?? "").toLowerCase()) {
    case "high":
      return 3;
    case "medium":
    case "med":
      return 2;
    case "low":
      return 1;
    default:
      return 0;
  }
}

export interface Suggestion {
  reason: "explicit" | "unfinished-series" | "curriculum-gap" | "research-fallback";
  pillar?: string;
  slug?: string;
  title: string;
  detail: string;
  keyword?: string;
  opportunity?: Opportunity;
}

function loadCurriculum(): Curriculum | null {
  const file = path.join(process.cwd(), "content", "curriculum.json");
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf-8")) as Curriculum;
}

export function resolveNextTopic(
  opts: { topic?: string; pillar?: string; by?: "opportunity" | "order" } = {}
): Suggestion {
  if (opts.topic) {
    return {
      reason: "explicit",
      title: opts.topic,
      detail: `Explicit request — drafting "${opts.topic}" (overrides the queue).`,
    };
  }

  const tutorials = discoverTutorials();
  const published = publishedSlugs(tutorials);

  // 2. Unfinished series.
  for (const t of tutorials) {
    for (const series of extractSeries(t.content)) {
      const missing = series.slugs.find((s) => !published.has(s));
      if (missing) {
        return {
          reason: "unfinished-series",
          slug: missing,
          title: `${series.seriesName} — next part (${missing})`,
          detail: `Finish the in-progress series "${series.seriesName}" before starting anything new.`,
        };
      }
    }
  }

  // 3. Curriculum gap (anchor pillar first, then spokes; honor --pillar).
  const curriculum = loadCurriculum();
  if (curriculum) {
    const order = Object.entries(curriculum.pillars).sort(([ka, a], [kb, b]) => {
      if (opts.pillar) {
        if (ka === opts.pillar) return -1;
        if (kb === opts.pillar) return 1;
      }
      if (ka === curriculum.anchor) return -1;
      if (kb === curriculum.anchor) return 1;
      return a.priority === "anchor" ? -1 : b.priority === "anchor" ? 1 : 0;
    });

    // Collect all unpublished planned items in pedagogical (pillar-priority) order.
    const gaps: { key: string; pillar: Pillar; item: PlannedItem }[] = [];
    for (const [key, pillar] of order) {
      for (const item of pillar.planned) {
        if (!published.has(item.slug)) gaps.push({ key, pillar, item });
      }
    }

    if (gaps.length > 0) {
      // Default = first pedagogical gap. --by=opportunity = highest baked-in score
      // (V8 sort is stable, so ties keep pedagogical order).
      const chosen =
        opts.by === "opportunity"
          ? [...gaps].sort((a, b) => oppRank(b.item.opportunity) - oppRank(a.item.opportunity))[0]
          : gaps[0];
      const opp = chosen.item.opportunity;
      return {
        reason: "curriculum-gap",
        pillar: chosen.key,
        slug: chosen.item.slug,
        title: chosen.item.title,
        keyword: chosen.item.keyword,
        opportunity: opp,
        detail:
          `Next gap in the "${chosen.pillar.label}" syllabus (${chosen.key})` +
          (opts.by === "opportunity" ? `, ranked by opportunity` : "") +
          (opp ? ` · opportunity: ${opp}` : "") +
          (chosen.item.keyword ? ` · target keyword: "${chosen.item.keyword}"` : "") +
          ".",
      };
    }
  }

  // 4. Nothing queued.
  return {
    reason: "research-fallback",
    title: "Open the weekly research digest",
    detail:
      "No unfinished series or curriculum gaps. Pick a keyword-driven topic from the latest report, or add items to content/curriculum.json.",
  };
}

export function runNextTopic(argv: string[] = []): number {
  const joined = argv.join(" ");
  const topic = /--topic=(.+)/.exec(joined)?.[1]?.replace(/^["']|["']$/g, "");
  const pillar = /--pillar=(\w+)/.exec(joined)?.[1];
  const by = /--by=(opportunity|order)/.exec(joined)?.[1] as "opportunity" | "order" | undefined;
  const s = resolveNextTopic({ topic, pillar, by });

  log.info(`\n▶️  Next topic (${s.reason}):`);
  log.success(s.title);
  log.info(`   ${s.detail}${s.slug ? `\n   slug: ${s.slug}` : ""}\n`);

  setOutput("reason", s.reason);
  setOutput("title", s.title);
  if (s.slug) setOutput("slug", s.slug);
  if (s.opportunity) setOutput("opportunity", s.opportunity);
  if (s.keyword) setOutput("keyword", s.keyword);

  writeStepSummary(
    `## Next topic\n\n- **${s.title}**\n- Reason: \`${s.reason}\`${
      s.pillar ? ` · Pillar: \`${s.pillar}\`` : ""
    }\n- ${s.detail}\n`
  );
  return 0;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(runNextTopic(process.argv.slice(2)));
}
