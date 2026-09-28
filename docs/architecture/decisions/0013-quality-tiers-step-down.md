# ADR-0013: Adapt quality in tiers that only step down

- **Status:** Accepted
- **Date:** 2026-09-24

## Context

The hub is judged live on unknown hardware, and a stuttering demo reads worse than a
simpler image.

## Decision

A performance monitor steps the quality tier down after a sustained drop in frame rate:
high (reflection 0.5, ambient occlusion, dpr up to 2), then medium (reflection 0.35, no AO,
dpr 1.5), then low (no planar reflection, dpr 1). Touch devices start at medium. A tier
never steps back up within a session, so the image does not oscillate. The effect composer
is recreated per tier (`key={tier}`), because removing a pass from a running composer froze
the canvas.

## Consequences

- The hub degrades gracefully on weak hardware (NFR-01, partial: not yet measured on the
  target machine).
- `?quality=` pins a tier for tests. Automatic changes must be verified without it.
- Source: `elevate-world-realism` design D10.
