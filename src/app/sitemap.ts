import type { MetadataRoute } from "next";
import { getAllTutorials } from "@/lib/mdx";
import { getAllCategoryMetas } from "@/lib/categories";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://allaboutcs.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const tutorials = getAllTutorials();
  const categories = getAllCategoryMetas();

  // ── Static pages ─────────────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/tutorials`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/topics`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  // ── Topic / category pages ───────────────────────────────────
  const topicPages: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${SITE_URL}/topics/${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // ── Tutorial pages ───────────────────────────────────────────
  const tutorialPages: MetadataRoute.Sitemap = tutorials.map((t) => ({
    url: `${SITE_URL}/tutorials/${t.slug}`,
    lastModified: new Date(t.date),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [...staticPages, ...topicPages, ...tutorialPages];
}
