import type { Metadata } from "next";
import { Mail, MessageSquare, Send } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Us — All About CS",
  description:
    "Get in touch with the All About CS team for feedback, support, content suggestions, or partnership inquiries.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <header className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Mail className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Get in Touch
        </h1>
        <p className="mt-2 text-base text-muted">
          Have feedback, found a bug, or want to suggest a new tutorial topic? We'd love to hear from you.
        </p>
      </header>

      <div className="mt-10 overflow-hidden rounded-2xl border border-border bg-surface/40 p-6 sm:p-8 backdrop-blur-md">
        <form className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-foreground">
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              placeholder="Your name"
              className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="you@example.com"
              className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-foreground">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              rows={5}
              placeholder="How can we help?"
              className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
            />
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-transform hover:scale-105"
          >
            <Send className="h-4 w-4" />
            Send Message
          </button>
        </form>
      </div>

      <div className="mt-8 text-center text-xs text-muted">
        Direct Email: <a href="mailto:support@allaboutcs.dev" className="text-primary hover:underline">support@allaboutcs.dev</a>
      </div>
    </main>
  );
}
