/**
 * Google Search Console — Search Analytics API fetcher.
 *
 * Authentication: Google service-account JWT, signed with node:crypto (RS256).
 * Zero extra npm dependencies. Requires env vars:
 *   GSC_SERVICE_ACCOUNT_JSON  — service-account JSON (plain or base64-encoded)
 *   GSC_SITE_URL              — verified property, e.g. "https://allaboutcs.dev/"
 *                               or "sc-domain:allaboutcs.dev"
 *
 * Returns null (never throws) when credentials are absent or any fetch fails.
 */
import { createSign } from "node:crypto";
import { log } from "./log";

export interface GscRow {
  query?: string;
  page?: string;
  clicks: number;
  impressions: number;
  ctr: number;   // 0–1
  position: number;
}

export interface ContentGap {
  query: string;
  impressions: number;
  position: number;
}

export interface GscData {
  period: string;
  /** Top 20 queries by impressions. */
  topQueries: GscRow[];
  /** Top 10 pages by clicks. */
  topPages: GscRow[];
  /** Queries with ≥50 impressions, <5% CTR, position ≤20 — improve title/meta. */
  lowCtrOpportunities: GscRow[];
  /** Queries with ≥30 impressions and 0 clicks — potential content gaps. */
  contentGaps: ContentGap[];
}

interface ServiceAccount {
  client_email: string;
  private_key: string;
}

// ── JWT helpers (zero deps) ────────────────────────────────────────

function b64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function makeJwt(sa: ServiceAccount): string {
  const hdr = b64url(Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })));
  const now = Math.floor(Date.now() / 1000);
  const pld = b64url(
    Buffer.from(
      JSON.stringify({
        iss: sa.client_email,
        scope: "https://www.googleapis.com/auth/webmasters.readonly",
        aud: "https://oauth2.googleapis.com/token",
        exp: now + 3600,
        iat: now,
      })
    )
  );
  const signer = createSign("RSA-SHA256");
  signer.update(`${hdr}.${pld}`);
  const sig = signer.sign(sa.private_key, "base64url");
  return `${hdr}.${pld}.${sig}`;
}

async function getToken(sa: ServiceAccount): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: makeJwt(sa),
    }),
  });
  if (!res.ok) throw new Error(`Token exchange: ${res.status} ${await res.text()}`);
  return ((await res.json()) as { access_token: string }).access_token;
}

// ── Search Analytics ────────────────────────────────────────────────

type Dimension = "query" | "page";

async function queryDimension(
  token: string,
  siteUrl: string,
  dim: Dimension,
  startDate: string,
  endDate: string,
  rowLimit = 500
): Promise<GscRow[]> {
  const enc = encodeURIComponent(siteUrl);
  const res = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${enc}/searchAnalytics/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ startDate, endDate, dimensions: [dim], rowLimit }),
    }
  );
  if (!res.ok) throw new Error(`GSC ${dim}: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as {
    rows?: { keys: string[]; clicks: number; impressions: number; ctr: number; position: number }[];
  };
  return (data.rows ?? []).map((r) => ({
    [dim]: r.keys[0],
    clicks: r.clicks,
    impressions: r.impressions,
    ctr: r.ctr,
    position: r.position,
  }));
}

// ── Public API ──────────────────────────────────────────────────────

export async function fetchGscData(): Promise<GscData | null> {
  const raw = process.env.GSC_SERVICE_ACCOUNT_JSON;
  const siteUrl = process.env.GSC_SITE_URL;
  if (!raw || !siteUrl) return null;

  let sa: ServiceAccount;
  try {
    const decoded = raw.trim().startsWith("{")
      ? raw
      : Buffer.from(raw, "base64").toString("utf-8");
    sa = JSON.parse(decoded) as ServiceAccount;
    if (!sa.client_email || !sa.private_key) throw new Error("missing fields");
  } catch (err) {
    log.warn(`GSC: cannot parse GSC_SERVICE_ACCOUNT_JSON — ${(err as Error).message}`);
    return null;
  }

  try {
    const token = await getToken(sa);
    const endDate = new Date().toISOString().slice(0, 10);
    const startDate = new Date(Date.now() - 28 * 86_400_000).toISOString().slice(0, 10);

    const [queries, pages] = await Promise.all([
      queryDimension(token, siteUrl, "query", startDate, endDate, 500),
      queryDimension(token, siteUrl, "page", startDate, endDate, 100),
    ]);

    const lowCtr = queries
      .filter((r) => r.impressions >= 50 && r.ctr < 0.05 && r.position <= 20)
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 20);

    const gaps: ContentGap[] = queries
      .filter((r) => r.impressions >= 30 && r.clicks === 0)
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 15)
      .map((r) => ({ query: r.query!, impressions: r.impressions, position: r.position }));

    return {
      period: `${startDate} to ${endDate}`,
      topQueries: queries.sort((a, b) => b.impressions - a.impressions).slice(0, 20),
      topPages: pages.sort((a, b) => b.clicks - a.clicks).slice(0, 10),
      lowCtrOpportunities: lowCtr,
      contentGaps: gaps,
    };
  } catch (err) {
    log.warn(`GSC fetch failed (non-fatal): ${(err as Error).message}`);
    return null;
  }
}
