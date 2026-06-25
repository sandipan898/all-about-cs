import { NextResponse } from "next/server";
import {
  VISUALIZE_LIMITS,
  type PlaygroundLanguage,
  type VisualizeRequest,
  type VizGraph,
  type VizEdge,
  type VizNode,
  type VizStep,
} from "./types";

/**
 * ⚠️  PARKED — not wired as a live route.
 *
 * This file used to live at `src/app/api/visualize/route.ts`. It has been moved
 * out of the `app/` tree so it is no longer served, but is preserved verbatim
 * (deterministic `staticAnalyze` + AI proxy contract) for a future, non-AI-first
 * logic-tracing feature. To revive it, move it back under `src/app/api/...`.
 *
 * Original contract: POST /api/visualize
 *
 * Server-side proxy that turns a code snippet into a structured execution
 * diagram ({@link VizGraph}). The LLM key NEVER reaches the browser — all model
 * traffic happens here, behind the server boundary.
 *
 * Provider-agnostic: any OpenAI-compatible endpoint works (OpenAI, Azure
 * OpenAI, OpenRouter, a local llama.cpp server, …) via env:
 *   LLM_API_BASE   default https://api.openai.com/v1
 *   LLM_API_KEY    (required to enable the AI path)
 *   LLM_MODEL      default gpt-4o-mini
 *
 * When no key is configured the route degrades gracefully to a deterministic
 * static analysis so the feature works out-of-the-box in development.
 */
export const runtime = "nodejs";

const SYSTEM_PROMPT = `You are an algorithm visualization engine for a computer-science learning platform.
Given a short code snippet, return ONLY a JSON object (no markdown, no prose) matching this TypeScript type:

{
  "title": string,            // short, e.g. "Recursive factorial"
  "summary": string,          // 1-2 sentence plain-language overview
  "nodes": { "id": string, "label": string, "kind": "variable"|"value"|"call"|"frame"|"note", "detail"?: string }[],
  "edges": { "from": string, "to": string, "label"?: string }[],
  "steps": { "line"?: number, "description": string, "highlight"?: string[] }[]  // highlight = node ids
}

Rules:
- Keep it small: at most 12 nodes and 12 steps.
- Use "frame" for recursion/call-stack frames, "call" for function calls, "variable" for variables, "value" for concrete values.
- "highlight" ids MUST reference existing node ids.
- Output valid minified JSON only.`;

// ── Handler ────────────────────────────────────────────────────────

export async function POST(req: Request) {
  let body: VisualizeRequest;
  try {
    body = (await req.json()) as VisualizeRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const code = typeof body.code === "string" ? body.code : "";
  const language: PlaygroundLanguage =
    body.language === "javascript" ? "javascript" : "python";

  // Input validation / abuse bounds.
  if (!code.trim()) {
    return NextResponse.json({ error: "Missing code." }, { status: 400 });
  }
  if (code.length > VISUALIZE_LIMITS.maxCodeLength) {
    return NextResponse.json(
      { error: "Code too long to visualize." },
      { status: 413 }
    );
  }
  const stdout = (body.stdout ?? "").slice(0, VISUALIZE_LIMITS.maxStdoutLength);

  // Prefer the AI path when a key is configured; otherwise fall back.
  const apiKey = process.env.LLM_API_KEY;
  if (apiKey) {
    try {
      const graph = await callLlm({ code, language, stdout, apiKey });
      if (graph) return NextResponse.json(graph);
    } catch {
      // Swallow and fall through to deterministic analysis.
    }
  }

  return NextResponse.json(staticAnalyze(code, language));
}

// ── AI path ────────────────────────────────────────────────────────

async function callLlm({
  code,
  language,
  stdout,
  apiKey,
}: {
  code: string;
  language: PlaygroundLanguage;
  stdout: string;
  apiKey: string;
}): Promise<VizGraph | null> {
  const base = process.env.LLM_API_BASE ?? "https://api.openai.com/v1";
  const model = process.env.LLM_MODEL ?? "gpt-4o-mini";

  const userContent = `Language: ${language}\n\nCode:\n${code}${
    stdout ? `\n\nObserved stdout:\n${stdout}` : ""
  }`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
      }),
    });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<VizGraph>;
    return normalizeGraph(parsed, "ai");
  } finally {
    clearTimeout(timeout);
  }
}

