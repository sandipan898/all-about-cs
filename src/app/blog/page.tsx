import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Blog — Engineering & Learning Insights",
  description:
    "Engineering insights, career advice, and computer science learning guides from the All About CS team.",
  alternates: { canonical: "/blog" },
};

export default function BlogPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-border bg-surface/40 p-8 text-center backdrop-blur-md sm:p-12">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-hover text-foreground shadow-inner">
          <BookOpen className="h-7 w-7 text-primary" />
        </div>

        <span className="mt-6 inline-block rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted">
          Coming Soon
        </span>

        <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          The All About CS Blog
        </h1>

        <p className="mx-auto mt-3 max-w-xl text-base text-muted sm:text-lg">
          In-depth engineering articles, architecture deep-dives, software career advice, and platform updates are coming soon.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/tutorials"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-transform hover:scale-105"
          >
            Browse Tutorials
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}
