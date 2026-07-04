import type { Metadata } from "next";
import { VisualizerClient } from "./visualizer-client";

export const metadata: Metadata = {
  title: "Algorithm Visualizer — See DSA in Action",
  description:
    "Interactive visualizations of popular sorting, searching, and algorithmic techniques. Watch Bubble Sort, Quick Sort, Binary Search, and more animate step by step.",
  alternates: { canonical: "/visualizer" },
  openGraph: {
    title: "Algorithm Visualizer — All About CS",
    description:
      "Watch sorting and searching algorithms execute step-by-step with animated visualizations.",
    url: "/visualizer",
    type: "website",
  },
};

export default function VisualizerPage() {
  return (
    <main className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Algorithm Visualizer
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          Watch algorithms execute step by step. Select an algorithm, customize
          the input, and control the animation speed.
        </p>
      </header>
      <VisualizerClient />
    </main>
  );
}
