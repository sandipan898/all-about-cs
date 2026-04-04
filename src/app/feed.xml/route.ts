import { NextResponse } from "next/server";
import { getAllTutorials } from "@/lib/mdx";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://allaboutcs.com";
const SITE_NAME = "All About CS";

export async function GET() {
  const tutorials = getAllTutorials();

  const items = tutorials
    .map(
      (t) => `
    <item>
      <title><![CDATA[${t.title}]]></title>
      <link>${SITE_URL}/tutorials/${t.slug}</link>
      <guid isPermaLink="true">${SITE_URL}/tutorials/${t.slug}</guid>
      <description><![CDATA[${t.description}]]></description>
      <pubDate>${new Date(t.date).toUTCString()}</pubDate>
      <category>${t.category}</category>
    </item>`
    )
    .join("");

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${SITE_NAME}</title>
    <link>${SITE_URL}</link>
    <description>A developer learning platform with dual-mode tutorials — read or watch, your choice.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${SITE_URL}/icon-512.png</url>
      <title>${SITE_NAME}</title>
      <link>${SITE_URL}</link>
    </image>
    ${items}
  </channel>
</rss>`;

  return new NextResponse(feed.trim(), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