/** Coerce/clamp untrusted model output into a safe, well-formed VizGraph. */
function normalizeGraph(
  input: Partial<VizGraph>,
  source: VizGraph["source"]
): VizGraph {
  const nodes: VizNode[] = Array.isArray(input.nodes)
    ? input.nodes.slice(0, 12).map((n, i) => ({
        id: String(n.id ?? `n${i}`),
        label: String(n.label ?? "?"),
        kind: (["variable", "value", "call", "frame", "note"].includes(
          n.kind as string
        )
          ? n.kind
          : "note") as VizNode["kind"],
        detail: n.detail ? String(n.detail) : undefined,
      }))
    : [];

  const ids = new Set(nodes.map((n) => n.id));
  const edges: VizEdge[] = Array.isArray(input.edges)
    ? input.edges
        .filter((e) => ids.has(String(e.from)) && ids.has(String(e.to)))
        .slice(0, 24)
        .map((e) => ({
          from: String(e.from),
          to: String(e.to),
          label: e.label ? String(e.label) : undefined,
        }))
    : [];

  const steps: VizStep[] = Array.isArray(input.steps)
    ? input.steps.slice(0, 12).map((s) => ({
        line: typeof s.line === "number" ? s.line : undefined,
        description: String(s.description ?? ""),
        highlight: Array.isArray(s.highlight)
          ? s.highlight.map(String).filter((id) => ids.has(id))
          : undefined,
      }))
    : [];

  return {
    title: String(input.title ?? "Execution overview"),
    summary: String(input.summary ?? ""),
    nodes,
    edges,
    steps,
    source,
  };
}

// ── Deterministic fallback (no key required) ───────────────────────

/**
 * Lightweight static analysis: extracts variable assignments and function
 * definitions, detects direct recursion, and emits a readable diagram. This
 * keeps the visualizer fully functional offline / without an LLM key.
 */
function staticAnalyze(
  code: string,
  language: PlaygroundLanguage
): VizGraph {
  const lines = code.split("\n");
  const nodes: VizNode[] = [];
  const edges: VizEdge[] = [];
  const steps: VizStep[] = [];
  const seen = new Set<string>();

  const assignRe =
    language === "python"
      ? /^\s*([A-Za-z_]\w*)\s*=\s*(.+?)\s*$/
      : /^\s*(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(.+?);?\s*$/;
  const funcRe =
    language === "python"
      ? /^\s*def\s+([A-Za-z_]\w*)\s*\(/
      : /^\s*function\s+([A-Za-z_$][\w$]*)\s*\(/;

  let funcName: string | null = null;
  let recursionFound = false;

  lines.forEach((line, idx) => {
    const fn = line.match(funcRe);
    if (fn) {
      funcName = fn[1];
      const id = `fn:${funcName}`;
      if (!seen.has(id)) {
        seen.add(id);
        nodes.push({ id, label: `${funcName}()`, kind: "call" });
        steps.push({
          line: idx + 1,
          description: `Define function ${funcName}.`,
          highlight: [id],
        });
      }
      return;
    }

    const asg = line.match(assignRe);
    if (asg) {
      const [, name, value] = asg;
      const id = `var:${name}`;
      if (!seen.has(id)) {
        seen.add(id);
        nodes.push({
          id,
          label: name,
          kind: "variable",
          detail: value.length > 20 ? value.slice(0, 19) + "…" : value,
        });
      }
      steps.push({
        line: idx + 1,
        description: `Assign ${name} = ${value}.`,
        highlight: [id],
      });
    }

    // Direct recursion: a self-call *inside the function body* (indented),
    // not a top-level invocation like `print(fact(5))`. Recorded once.
    const isIndented = /^\s/.test(line);
    if (
      funcName &&
      isIndented &&
      !recursionFound &&
      new RegExp(`\\b${funcName}\\s*\\(`).test(line)
    ) {
      const fid = `fn:${funcName}`;
      if (seen.has(fid)) {
        recursionFound = true;
        edges.push({ from: fid, to: fid, label: "recurses" });
        steps.push({
          line: idx + 1,
          description: `${funcName} calls itself — recursion.`,
          highlight: [fid],
        });
      }
    }
  });

  if (nodes.length === 0) {
    nodes.push({
      id: "note",
      label: "No variables detected",
      kind: "note",
      detail: "Run the code to see output",
    });
  }

  return {
    title: "Static code overview",
    summary:
      "Generated locally from the source (no AI key configured). Set LLM_API_KEY for a richer, model-driven trace.",
    nodes,
    edges,
    steps,
    source: "static",
  };
}
