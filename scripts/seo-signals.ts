/**
 * SEO signals orchestrator.
 *
 * Fetches Google Search Console + Core Web Vitals (PSI) data, writes
 * `automation-output/seo-signals.json`, and opens/updates alert issues in CI
 * when CWV thresholds are breached.
 *
 * The output file is intentionally shared state: `curriculum --prompt` embeds
 * it so the AI planner ranks topics against REAL search demand, not guesses.
 *
 * Triggers:
 *   - Weekly (report.yml) — full GSC + CWV refresh before the digest.
 *   - Nightly (quality.yml) — CWV-only check (GSC may be skipped via flag).
 *   - On-demand: npm run auto -- seo-signals
 *   - On-demand (CWV only): npm run auto -- seo-signals --cwv-only
 *
 * Always exits 0 — never blocks the pipeline (non-fatal, best-effort).
 */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { fetchGscData, type GscData } from "./lib/gsc";
import { fetchCwvData, type CwvData } from "./lib/cwv";
import { githubContext, upsertLabeledIssue } from "./lib/github";
import { log, setOutput, writeStepSummary } from "./lib/log";

const SITE       = process.env.NEXT_PUBLIC_SITE_URL || "https://allaboutcs.dev";
const OUT_DIR    = path.join(process.cwd(), "automation-output");
const OUT_FILE   = path.join(OUT_DIR, "seo-signals.json");
const CWV_LABEL  = "cwv-alert";

export interface SeoSignals {
  generated: string;
  gsc: GscData | null;
  cwv: CwvData | null;
}

// ── CWV alert issue ────────────────────────────────────────────────

function buildCwvIssueBody(cwv: CwvData): string {
  const alertLines = cwv.pages.flatMap((p) =>
    p.alerts.length ? [`**${p.url}**: ${p.alerts.join(" · ")}`] : []
  );
  const scoreLines = cwv.pages.map((p) => {
    const score =
      p.lab.performanceScore !== undefined
        ? Math.round(p.lab.performanceScore * 100)
        : "—";
    return `- ${p.url}: lab score **${score}**${
      p.field?.overall ? ` · field overall **${p.field.overall}**` : ""
    }`;
  });
  return (
    `Core Web Vitals thresholds breached as of **${cwv.checkedAt.slice(0, 10)}**.\n\n` +
    `### Alerts\n${alertLines.map((l) => `- ${l}`).join("\n") || "- (none)"}\n\n` +
    `### Scores\n${scoreLines.join("\n")}\n\n` +
    `**Actions:**\n` +
    `- Run \`npm run auto -- seo-signals\` locally to reproduce.\n` +
    `- Check the latest [quality workflow](../actions/workflows/quality.yml) for Lighthouse details.\n` +
    `- Common fixes: defer non-critical JS, optimise images (avif/webp via next/image), ` +
    `reduce third-party scripts, remove layout-shift-causing elements.\n\n` +
    `_Raise thresholds via \`USAGE_WARN_THRESHOLD\`/\`USAGE_ALERT_THRESHOLD\` if expected._`
  );
}

// ── Step summary ────────────────────────────────────────────────────

function buildSummary(signals: SeoSignals): string {
  const lines: string[] = ["## SEO signals\n"];

  if (signals.gsc) {
    const { topQueries, lowCtrOpportunities, contentGaps, period } = signals.gsc;
    lines.push(`### 🔍 Google Search Console (${period})`);
    lines.push(`- Top query: **"${topQueries[0]?.query ?? "—"}"** (${topQueries[0]?.impressions ?? 0} impressions)`);
    lines.push(`- Low-CTR opportunities: **${lowCtrOpportunities.length}** (high impressions, improve title/meta)`);
    lines.push(`- Content gaps (impressions, 0 clicks): **${contentGaps.length}**`);
    if (contentGaps.length) {
      lines.push(
        contentGaps.slice(0, 3).map((g) => `    - "${g.query}" (${g.impressions} imp)`).join("\n")
      );
    }
    lines.push("");
  } else {
    lines.push("### 🔍 GSC: _not configured_ (set GSC_SERVICE_ACCOUNT_JSON + GSC_SITE_URL)\n");
  }

  if (signals.cwv) {
    lines.push("### ⚡ Core Web Vitals");
    for (const p of signals.cwv.pages) {
      const score =
        p.lab.performanceScore !== undefined
          ? Math.round(p.lab.performanceScore * 100)
          : "—";
      const lcp = p.lab.lcp_ms ? `LCP ${(p.lab.lcp_ms / 1000).toFixed(1)}s` : "";
      const flag = p.alerts.length ? `⚠️ ${p.alerts[0]}` : "✅ within thresholds";
      lines.push(`- **${p.url}**: score ${score} · ${lcp} · ${flag}`);
    }
  } else {
    lines.push("### ⚡ CWV: _not configured_ (set PAGESPEED_API_KEY)\n");
  }

  return lines.join("\n") + "\n";
}

// ── Main ────────────────────────────────────────────────────────────

export async function runSeoSignals(argv: string[] = []): Promise<number> {
  const cwvOnly = argv.includes("--cwv-only");

  // GSC (skip in cwv-only mode or when not configured)
  let gsc: GscData | null = null;
  if (!cwvOnly) {
    log.info("Fetching GSC data…");
    gsc = await fetchGscData();
    if (gsc)
      log.success(`GSC: ${gsc.topQueries.length} queries · ${gsc.contentGaps.length} gaps · ${gsc.lowCtrOpportunities.length} low-CTR`);
    else
      log.notice("GSC: not configured (set GSC_SERVICE_ACCOUNT_JSON + GSC_SITE_URL).");
  }

  // CWV
  log.info("Fetching CWV (PSI)…");
  const urls = [`${SITE}/`, `${SITE}/tutorials`];
  const cwv = await fetchCwvData(urls);
  if (cwv) {
    if (cwv.hasAlerts)
      log.warn(`CWV: ${cwv.pages.reduce((n, p) => n + p.alerts.length, 0)} alert(s)`);
    else
      log.success("CWV: all pages within thresholds.");
  } else {
    log.notice("CWV: not configured (set PAGESPEED_API_KEY).");
  }

  // Write signals file
  const signals: SeoSignals = { generated: new Date().toISOString(), gsc, cwv: cwv ?? null };
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(signals, null, 2), "utf-8");
  log.success("Wrote automation-output/seo-signals.json");

  // Summary + outputs
  writeStepSummary(buildSummary(signals));
  setOutput("cwv_has_alerts", String(cwv?.hasAlerts ?? false));
  setOutput("gsc_configured", String(gsc !== null));

  // CWV alert issue in CI
  if (cwv?.hasAlerts) {
    const ctx = githubContext();
    if (ctx) {
      await upsertLabeledIssue(
        ctx,
        CWV_LABEL,
        `⚡ CWV alert — ${new Date().toISOString().slice(0, 10)}`,
        buildCwvIssueBody(cwv)
      );
    }
  }

  return 0; // always non-blocking
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  runSeoSignals(process.argv.slice(2)).then((code) => process.exit(code));
}
