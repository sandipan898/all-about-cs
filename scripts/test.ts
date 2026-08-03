/**
 * Zero-dependency unit tests for the automation helpers.
 *
 * Uses Node's built-in assert so no test framework install is required — runs
 * anywhere `tsx` runs. Exits non-zero on the first failure (CI-friendly).
 *
 * Run:  tsx scripts/test.ts   (or `npm test`)
 */
import assert from "node:assert/strict";
import {
  extractSeries,
  extractTutorialLinks,
  PLACEHOLDER_YOUTUBE_IDS,
} from "./lib/content";
import { resolveNextTopic } from "./next-topic";
import { labAlerts, fieldAlerts } from "./lib/cwv";
import { runSeoSignals } from "./seo-signals";

let passed = 0;
function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    process.stdout.write(`  ✓ ${name}\n`);
  } catch (err) {
    process.stderr.write(`  ✗ ${name}\n    ${(err as Error).message}\n`);
    process.exit(1);
  }
}

test("extractSeries parses attributes and slug list", () => {
  const refs = extractSeries(
    '<SeriesNavigation seriesName="File Handling" currentPart="1" totalParts="2" slugs="a, b" />'
  );
  assert.equal(refs.length, 1);
  assert.equal(refs[0].seriesName, "File Handling");
  assert.equal(refs[0].totalParts, 2);
  assert.deepEqual(refs[0].slugs, ["a", "b"]);
});

test("extractTutorialLinks finds internal tutorial links", () => {
  const links = extractTutorialLinks(
    "See [loops](/tutorials/python-loops) and [x](/tutorials/python-loops) and [ext](https://x.com)."
  );
  assert.deepEqual(links, ["python-loops"]);
});

test("placeholder youtube id list contains the rick-roll id", () => {
  assert.ok(PLACEHOLDER_YOUTUBE_IDS.includes("dQw4w9WgXcQ"));
});

test("resolveNextTopic honors an explicit request above everything", () => {
  const s = resolveNextTopic({ topic: "python generators" });
  assert.equal(s.reason, "explicit");
  assert.match(s.title, /generators/);
});

test("resolveNextTopic returns a valid reason for the current repo", () => {
  const s = resolveNextTopic();
  assert.ok(
    ["unfinished-series", "curriculum-gap", "research-fallback"].includes(s.reason)
  );
  assert.ok(s.title.length > 0);
});

test("resolveNextTopic accepts --by=opportunity and stays deterministic", () => {
  const a = resolveNextTopic({ by: "opportunity" });
  const b = resolveNextTopic({ by: "opportunity" });
  assert.equal(a.slug, b.slug);
  assert.ok(
    ["unfinished-series", "curriculum-gap", "research-fallback"].includes(a.reason)
  );
});

test("labAlerts: no alerts within thresholds", () => {
  const alerts = labAlerts({ performanceScore: 0.9, lcp_ms: 2000, tbt_ms: 100, cls: 0.02 });
  assert.equal(alerts.length, 0);
});

test("labAlerts: fires alert when performanceScore below 0.70", () => {
  const alerts = labAlerts({ performanceScore: 0.65 });
  assert.ok(alerts.length > 0);
  assert.ok(alerts[0].includes("score"));
});

test("labAlerts: fires alert when LCP above 4s", () => {
  const alerts = labAlerts({ lcp_ms: 5000 });
  assert.ok(alerts.some((a) => a.includes("LCP")));
});

test("fieldAlerts: fires alert when field LCP p75 above 4s", () => {
  const alerts = fieldAlerts({ lcp_p75_ms: 5000 });
  assert.ok(alerts.some((a) => a.includes("LCP")));
});

test("seo-signals: no-ops gracefully when API keys absent", async () => {
  // Ensure no credentials in env (test isolation).
  const savedGsc = process.env.GSC_SERVICE_ACCOUNT_JSON;
  const savedPsi = process.env.PAGESPEED_API_KEY;
  delete process.env.GSC_SERVICE_ACCOUNT_JSON;
  delete process.env.PAGESPEED_API_KEY;
  const code = await runSeoSignals([]);
  process.env.GSC_SERVICE_ACCOUNT_JSON = savedGsc;
  process.env.PAGESPEED_API_KEY = savedPsi;
  assert.equal(code, 0); // always non-blocking
});

process.stdout.write(`\n${passed} passed\n`);
