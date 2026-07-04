"use client";

import { useMemo } from "react";

interface CodePanelProps {
  code: string;
  activeLine: number;
}

/** Token types for basic syntax highlighting. */
type TokenType = "keyword" | "string" | "comment" | "number" | "fn" | "plain";

interface Token {
  type: TokenType;
  text: string;
}

const KEYWORDS = new Set([
  "function", "const", "let", "var", "if", "else", "for", "while", "return",
  "new", "class", "import", "export", "default", "from", "of", "in",
  "true", "false", "null", "undefined", "this", "break", "continue",
  "switch", "case", "throw", "try", "catch", "finally", "typeof",
  "async", "await", "yield",
]);

const TOKEN_COLORS: Record<TokenType, string> = {
  keyword: "#c678dd",    // purple
  string: "#98c379",     // green
  comment: "#5c6370",    // grey
  number: "#d19a66",     // orange
  fn: "#61afef",         // blue
  plain: "#abb2bf",      // default text
};

/** Simple line tokenizer — handles keywords, strings, comments, numbers. */
function tokenizeLine(line: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < line.length) {
    // Single-line comment
    if (line[i] === "/" && line[i + 1] === "/") {
      tokens.push({ type: "comment", text: line.slice(i) });
      break;
    }

    // Strings
    if (line[i] === '"' || line[i] === "'" || line[i] === "`") {
      const quote = line[i];
      let j = i + 1;
      while (j < line.length && line[j] !== quote) {
        if (line[j] === "\\") j++; // skip escaped
        j++;
      }
      tokens.push({ type: "string", text: line.slice(i, j + 1) });
      i = j + 1;
      continue;
    }

    // Numbers
    if (/\d/.test(line[i]) && (i === 0 || /[\s(,=<>+\-*/[]/.test(line[i - 1]))) {
      let j = i;
      while (j < line.length && /[\d.]/.test(line[j])) j++;
      tokens.push({ type: "number", text: line.slice(i, j) });
      i = j;
      continue;
    }

    // Words (identifiers / keywords)
    if (/[a-zA-Z_$]/.test(line[i])) {
      let j = i;
      while (j < line.length && /[a-zA-Z0-9_$]/.test(line[j])) j++;
      const word = line.slice(i, j);
      if (KEYWORDS.has(word)) {
        tokens.push({ type: "keyword", text: word });
      } else if (j < line.length && line[j] === "(") {
        tokens.push({ type: "fn", text: word });
      } else {
        tokens.push({ type: "plain", text: word });
      }
      i = j;
      continue;
    }

    // Everything else (operators, parens, spaces, etc.)
    tokens.push({ type: "plain", text: line[i] });
    i++;
  }

  return tokens;
}

/**
 * `CodePanel` — displays the algorithm source with syntax highlighting
 * and active-line indicator.
 *
 * Uses a lightweight built-in tokenizer (no external deps) that highlights
 * keywords, strings, comments, numbers, and function calls. The active line
 * gets a highlighted background that follows the current animation step.
 */
export function CodePanel({ code, activeLine }: CodePanelProps) {
  const lines = useMemo(() => code.split("\n"), [code]);
  const tokenizedLines = useMemo(
    () => lines.map((line) => tokenizeLine(line)),
    [lines]
  );

  return (
    <div className="overflow-auto rounded-lg border border-border bg-[#282c34] text-[13px] leading-relaxed">
      <div className="p-3">
        {tokenizedLines.map((tokens, i) => (
          <div
            key={i}
            className={`flex rounded px-2 py-0.5 font-mono transition-colors duration-200 ${
              i === activeLine ? "bg-accent/20" : ""
            }`}
          >
            <span className="mr-3 inline-block w-5 shrink-0 select-none text-right text-[10px] text-[#5c6370]">
              {i + 1}
            </span>
            <span className="whitespace-pre">
              {tokens.length === 0 ? " " : null}
              {tokens.map((token, j) => (
                <span key={j} style={{ color: TOKEN_COLORS[token.type] }}>
                  {token.text}
                </span>
              ))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
