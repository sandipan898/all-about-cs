import Link from "next/link";
import { Calendar, ArrowRight, FolderOpen } from "lucide-react";
import { getAllTutorials, type TutorialMeta } from "@/lib/mdx";
import { JsonLd } from "@/components/json-ld";
import {
  generateBreadcrumbJsonLd,
  generateItemListJsonLd,
} from "@/lib/json-ld";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://allaboutcs.com";

export const metadata = {
  title: "Tutorials",
  description:
    "Browse all dual-mode tutorials on algorithms, data structures, and core CS concepts.",
};

const CATEGORY_LABELS: Record<string, string> = {
  python: "Python",
  dsa: "Data Structures & Algorithms",
  general: "General",
};

function getCategoryLabel(category: string) {
  return CATEGORY_LABELS[category] ?? category.charAt(0).toUpperCase() + category.slice(1);
}

function groupByCategory(tutorials: TutorialMeta[]) {
  const groups: Record<string, TutorialMeta[]> = {};
  for (const t of tutorials) {
    const cat = t.category;
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(t);
  }
  return groups;
}

export default function TutorialsPage() {
  const tutorials = getAllTutorials();
  const grouped = groupByCategory(tutorials);
  const categoryOrder = Object.keys(grouped).sort();

  return (
    <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      {/* Structured data */}
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: "Home", url: SITE_URL },
          { name: "Tutorials", url: `${SITE_URL}/tutorials` },
        ])}
      />
      <JsonLd data={generateItemListJsonLd(tutorials)} />

      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        Tutorials
      </h1>
      <p className="mt-2 text-lg text-muted">
        Read or watch — every tutorial supports both modes.
      </p>

      {tutorials.length === 0 ? (
        <p className="mt-12 text-center text-muted">
          No tutorials yet. Check back soon!
        </p>
      ) : (
        <div className="mt-10 space-y-12">
          {categoryOrder.map((category) => (
            <div key={category}>
              <div className="mb-5 flex items-center gap-2.5">
                <FolderOpen className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold tracking-tight">
                  {getCategoryLabel(category)}
                </h2>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                  {grouped[category].length}
                </span>
              </div>

              <div className="grid gap-4">
                {grouped[category].map((t) => (
                  <Link
                    key={t.slug}
                    href={`/tutorials/${t.slug}`}
                    className="group rounded-xl border border-border bg-surface p-5 transition-all hover:border-primary/30 hover:bg-surface-hover"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-semibold tracking-tight transition-colors group-hover:text-primary">
                          {t.title}
                        </h3>
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

                      <ArrowRight className="mt-1 h-5 w-5 flex-shrink-0 text-muted transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
