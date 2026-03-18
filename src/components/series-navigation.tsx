import Link from "next/link";
import { ChevronLeft, ChevronRight, BookOpen } from "lucide-react";

interface SeriesNavigationProps {
  seriesName: string;
  currentPart: string | number;
  totalParts: string | number;
  slugs?: string | string[];
}

export function SeriesNavigation({
  seriesName,
  currentPart: rawCurrent,
  totalParts: rawTotal,
  slugs: rawSlugs = [],
}: SeriesNavigationProps) {
  const currentPart = typeof rawCurrent === "string" ? parseInt(rawCurrent, 10) : rawCurrent;
  const totalParts = typeof rawTotal === "string" ? parseInt(rawTotal, 10) : rawTotal;
  const slugs = typeof rawSlugs === "string" ? rawSlugs.split(",").map((s) => s.trim()) : rawSlugs;

  if (!currentPart || !totalParts) return null;

  const prevSlug = currentPart > 1 ? slugs[currentPart - 2] : null;
  const nextSlug = currentPart < totalParts ? slugs[currentPart] : null;

  return (
    <div className="not-prose my-8 overflow-hidden rounded-xl border border-border bg-surface/50 backdrop-blur-sm">
      <div className="flex items-center gap-2.5 border-b border-border bg-primary/5 px-5 py-3">
        <BookOpen className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">{seriesName}</span>
        <span className="ml-auto rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
          Part {currentPart} of {totalParts}
        </span>
      </div>

      <div className="flex items-center gap-3 px-5 py-3">
        <div className="flex flex-1 gap-1.5">
          {Array.from({ length: totalParts }, (_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i + 1 === currentPart
                  ? "bg-primary"
                  : i + 1 < currentPart
                    ? "bg-primary/40"
                    : "bg-border"
              }`}
            />
          ))}
        </div>
      </div>

      {(prevSlug || nextSlug) && (
        <div className="flex items-center justify-between border-t border-border px-5 py-3">
          {prevSlug ? (
            <Link
              href={`/tutorials/${prevSlug}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-primary"
            >
              <ChevronLeft className="h-4 w-4" />
              Part {currentPart - 1}
            </Link>
          ) : (
            <span />
          )}
          {nextSlug ? (
            <Link
              href={`/tutorials/${nextSlug}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-primary"
            >
              Part {currentPart + 1}
              <ChevronRight className="h-4 w-4" />
            </Link>
          ) : (
            <span />
          )}
        </div>
      )}
    </div>
  );
}
