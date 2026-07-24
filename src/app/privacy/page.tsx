import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy — All About CS",
  description:
    "Privacy Policy for All About CS. We respect your privacy and provide frictionless, tracking-free computer science learning.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <header className="mb-10 border-b border-border pb-6">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Privacy Policy
          </h1>
        </div>
        <p className="mt-2 text-sm text-muted">
          Last updated: July 2026
        </p>
      </header>

      <div className="prose dark:prose-invert max-w-none space-y-6 text-sm text-muted leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-foreground">1. Privacy Commitment</h2>
          <p className="mt-2">
            All About CS ("AACS") is designed to be a frictionless, privacy-respecting educational platform. We believe learning computer science should not require handing over personal information or being tracked across the web.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">2. Information Collection & Analytics</h2>
          <p className="mt-2">
            We use privacy-friendly, anonymized analytics (Umami Analytics / Google Analytics) to aggregate page view metrics without collecting personally identifiable information (PII). We do not set persistent tracking cookies or share visitor data with third-party data brokers.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">3. Interactive Code Execution</h2>
          <p className="mt-2">
            Code executed in our browser runtimes (Python Wasm / JavaScript Worker) runs 100% on your device and is never sent to our servers. Code executed via our backend proxy is processed statelssly and deleted immediately after execution.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">4. Contact Us</h2>
          <p className="mt-2">
            If you have questions regarding this Privacy Policy, please contact us at <a href="mailto:privacy@allaboutcs.dev" className="text-primary hover:underline">privacy@allaboutcs.dev</a>.
          </p>
        </section>
      </div>
    </main>
  );
}
