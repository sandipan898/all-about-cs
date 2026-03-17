"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { Search } from "lucide-react";
import { SearchDialog } from "./search-dialog";

interface SearchContextValue {
  openSearch: () => void;
}

const SearchContext = createContext<SearchContextValue | null>(null);

export function useSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error("useSearch must be used within SearchProvider");
  return ctx;
}

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const openSearch = useCallback(() => setOpen(true), []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <SearchContext.Provider value={{ openSearch }}>
      <SearchDialog open={open} onClose={() => setOpen(false)} />
      {children}
    </SearchContext.Provider>
  );
}

const isMac =
  typeof navigator !== "undefined" &&
  /Mac|iPod|iPhone|iPad/.test(navigator.platform);

export function SearchTrigger() {
  const { openSearch } = useSearch();

  return (
    <button
      type="button"
      onClick={openSearch}
      aria-label="Open search"
      className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface/50 px-3 py-1.5 text-sm text-muted transition-colors hover:border-foreground/20 hover:text-foreground"
    >
      <Search className="h-4 w-4 shrink-0" />
      <span className="hidden sm:inline">Search…</span>
      <kbd className="hidden rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted sm:inline-block">
        {isMac ? "⌘" : "Ctrl"} K
      </kbd>
    </button>
  );
}
