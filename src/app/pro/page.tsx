import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles, CheckCircle2, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Pro Membership — Coming Soon",
  description:
    "Upgrade your learning experience with All About CS Pro. Premium course tracks, verified certificates, AI tutoring, and cloud execution environments.",
  alternates: { canonical: "/pro" },
};

const proFeatures = [
  "Advanced System Design & DSA Certificate Tracks",
  "AI-Powered Real-Time Code Review & Tutoring",
  "Unlimited Cloud Execution Environments & Workspaces",
  "Ad-Free Learning & Downloadable Offline Content",
];

export default function ProPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-primary/30 bg-surface/40 p-8 text-center backdrop-blur-md sm:p-12">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
          <Sparkles className="h-7 w-7" />
        </div>

        <span className="mt-6 inline-block rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
          Coming Soon
        </span>

        <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          All About CS Pro
        </h1>

        <p className="mx-auto mt-3 max-w-xl text-base text-muted sm:text-lg">
          We're building an elite learning experience to help you master Computer Science, System Design, and Algorithms faster.
        </p>

        <div className="mx-auto mt-8 max-w-md text-left">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
            What's Included in Pro:
          </h2>
          <ul className="mt-4 space-y-3">
            {proFeatures.map((feature) => (
              <li key={feature} className="flex items-start gap-3 text-sm text-foreground">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/tutorials"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-transform hover:scale-105"
          >
            Explore Free Tutorials
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}
