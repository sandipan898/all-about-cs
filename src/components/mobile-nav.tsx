"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  BookOpen,
  GraduationCap,
  Layers,
  Info,
  Sparkles,
  LogIn,
  Search,
} from "lucide-react";
import { useSearch } from "./search-trigger";
import { ThemeToggle } from "./theme-toggle";

const navLinks = [
  { href: "/tutorials", label: "Tutorials", icon: GraduationCap },
  { href: "/topics", label: "Topics", icon: Layers },
  { href: "/about", label: "About", icon: Info },
];

function DrawerPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { openSearch } = useSearch();

  const close = useCallback(() => setOpen(false), []);

  const openSearchAndClose = useCallback(() => {
    close();
    openSearch();
  }, [close, openSearch]);

  useEffect(() => {
    close();
  }, [pathname, close]);

  useEffect(() => {
    if (!open) return;

    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  return (
    <>
      {/* Hamburger trigger — visible only below md */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
        className="inline-flex items-center justify-center rounded-lg p-2 text-muted transition-colors hover:bg-surface hover:text-foreground md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Portal renders directly on body — escapes all parent stacking contexts */}
      <DrawerPortal>
        <div
          className={`fixed inset-0 z-[100] md:hidden transition-visibility ${
            open ? "visible" : "invisible"
          }`}
          style={{ transitionDuration: open ? "0ms" : "300ms" }}
        >
          {/* Full-screen blurred backdrop */}
          <div
            className={`absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity duration-300 ${
              open ? "opacity-100" : "opacity-0"
            }`}
            onClick={close}
            aria-hidden="true"
          />

          {/* Drawer panel */}
          <nav
            className={`absolute right-0 top-0 bottom-0 flex w-[280px] max-w-[85vw] flex-col border-l border-border/60 bg-surface/95 backdrop-blur-xl shadow-[-8px_0_30px_rgba(0,0,0,0.5)] transition-transform duration-300 ease-out ${
              open ? "translate-x-0" : "translate-x-full"
            }`}
          >
            {/* ── Header ── */}
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-5">
              <Link
                href="/"
                onClick={close}
                className="flex items-center gap-2"
              >
                <BookOpen className="h-5 w-5 text-primary" />
                <span className="text-base font-bold tracking-tight">
                  All About <span className="text-primary">CS</span>
                </span>
              </Link>
              <div className="flex items-center gap-1">
                <ThemeToggle />
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close navigation menu"
                  className="rounded-lg p-1.5 text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* ── Search row ── */}
            <div className="border-b border-border px-4 py-3">
              <button
                type="button"
                onClick={openSearchAndClose}
                className="flex w-full items-center gap-3 rounded-xl border border-border/60 bg-background/50 px-3 py-2.5 text-left text-sm text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
              >
                <Search className="h-4 w-4 shrink-0" />
                <span>Search tutorials…</span>
              </button>
            </div>

            {/* ── Navigation links card ── */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="rounded-xl border border-border/60 bg-background/50 p-2">
                <p className="mb-2 px-3 pt-1 text-[11px] font-semibold uppercase tracking-widest text-muted/60">
                  Menu
                </p>
                <ul className="space-y-0.5">
                  {navLinks.map(({ href, label, icon: Icon }) => {
                    const isActive =
                      pathname === href || pathname.startsWith(href + "/");
                    return (
                      <li key={href}>
                        <Link
                          href={href}
                          onClick={close}
                          className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors ${
                            isActive
                              ? "bg-primary/10 text-primary"
                              : "text-foreground hover:bg-surface-hover"
                          }`}
                        >
                          <Icon
                            className={`h-[18px] w-[18px] ${
                              isActive ? "text-primary" : "text-muted"
                            }`}
                          />
                          {label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>

            {/* ── Bottom actions ── */}
            <div className="shrink-0 border-t border-border p-4 space-y-2.5">
              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/20"
              >
                <Sparkles className="h-4 w-4" />
                Go Pro
              </button>
              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-medium text-muted transition-colors hover:border-foreground/20 hover:text-foreground"
              >
                <LogIn className="h-4 w-4" />
                Login
              </button>
            </div>
          </nav>
        </div>
      </DrawerPortal>
    </>
  );
}
