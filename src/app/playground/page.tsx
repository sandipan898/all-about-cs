import type { Metadata } from "next";
import { PlaygroundClient } from "./playground-client";

export const metadata: Metadata = {
  title: "Playground — Run Code in Your Browser",
  description:
    "A free online code playground. Write and run Python, JavaScript, C++, Java, Go, Rust, and more — Python & JS run in your browser, compiled languages on the server.",
  alternates: { canonical: "/playground" },
  openGraph: {
    title: "Playground — All About CS",
    description:
      "Write and run code in 10+ languages right from your browser.",
    url: "/playground",
    type: "website",
  },
};

export default function PlaygroundPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Playground
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          Pick a language, write some code, and hit{" "}
          <span className="font-medium text-foreground">Run</span>. Python and
          JavaScript execute right in your browser; compiled languages run
          securely on the server.
        </p>
      </header>

      <PlaygroundClient />
    </main>
  );
}
