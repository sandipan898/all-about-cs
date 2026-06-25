import { NextResponse } from "next/server";
import { getLanguage } from "@/lib/playground/languages";
import type { RunResult } from "@/lib/playground/types";

/**
 * POST /api/execute — secure server-side execution proxy (Wandbox).
 *
 * Why this exists: compiled / non-browser languages (C++, Java, Rust, Go, …)
 * cannot run client-side. Rather than bundle a monolithic WASM toolchain into
 * the browser, we OWN a thin proxy to a sandboxed runner. This keeps the
 * execution pipeline under our control for future AI integrations and lets us
 * enforce validation + rate limiting at the edge.
 *
 * Backend: Wandbox (https://wandbox.org) — a free, public, key-less compile &
 * run service. NO registration or API key is required, so this works out of the
 * box with zero configuration. Override the endpoint with `WANDBOX_API_URL` if
 * you self-host. Python / JavaScript intentionally do NOT route here — they
 * execute entirely in the visitor's browser.
 */
export const runtime = "nodejs";

const WANDBOX_API_URL =
  process.env.WANDBOX_API_URL?.replace(/\/$/, "") || "https://wandbox.org/api";

/** Hard limits to bound payloads and abuse. */
export const EXECUTE_LIMITS = {
  /** Max accepted source length (characters). */
  maxCodeLength: 20_000,
  /** Max accepted stdin length (characters). */
  maxStdinLength: 4_000,
  /** Rate-limit window (ms). */
  windowMs: 60_000,
  /** Max requests per IP per window. */
  maxPerWindow: 20,
} as const;

// ── Naive in-memory rate limiter (per server instance) ─────────────
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now > entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + EXECUTE_LIMITS.windowMs });
    return true;
  }
  if (entry.count >= EXECUTE_LIMITS.maxPerWindow) return false;
  entry.count += 1;
  return true;
}

// ── Wandbox compiler resolution (cached in module memory) ──────────
interface WandboxCompiler {
  name: string;
  language: string;
}

let compilersCache: { at: number; data: WandboxCompiler[] } | null = null;
const COMPILERS_TTL = 30 * 60_000; // 30 minutes

async function getCompilers(): Promise<WandboxCompiler[]> {
  if (compilersCache && Date.now() - compilersCache.at < COMPILERS_TTL) {
    return compilersCache.data;
  }
  const res = await fetch(`${WANDBOX_API_URL}/list.json`, {
    next: { revalidate: 1800 },
  });
  if (!res.ok) throw new Error(`Wandbox compiler list failed (${res.status}).`);
  const data = (await res.json()) as WandboxCompiler[];
  compilersCache = { at: Date.now(), data };
  return data;
}

/**
 * Resolve the newest compiler `name` for a Wandbox language label. Wandbox
 * lists newest-first, so the first match is the most recent toolchain.
 */
async function resolveCompiler(languageLabel: string): Promise<string | null> {
  const compilers = await getCompilers();
  const match = compilers.find((c) => c.language === languageLabel);
  return match?.name ?? null;
}

interface ExecuteBody {
  language?: unknown;
  code?: unknown;
  stdin?: unknown;
}

/** Shape of a Wandbox `/compile.json` response. */
interface WandboxResult {
  status?: string;
  signal?: string;
  compiler_output?: string;
  compiler_error?: string;
  program_output?: string;
  program_error?: string;
  program_message?: string;
}

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(req: Request): Promise<NextResponse> {
  if (!rateLimit(clientIp(req))) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429 }
    );
  }

  let body: ExecuteBody;
  try {
    body = (await req.json()) as ExecuteBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const languageId = typeof body.language === "string" ? body.language : "";
  const code = typeof body.code === "string" ? body.code : "";
  const stdin = typeof body.stdin === "string" ? body.stdin : "";

  const lang = getLanguage(languageId);
  if (!lang || !lang.wandbox) {
    return NextResponse.json(
      { error: `Language "${languageId}" is not executable on the server.` },
      { status: 400 }
    );
  }
  if (!code.trim()) {
    return NextResponse.json({ error: "No code provided." }, { status: 400 });
  }
  if (code.length > EXECUTE_LIMITS.maxCodeLength) {
    return NextResponse.json(
      { error: "Code exceeds the maximum allowed length." },
      { status: 413 }
    );
  }
  if (stdin.length > EXECUTE_LIMITS.maxStdinLength) {
    return NextResponse.json(
      { error: "Input exceeds the maximum allowed length." },
      { status: 413 }
    );
  }

  let compiler: string | null;
  try {
    compiler = await resolveCompiler(lang.wandbox);
  } catch {
    return NextResponse.json(
      { error: "Execution backend is unavailable. Please try again later." },
      { status: 502 }
    );
  }
  if (!compiler) {
    return NextResponse.json(
      { error: `No compiler available for "${lang.label}".` },
      { status: 502 }
    );
  }

  const started = Date.now();
  let wandRes: Response;
  try {
    wandRes = await fetch(`${WANDBOX_API_URL}/compile.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        compiler,
        code,
        stdin,
      }),
    });
  } catch {
    return NextResponse.json(
      { error: "Execution backend is unavailable. Please try again later." },
      { status: 502 }
    );
  }

  const durationMs = Date.now() - started;

  if (!wandRes.ok) {
    const detail = await wandRes.text().catch(() => "");
    return NextResponse.json(
      { error: "Execution failed.", detail: detail.slice(0, 300) || undefined },
      { status: 502 }
    );
  }

  const data = (await wandRes.json()) as WandboxResult;

  // Wandbox `status` is the exit code as a string ("0" = clean run). Fold every
  // diagnostic stream into stderr (compiler errors first, then runtime errors).
  const stdout = data.program_output ?? "";
  let stderr = "";
  if (data.compiler_error) stderr += data.compiler_error;
  if (data.program_error)
    stderr += (stderr ? "\n" : "") + data.program_error;
  if (data.signal && !stderr) stderr = `Process terminated by signal: ${data.signal}`;

  const result: RunResult = {
    stdout,
    stderr,
    durationMs,
    ok: data.status === "0",
  };

  return NextResponse.json(result, { status: 200 });
}

/** Reject non-POST verbs explicitly. */
export function GET(): NextResponse {
  return NextResponse.json({ error: "Method not allowed." }, { status: 405 });
}
