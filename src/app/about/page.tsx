import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Youtube,
  Linkedin,
  Github,
  Rocket,
  Brain,
  Monitor,
  Heart,
  Zap,
} from "lucide-react";
import { getAllTutorials } from "@/lib/mdx";
import { getAllCategoryMetas } from "@/lib/categories";

export const metadata: Metadata = {
  title: "About",
  description:
    "All About CS is a developer learning platform by Sandipan Das — free tutorials on Python, Java, JavaScript, DSA, and more.",
};

const technologies = [
  "Python",
  "Java",
  "JavaScript",
  "React.js",
  "Backend Development",
  "Git",
  "Linux",
  "Data Structures",
  "Algorithms",
];

const values = [
  {
    icon: Brain,
    title: "Learn",
    description:
      "Every concept is broken down into clear, digestible explanations. No jargon walls — just real understanding.",
  },
  {
    icon: Monitor,
    title: "Code",
    description:
      "Hands-on examples you can run immediately. Read the article or watch the video — every tutorial supports both modes.",
  },
  {
    icon: Rocket,
    title: "Grow",
    description:
      "Build the skills that matter. Whether you're prepping for interviews or shipping production code, we've got you covered.",
  },
];

const socials = [
  {
    icon: Youtube,
    label: "YouTube",
    href: "https://www.youtube.com/@allaboutcs",
    handle: "@allaboutcs",
    color: "text-red-500",
    bg: "bg-red-500/10 hover:bg-red-500/20",
  },
  {
    icon: Linkedin,
    label: "LinkedIn",
    href: "https://linkedin.com/in/sandipan-das-528166175",
    handle: "Sandipan Das",
    color: "text-blue-500",
    bg: "bg-blue-500/10 hover:bg-blue-500/20",
  },
  {
    icon: Github,
    label: "GitHub",
    href: "https://github.com/sandipan898",
    handle: "sandipan898",
    color: "text-foreground",
    bg: "bg-surface hover:bg-surface-hover",
  },
];

export default function AboutPage() {
  const totalTutorials = getAllTutorials().length;
  const totalTopics = getAllCategoryMetas().length;

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative isolate overflow-hidden">
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
        </div>

        <div className="mx-auto flex max-w-4xl flex-col items-center px-6 pb-16 pt-20 text-center sm:pt-28 md:pb-24">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
            About{" "}
            <span className="bg-gradient-to-r from-primary via-accent to-emerald-400 bg-clip-text text-transparent">
              All About CS
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted sm:text-xl">
            Your ultimate destination for mastering programming and computer
            science — easy-to-understand tutorials, real-world projects, and
            deep dives into the technologies that power the modern web.
          </p>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="border-y border-border bg-surface/30">
        <div className="mx-auto grid max-w-4xl grid-cols-2 divide-x divide-border sm:grid-cols-4">
          {[
            { value: `${totalTutorials}+`, label: "Tutorials" },
            { value: `${totalTopics}`, label: "Learning Tracks" },
            { value: "Free", label: "Always" },
            { value: "Weekly", label: "New Content" },
          ].map((stat) => (
            <div key={stat.label} className="px-4 py-6 text-center sm:py-8">
              <p className="text-2xl font-bold text-foreground sm:text-3xl">
                {stat.value}
              </p>
              <p className="mt-1 text-xs font-medium text-muted sm:text-sm">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Mission: Learn. Code. Grow. ── */}
      <section className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="mb-14 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Learn. Code. Grow.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted">
            Three pillars that drive everything we create.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {values.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="group rounded-2xl border border-border/60 bg-surface/40 p-7 backdrop-blur-sm transition-all hover:border-primary/30 hover:bg-surface/70"
            >
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── About the Creator ── */}
      <section className="border-t border-border bg-surface/30">
        <div className="mx-auto max-w-4xl px-6 py-20 md:py-28">
          <div className="flex flex-col gap-10 md:flex-row md:items-start md:gap-14">
            {/* Avatar / identity */}
            <div className="flex flex-col items-center md:items-start">
              <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-accent/20 text-4xl font-bold text-primary ring-4 ring-primary/10">
                SD
              </div>
              <h3 className="mt-4 text-xl font-bold tracking-tight">
                Sandipan Das
              </h3>
              <p className="text-sm text-muted">Creator & Instructor</p>

              <div className="mt-5 flex gap-2">
                {socials.map(({ icon: Icon, label, href, color, bg }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${bg} ${color} transition-colors`}
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Bio */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                The story behind the channel
              </h2>
              <div className="mt-5 space-y-4 text-muted leading-relaxed">
                <p>
                  All About CS started as a YouTube channel with a simple goal:
                  make computer science{" "}
                  <strong className="text-foreground">accessible</strong> to
                  everyone. Too many tutorials either drown you in jargon or
                  oversimplify to the point of uselessness. I wanted something in
                  between — technically rigorous, but explained like a friend is
                  sitting next to you.
                </p>
                <p>
                  Every tutorial is crafted from real experience building
                  software. The examples are practical, the explanations are
                  honest about trade-offs, and the goal is always the same:{" "}
                  <strong className="text-foreground">
                    help you write better code, faster
                  </strong>
                  .
                </p>
                <p>
                  Whether you&apos;re writing your first Python script or
                  preparing for a FAANG interview, this platform is built for you.
                  No paywalls on fundamentals. No fluff. Just clear, structured
                  learning paths you can follow at your own pace.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── What We Cover ── */}
      <section className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Technologies We Cover
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted">
            From languages to frameworks to tools — practical, job-ready skills.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {technologies.map((tech) => (
            <span
              key={tech}
              className="rounded-full border border-border bg-surface/60 px-5 py-2.5 text-sm font-medium text-foreground backdrop-blur-sm transition-colors hover:border-primary/30 hover:bg-primary/5"
            >
              {tech}
            </span>
          ))}
        </div>
      </section>

      {/* ── Connect ── */}
      <section className="border-t border-border bg-surface/30">
        <div className="mx-auto max-w-4xl px-6 py-20 md:py-28">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Stay Connected
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-muted">
              New tutorials drop every week. Subscribe on YouTube or follow along
              on social media so you never miss a lesson.
            </p>
          </div>

          <div className="mx-auto mt-10 grid max-w-lg gap-4 sm:grid-cols-3">
            {socials.map(({ icon: Icon, label, href, handle, color, bg }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-surface/40 p-6 backdrop-blur-sm transition-all hover:border-primary/30 hover:bg-surface/70"
              >
                <div
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${bg} ${color} transition-colors`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-foreground">
                    {label}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">{handle}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-surface/40 px-8 py-14 text-center backdrop-blur-sm sm:px-16 sm:py-20">
          <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[500px] rounded-full bg-primary/10 blur-[100px]" />

          <div className="relative">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-4 py-1.5 text-xs font-medium text-muted backdrop-blur-sm">
              <Heart className="h-3.5 w-3.5 text-red-400" />
              100% free — no signup required
            </div>

            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to start learning?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-muted">
              Jump into any tutorial right now. Pick a topic, follow the track,
              and build real skills — one lesson at a time.
            </p>

            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/tutorials"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:brightness-110 hover:shadow-xl hover:shadow-primary/30"
              >
                Browse Tutorials
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/topics"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface/60 px-6 py-3 text-sm font-medium text-foreground backdrop-blur-sm transition-colors hover:bg-surface-hover"
              >
                <Zap className="h-4 w-4 text-primary" />
                Explore Topics
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
