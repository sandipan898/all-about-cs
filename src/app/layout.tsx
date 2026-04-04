import type { Metadata } from "next";
import { Inter, Fira_Code } from "next/font/google";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { JsonLd } from "@/components/json-ld";
import { SearchProvider } from "@/components/search-trigger";
import { ThemeProvider } from "@/components/theme-provider";
import { ScrollToTop } from "@/components/scroll-to-top";
import {
  generateWebSiteJsonLd,
  generateOrganizationJsonLd,
} from "@/lib/json-ld";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const firaCode = Fira_Code({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://allaboutcs.com";

export const metadata: Metadata = {
  title: {
    default: "All About CS — Free CS Tutorials | Read or Watch",
    template: "%s | All About CS",
  },
  description:
    "A developer learning platform with dual-mode tutorials — read or watch, your choice. Free tutorials on Python, DSA, algorithms, data structures, and core CS concepts.",
  metadataBase: new URL(SITE_URL),
  applicationName: "All About CS",
  creator: "Sandipan Das",
  publisher: "All About CS",
  keywords: [
    "computer science tutorials",
    "learn programming",
    "Python tutorials",
    "data structures and algorithms",
    "DSA",
    "coding tutorials",
    "free CS courses",
    "learn to code",
    "programming for beginners",
    "algorithm explanations",
    "Big O notation",
    "recursion",
    "All About CS",
  ],
  category: "Education",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "All About CS",
    title: "All About CS — Free CS Tutorials | Read or Watch",
    description:
      "A developer learning platform with dual-mode tutorials — read or watch, your choice. Free tutorials on Python, DSA, and core CS concepts.",
    url: SITE_URL,
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "All About CS — Free CS Tutorials",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "All About CS — Free CS Tutorials | Read or Watch",
    description:
      "A developer learning platform with dual-mode tutorials — read or watch, your choice.",
    images: [`${SITE_URL}/og-image.png`],
    creator: "@sandipandas",
  },
  alternates: {
    canonical: SITE_URL,
    types: {
      "application/rss+xml": `${SITE_URL}/feed.xml`,
    },
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ?? "",
    // yandex: "YANDEX_VERIFICATION_CODE",
    // bing: "BING_VERIFICATION_CODE",
  },
  other: {
    "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION ?? "",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${firaCode.variable}`} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col antialiased">
        <ThemeProvider>
          <JsonLd data={generateWebSiteJsonLd()} />
          <JsonLd data={generateOrganizationJsonLd()} />
          <SearchProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </SearchProvider>
          <ScrollToTop />
        </ThemeProvider>
      </body>
    </html>
  );
}
