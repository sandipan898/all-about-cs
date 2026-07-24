import type { Metadata } from "next";
import { FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service — All About CS",
  description:
    "Terms of Service for accessing and using the All About CS developer learning platform.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <header className="mb-10 border-b border-border pb-6">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Terms of Service
          </h1>
        </div>
        <p className="mt-2 text-sm text-muted">
          Last updated: July 2026
        </p>
      </header>

      <div className="prose dark:prose-invert max-w-none space-y-6 text-sm text-muted leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-foreground">1. Acceptance of Terms</h2>
          <p className="mt-2">
            By accessing and using All About CS ("AACS"), you agree to abide by these Terms of Service. If you do not agree, please discontinue using the platform.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">2. Intellectual Property & License</h2>
          <p className="mt-2">
            All original tutorial content, code examples, interactive visualizers, and educational materials provided on AACS are owned by All About CS and licensed for non-commercial personal learning.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">3. Acceptable Code Execution Use</h2>
          <p className="mt-2">
            Our interactive code playgrounds and API execution proxies are provided strictly for educational testing. Automated scraping, malicious code execution, denial-of-service attempts, or bypassing rate limits are strictly prohibited.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">4. Disclaimer of Warranties</h2>
          <p className="mt-2">
            AACS is provided "as is" without warranties of any kind. While we strive for 100% accuracy, we do not guarantee error-free execution or uptime for free execution services.
          </p>
        </section>
      </div>
    </main>
  );
}
