import Link from "next/link";
import { Calendar, ArrowRight } from "lucide-react";
import { getAllTutorials } from "@/lib/mdx";

export const metadata = {
  title: "Tutorials",
  description:
    "Browse all dual-mode tutorials on algorithms, data structures, and core CS concepts.",
};

export default function TutorialsPage() {
  const tutorials = getAllTutorials();

  return (
    <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
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
        <div className="mt-10 grid gap-6">
          {tutorials.map((t) => (
            <Link
              key={t.slug}
              href={`/tutorials/${t.slug}`}
              className="group rounded-xl border border-border bg-surface p-6 transition-all hover:border-primary/30 hover:bg-surface-hover"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl font-semibold tracking-tight group-hover:text-primary transition-colors">
                    {t.title}
                  </h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted line-clamp-2">
                    {t.description}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(t.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    {t.tags?.map((tag) => (
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
      )}
    </section>
  );
}
