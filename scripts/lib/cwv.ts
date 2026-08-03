/**
 * Core Web Vitals fetcher — PageSpeed Insights API (lab + CrUX field data).
 *
 * PSI returns BOTH synthetic lab metrics (Lighthouse) and real-user field data
 * (Chrome UX Report / CrUX) in a single free API call. No service account
 * needed — only a free PAGESPEED_API_KEY from Google Cloud Console.
 *
 * Thresholds follow Google's official Good/Needs Improvement/Poor bands.
 * Any metric in the "Poor" band (or lab performance score < 0.70) raises an alert.
 */
import { log } from "./log";

// ── PSI response types (trimmed) ────────────────────────────────────

interface PsiMetric {
  percentile: number;
  category: "FAST" | "AVERAGE" | "SLOW";
}

interface PsiResponse {
  lighthouseResult?: {
    categories?: { performance?: { score: number | null } };
    audits?: {
      "first-contentful-paint"?: { numericValue?: number };
      "largest-contentful-paint"?: { numericValue?: number };
      "total-blocking-time"?: { numericValue?: number };
      "cumulative-layout-shift"?: { numericValue?: number };
    };
  };
  loadingExperience?: {
    overall_category?: string;
    metrics?: {
      LARGEST_CONTENTFUL_PAINT_MS?: PsiMetric;
      INTERACTION_TO_NEXT_PAINT?: PsiMetric;
      CUMULATIVE_LAYOUT_SHIFT_SCORE?: PsiMetric; // PSI returns CLS × 100 (integer)
    };
  };
}

// ── Public types ─────────────────────────────────────────────────────

export interface CwvLab {
  performanceScore?: number; // 0–1
  lcp_ms?: number;
  fcp_ms?: number;
  tbt_ms?: number;
  cls?: number; // raw 0–1
}

export interface CwvField {
  lcp_p75_ms?: number;
  inp_p75_ms?: number;
  cls_p75?: number; // raw 0–1
  lcp_category?: string;
  inp_category?: string;
  cls_category?: string;
  overall?: string;
}

export interface CwvPage {
  url: string;
  lab: CwvLab;
  field?: CwvField; // absent when CrUX has insufficient data
  alerts: string[];
}

export interface CwvData {
  pages: CwvPage[];
  hasAlerts: boolean;
  checkedAt: string;
}

// ── Thresholds (Google official "Poor" boundary) ─────────────────────
// These are the ALERT thresholds — anything beyond them triggers an issue.
export const CWV_THRESHOLDS = {
  lab:   { performanceScore: 0.70, lcp_ms: 4_000, tbt_ms: 600, cls: 0.25 },
  field: { lcp_p75_ms: 4_000,     inp_p75_ms: 500, cls_p75: 0.25 },
} as const;

export function labAlerts(lab: CwvLab): string[] {
  const a: string[] = [];
  if (lab.performanceScore !== undefined && lab.performanceScore < CWV_THRESHOLDS.lab.performanceScore)
    a.push(`Performance score ${Math.round(lab.performanceScore * 100)} < 70`);
  if (lab.lcp_ms !== undefined && lab.lcp_ms > CWV_THRESHOLDS.lab.lcp_ms)
    a.push(`LCP ${(lab.lcp_ms / 1000).toFixed(1)}s > 4s (lab)`);
  if (lab.tbt_ms !== undefined && lab.tbt_ms > CWV_THRESHOLDS.lab.tbt_ms)
    a.push(`TBT ${Math.round(lab.tbt_ms)}ms > 600ms`);
  if (lab.cls !== undefined && lab.cls > CWV_THRESHOLDS.lab.cls)
    a.push(`CLS ${lab.cls.toFixed(3)} > 0.25 (lab)`);
  return a;
}

