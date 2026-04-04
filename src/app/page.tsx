import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Code2,
  Users,
  Play,
  Calendar,
  Youtube,
} from "lucide-react";
import { getAllTutorials } from "@/lib/mdx";

const features = [
  {
    icon: BookOpen,
    title: "Dual-Mode Learning",
    description:
      "Every tutorial supports Read and Watch modes. Follow the article or pin the video — switch anytime, mid-scroll.",
  },
  {
    icon: Code2,
    title: "Interactive Coding",
    description:
      "Practice directly alongside the lesson. Code examples you can copy, tweak, and run in your own environment.",
  },
  {
    icon: Users,
    title: "Developer Community",
    description:
      "Join thousands of developers leveling up together. Share solutions, ask questions, and grow your network.",
  },
];

export default function HomePage() {
  const tutorials = getAllTutorials().slice(0, 3);

  return (
    <>
      {/* ──────────────────────────────────────────────────────────────
          Hero Section
      ────────────────────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden">
        {/* Background grid + glow */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div
            className="absolute inset-0 opacity-[0.03] dark:opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(to right, var(--color-border) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
          <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/3 h-[500px] w-[800px] rounded-full bg-primary/10 blur-[120px]" />
          <div className="absolute right-1/4 bottom-0 translate-y-1/2 h-[300px] w-[500px] rounded-full bg-accent/8 blur-[100px]" />
        </div>

        <div className="mx-auto flex max-w-4xl flex-col items-center px-6 pb-20 pt-24 text-center sm:pt-32 md:pb-28 md:pt-40">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-4 py-1.5 text-xs font-medium text-muted backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Free tutorials — no signup required
          </div>

          {/* Heading */}
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl">
            Master CS,{" "}
            <span className="bg-gradient-to-r from-primary via-accent to-emerald-400 bg-clip-text text-transparent">
              your way.
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted sm:text-xl">
            Read the article or watch the video — every tutorial supports both.
            No fluff, no ads, just clear explanations of algorithms, data
            structures, and core CS concepts.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
            <Link
              href="/tutorials"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:brightness-110 hover:shadow-xl hover:shadow-primary/30"
            >
              Start Learning
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="hhttps://www.youtube.com/@allaboutcs"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface/60 px-6 py-3 text-sm font-medium text-foreground backdrop-blur-sm transition-colors hover:bg-surface-hover"
            >
              <Youtube className="h-4 w-4 text-red-500" />
              Subscribe on YouTube
            </a>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────
          Value Prop Grid
      ────────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="mb-14 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Why developers choose{" "}
            <span className="text-primary">All About CS</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted">
            Built for people who learn best by doing — not just watching a
            talking head.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="group rounded-2xl border border-border/60 bg-surface/40 p-7 backdrop-blur-sm transition-all hover:border-primary/30 hover:bg-surface/70"
            >
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold tracking-tight">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────
          Latest Tutorials
      ────────────────────────────────────────────────────────────── */}
      <section className="border-t border-border bg-surface/30">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <div className="mb-14 flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Latest Tutorials
              </h2>
              <p className="mt-2 text-muted">
                Jump into what&apos;s new — fresh content every week.
              </p>
            </div>
            <Link
              href="/tutorials"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-accent"
            >
              View all tutorials
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {tutorials.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {tutorials.map((t) => (
                <Link
                  key={t.slug}
                  href={`/tutorials/${t.slug}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-surface/40 backdrop-blur-sm transition-all hover:border-primary/30 hover:bg-surface/70"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video w-full overflow-hidden bg-border/30">
                    <img
                      src={`https://img.youtube.com/vi/${t.youtubeId}/mqdefault.jpg`}
                      alt={t.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/90 shadow-lg">
                        <Play className="h-4 w-4 text-primary-foreground" fill="currentColor" />
                      </div>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="font-semibold tracking-tight transition-colors group-hover:text-primary">
                      {t.title}
                    </h3>
                    <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted line-clamp-2">
                      {t.description}
                    </p>

                    <div className="mt-4 flex items-center gap-3 text-xs text-muted">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(t.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      {t.tags?.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-border px-2 py-0.5"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted">
              Tutorials coming soon — check back shortly!
            </p>
          )}
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────
          CTA Banner
      ────────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-surface/40 px-8 py-14 text-center backdrop-blur-sm sm:px-16 sm:py-20">
          {/* Glow */}
          <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[500px] rounded-full bg-primary/10 blur-[100px]" />

          <h2 className="relative text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to level up?
          </h2>
          <p className="relative mx-auto mt-4 max-w-lg text-muted">
            Start with any tutorial — no account needed. When you&apos;re ready
            for the full experience, Go Pro for exclusive deep-dives and projects.
          </p>
          <div className="relative mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/tutorials"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:brightness-110"
            >
              Browse Tutorials
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/pro"
              className="inline-flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-6 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/20"
            >
              Go Pro
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
