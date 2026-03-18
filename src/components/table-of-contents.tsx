"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { AlignLeft, ChevronUp } from "lucide-react";

interface Heading {
  id: string;
  text: string;
  level: number;
}

export function TableOfContents() {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [isOpen, setIsOpen] = useState(true);
  const listRef = useRef<HTMLUListElement | null>(null);

  useEffect(() => {
    const article = document.querySelector("article");
    if (!article) return;

    const elements = article.querySelectorAll("h2, h3");
    const items: Heading[] = [];

    elements.forEach((el) => {
      if (!el.id) {
        el.id =
          el.textContent
            ?.toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "") ?? "";
      }
      items.push({
        id: el.id,
        text: el.textContent ?? "",
        level: el.tagName === "H2" ? 2 : 3,
      });
    });

    setHeadings(items);
  }, []);

  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting);
        if (visible?.target.id) setActiveId(visible.target.id);
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0.1 }
    );

    headings.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  useEffect(() => {
    if (!listRef.current || !activeId) return;
    const container = listRef.current;
    const activeEl = container.querySelector<HTMLElement>(`[data-toc-id="${activeId}"]`);
    if (!activeEl) return;

    const top = activeEl.offsetTop - container.offsetTop;
    const bottom = top + activeEl.offsetHeight;

    if (top < container.scrollTop) {
      container.scrollTo({ top, behavior: "smooth" });
    } else if (bottom > container.scrollTop + container.clientHeight) {
      container.scrollTo({ top: bottom - container.clientHeight, behavior: "smooth" });
    }
  }, [activeId]);

  const handleClick = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }, []);

  if (headings.length === 0) return null;

  return (
    <nav className="not-prose my-8 overflow-hidden rounded-xl border border-border bg-surface/50 backdrop-blur-sm">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center gap-2.5 px-5 py-3.5 text-left transition-colors hover:bg-surface-hover"
      >
        <AlignLeft className="h-4 w-4 shrink-0 text-primary" />
        <span className="text-sm font-semibold text-foreground">
          On This Page
        </span>
        <ChevronUp
          className={`ml-auto h-4 w-4 shrink-0 text-muted transition-transform duration-200 ${
            isOpen ? "" : "rotate-180"
          }`}
        />
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <ul ref={listRef} className="max-h-72 space-y-0.5 overflow-y-auto overscroll-contain px-5 pb-4 text-sm">
            {headings.map(({ id, text, level }) => (
              <li key={id} className={level === 3 ? "ml-4" : ""}>
                <a
                  data-toc-id={id}
                  href={`#${id}`}
                  onClick={(e) => handleClick(e, id)}
                  className={`block border-l-2 py-1.5 pl-3 pr-2 transition-colors ${
                    activeId === id
                      ? "border-primary font-medium text-primary"
                      : "border-transparent text-muted hover:border-border hover:text-foreground"
                  }`}
                >
                  {text}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
}
