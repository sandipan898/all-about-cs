"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, Clock, HardDrive } from "lucide-react";
import {
  CATEGORIES,
  getAlgorithmsByCategory,
} from "@/lib/visualizer/registry";
import type { AlgorithmDef } from "@/lib/visualizer/types";

interface AlgorithmSelectorProps {
  selected: AlgorithmDef;
  onSelect: (id: string) => void;
}

/**
 * `AlgorithmSelector` — a premium grouped dropdown for picking algorithms.
 *
 * Shows the current algorithm with its complexity, and opens a searchable
 * panel with category-grouped options, descriptions, and badges.
 */
export function AlgorithmSelector({
  selected,
  onSelect,
}: AlgorithmSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  // Focus search on open
  useEffect(() => {
    if (isOpen) {
      searchRef.current?.focus();
      setSearch("");
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen]);

  const handleSelect = (id: string) => {
    onSelect(id);
    setIsOpen(false);
  };

  const filterAlgos = (algos: AlgorithmDef[]) => {
    if (!search.trim()) return algos;
    const q = search.toLowerCase();
    return algos.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q)
    );
  };

  const hasResults = CATEGORIES.some(
    (cat) => filterAlgos(getAlgorithmsByCategory(cat.id)).length > 0
  );

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="group flex w-full cursor-pointer items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-left shadow-sm transition-all hover:border-accent/50 hover:shadow-md"
      >
        {/* Algorithm icon dot */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
          <span className="text-lg font-bold text-accent">
            {selected.name[0]}
          </span>
        </div>

        <div className="flex-1 overflow-hidden">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground sm:text-base">
              {selected.name}
            </span>
            <span className="hidden rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent sm:inline-block">
              {selected.category}
            </span>
          </div>
          <p className="mt-0.5 hidden truncate text-sm text-muted sm:block">
            {selected.description}
          </p>
        </div>

        <div className="hidden shrink-0 flex-col items-end gap-0.5 sm:flex">
          <span className="inline-flex items-center gap-1 text-[11px] text-muted">
            <Clock className="h-3 w-3" />
            {selected.timeComplexity}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] text-muted">
            <HardDrive className="h-3 w-3" />
            {selected.spaceComplexity}
          </span>
        </div>

        <ChevronDown
          className={`h-5 w-5 shrink-0 text-muted transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div
          className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-border bg-surface shadow-xl"
          style={{
            animation: "dropdown-in 150ms ease-out",
          }}
        >
          {/* Search bar */}
          <div className="border-b border-border px-3 py-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search algorithms..."
                className="w-full rounded-lg border border-border bg-surface-hover py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>

          {/* Algorithm list */}
          <div className="max-h-[360px] overflow-y-auto overscroll-contain p-2">
            {!hasResults && (
              <p className="px-3 py-6 text-center text-sm text-muted">
                No algorithms match &ldquo;{search}&rdquo;
              </p>
            )}

            {CATEGORIES.map((cat) => {
              const algos = filterAlgos(getAlgorithmsByCategory(cat.id));
              if (algos.length === 0) return null;
              return (
                <div key={cat.id} className="mb-1">
                  <div className="px-3 pb-1 pt-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                      {cat.label}
                    </span>
                  </div>
                  {algos.map((algo) => {
                    const isActive = algo.id === selected.id;
                    return (
                      <button
                        key={algo.id}
                        type="button"
                        onClick={() => handleSelect(algo.id)}
                        className={`group/item flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                          isActive
                            ? "bg-accent/10 text-foreground"
                            : "text-foreground hover:bg-surface-hover"
                        }`}
                      >
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-sm font-bold ${
                            isActive
                              ? "bg-accent text-white"
                              : "bg-surface-hover text-muted group-hover/item:bg-accent/10 group-hover/item:text-accent"
                          }`}
                        >
                          {algo.name[0]}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {algo.name}
                            </span>
                            {isActive && (
                              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                            )}
                          </div>
                          <p className="truncate text-xs text-muted">
                            {algo.description}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <span className="block text-[10px] text-muted">
                            {algo.timeComplexity}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Footer hint */}
          <div className="border-t border-border px-3 py-2">
            <p className="text-center text-[11px] text-muted">
              {CATEGORIES.reduce(
                (sum, cat) => sum + getAlgorithmsByCategory(cat.id).length,
                0
              )}{" "}
              algorithms available · More coming soon
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
