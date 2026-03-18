import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Calendar, BookOpen, ArrowLeft } from "lucide-react";
import { getAllCategoryMetas, getCategoryMeta } from "@/lib/categories";
import { getAllTutorials } from "@/lib/mdx";

interface TopicPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllCategoryMetas().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: TopicPageProps): Promise<Metadata> {
  const { slug } = await params;
  const cat = getCategoryMeta(slug);

  if (!cat) return { title: "Topic Not Found" };

  return {
    title: cat.label,
    description: cat.description,
  };
}

export default async function TopicPage({ params }: TopicPageProps) {
  const { slug } = await params;
  const cat = getCategoryMeta(slug);

  if (!cat) notFound();

  const tutorials = getAllTutorials()
    .filter((t) => t.category === slug)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const Icon = cat.icon;

  return (
    <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      {/* Breadcrumb */}
      <Link
        href="/topics"
        className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All Topics
      </Link>

      {/* Header */}
      <div className="mb-10 rounded-2xl border border-border bg-surface/40 p-8 backdrop-blur-sm sm:p-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
          <div
            className={`inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${cat.gradient} ${cat.color}`}
          >
            <Icon className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {cat.label}
            </h1>
            <p className="mt-2 text-muted leading-relaxed">
              {cat.longDescription}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-4 text-sm text-muted">
          <span className="inline-flex items-center gap-1.5">
            <BookOpen className="h-4 w-4" />
            {tutorials.length}{" "}
            {tutorials.length === 1 ? "tutorial" : "tutorials"}
          </span>
          {tutorials.length > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              Last updated{" "}
              {new Date(
                tutorials[tutorials.length - 1].date
              ).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          )}
        </div>
      </div>

      {/* Tutorial list */}
      {tutorials.length === 0 ? (
        <p className="text-center text-muted">
          Tutorials coming soon — check back shortly!
        </p>
      ) : (
        <div className="space-y-4">
          {tutorials.map((t, i) => (
            <Link
              key={t.slug}
              href={`/tutorials/${t.slug}`}
              className="group flex items-start gap-4 rounded-xl border border-border bg-surface p-5 transition-all hover:border-primary/30 hover:bg-surface-hover"
            >
              {/* Order number */}
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                {i + 1}
              </span>

              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold tracking-tight transition-colors group-hover:text-primary">
                  {t.title}
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-muted line-clamp-2">
                  {t.description}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2.5 text-xs text-muted">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(t.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  {t.tags?.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-border px-2 py-0.5"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-muted transition-transform group-hover:translate-x-1 group-hover:text-primary" />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
