"use client";

import { useId, useMemo, type KeyboardEvent } from "react";
import type { PlaygroundLanguage } from "@/lib/playground/types";

/**
 * Dependency-free syntax highlighter.
 *
 * We deliberately avoid pulling Monaco / CodeMirror (megabytes + a wide
 * dependency tree) to preserve the platform's zero-vulnerability, minimal
 * footprint. Instead a controlled <textarea> is layered transparently over a
 * highlighted <pre> mirror — the classic lightweight code-editor technique.
 *
 * The tokenizer is intentionally small: keywords, strings, comments and
 * numbers. That is more than enough fidelity for short educational snippets.
 */

const KEYWORDS: Record<PlaygroundLanguage, Set<string>> = {
  python: new Set([
    "False", "None", "True", "and", "as", "assert", "async", "await", "break",
    "class", "continue", "def", "del", "elif", "else", "except", "finally",
    "for", "from", "global", "if", "import", "in", "is", "lambda", "nonlocal",
    "not", "or", "pass", "raise", "return", "try", "while", "with", "yield",
    "print", "range", "len", "self",
  ]),
  javascript: new Set([
    "await", "async", "break", "case", "catch", "class", "const", "continue",
    "debugger", "default", "delete", "do", "else", "export", "extends",
    "finally", "for", "function", "if", "import", "in", "instanceof", "let",
    "new", "of", "return", "super", "switch", "this", "throw", "try", "typeof",
    "var", "void", "while", "yield", "true", "false", "null", "undefined",
    "console",
  ]),
};

/** Escape HTML so source text can be safely injected into the mirror. */
function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Produce highlighted HTML for a snippet. Order matters: comments and strings
 * are consumed first so their inner contents are never re-tokenized.
 */
function highlight(code: string, language: PlaygroundLanguage): string {
  const keywords = KEYWORDS[language];
  const commentStart = language === "python" ? "#" : "//";

  // Token regex: line comment | block comment (JS) | string | number | word.
  const pattern =
    language === "python"
      ? /(#[^\n]*)|("""[\s\S]*?"""|'''[\s\S]*?'''|"[^"\n]*"|'[^'\n]*')|(\b\d+(?:\.\d+)?\b)|([A-Za-z_]\w*)/g
      : /(\/\/[^\n]*)|(\/\*[\s\S]*?\*\/)|("[^"\n]*"|'[^'\n]*'|`[^`]*`)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)/g;

  let out = "";
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(code)) !== null) {
    out += escapeHtml(code.slice(last, match.index));
    last = pattern.lastIndex;

    const [raw, comment, comment2OrStr, strOrNum, num, word] = match;
    // Group layout differs slightly between the two regexes; normalize.
    const isComment = raw.startsWith(commentStart) || raw.startsWith("/*");
    const isString = /^["'`]/.test(raw);
    const isNumber = /^\d/.test(raw);

    if (isComment) {
      out += `<span class="text-muted italic">${escapeHtml(raw)}</span>`;
    } else if (isString) {
      out += `<span class="text-emerald-600 dark:text-emerald-400">${escapeHtml(raw)}</span>`;
    } else if (isNumber) {
      out += `<span class="text-amber-600 dark:text-amber-400">${escapeHtml(raw)}</span>`;
    } else if (keywords.has(raw)) {
      out += `<span class="text-accent font-medium">${escapeHtml(raw)}</span>`;
    } else {
      out += escapeHtml(raw);
    }
    // Silence unused-destructure lint without changing behavior.
    void comment;
    void comment2OrStr;
    void strOrNum;
    void num;
    void word;
  }
  out += escapeHtml(code.slice(last));
  // Trailing newline keeps the mirror height in sync with the textarea.
  return out + "\n";
}

interface CodeEditorProps {
  value: string;
  language: PlaygroundLanguage;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const SHARED_TEXT =
  "m-0 whitespace-pre font-mono text-[13px] leading-[1.6] tab-[2]";

export function CodeEditor({
  value,
  language,
  onChange,
  disabled,
}: CodeEditorProps) {
  const id = useId();
  const highlighted = useMemo(
    () => highlight(value, language),
    [value, language]
  );
  const lineCount = useMemo(() => value.split("\n").length, [value]);

  /** Insert two spaces on Tab instead of moving focus. */
  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== "Tab") return;
    e.preventDefault();
    const ta = e.currentTarget;
    const { selectionStart, selectionEnd } = ta;
    const next =
      value.slice(0, selectionStart) + "  " + value.slice(selectionEnd);
    onChange(next);
    // Restore caret just after the inserted indentation.
    requestAnimationFrame(() => {
      ta.selectionStart = ta.selectionEnd = selectionStart + 2;
    });
  }

  return (
    <div className="flex max-h-[60vh] overflow-auto bg-surface">
      {/* Gutter */}
      <div
        aria-hidden
        className={`${SHARED_TEXT} select-none border-r border-border px-3 py-3 text-right text-muted`}
      >
        {Array.from({ length: lineCount }, (_, i) => (
          <div key={i}>{i + 1}</div>
        ))}
      </div>

      {/* Editor: transparent textarea over highlighted mirror */}
      <div className="relative min-w-0 flex-1">
        <pre aria-hidden className={`${SHARED_TEXT} px-4 py-3`}>
          <code dangerouslySetInnerHTML={{ __html: highlighted }} />
        </pre>
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          aria-label={`${language} code editor`}
          className={`${SHARED_TEXT} absolute inset-0 resize-none overflow-hidden bg-transparent px-4 py-3 text-transparent caret-foreground outline-none`}
        />
      </div>
    </div>
  );
}
