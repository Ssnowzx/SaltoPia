"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void): () => void {
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", onChange);
  return () => {
    media.removeEventListener("change", onChange);
  };
}

function getSnapshot(): boolean {
  return window.matchMedia(QUERY).matches;
}

/** On the server there is no media query to read, so motion is assumed to be allowed. */
function getServerSnapshot(): boolean {
  return false;
}

/**
 * Whether the visitor has asked for reduced motion.
 *
 * Read through `useSyncExternalStore` rather than an effect: matchMedia is external
 * state, and subscribing to it this way keeps the server and first client render in
 * agreement without a post-mount state write.
 *
 * It tracks changes, not just the initial value, because the setting can be toggled
 * while the page is open - and a camera that keeps drifting after the visitor turns
 * motion off is exactly the failure the setting exists to prevent.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
