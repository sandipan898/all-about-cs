/**
 * Tiny logger shared by all automation scripts.
 *
 * When running inside GitHub Actions (env `GITHUB_ACTIONS === "true"`) it also
 * emits workflow annotations (`::error`, `::warning`, `::notice`) and appends a
 * human-readable summary to `$GITHUB_STEP_SUMMARY`. Locally it just prints.
 */
import fs from "node:fs";

const inActions = process.env.GITHUB_ACTIONS === "true";

function annotate(kind: "error" | "warning" | "notice", message: string) {
  if (inActions) {
    // Escape newlines per the workflow-command spec.
    const safe = message.replace(/\r?\n/g, "%0A");
    process.stdout.write(`::${kind}::${safe}\n`);
  }
}

export const log = {
  info(message: string) {
    process.stdout.write(`${message}\n`);
  },
  notice(message: string) {
    process.stdout.write(`ℹ️  ${message}\n`);
    annotate("notice", message);
  },
  warn(message: string) {
    process.stdout.write(`⚠️  ${message}\n`);
    annotate("warning", message);
  },
  error(message: string) {
    process.stderr.write(`❌ ${message}\n`);
    annotate("error", message);
  },
  success(message: string) {
    process.stdout.write(`✅ ${message}\n`);
  },
};

/** Append a Markdown block to the GitHub Actions job summary (no-op locally). */
export function writeStepSummary(markdown: string): void {
  const file = process.env.GITHUB_STEP_SUMMARY;
  if (!file) return;
  try {
    fs.appendFileSync(file, markdown.endsWith("\n") ? markdown : `${markdown}\n`);
  } catch {
    /* best-effort only */
  }
}

/** Set an output for later workflow steps (`name=value` on $GITHUB_OUTPUT). */
export function setOutput(name: string, value: string): void {
  const file = process.env.GITHUB_OUTPUT;
  if (!file) return;
  try {
    fs.appendFileSync(file, `${name}=${value}\n`);
  } catch {
    /* best-effort only */
  }
}
