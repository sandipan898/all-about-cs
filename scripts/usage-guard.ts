/**
 * Usage guard — the cost limiter / early-warning alert.
 *
 * Checks this account's GitHub Actions minutes for the current billing cycle and:
 *   - warns at WARN_THRESHOLD (default 75%),
 *   - alerts (opens/updates an issue) at ALERT_THRESHOLD (default 90%),
 *   - in `--enforce` mode, exits non-zero at/above ALERT_THRESHOLD so an expensive
 *     downstream job (Lighthouse, Playwright, build) is skipped to save cost.
 *
 * Public repos have unlimited free minutes, so the guard reports "unlimited" and
 * always passes. Thresholds are overridable via env:
 *   USAGE_WARN_THRESHOLD, USAGE_ALERT_THRESHOLD  (percent, e.g. "75").
 *
 * Usage:
 *   tsx scripts/usage-guard.ts            # report only
 *   tsx scripts/usage-guard.ts --enforce  # also gate (exit 1 when over alert)
 *   tsx scripts/usage-guard.ts --alert     # also open/update the alert issue
 */
import { pathToFileURL } from "node:url";
import { fetchActionsUsage, githubContext, upsertLabeledIssue } from "./lib/github";
import { log, setOutput, writeStepSummary } from "./lib/log";

const ALERT_LABEL = "actions-usage-alert";

function threshold(name: string, fallback: number): number {
  const v = Number(process.env[name]);
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

export async function runUsageGuard(argv: string[] = []): Promise<number> {
  const enforce = argv.includes("--enforce");
  const doAlert = argv.includes("--alert") || enforce;
  const warnAt = threshold("USAGE_WARN_THRESHOLD", 75);
  const alertAt = threshold("USAGE_ALERT_THRESHOLD", 90);

  const ctx = githubContext();
  if (!ctx) {
    log.notice("No GitHub context — skipping usage check (local run).");
    return 0;
  }

  const usage = await fetchActionsUsage(ctx);

  if (!usage.known) {
    log.success(
      "Actions minutes: unlimited/unavailable (public repo or no billing scope). Passing."
    );
    setOutput("over_limit", "false");
    writeStepSummary("## Usage guard\n\n- Minutes: **unlimited / not billed** ✅\n");
    return 0;
  }

  const pct = Math.round(usage.percentUsed);
  const line = `Actions minutes: ${usage.usedMinutes}/${usage.includedMinutes} (${pct}%) used this cycle.`;
  const over = usage.percentUsed >= alertAt;

  setOutput("percent_used", String(pct));
  setOutput("over_limit", String(over));

  writeStepSummary(
    `## Usage guard\n\n- Used: **${usage.usedMinutes}/${usage.includedMinutes} min (${pct}%)**\n` +
      `- Warn ≥ ${warnAt}% · Alert ≥ ${alertAt}%\n- Over alert threshold: **${over}**\n`
  );

  if (over) {
    log.error(`${line} At/above alert threshold (${alertAt}%).`);
    if (doAlert) {
      await upsertLabeledIssue(
        ctx,
        ALERT_LABEL,
        `⚠️ GitHub Actions usage at ${pct}%`,
        `Automated pipelines have used **${usage.usedMinutes}/${usage.includedMinutes}** ` +
          `Actions minutes (**${pct}%**) this billing cycle.\n\n` +
          `**Recommended actions to avoid overage charges:**\n` +
          `- Set repo variable \`AUTOMATION_ENABLED=false\` to pause all scheduled jobs.\n` +
          `- Or disable individual jobs via \`REPORTS_ENABLED\` / \`LIGHTHOUSE_ENABLED\`.\n` +
          `- Reduce cron frequency (weekly → monthly) in \`.github/workflows/\`.\n\n` +
          `_Raise the bar via \`USAGE_ALERT_THRESHOLD\` if this is expected._`
      );
    }
    if (enforce) {
      log.error("Enforce mode: signalling downstream jobs to skip to protect budget.");
      return 1;
    }
    return 0;
  }

  if (usage.percentUsed >= warnAt) {
    log.warn(`${line} Approaching limit (warn ≥ ${warnAt}%).`);
  } else {
    log.success(line);
  }
  return 0;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  runUsageGuard(process.argv.slice(2)).then((code) => process.exit(code));
}
