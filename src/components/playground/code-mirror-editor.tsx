"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { EditorState, Compartment } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { defaultKeymap, indentWithTab } from "@codemirror/commands";
import { basicSetup } from "codemirror";
import { oneDark } from "@codemirror/theme-one-dark";
import type { LanguageSupport } from "@codemirror/language";

interface CodeMirrorEditorProps {
  value: string;
  onChange?: (value: string) => void;
  /** Registry language id (python, javascript, cpp, …). */
  language: string;
  /** Optional fixed min-height for the editor surface. */
  minHeight?: string;
  /** Optional aria-label for accessibility. */
  ariaLabel?: string;
}

/** Lazily load the CodeMirror language extension for a registry id. */
async function loadLanguage(id: string): Promise<LanguageSupport | null> {
  switch (id) {
    case "python":
      return (await import("@codemirror/lang-python")).python();
    case "javascript":
      return (await import("@codemirror/lang-javascript")).javascript();
    case "typescript":
      return (await import("@codemirror/lang-javascript")).javascript({
        typescript: true,
      });
    case "cpp":
    case "c":
      return (await import("@codemirror/lang-cpp")).cpp();
    case "java":
      return (await import("@codemirror/lang-java")).java();
    case "rust":
      return (await import("@codemirror/lang-rust")).rust();
    case "go":
      return (await import("@codemirror/lang-go")).go();
    case "php":
      return (await import("@codemirror/lang-php")).php();
    case "sql":
      return (await import("@codemirror/lang-sql")).sql();
    default:
      return null;
  }
}

/**
 * `CodeMirrorEditor` — a controlled CodeMirror 6 instance.
 *
 * Language grammar and theme live in {@link Compartment}s so they can be
 * reconfigured in place (language switch / light-dark toggle) without tearing
 * down the view. The dark theme uses `@codemirror/theme-one-dark`; light mode
 * uses CodeMirror's default light theme, synced to `next-themes`.
 */
export function CodeMirrorEditor({
  value,
  onChange,
  language,
  minHeight = "8rem",
  ariaLabel = "Code editor",
}: CodeMirrorEditorProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const langCompartment = useRef(new Compartment());
  const themeCompartment = useRef(new Compartment());
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // Create the view once.
  useEffect(() => {
    if (!hostRef.current || viewRef.current) return;

    const state = EditorState.create({
      doc: value,
      extensions: [
        basicSetup,
        keymap.of([...defaultKeymap, indentWithTab]),
        langCompartment.current.of([]),
        themeCompartment.current.of(isDark ? oneDark : []),
        EditorView.theme({
          "&": { minHeight, fontSize: "13px" },
          ".cm-scroller": {
            fontFamily:
              "var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace)",
          },
          "&.cm-focused": { outline: "none" },
        }),
        EditorView.updateListener.of((u) => {
          if (u.docChanged) onChangeRef.current?.(u.state.doc.toString());
        }),
        EditorView.contentAttributes.of({ "aria-label": ariaLabel }),
      ],
    });

    const view = new EditorView({ state, parent: hostRef.current });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // Intentionally run once — subsequent prop changes are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load / swap the language grammar when `language` changes.
  useEffect(() => {
    let cancelled = false;
    loadLanguage(language).then((support) => {
      if (cancelled || !viewRef.current) return;
      viewRef.current.dispatch({
        effects: langCompartment.current.reconfigure(support ? support : []),
      });
    });
    return () => {
      cancelled = true;
    };
  }, [language]);

  // Swap the theme when light/dark changes.
  useEffect(() => {
    if (!viewRef.current) return;
    viewRef.current.dispatch({
      effects: themeCompartment.current.reconfigure(isDark ? oneDark : []),
    });
  }, [isDark]);

  // Keep the document in sync if `value` is changed externally (e.g. reset,
  // language-switch seeding) — but not on every keystroke (guarded by equality).
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (value !== current) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      });
    }
  }, [value]);

  return (
    <div
      ref={hostRef}
      className="overflow-hidden rounded-md border border-border bg-surface text-left"
    />
  );
}

export default CodeMirrorEditor;
