"use client";

import { useLayoutEffect, useRef } from "react";

import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

/** Hands a div to the ref the effect reads; a div ref and a section ref are both HTMLElement. */
function store(ref: React.RefObject<HTMLElement | null>, node: HTMLDivElement | null): void {
  ref.current = node;
}

/** How far up the viewport a section has to come before it plays. */
const ROOT_MARGIN = "0px 0px -12% 0px";

interface RevealProps {
  readonly children: React.ReactNode;
  readonly className?: string;
  readonly id?: string;
  /** For a section that carries a place's colours as custom properties. */
  readonly style?: React.CSSProperties;
  /**
   * A plain block rather than a section - for the content of a band whose ground must
   * stay opaque. On a place page the hero is pinned behind every band, so a band that
   * faded in as a whole would show the hero through itself while it did.
   */
  readonly as?: "section" | "div";
}

/**
 * A section that animates into place the first time it is scrolled to.
 *
 * The section is rendered in its final state and only marked pending after mount, in
 * a layout effect, so without scripting - or under reduced motion - nothing is ever
 * hidden. The observer disconnects after the first entry: a section plays once.
 */
export function Reveal({ children, className, id, style, as: Tag = "section" }: RevealProps): React.ReactElement {
  const ref = useRef<HTMLElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;

    // The first client render cannot know the setting - there is no media query on the
    // server - so a section can be marked pending and only then learn that motion is
    // reduced. Clearing the mark is what stops it being left invisible for good.
    if (reducedMotion) {
      delete node.dataset.reveal;
      return;
    }

    node.dataset.reveal = "pending";
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        node.dataset.reveal = "shown";
        observer.disconnect();
      },
      { rootMargin: ROOT_MARGIN },
    );
    observer.observe(node);

    return () => observer.disconnect();
  }, [reducedMotion]);

  if (Tag === "div") {
    return (
      <div ref={(node) => store(ref, node)} id={id} className={className} style={style}>
        {children}
      </div>
    );
  }
  return (
    <section ref={ref} id={id} className={className} style={style}>
      {children}
    </section>
  );
}
