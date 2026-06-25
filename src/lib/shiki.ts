import "server-only";

import {
  createHighlighter,
  type Highlighter,
} from "shiki";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import { SHIKI_LANGS } from "./playground/languages";

/**
 * Build-time syntax highlighter (singleton).
 *
 * Uses Shiki's pure-JavaScript regex engine instead of the WASM Oniguruma
 * engine, so highlighting works in any serverless / edge runtime without
 * bundling a WASM binary. Two themes are loaded with `defaultColor: false`,
 * which emits BOTH colors as CSS variables (`--shiki-light` / `--shiki-dark`)
 * on every token — letting the dark-mode swap happen purely in CSS with zero
 * client JS. See `globals.css` for the `.shiki` dual-theme rules.
 */

let highlighterPromise: Promise<Highlighter> | null = null;

export const SHIKI_THEMES = {
  light: "github-light",
  dark: "github-dark",
} as const;

function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: [SHIKI_THEMES.light, SHIKI_THEMES.dark],
      langs: SHIKI_LANGS,
      engine: createJavaScriptRegexEngine(),
    });
  }
  return highlighterPromise;
}

/**
 * Highlight `code` to a static, SEO-friendly `<pre class="shiki">…</pre>`
 * string with dual-theme CSS variables. Falls back to a plain escaped block
 * for unknown grammars so it can never throw at render time.
 */
export async function highlightCode(
  code: string,
  shikiLang: string
): Promise<string> {
  const highlighter = await getHighlighter();
  const loaded = highlighter.getLoadedLanguages();
  const lang = loaded.includes(shikiLang) ? shikiLang : "text";
  return highlighter.codeToHtml(code, {
    lang,
    themes: SHIKI_THEMES,
    defaultColor: false,
  });
}
