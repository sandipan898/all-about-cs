import { getLanguage } from "@/lib/playground/languages";
import { highlightCode } from "@/lib/shiki";
import { SnippetRunner } from "./snippet-runner";

interface RunnableSnippetProps {
  /** Source code (from MDX). */
  code: string;
  /** Registry language id (python, javascript, cpp, …). Defaults to python. */
  language?: string;
  /** Optional caption shown in the snippet header. */
  title?: string;
}

/**
 * `RunnableSnippet` — async server component used inside MDX.
 *
 * It highlights `code` with Shiki **at build/render time** (so the page ships
 * static, crawlable, fully-styled HTML for SEO) and hands that markup to the
 * client {@link SnippetRunner}, which upgrades it to an interactive editor on
 * demand. Python/JS run in the browser; compiled languages dispatch to the
 * `/api/execute` proxy — the routing is resolved from the language registry.
 *
 * @example
 * <RunnableSnippet language="python" code={`print("hello")`} />
 */
export async function RunnableSnippet({
  code,
  language = "python",
  title,
}: RunnableSnippetProps) {
  const source = (code ?? "").replace(/\n$/, "");
  const lang = getLanguage(language);
  const shikiLang = lang?.shiki ?? "text";
  const highlightedHtml = await highlightCode(source, shikiLang);

  return (
    <SnippetRunner
      code={source}
      language={lang ? lang.id : "text"}
      highlightedHtml={highlightedHtml}
      title={title}
    />
  );
}

export default RunnableSnippet;
