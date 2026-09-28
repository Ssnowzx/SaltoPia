# ADR-0002: Generate the 3D world in code, not load a pre-built model

- **Status:** Accepted
- **Date:** 2026-09-14

## Context

The reference ships its whole city as one 16.3 MB glTF file. Saltopia is presented live
on a machine nobody has tested, is assessed on its source, and has to change often: places
move, and buildings are added and corrected after review.

## Decision

Every object in the world is built by procedural builders from a typed layout
(`web/src/lib/world/`). This covers terrain, roads, buildings, trees, boats, the sky and
every texture. The layout lists what stands where, and a registry maps each model key to a
builder. Nothing of the world is downloaded. The only models fetched are six CC0
characters for walk mode and the townsfolk, and only after the world has been drawn.

## Consequences

- The world's 3D payload is zero bytes, far below the 8 MB budget (NFR-03).
- The town is reviewable, diffable source, and `npm run check:layout` can check its
  invariants (FR-53).
- Visual fidelity costs code: realism had to be written, not modelled
  (`elevate-world-realism`).
- The registry keeps one loader-shaped seam: any builder can be replaced by a glTF model
  without touching the layout.
- Source: `add-serranopolis-experience` design D1 and D2.
