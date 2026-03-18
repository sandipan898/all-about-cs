import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { getTutorialBySlug, getTutorialSlugs } from "@/lib/mdx";
import {
  generateTechArticleJsonLd,
  generateVideoObjectJsonLd,
} from "@/lib/json-ld";
import { DualModeLayout } from "@/components/dual-mode-layout";
import { YouTubeEmbed } from "@/components/youtube-embed";
import { Callout } from "@/components/callout";
import { TableOfContents } from "@/components/table-of-contents";
import { SeriesNavigation } from "@/components/series-navigation";
import { JsonLd } from "@/components/json-ld";

interface TutorialPageProps {
  params: Promise<{ slug: string }>;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

function InlineYouTubeEmbed(props: { id: string; title?: string }) {
  return <YouTubeEmbed {...props} inline />;
}

const mdxComponents = {
  YouTubeEmbed: InlineYouTubeEmbed,
  Callout,
  TableOfContents,
  SeriesNavigation,
};

// ── Static Params ──────────────────────────────────────────────────

export async function generateStaticParams() {
  return getTutorialSlugs().map((slug) => ({ slug }));
}

// ── Dynamic Metadata (SEO) ─────────────────────────────────────────

export async function generateMetadata({
  params,
}: TutorialPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tutorial = getTutorialBySlug(slug);

  if (!tutorial) {
    return { title: "Tutorial Not Found" };
  }

  const { frontmatter } = tutorial;
  const url = `${SITE_URL}/tutorials/${slug}`;
  const ogImage = `https://img.youtube.com/vi/${frontmatter.youtubeId}/maxresdefault.jpg`;

  return {
    title: frontmatter.title,
    description: frontmatter.description,
    keywords: frontmatter.tags,
    authors: frontmatter.author ? [{ name: frontmatter.author }] : undefined,
    openGraph: {
      type: "article",
      title: frontmatter.title,
      description: frontmatter.description,
      url,
      siteName: "All About CS",
      publishedTime: frontmatter.date,
      modifiedTime: frontmatter.date,
      tags: frontmatter.tags,
      images: [
        {
          url: ogImage,
          width: 1280,
          height: 720,
          alt: frontmatter.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: frontmatter.title,
      description: frontmatter.description,
      images: [ogImage],
    },
    alternates: {
      canonical: url,
    },
  };
}

// ── Page Component ─────────────────────────────────────────────────

export default async function TutorialPage({ params }: TutorialPageProps) {
  const { slug } = await params;
  const tutorial = getTutorialBySlug(slug);

  if (!tutorial) notFound();

  const { frontmatter, content } = tutorial;

  const techArticleJsonLd = generateTechArticleJsonLd(frontmatter, slug);
  const videoObjectJsonLd = generateVideoObjectJsonLd(frontmatter, slug);

  return (
    <>
      {/* Structured data for search engines and LLMs */}
      <JsonLd data={techArticleJsonLd} />
      <JsonLd data={videoObjectJsonLd} />

      <DualModeLayout
        youtubeId={frontmatter.youtubeId}
        videoTitle={frontmatter.title}
      >
        <header className="not-prose mb-8 border-b border-border pb-6">
          <p className="mb-2 text-sm text-muted">
            {new Date(frontmatter.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
            {frontmatter.author && (
              <span> &middot; {frontmatter.author}</span>
            )}
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {frontmatter.title}
          </h1>
          <p className="mt-3 text-lg text-muted">{frontmatter.description}</p>
          {frontmatter.tags && frontmatter.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {frontmatter.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-border bg-surface px-3 py-0.5 text-xs font-medium text-muted"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </header>

        <MDXRemote
          source={content}
          components={mdxComponents}
          options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
        />
      </DualModeLayout>
    </>
  );
}
