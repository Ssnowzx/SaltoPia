# ADR-0013: Adapt quality in tiers that only step down

- **Status:** Accepted
- **Date:** 2026-09-24

## Context

The hub is judged live on unknown hardware, and a stuttering demo reads worse than a
simpler image.

## Decision

A performance monitor steps the quality tier down after a sustained drop in frame rate:

| Tier | Reflection | AO | Pixel ratio | Shadow map | Multisampling |
| --- | --- | --- | --- | --- | --- |
| high | 0.5 | on | ≤ 2 | 4096² | 4 |
| medium | 0.35 | off | ≤ 1.5 | 2048² | 4 |
| low | off | off | 1 | 2048² | off |

Touch devices start at medium. A tier never steps back up within a session, so the image
does not oscillate. The effect composer is recreated per tier (`key={tier}`), because
removing a pass from a running composer froze the canvas. The shadow map's size and the
multisampling joined the tiers with `speed-up-the-hub` (design D5). The 4096² map is 64 MB
of depth a weak GPU writes every frame.

## Consequences

- The hub degrades gracefully on weak hardware (NFR-01, partial: not yet measured on the
  target machine).
- `?quality=` pins a tier for tests. Automatic changes must be verified without it.
- Source: `elevate-world-realism` design D10; the shadow map and multisampling,
  `speed-up-the-hub` design D5.
