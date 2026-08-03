import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";

/**
 * GET|POST /api/cron/[task] — secured trigger surface for external schedulers.
 *
 * This is the "Pattern B" endpoint from the automation design: a scheduler such
 * as cron-jobs.org hits this URL on a timetable. LIGHT tasks run inline; HEAVY
 * tasks (that need a full runner) are RELAYED to GitHub Actions via
 * repository_dispatch so the same portable workflows do the real work.
 *
 * Auth: every request MUST present the shared secret, either as the
 * `x-cron-secret` header or a `?secret=` query param. Missing/incorrect → 401.
 *
 * Because the logic lives in the scripts + workflows (not here), ANY caller —
 * cron-jobs.org, curl, a chatbot — triggers identical behaviour.
 */
export const runtime = "nodejs";

/** Tasks handled inline at the edge (fast, no runner needed). */
const LIGHT_TASKS = new Set(["ping", "sitemap-ping"]);
/** Tasks relayed to GitHub Actions via repository_dispatch (heavy). */
const RELAY_TASKS = new Set(["report", "quality", "usage"]);

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://allaboutcs.dev";

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // fail closed when unconfigured
  const url = new URL(req.url);
  const provided = req.headers.get("x-cron-secret") ?? url.searchParams.get("secret") ?? "";
  const a = Buffer.from(provided);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Fire a GitHub repository_dispatch so a workflow (types: [task]) runs. */
async function relayToGitHub(task: string): Promise<{ ok: boolean; status: number }> {
  const token = process.env.GH_DISPATCH_TOKEN;
  const repo = process.env.GITHUB_DISPATCH_REPO || "sandipan898/all-about-cs";
  if (!token) return { ok: false, status: 500 };

  const res = await fetch(`https://api.github.com/repos/${repo}/dispatches`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ event_type: task }),
  });
  return { ok: res.ok, status: res.status };
}

async function handle(req: Request, task: string): Promise<Response> {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  if (LIGHT_TASKS.has(task)) {
    if (task === "ping") {
      return NextResponse.json({ ok: true, task, pong: true, at: new Date().toISOString() });
    }
    // sitemap-ping: warm the sitemap and confirm it is reachable.
    const res = await fetch(`${SITE}/sitemap.xml`, { cache: "no-store" });
    return NextResponse.json({ ok: res.ok, task, status: res.status });
  }

  if (RELAY_TASKS.has(task)) {
    const relay = await relayToGitHub(task);
    return NextResponse.json(
      { ok: relay.ok, task, relayed: true, githubStatus: relay.status },
      { status: relay.ok ? 202 : 502 }
    );
  }

  return NextResponse.json({ ok: false, error: `unknown task: ${task}` }, { status: 404 });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ task: string }> }
): Promise<Response> {
  const { task } = await params;
  return handle(req, task);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ task: string }> }
): Promise<Response> {
  const { task } = await params;
  return handle(req, task);
}
