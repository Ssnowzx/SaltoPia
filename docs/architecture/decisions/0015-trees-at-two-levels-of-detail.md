# ADR-0015: Draw distant trees in a simpler form of themselves

- **Status:** Accepted
- **Date:** 2026-10-07

## Context

Two tree models make 92% of the world's triangles:

- 1,052 araucárias at 2,668 triangles each;
- 1,525 broadleaf trees at 664 each.

Every copy was drawn in the view, again in the sun's shadow map and, near the lake, again
in the mirror. Hiding the trees took a frame on the M5 from 20.2 ms to 7.4 ms. The hub is
judged live on a machine nobody has tested, so that cost decides whether it runs there.
In the usual views half the trees stand 250-390 m from the camera.

## Decision

The araucária and broadleaf builders have a `simple` detail, registered in
`SIMPLE_MODEL_REGISTRY` (`lib/world/neighborhood-layout.ts`):

- tufts with 20 faces instead of 80, built 6.5% larger so they look the same size;
- branches with four open sides;
- the same random sequence, so every part stands where it does in the full tree.

That is 768 triangles instead of 2,668, and 184 instead of 664.

Each group of those models draws two instanced meshes, one full and one simple. A copy is
drawn full within 200 m of the camera and simple beyond 230 m. Between the two it keeps the
form it had, so it cannot flicker. The copies are reassigned when the camera has moved
2 m. The choice and the packing are pure (`lib/world/tree-detail.ts`) and tested.

## Consequences

- From the wide shot the trees draw 43% of the triangles they did, and on foot at the
  spawn 47%. Within 200 m nothing changes: walk-mode captures are pixel-identical before
  and after.
- Past 200 m a simple crown is a little more angular. Enlarged 4x from a 2x capture it
  shows, at native size it does not.
- A tree model planted by the hundred should get a simple form too. A model without one is
  drawn as before.
- The world-map spec now asks for repeated scenery "in a few batches", not "a single
  batch".
- Source: `speed-up-the-hub` design D3.
