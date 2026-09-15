# How Saltopia is built

This is the document for the parts that are not obvious from the file names: what depends
on what, and the handful of rules that, when broken, produce the defects that took longest
to find. The decisions themselves, with their reasoning, are in
`openspec/changes/add-serranopolis-experience/design.md` (D1–D27); this is the map of the
code.

## Two halves

**The hub** is `/`. A single WebGL canvas, no scroll, no downloaded models. **The pages**
are everything else: ordinary documents that scroll, with no WebGL at all. They share a
navigation bar, a footer and a colour palette, and nothing else. Keeping them apart is
what lets the pages stay fast and the hub stay a scene.

## The world, layer by layer

Everything in `src/lib/world/` is a pure module: data in, geometry out, no React. The
dependency order matters, because two of the modules below cannot import each other.

```
constants.ts     numbers: palette, camera, fog, sizes
sites.ts         where every named place is  ─────────────┐   (imports nothing)
road-network.ts  where every road is  ───────────────┐    │   (imports nothing)
curves.ts        the one curve builder both use      │    │
        ↓                                            │    │
terrain.ts       the single source of ground height ←┴────┘
        ↓
roads.ts         ribbons laid on the graded ground
builders.ts      primitives: box, post, cone, building, tree
landmarks.ts     farms.ts  attractions.ts  ufo-port.ts  props.ts  people.ts
        ↓
neighborhood-layout.ts   what is placed where, and the spacing pass
```

`terrain.ts` owns `terrainHeightAt(x, z)`. Every building, road, tree and pin samples it.
Nothing else may decide how high the ground is — that is why nothing floats or sinks.

`sites.ts` and `road-network.ts` import nothing on purpose. The terrain reads them to
grade the ground; the geometry reads them to draw. If either imported the terrain the
cycle would force a copy of the coordinates, and the copies would drift — which they did,
producing buildings standing beside their own flat ground.

## Five rules the world depends on

These are the ones that cost the most to learn. Each corresponds to a defect that was
visible on screen and hard to attribute.

**Roads are graded into the terrain, not draped over it.** The ground under every ribbon
is flattened to the road's width and level along the curve the ribbon is drawn on. Draping
never works: lifted a little the ground pokes through the edges on every bump, lifted more
the road floats on every crest.

**Road layers sit at least 0.15 apart.** Shoulder, track, carriageway, line. At 0.06 they
fell inside the depth buffer's precision at map distance and the GPU decided quad by quad
which showed — a ladder of pale rungs down every curve.

**A hill that carries a building is terrain, not a mesh.** A flat pad levels the ground
under a dome but not the dome itself, so anything placed inside one is buried. The ridge
and the back band are bumps in the height function; only the far backdrop is mesh.

**Paved surfaces map inside a single atlas tile.** The atlas lookup wraps with `fract()`,
and at each wrap the GPU's derivative jumps, it picks the coarsest mip and samples the
neighbouring tile — a dark seam across every street every couple of metres.

**Never write `rotation.z` after `lookAt`.** `lookAt` can express a heading as
(x = π, y, z = π); overwriting one component flips the object. Use `rotateZ`, which
applies on top of the heading. This is what turned the yacht upside down and made the
sailboat vanish for part of every lap.

A sixth, older one worth keeping in mind: **a blend or bound that starts in front of what
it should be behind.** Windows built at the front wall's z and then rotated, a golden tint
starting in front of the far shore, a shadow frustum smaller than the terrain, a terrace
meant for one shoreline applied across the whole map. Check extents against the thing they
must clear.

## The checks

`npm run check` runs all of them. Two are specific to this project and both have caught
real defects:

- **`check:layout`** — no building overlaps another, none stands on a road, no car park
  crosses a street, and the two boat routes neither cross each other nor run aground.
  Landmarks are excused from the road test: a driveway ending at the door is the point.
- **`check:assets`** — every image path in the database exists on disk. It found three
  crests still pointing at `.webp` files that stopped being written when the crests became
  SVG, and the cause: the seed's update branch was not setting the paths, so rows created
  before a change kept the old one for ever.

## The hub's interface

Pins are HTML in an absolutely positioned layer above the canvas. `pin-projector.tsx`
projects each place's world position and writes the result straight into
`style.transform`, outside React — sixty reconciliations a second would be a bug, not a
detail. The pins' DOM order never changes, which is what gives the keyboard a stable tab
order while the camera moves.

Choosing a pin does not navigate. The camera flies (`camera-rig.tsx`, a quadratic Bézier
so the path arcs over the ridge rather than through it), the pins hide, and the card opens
when the camera settles. The card traps Tab and hands focus back to its pin on Escape.

`viewport-framing.tsx` widens the vertical field of view by however much the viewport
falls short of 16:9, which holds the horizontal field — the axis the town is laid out
across — at what it was composed for. That is the whole of the hub's responsive behaviour.

## The pages

`ContentShell` carries the header, the footer and Lenis; the hub deliberately gets none of
them. `Reveal` animates a section in once, and is careful to render everything visible
when scripting or motion is unavailable — including clearing its own mark if the first
client render happened before the motion preference was known.

Navigation is full-document, through plain `<a>` elements. That is what lets the browser
run the iris as a cross-document view transition, which is how the reference does it; the
client router would need an experimental flag, and the demo cannot afford one. The
`no-html-link-for-pages` lint rule is switched off for this reason and no other.

## Assets

Nothing is fetched at runtime and nothing is vendored.

- **Wordmark** — `scripts/build-logo.py` cuts two files from `logo.png`: one with the paper
  card shaped to the emblem and faded out, for use over the map, and one cut out, for the
  cream header. Neither works in both places, which is why there are two.
- **Crests** — `scripts/build-crests.ts` draws an SVG per place from its pin glyph.
- **Photographs** — generated from `docs/image-prompts.md` and committed under
  `web/public/images/`.

## Adding a place

1. Add it to `SITES` in `sites.ts` with its pad and clearing radii.
2. Give it a model in `MODEL_REGISTRY` and a row in `SITE_LANDMARKS`.
3. Add a driveway in `road-network.ts` so it can be reached.
4. Add a pin glyph to `pin-icons.ts`.
5. Add the place and its experiences to `prisma/seed.ts`, then `npm run db:seed`.
6. Add a brief to `docs/image-prompts.md` and put the images in `public/images/`.
7. Run `npm run check`.

Steps 1–3 are separate files on purpose, and step 7 is what catches it when one is
forgotten.
