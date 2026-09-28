import type Lenis from "lenis";

/**
 * The one smooth-scroll instance of a content page, held where anything can pause it.
 *
 * Lenis moves the page on every wheel event whatever the stylesheet says, so a dialog
 * that locks the page with `overflow: hidden` still has the page sliding under it. The
 * dialog pauses Lenis here instead, and resumes it on close.
 */

let active: Lenis | null = null;

/** Called by the provider when it creates or destroys its instance. */
export function registerSmoothScroll(instance: Lenis | null): void {
  active = instance;
}

export function pauseSmoothScroll(): void {
  active?.stop();
}

export function resumeSmoothScroll(): void {
  active?.start();
}
