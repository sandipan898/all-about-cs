"use client";

import { Play } from "lucide-react";
import { getLanguage } from "@/lib/playground/languages";
import { useGlobalRunner } from "./global-runner-context";

interface SnippetRunnerProps {
  /** Raw source (dispatched into the global runner on Run). */
  code: string;
  /** Registry language id. */
  language: string;
  /** Pre-rendered Shiki HTML for the static (SEO) view. */
  highlightedHtml: string;
  /** Optional caption shown in the header. */
  title?: string;
}

/**
 * `SnippetRunner` — the in-blog code block trigger.
 *
 * It renders the static, build-time-highlighted Shiki block (great for SEO and
 * zero JS cost) plus a single "Run" button. Clicking Run no longer hydrates a
 * local editor — it dispatches this snippet's `code` + `language` into the
 * page-level {@link useGlobalRunner} drawer, which holds the ONE editor +
 * runtime shared by every snippet on the page.
 */
export function SnippetRunner({
  code,
  language,
  highlightedHtml,
  title,
}: SnippetRunnerProps) {
  const { open } = useGlobalRunner();
  const lang = getLanguage(language);
  const label = lang?.label ?? language;

  return (
    <div className="not-prose my-6 overflow-hidden rounded-lg border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border bg-surface-hover px-4 py-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">
          {title ? title : label}
        </span>
        <button
          type="button"
          onClick={() => open({ code, language, title })}
          className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-primary"
        >
          <Play className="h-3.5 w-3.5" />
          Run
        </button>
      </div>

      <div
        className="overflow-x-auto"
        // Shiki output is generated at build time from trusted MDX source.
        dangerouslySetInnerHTML={{ __html: highlightedHtml }}
      />
    </div>
  );
}
