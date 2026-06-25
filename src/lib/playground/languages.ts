/**
 * Language registry — the single source of truth for the Hybrid Execution
 * Architecture. Every surface (RunnableSnippet, the /playground IDE, the
 * `useCodeRunner` hook, and the `/api/execute` proxy) resolves capabilities
 * from this map so adding a language is a one-line change.
 */

import type { ExecutionTarget } from "./types";

export interface LanguageDef {
  /** Stable id used in MDX (`language="..."`) and the registry key. */
  id: string;
  /** Human label shown in the playground language selector. */
  label: string;
  /** Where this language executes. */
  target: ExecutionTarget;
  /** Shiki grammar id used for static build-time highlighting. */
  shiki: string;
  /**
   * Wandbox language label (e.g. "C++", "Go"). Required for `server` targets;
   * omitted for client targets that run entirely in the browser (Python / JS).
   * The proxy resolves the newest available compiler for this label at runtime.
   */
  wandbox?: string;
  /** Seed code shown in the standalone playground for this language. */
  defaultCode: string;
}

export const LANGUAGES: Record<string, LanguageDef> = {
  python: {
    id: "python",
    label: "Python",
    target: "client-python",
    shiki: "python",
    defaultCode: `def greet(name):
    return f"Hello, {name}!"


print(greet("world"))
`,
  },
  javascript: {
    id: "javascript",
    label: "JavaScript",
    target: "client-js",
    shiki: "javascript",
    defaultCode: `function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet("world"));
`,
  },
  typescript: {
    id: "typescript",
    label: "TypeScript",
    target: "server",
    shiki: "typescript",
    wandbox: "TypeScript",
    defaultCode: `function greet(name: string): string {
  return \`Hello, \${name}!\`;
}

console.log(greet("world"));
`,
  },
  cpp: {
    id: "cpp",
    label: "C++",
    target: "server",
    shiki: "cpp",
    wandbox: "C++",
    defaultCode: `#include <iostream>

int main() {
    std::cout << "Hello, world!" << std::endl;
    return 0;
}
`,
  },
  c: {
    id: "c",
    label: "C",
    target: "server",
    shiki: "c",
    wandbox: "C",
    defaultCode: `#include <stdio.h>

int main(void) {
    printf("Hello, world!\\n");
    return 0;
}
`,
  },
  java: {
    id: "java",
    label: "Java",
    target: "server",
    shiki: "java",
    wandbox: "Java",
    defaultCode: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, world!");
    }
}
`,
  },
  go: {
    id: "go",
    label: "Go",
    target: "server",
    shiki: "go",
    wandbox: "Go",
    defaultCode: `package main

import "fmt"

func main() {
    fmt.Println("Hello, world!")
}
`,
  },
  rust: {
    id: "rust",
    label: "Rust",
    target: "server",
    shiki: "rust",
    wandbox: "Rust",
    defaultCode: `fn main() {
    println!("Hello, world!");
}
`,
  },
  php: {
    id: "php",
    label: "PHP",
    target: "server",
    shiki: "php",
    wandbox: "PHP",
    defaultCode: `<?php

echo "Hello, world!\\n";
`,
  },
  sql: {
    id: "sql",
    label: "SQL",
    target: "server",
    shiki: "sql",
    wandbox: "SQL",
    defaultCode: `SELECT 'Hello, world!' AS greeting;
`,
  },
};

/** Ordered list for selector menus. */
export const LANGUAGE_LIST: LanguageDef[] = Object.values(LANGUAGES);

/** Safe lookup; returns `undefined` for unknown ids. */
export function getLanguage(id: string): LanguageDef | undefined {
  return LANGUAGES[id];
}

/** All shiki grammar ids the build-time highlighter must preload. */
export const SHIKI_LANGS: string[] = Array.from(
  new Set(LANGUAGE_LIST.map((l) => l.shiki))
);
