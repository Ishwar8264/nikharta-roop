"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

interface LegalTocProps {
  sections: { id: string; title: string }[];
}

const ACTIVATION_OFFSET_PX = 112;

/**
 * Sticky table of contents for legal pages.
 *
 * Why position-based scroll tracking:
 * Sections vary substantially in height, so a fixed IntersectionObserver
 * threshold can skip short sections or leave the wrong final item active.
 * Comparing each heading with a line below the sticky header gives stable
 * behavior while requestAnimationFrame keeps scroll work to one update/frame.
 *
 * Why hidden on mobile:
 * On a phone the TOC becomes a 15-item list above the content the user
 * actually came to read. The browser's own back/scroll is faster than a
 * jump link on small screens.
 */
export function LegalToc({ sections }: LegalTocProps) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    const elements = sections
      .map(({ id }) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);

    if (elements.length === 0) return;

    let frameId: number | null = null;

    const updateActiveSection = () => {
      frameId = null;
      const pageBottom = window.scrollY + window.innerHeight;
      const documentBottom = document.documentElement.scrollHeight;

      if (pageBottom >= documentBottom - 2) {
        setActiveId(elements.at(-1)?.id ?? elements[0].id);
        return;
      }

      const activeElement = elements.reduce((current, element) => {
        return element.getBoundingClientRect().top <= ACTIVATION_OFFSET_PX
          ? element
          : current;
      }, elements[0]);

      setActiveId(activeElement.id);
    };

    const scheduleUpdate = () => {
      if (frameId === null) {
        frameId = window.requestAnimationFrame(updateActiveSection);
      }
    };

    updateActiveSection();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("hashchange", scheduleUpdate);

    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("hashchange", scheduleUpdate);
      if (frameId !== null) window.cancelAnimationFrame(frameId);
    };
  }, [sections]);

  return (
    <nav aria-label="Table of contents" className="hidden lg:block">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        On this page
      </p>
      <ul className="mt-4 space-y-1.5 border-l border-border">
        {sections.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              aria-current={activeId === section.id ? "location" : undefined}
              onClick={() => setActiveId(section.id)}
              className={cn(
                "-ml-px block rounded-r-md border-l-2 py-1 pl-4 pr-2 text-sm transition-[color,background-color,border-color] duration-200",
                activeId === section.id
                  ? "border-primary bg-primary/10 font-medium text-primary"
                  : "border-transparent text-muted-foreground hover:border-primary/50 hover:bg-muted/50 hover:text-foreground",
              )}
            >
              {section.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
