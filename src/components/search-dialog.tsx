"use client";

import {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
  type KeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { Search, FileText } from "lucide-react";

const RESULT_LIMIT = 8;
const SNIPPET_LENGTH = 60;

interface SearchEntry {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  headings: string[];
  body: string;
  category: "tutorial";
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const re = new RegExp(`(${escapeRegex(query)})`, "gi");
  const parts = text.split(re);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <mark key={i} className="rounded bg-primary/30 font-medium text-primary">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

function getSnippet(entry: SearchEntry, query: string): string {
  const q = query.trim().toLowerCase();
  if (!q) return entry.description;
  if (entry.title.toLowerCase().includes(q)) return entry.title;
  if (entry.description.toLowerCase().includes(q)) return entry.description;
  const inBody = entry.body.toLowerCase().indexOf(q);
  if (inBody === -1) return entry.description;
  const start = Math.max(0, inBody - SNIPPET_LENGTH / 2);
  const end = Math.min(entry.body.length, inBody + q.length + SNIPPET_LENGTH / 2);
  let snippet = entry.body.slice(start, end);
  if (start > 0) snippet = "…" + snippet;
  if (end < entry.body.length) snippet = snippet + "…";
  return snippet;
}

function searchEntries(index: SearchEntry[], query: string): SearchEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const results: SearchEntry[] = [];
  for (const entry of index) {
    const inTitle = entry.title.toLowerCase().includes(q);
    const inDesc = entry.description.toLowerCase().includes(q);
    const inTags = entry.tags.some((t) => t.toLowerCase().includes(q));
    const inHeadings = entry.headings.some((h) => h.toLowerCase().includes(q));
    const inBody = entry.body.toLowerCase().includes(q);
    if (inTitle || inDesc || inTags || inHeadings || inBody) {
      results.push(entry);
      if (results.length >= RESULT_LIMIT) break;
    }
  }
  return results;
}

function SearchDialogPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}

interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
}

export function SearchDialog({ open, onClose }: SearchDialogProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [index, setIndex] = useState<SearchEntry[] | null>(null);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const results = useMemo(() => {
    if (!index) return [];
    return searchEntries(index, query);
  }, [index, query]);

  const navigateTo = useCallback(
    (slug: string) => {
      onClose();
      setQuery("");
      setSelectedIndex(0);
      router.push(`/tutorials/${slug}`);
    },
    [onClose, router]
  );

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setSelectedIndex(0);
    inputRef.current?.focus();
    if (index === null) {
      fetch("/search-index.json")
        .then((r) => r.json())
        .then(setIndex)
        .catch(() => setIndex([]));
    }
  }, [open, index]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      navigateTo(results[selectedIndex].slug);
    }
  };

  if (!open) return null;

  return (
    <SearchDialogPortal>
      <div className="fixed inset-0 z-[110]" role="dialog" aria-modal="true" aria-label="Search">
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />
        <div className="fixed left-1/2 top-[15%] w-full max-w-xl -translate-x-1/2 px-4">
          <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-2xl">
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <Search className="h-5 w-5 shrink-0 text-muted" />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search tutorials..."
                className="min-w-0 flex-1 bg-transparent text-foreground placeholder:text-muted focus:outline-none"
                autoComplete="off"
                aria-autocomplete="list"
                aria-controls="search-results"
                aria-activedescendant={
                  results[selectedIndex]
                    ? `search-result-${selectedIndex}`
                    : undefined
                }
              />
              <kbd className="hidden rounded border border-border bg-background px-2 py-0.5 text-[10px] text-muted sm:inline-block">
                ESC
              </kbd>
            </div>

            <div
              id="search-results"
              className="max-h-[min(60vh,400px)] overflow-y-auto py-2"
              role="listbox"
            >
              {index === null ? (
                <p className="px-4 py-6 text-center text-sm text-muted">
                  Loading index…
                </p>
              ) : !query.trim() ? (
                <p className="px-4 py-6 text-center text-sm text-muted">
                  Start typing to search…
                </p>
              ) : results.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-muted">
                  No results found.
                </p>
              ) : (
                <>
                  <p className="mb-1 px-4 py-1 text-[11px] font-semibold uppercase tracking-widest text-muted/80">
                    Tutorials
                  </p>
                  {results.map((entry, i) => {
                    const isSelected = i === selectedIndex;
                    const snippet = getSnippet(entry, query);
                    return (
                      <button
                        key={entry.slug}
                        id={`search-result-${i}`}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        className={`flex w-full items-start gap-3 px-4 py-2.5 text-left transition-colors ${
                          isSelected ? "bg-primary/10" : "hover:bg-surface-hover"
                        }`}
                        onMouseEnter={() => setSelectedIndex(i)}
                        onClick={() => navigateTo(entry.slug)}
                      >
                        <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-foreground">
                            {highlightMatch(entry.title, query)}
                          </div>
                          <div className="mt-0.5 line-clamp-1 text-xs text-muted">
                            {highlightMatch(snippet, query)}
                          </div>
                          {entry.tags.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {entry.tags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </SearchDialogPortal>
  );
}