export function fieldAlerts(field: CwvField): string[] {
  const a: string[] = [];
  if (field.lcp_p75_ms !== undefined && field.lcp_p75_ms > CWV_THRESHOLDS.field.lcp_p75_ms)
    a.push(`Field LCP p75 ${(field.lcp_p75_ms / 1000).toFixed(1)}s > 4s`);
  if (field.inp_p75_ms !== undefined && field.inp_p75_ms > CWV_THRESHOLDS.field.inp_p75_ms)
    a.push(`Field INP p75 ${field.inp_p75_ms}ms > 500ms`);
  if (field.cls_p75 !== undefined && field.cls_p75 > CWV_THRESHOLDS.field.cls_p75)
    a.push(`Field CLS p75 ${field.cls_p75.toFixed(3)} > 0.25`);
  return a;
}

// ── Per-page fetch ────────────────────────────────────────────────────

async function fetchPageCwv(url: string, apiKey: string): Promise<CwvPage> {
  const endpoint =
    `https://www.googleapis.com/pagespeedonline/v5/runPagespeed` +
    `?url=${encodeURIComponent(url)}&key=${apiKey}&strategy=mobile&category=performance`;

  let lab: CwvLab = {};
  let field: CwvField | undefined;
  const alerts: string[] = [];

  try {
    const res = await fetch(endpoint, { signal: AbortSignal.timeout(35_000) });
    if (!res.ok) {
      alerts.push(`PSI returned ${res.status}`);
      return { url, lab, alerts };
    }
    const data = (await res.json()) as PsiResponse;

    const lh = data.lighthouseResult;
    if (lh) {
      lab = {
        performanceScore: lh.categories?.performance?.score ?? undefined,
        lcp_ms: lh.audits?.["largest-contentful-paint"]?.numericValue,
        fcp_ms: lh.audits?.["first-contentful-paint"]?.numericValue,
        tbt_ms: lh.audits?.["total-blocking-time"]?.numericValue,
        cls:    lh.audits?.["cumulative-layout-shift"]?.numericValue,
      };
    }

    const le = data.loadingExperience;
    if (le?.metrics && Object.keys(le.metrics).length > 0) {
      const clsRaw = le.metrics.CUMULATIVE_LAYOUT_SHIFT_SCORE?.percentile;
      field = {
        lcp_p75_ms: le.metrics.LARGEST_CONTENTFUL_PAINT_MS?.percentile,
        inp_p75_ms: le.metrics.INTERACTION_TO_NEXT_PAINT?.percentile,
        // PSI returns CLS×100 as an integer; divide back to 0–1
        cls_p75: clsRaw !== undefined ? clsRaw / 100 : undefined,
        lcp_category: le.metrics.LARGEST_CONTENTFUL_PAINT_MS?.category,
        inp_category: le.metrics.INTERACTION_TO_NEXT_PAINT?.category,
        cls_category: le.metrics.CUMULATIVE_LAYOUT_SHIFT_SCORE?.category,
        overall: le.overall_category,
      };
    }

    alerts.push(...labAlerts(lab));
    if (field) alerts.push(...fieldAlerts(field));
  } catch (err) {
    alerts.push(`PSI error: ${(err as Error).message}`);
  }

  return { url, lab, field, alerts };
}

// ── Public API ────────────────────────────────────────────────────────

/**
 * Fetch CWV for each URL sequentially (PSI can be slow; parallel risks timeouts).
 * Returns null when PAGESPEED_API_KEY is absent.
 */
export async function fetchCwvData(urls: string[]): Promise<CwvData | null> {
  const apiKey = process.env.PAGESPEED_API_KEY;
  if (!apiKey || urls.length === 0) return null;

  const pages: CwvPage[] = [];
  for (const url of urls) {
    log.notice(`  CWV: fetching ${url}`);
    pages.push(await fetchPageCwv(url, apiKey));
  }

  return {
    pages,
    hasAlerts: pages.some((p) => p.alerts.length > 0),
    checkedAt: new Date().toISOString(),
  };
}
