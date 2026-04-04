import type { TutorialFrontmatter, TutorialMeta } from "./mdx";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://allaboutcs.com";
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

/**
 * Organization schema — helps Google understand and display your brand.
 * @see https://schema.org/Organization
 */
export function generateOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/icon-512.png`,
    description:
      "A developer learning platform with dual-mode tutorials — read or watch, your choice.",
    sameAs: [
      "https://www.youtube.com/@allaboutcs",
      "https://github.com/sandipan-das",
      "https://www.linkedin.com/in/sandipandas",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      url: `${SITE_URL}/about`,
    },
  };
}

/**
 * BreadcrumbList schema — gives Google breadcrumb-rich snippets.
 * @see https://schema.org/BreadcrumbList
 */
export function generateBreadcrumbJsonLd(
  items: { name: string; url: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * ItemList schema for tutorial listing pages — helps Google show carousel-rich results.
 * @see https://schema.org/ItemList
 */
export function generateItemListJsonLd(tutorials: TutorialMeta[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: tutorials.map((t, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: t.title,
      url: `${SITE_URL}/tutorials/${t.slug}`,
    })),
  };
}

/**
 * Course schema for topic / category pages.
 * @see https://schema.org/Course
 */
export function generateCourseJsonLd(
  name: string,
  description: string,
  slug: string,
  tutorials: TutorialMeta[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name,
    description,
    url: `${SITE_URL}/topics/${slug}`,
    provider: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      courseWorkload: "PT1H",
    },
    numberOfCredits: 0,
    isAccessibleForFree: true,
    teaches: tutorials.map((t) => t.title),
  };
}

/**
 * FAQPage schema — can produce rich FAQ snippets in search.
 * @see https://schema.org/FAQPage
 */
export function generateFaqJsonLd(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}
