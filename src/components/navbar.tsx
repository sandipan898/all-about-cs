import Link from "next/link";
import Image from "next/image";
import { Sparkles, LogIn } from "lucide-react";
import { MobileNav } from "./mobile-nav";
import { SearchTrigger } from "./search-trigger";
import { ThemeToggle } from "./theme-toggle";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <Image
            src="/logo.png"
            alt="All About CS logo"
            width={32}
            height={32}
            priority
            className="h-8 w-8 rounded-full transition-transform group-hover:scale-110"
          />
          <span className="text-lg font-bold tracking-tight">
            All About <span className="text-primary">CS</span>
          </span>
        </Link>

        {/* Desktop center nav — hidden on mobile */}
        <ul className="hidden items-center gap-8 text-sm font-medium md:flex">
          <li>
            <Link
              href="/tutorials"
              className="text-muted transition-colors hover:text-foreground"
            >
              Tutorials
            </Link>
          </li>
          <li>
            <Link
              href="/topics"
              className="text-muted transition-colors hover:text-foreground"
            >
              Topics
            </Link>
          </li>
          <li>
            <Link
              href="/playground"
              className="text-muted transition-colors hover:text-foreground"
            >
              Playground
            </Link>
          </li>
          <li>
            <Link
              href="/about"
              className="text-muted transition-colors hover:text-foreground"
            >
              About
            </Link>
          </li>
        </ul>

        {/* Search + Theme + Desktop actions — hidden on mobile */}
        <div className="hidden items-center gap-3 md:flex">
          <SearchTrigger />
          <ThemeToggle />
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-3.5 py-1.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/20"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Go Pro
          </button>

          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-1.5 text-sm font-medium text-muted transition-colors hover:border-foreground/20 hover:text-foreground"
          >
            <LogIn className="h-3.5 w-3.5" />
            Login
          </button>
        </div>

        {/* Mobile: search + theme + hamburger — visible only below md */}
        <div className="flex items-center gap-1 md:hidden">
          <SearchTrigger />
          <ThemeToggle />
          <MobileNav />
        </div>
      </nav>
    </header>
  );
}
