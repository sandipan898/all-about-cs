import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { getAllCategoryMetas } from "@/lib/categories";
import { getAllTutorials } from "@/lib/mdx";
import { JsonLd } from "@/components/json-ld";
import { generateBreadcrumbJsonLd } from "@/lib/json-ld";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://allaboutcs.com";

export const metadata = {
  title: "Topics",
  description:
    "Explore learning tracks — pick a topic and follow a structured path from beginner to confident.",
};

export default function TopicsPage() {
  const categories = getAllCategoryMetas();
  const tutorials = getAllTutorials();

  function countForCategory(slug: string) {
    return tutorials.filter((t) => t.category === slug).length;
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: "Home", url: SITE_URL },
          { name: "Topics", url: `${SITE_URL}/topics` },
        ])}
      />

      <div className="mb-12 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Explore Topics
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-lg text-muted">
          Each topic is a structured learning track. Pick one and work through
          the tutorials at your own pace.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const count = countForCategory(cat.slug);

          return (
            <Link
              key={cat.slug}
              href={`/topics/${cat.slug}`}
              className="group relative overflow-hidden rounded-2xl border border-border bg-surface/40 p-7 backdrop-blur-sm transition-all hover:border-primary/30 hover:bg-surface/70"
            >
              {/* Gradient background */}
              <div
                className={`pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br ${cat.gradient} opacity-0 transition-opacity group-hover:opacity-100`}
              />

              <div className="flex items-start justify-between">
                <div
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-surface ${cat.color} transition-colors`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <ArrowRight className="h-5 w-5 text-muted transition-transform group-hover:translate-x-1 group-hover:text-primary" />
              </div>

              <h2 className="mt-5 text-xl font-semibold tracking-tight transition-colors group-hover:text-primary">
                {cat.label}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {cat.description}
              </p>

              <div className="mt-5 flex items-center gap-2 text-xs font-medium text-muted">
                <BookOpen className="h-3.5 w-3.5" />
                <span>
                  {count} {count === 1 ? "tutorial" : "tutorials"}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
