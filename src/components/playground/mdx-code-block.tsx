import { isValidElement, type ReactElement, type ReactNode } from "react";
import { getLanguage } from "@/lib/playground/languages";
import { highlightCode } from "@/lib/shiki";
import { RunnableSnippet } from "./runnable-snippet";

/**
 * Map common Markdown fence info-strings to a runnable registry id. Only
 * languages present here AND in the language registry get a "Run" button; any
 * other fence (bash, json, text, …) renders as a static, highlighted block.
 */
const LANG_ALIASES: Record<string, string> = {
  py: "python",
  python: "python",
  js: "javascript",
  javascript: "javascript",
  node: "javascript",
  ts: "typescript",
  typescript: "typescript",
  cpp: "cpp",
  "c++": "cpp",
  cc: "cpp",
  cxx: "cpp",
  c: "c",
  java: "java",
  go: "go",
  golang: "go",
  rs: "rust",
  rust: "rust",
  php: "php",
  sql: "sql",
  sqlite: "sql",
  mysql: "sql",
  postgresql: "sql",
};

/** Recursively flatten React children into their raw text content. */
function nodeToText(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(nodeToText).join("");
  if (isValidElement(node)) {
    return nodeToText((node.props as { children?: ReactNode }).children);
  }
  return "";
}

/** Pick the inner `<code>` element from a `<pre>`'s children, if present. */
function findCodeChild(children: ReactNode): ReactElement | null {
  if (isValidElement(children)) return children;
  if (Array.isArray(children)) {
    const el = children.find((c) => isValidElement(c));
    return (el as ReactElement) ?? null;
  }
  return null;
}

interface MdxPreProps {
  children?: ReactNode;
}

/**
 * `MdxPre` — drop-in override for the Markdown `<pre>` element.
 *
 * Every fenced code block (```python … ```) flows through here. When the fence
 * language is one we can execute, it upgrades to a {@link RunnableSnippet}
 * (static Shiki HTML + a "Run" button that dispatches the code into the global
 * editor). Non-runnable fences render as a static, dual-theme highlighted block
 * so prose code still looks consistent.
 */
export async function MdxPre(props: MdxPreProps) {
  const codeChild = findCodeChild(props.children);

  // Not a fenced code block (rare) — render a plain styled block.
  if (!codeChild) {
    return (
      <pre className="not-prose my-6 overflow-x-auto rounded-lg border border-border bg-surface p-4 text-sm">
        {props.children}
      </pre>
    );
  }

  const codeProps = codeChild.props as {
    className?: string;
    children?: ReactNode;
  };
  const fence = /language-([\w+#-]+)/
    .exec(codeProps.className ?? "")?.[1]
    ?.toLowerCase();
  const raw = nodeToText(codeProps.children).replace(/\n$/, "");
  const runnableId = fence ? LANG_ALIASES[fence] : undefined;

  // Runnable language → interactive snippet with a Run button.
  if (runnableId && getLanguage(runnableId)) {
    return <RunnableSnippet code={raw} language={runnableId} />;
  }

  // Otherwise → static, highlighted block (no Run button).
  const html = await highlightCode(raw, fence ?? "text");
  return (
    <div className="not-prose my-6 overflow-hidden rounded-lg border border-border bg-surface">
      {fence ? (
        <div className="border-b border-border bg-surface-hover px-4 py-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted">
            {fence}
          </span>
        </div>
      ) : null}
      <div
        className="overflow-x-auto"
        // Shiki output is generated at build time from trusted MDX source.
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}

export default MdxPre;
