/**
 * Minimal GitHub REST helpers used by automation scripts when they run inside
 * GitHub Actions. Everything is guarded: with no token/repo in the environment
 * the helpers become no-ops so the same scripts run cleanly on a laptop.
 *
 * Uses the global `fetch` (Node >= 18). No external dependencies.
 */
import { log } from "./log";

const API = "https://api.github.com";

export interface GitHubContext {
  token: string;
  owner: string;
  repo: string;
}

/** Resolve `{ token, owner, repo }` from the standard Actions environment. */
export function githubContext(): GitHubContext | null {
  const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN ?? "";
  const repo = process.env.GITHUB_REPOSITORY ?? ""; // "owner/name"
  if (!token || !repo.includes("/")) return null;
  const [owner, name] = repo.split("/");
  return { token, owner, repo: name };
}

async function gh<T>(
  ctx: GitHubContext,
  method: string,
  pathname: string,
  body?: unknown
): Promise<T> {
  const res = await fetch(`${API}${pathname}`, {
    method,
    headers: {
      Authorization: `Bearer ${ctx.token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`GitHub ${method} ${pathname} -> ${res.status} ${text}`);
  }
  return (await res.json()) as T;
}

interface Issue {
  number: number;
  title: string;
  html_url: string;
}

/**
 * Create a new issue, or update the body of the most recent open issue that
 * carries the given label. Keeps recurring reports to a single rolling issue
 * instead of spamming a new one every run.
 */
export async function upsertLabeledIssue(
  ctx: GitHubContext,
  label: string,
  title: string,
  body: string
): Promise<Issue | null> {
  try {
    const existing = await gh<Issue[]>(
      ctx,
      "GET",
      `/repos/${ctx.owner}/${ctx.repo}/issues?state=open&labels=${encodeURIComponent(
        label
      )}&per_page=1`
    );
    if (existing.length > 0) {
      const issue = existing[0];
      await gh(ctx, "PATCH", `/repos/${ctx.owner}/${ctx.repo}/issues/${issue.number}`, {
        title,
        body,
      });
      log.success(`Updated issue #${issue.number}: ${issue.html_url}`);
      return issue;
    }
    const created = await gh<Issue>(ctx, "POST", `/repos/${ctx.owner}/${ctx.repo}/issues`, {
      title,
      body,
      labels: [label],
    });
    log.success(`Opened issue #${created.number}: ${created.html_url}`);
    return created;
  } catch (err) {
    log.error(`Could not upsert issue: ${(err as Error).message}`);
    return null;
  }
}

export interface ActionsUsage {
  /** Whether real numbers were available (false = public repo / no billing scope). */
  known: boolean;
  includedMinutes: number;
  usedMinutes: number;
  percentUsed: number;
}

/**
 * Fetch this account's GitHub Actions minutes usage for the current cycle.
 * Falls back to `{ known: false }` for public repos (unlimited) or when the
 * token lacks the `Plan`/billing scope.
 */
export async function fetchActionsUsage(ctx: GitHubContext): Promise<ActionsUsage> {
  const empty: ActionsUsage = {
    known: false,
    includedMinutes: 0,
    usedMinutes: 0,
    percentUsed: 0,
  };
  try {
    const data = await gh<{
      total_minutes_used: number;
      included_minutes: number;
    }>(ctx, "GET", `/users/${ctx.owner}/settings/billing/actions`);
    const included = data.included_minutes || 0;
    const used = data.total_minutes_used || 0;
    return {
      known: true,
      includedMinutes: included,
      usedMinutes: used,
      percentUsed: included > 0 ? (used / included) * 100 : 0,
    };
  } catch {
    return empty;
  }
}
