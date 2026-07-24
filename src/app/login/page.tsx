import type { Metadata } from "next";
import Link from "next/link";
import { LogIn, ArrowRight, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Login & Signup — Coming Soon",
  description:
    "Log in or create an account on All About CS to save learning progress, bookmark tutorials, and unlock Pro features.",
  alternates: { canonical: "/login" },
};

export default function LoginPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-border bg-surface/40 p-8 text-center backdrop-blur-md sm:p-12">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-hover text-foreground shadow-inner">
          <LogIn className="h-7 w-7 text-primary" />
        </div>

        <span className="mt-6 inline-block rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
          Coming Soon
        </span>

        <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Account Login & Registration
        </h1>

        <p className="mx-auto mt-3 max-w-xl text-base text-muted sm:text-lg">
          We're adding user accounts to let you track completed lessons, save custom code snippets, and sync learning progress across devices.
        </p>

        <div className="mt-8 inline-flex items-center gap-2 text-xs font-medium text-muted">
          <Sparkles className="h-4 w-4 text-primary" />
          <span>Currently, all tutorials and code playgrounds remain 100% free with no account required!</span>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/tutorials"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-transform hover:scale-105"
          >
            Start Learning Free
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}
