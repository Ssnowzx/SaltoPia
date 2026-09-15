"use client";

import { useLayoutEffect, useRef } from "react";

import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

/** How far up the viewport a section has to come before it plays. */
const ROOT_MARGIN = "0px 0px -12% 0px";

interface RevealProps {
  readonly children: React.ReactNode;
  readonly className?: string;
  readonly id?: string;
}

/**
 * A section that animates into place the first time it is scrolled to.
 *
 * The section is rendered in its final state and only marked pending after mount, in
 * a layout effect, so without scripting - or under reduced motion - nothing is ever
 * hidden. The observer disconnects after the first entry: a section plays once.
 */
export function Reveal({ children, className, id }: RevealProps): React.ReactElement {
  const ref = useRef<HTMLElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node || reducedMotion) return;

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

  return (
    <section ref={ref} id={id} className={className}>
      {children}
    </section>
  );
}
