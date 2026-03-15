import type { TutorialFrontmatter } from "./mdx";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const SITE_NAME = "All About CS";

/**
 * Generates a JSON-LD `TechArticle` schema for a tutorial page.
 * @see https://schema.org/TechArticle
 */
export function generateTechArticleJsonLd(
  frontmatter: TutorialFrontmatter,
  slug: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: frontmatter.title,
    description: frontmatter.description,
    datePublished: frontmatter.date,
    dateModified: frontmatter.date,
    author: {
      "@type": "Person",
      name: frontmatter.author ?? SITE_NAME,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    url: `${SITE_URL}/tutorials/${slug}`,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/tutorials/${slug}`,
    },
    image: `https://img.youtube.com/vi/${frontmatter.youtubeId}/maxresdefault.jpg`,
    ...(frontmatter.tags && {
      keywords: frontmatter.tags.join(", "),
    }),
    proficiencyLevel: "Beginner",
  };
}

/**
 * Generates a JSON-LD `VideoObject` schema for the embedded YouTube video.
 * @see https://schema.org/VideoObject
 */
export function generateVideoObjectJsonLd(
  frontmatter: TutorialFrontmatter,
  slug: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: frontmatter.title,
    description: frontmatter.description,
    thumbnailUrl: `https://img.youtube.com/vi/${frontmatter.youtubeId}/maxresdefault.jpg`,
    uploadDate: frontmatter.date,
    contentUrl: `https://www.youtube.com/watch?v=${frontmatter.youtubeId}`,
    embedUrl: `https://www.youtube-nocookie.com/embed/${frontmatter.youtubeId}`,
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    isPartOf: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/tutorials/${slug}`,
    },
  };
}

/**
 * Site-wide `WebSite` schema with `SearchAction` for sitelinks search box.
 * @see https://schema.org/WebSite
 */
export function generateWebSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description:
      "A developer learning platform with dual-mode tutorials — read or watch, your choice.",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/tutorials?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}
