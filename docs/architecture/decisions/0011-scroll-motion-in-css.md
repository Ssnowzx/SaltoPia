# ADR-0011: Tie scroll motion to CSS, not to a scroll library

- **Status:** Accepted
- **Date:** 2026-09-28

## Context

The place pages needed a pinned hero with parallax and drifting prints. GSAP ScrollTrigger
would be the only use of that plugin on the site, would need Lenis wiring, and runs on the
main thread.

## Decision

The hero is `position: sticky`, and every later band paints an opaque ground over it. The
parallax uses CSS scroll-driven animations (`animation-timeline: scroll()` / `view()`),
declared only inside `@supports` and `prefers-reduced-motion: no-preference`.

## Consequences

- There is no script for scroll motion, and the page is complete and static where the
  feature is missing (Firefox, older Safari).
- A band must reveal its content and never itself, or the pinned hero shows through it.
- Source: `elevate-place-pages` design D4.
