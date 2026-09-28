"use client";

import Lenis from "lenis";
import { useEffect } from "react";

import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { registerSmoothScroll } from "@/lib/smooth-scroll";

/** How closely the scroll follows the wheel: lower is smoother, higher is tighter. */
const LERP = 0.1;

/**
 * Smooth scrolling for content pages. Mounted only inside the content shell, never on
 * the hub - the hub does not scroll, and the world-map spec says so. Under reduced motion
 * the native scroll is left alone.
 */
export function LenisProvider(): null {
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;
    const lenis = new Lenis({ autoRaf: true, lerp: LERP });
    registerSmoothScroll(lenis);
    return () => {
      registerSmoothScroll(null);
      lenis.destroy();
    };
  }, [reducedMotion]);

  return null;
}
