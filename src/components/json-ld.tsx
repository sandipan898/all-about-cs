/**
 * Injects a JSON-LD <script> tag into the page.
 * Works in both Server and Client components — no "use client" needed.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
