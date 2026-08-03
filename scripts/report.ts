/**
 * Weekly digest / report generator.
 *
 * Always produces a content-derived digest (new tutorials, totals per pillar,
 * next-topic suggestion). Optionally enriches it with Umami analytics when
 * `UMAMI_API_URL` + `UMAMI_API_TOKEN` + `NEXT_PUBLIC_UMAMI_WEBSITE_ID` are set.
 * Reads `automation-output/seo-signals.json` if present (written by seo-signals
 * before this step in CI) for GSC + CWV sections.
 * When run in GitHub Actions it upserts a single rolling "Weekly digest" issue.
 *
 * Usage:  tsx scripts/report.ts   (or `npm run auto -- report`)
 */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { discoverTutorials, type Tutorial } from "./lib/content";
import { resolveNextTopic } from "./next-topic";
import { githubContext, upsertLabeledIssue } from "./lib/github";
import { log, writeStepSummary } from "./lib/log";

const DIGEST_LABEL = "weekly-digest";

function daysAgo(dateStr?: string): number {
  if (!dateStr) return Infinity;
  const d = new Date(dateStr).getTime();
  if (Number.isNaN(d)) return Infinity;
  return (Date.now() - d) / 86_400_000;
}

interface UmamiTop {
  known: boolean;
  pageviews?: number;
  visitors?: number;
  topPages?: { url: string; views: number }[];
}

async function fetchUmami(): Promise<UmamiTop> {
  const base = process.env.UMAMI_API_URL;
  const token = process.env.UMAMI_API_TOKEN;
  const site = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
  if (!base || !token || !site) return { known: false };

  try {
    const end = Date.now();
    const start = end - 7 * 86_400_000;
    const headers = { Authorization: `Bearer ${token}`, Accept: "application/json" };
    const statsRes = await fetch(
      `${base}/api/websites/${site}/stats?startAt=${start}&endAt=${end}`,
      { headers }
    );
    if (!statsRes.ok) return { known: false };
    const stats = (await statsRes.json()) as {
      pageviews?: { value: number };
      visitors?: { value: number };
    };
    return {
      known: true,
      pageviews: stats.pageviews?.value,
      visitors: stats.visitors?.value,
    };
  } catch {
    return { known: false };
  }
}

function summarize(tutorials: Tutorial[]) {
  const published = tutorials.filter((t) => t.frontmatter.published !== false);
  const recent = published.filter((t) => daysAgo(t.frontmatter.date) <= 7);
  const byCategory = new Map<string, number>();
  for (const t of published) {
    byCategory.set(t.category, (byCategory.get(t.category) ?? 0) + 1);
  }
  return { total: published.length, recent, byCategory };
}

// ── SEO signals (written by seo-signals task before this step) ─────

interface SeoSignalsSnapshot {
  gsc?: {
    period: string;
    topQueries: { query?: string; clicks: number; impressions: number; ctr: number; position: number }[];
    lowCtrOpportunities: { query?: string; impressions: number; ctr: number; position: number }[];
    contentGaps: { query: string; impressions: number }[];
  } | null;
  cwv?: {
    pages: {
      url: string;
      lab: { performanceScore?: number; lcp_ms?: number };
      field?: { lcp_p75_ms?: number; overall?: string };
      alerts: string[];
    }[];
    hasAlerts: boolean;
  } | null;
}

function loadSeoSignals(): SeoSignalsSnapshot {
  const file = path.join(process.cwd(), "automation-output", "seo-signals.json");
  if (!fs.existsSync(file)) return {};
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8")) as SeoSignalsSnapshot;
  } catch {
    return {};
  }
}

function buildGscSection(gsc: NonNullable<SeoSignalsSnapshot["gsc"]>): string {
  const lines = [`_Period: ${gsc.period}_`];
  if (gsc.topQueries.length) {
    lines.push("\n**Top queries by impressions:**");
    gsc.topQueries.slice(0, 5).forEach((q) =>
      lines.push(
        `- \"${q.query ?? "—"}\" — ${q.impressions} imp · ` +
        `${(q.ctr * 100).toFixed(1)}% CTR · pos ${q.position.toFixed(1)}`
      )
    );
  }
  if (gsc.lowCtrOpportunities.length) {
    lines.push("\n**Low-CTR opportunities** (improve title / meta description):");
    gsc.lowCtrOpportunities.slice(0, 5).forEach((q) =>
      lines.push(
        `- \"${q.query ?? "—"}\" — ${q.impressions} imp · ${(q.ctr * 100).toFixed(1)}% CTR · pos ${q.position.toFixed(1)}`
      )
    );
  }
  if (gsc.contentGaps.length) {
    lines.push("\n**Content gaps** (impressions with 0 clicks — new tutorial opportunities):");
    gsc.contentGaps.slice(0, 5).forEach((g) =>
      lines.push(`- \"${g.query}\" — ${g.impressions} impressions`)
    );
  }
  return lines.join("\n");
}

function buildCwvSection(cwv: NonNullable<SeoSignalsSnapshot["cwv"]>): string {
  return cwv.pages
    .map((p) => {
      const score =
        p.lab.performanceScore !== undefined
          ? Math.round(p.lab.performanceScore * 100)
          : "—";
      const lcp = p.lab.lcp_ms ? ` · LCP ${(p.lab.lcp_ms / 1000).toFixed(1)}s` : "";
      const field = p.field?.overall ? ` · field: ${p.field.overall}` : "";
      const flag = p.alerts.length
        ? `\n  - ⚠️ ${p.alerts.join("\n  - ⚠️ ")}`
        : " ✅";
      return `- **${p.url}**: score ${score}${lcp}${field}${flag}`;
    })
    .join("\n");
}

export async function buildDigest(): Promise<string> {
  const tutorials = discoverTutorials();
  const { total, recent, byCategory } = summarize(tutorials);
  const umami = await fetchUmami();
  const next = resolveNextTopic();
  const stamp = new Date().toISOString().slice(0, 10);

  const catLines = [...byCategory.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([cat, n]) => `- **${cat}**: ${n}`)
    .join("\n");

  const recentLines = recent.length
    ? recent.map((t) => `- ${t.frontmatter.title} (\`${t.slug}\`)`).join("\n")
    : "- _No tutorials published in the last 7 days._";

  const analytics = umami.known
    ? `- Pageviews (7d): **${umami.pageviews ?? "—"}**\n- Visitors (7d): **${umami.visitors ?? "—"}**`
    : "- _Analytics not configured (set UMAMI_API_URL / UMAMI_API_TOKEN to enrich this section)._";

  return (
    `# 📊 Weekly digest — ${stamp}\n\n` +
    `## Content\n- Total published: **${total}**\n\n### Published this week\n${recentLines}\n\n` +
    `### Coverage by pillar\n${catLines}\n\n` +
    `## Analytics\n${analytics}\n\n` +
    `## ▶️ Suggested next topic\n- **${next.title}** _(‘${next.reason}’)_\n- ${next.detail}\n\n` +
    `---\n_Auto-generated by \`scripts/report.ts\`. Reply/close when actioned._\n`
  );
}

export async function runReport(): Promise<number> {
  const digest = await buildDigest();
  log.info(digest);
  writeStepSummary(digest);

  const ctx = githubContext();
  if (ctx) {
    await upsertLabeledIssue(
      ctx,
      DIGEST_LABEL,
      `📊 Weekly digest — ${new Date().toISOString().slice(0, 10)}`,
      digest
    );
  } else {
    log.notice("No GitHub context — printed digest locally (no issue created).");
  }
  return 0;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  runReport().then((code) => process.exit(code));
}
