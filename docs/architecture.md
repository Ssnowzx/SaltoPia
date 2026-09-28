# How Saltopia is built

This is the document for the parts that are not obvious from the file names: what depends
on what, and the handful of rules that, when broken, produce the defects that took longest
to find. The decisions themselves, with their reasoning, are in the design of each change
under `openspec/changes/`: `add-serranopolis-experience` (D1–D27, the site),
`elevate-world-realism` (sky, water, roads, houses, quality tiers), `add-walking-character`
(walk mode), `add-living-townsfolk` (the townsfolk, and the feet on what is drawn) and
`elevate-place-pages` (the place pages' bands, the menus, the contest page) and
`adopt-night-palette` (night, wine and champagne across the whole interface); this is the
map of the code.

## Two halves

**The hub** is `/`. A single WebGL canvas, no scroll, and a world with nothing downloaded
for it - only its people are models, fetched once it has been drawn. **The pages**
are everything else: ordinary documents that scroll, with no WebGL at all. They share a
navigation bar, a footer and a colour palette, and nothing else. Keeping them apart is
what lets the pages stay fast and the hub stay a scene.

## The world, layer by layer

Everything in `src/lib/world/` is a pure module: data in, geometry out, no React. The
dependency order matters, because two of the modules below cannot import each other.

```
constants.ts     numbers: palette, camera, sky, water, roads, walk mode, quality tiers
sites.ts         where every named place is  ─────────────┐   (imports nothing)
road-network.ts  where every road is  ───────────────┐    │   (imports nothing)
curves.ts        the one curve builder both use      │    │
        ↓                                            │    │
terrain.ts       the single source of ground height ←┴────┘
outer-land.ts    the land past the map's edge, and landHeightAt everywhere
        ↓
roads.ts  road-junctions.ts  road-surfaces.ts   streets, kerbs, pavements, clean junctions
builders.ts  building.ts  dwellings.ts          primitives, houses, ten regional designs
landmarks.ts  farms.ts  attractions.ts  ufo-port.ts  props.ts  groves.ts
        ↓
neighborhood-layout.ts   what is placed where, and the spacing pass

sky.ts  atmosphere.ts  planar-reflection.ts     the sky, aerial perspective, the lake's mirror
world-material.ts  terrain-material.ts  road-material.ts  lake-material.ts   the shaders
```

`terrain.ts` owns `terrainHeightAt(x, z)`, and `outer-land.ts` continues it past the map's
edge as `landHeightAt(x, z)`, which every building, road, tree and pin samples. Nothing else
may decide how high the ground is — that is why nothing floats or sinks.

`src/lib/walk/` is walk mode and the townsfolk, pure as well: the walk world (blocked
ground, obstacle circles, the height field of everything stood on), movement, A* routes,
arrival areas, and the townsfolk's routes and behaviour. It reads the world; the world
never reads it.

`sites.ts` and `road-network.ts` import nothing on purpose. The terrain reads them to
grade the ground; the geometry reads them to draw. If either imported the terrain the
cycle would force a copy of the coordinates, and the copies would drift — which they did,
producing buildings standing beside their own flat ground.

## Six rules the world depends on

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

**An aimed zoom moves the aim, so putting it back is a pan.** OrbitControls re-derives the
orbit target from the camera's forward ray on every dolly, which is what makes a zoom go
toward the cursor. Zooming in on one thing and out again therefore leaves the visitor aimed
at that thing from far away. The rig eases the aim home, and moves camera and target
together: easing the target alone lengthens the distance between the two as it moves, which
feeds back into the strength of the pull and cancels the visitor's zoom while they are
still making it.

A seventh, older one worth keeping in mind: **a blend or bound that starts in front of what
it should be behind.** Windows built at the front wall's z and then rotated, a golden tint
starting in front of the far shore, a shadow frustum smaller than the terrain, a terrace
meant for one shoreline applied across the whole map. Check extents against the thing they
must clear.

## Rules from the realism pass and walk mode

**Never take a pass out of a running effect composer.** Removing the ambient-occlusion pass
when the quality tier stepped down left the composer blitting into a depth texture of
another format; every frame failed and the canvas froze on its last image, while the pins,
which are HTML, went on moving over it — it looked like the pins drifting away. The
composer is keyed on the tier, so each tier gets a new one.

**Clamp the sky before it lights anything.** The analytic sun runs to thousands; bloomed or
baked into the environment map as it is, it washes the town orange. The drawn sky and the
baked one are clamped separately.

**The lake draws the scene twice.** Its mirror is a second render of everything reflected;
what sits on the unreflected layer (the far woods) is left out of it. Anything added near
the water costs double.

**The feet stand on what is drawn.** A walker's height comes from a height field rasterised
from the drawn geometry — the road surface and the open places' floors — never from a rule.
Twice a rule was written instead (the carriageway's height on any street, then nothing for
the square's paving) and twice the feet sank. A new raised surface belongs in that field.

**Nothing returned by a hook is written to.** React's compiler lint rejects it, and it is
right to: the three.js objects a frame loop moves are held in refs, reached through `get()`,
or changed by module functions.

**A download can fail.** Every model load sits inside an error boundary; a model that does
not arrive leaves its people out, not the hub without a world.

## The checks

`npm run check` runs all of them, and `npm test` the unit tests of the pure logic — noise,
the lake's mirror, groves, junctions, house designs, the walk world, the townsfolk, and on
the pages' side the colour rules, the menus' content, the gallery and print layout and the
contest's calendar and deck. Two
of the checks are specific to this project and both have caught real defects:

- **`check:layout`** — no building overlaps another, none stands on a road, no car park
  crosses a street, and the two boat routes neither cross each other nor run aground. No
  house stands beside its twin; nothing of the land stands in the water, and nothing of the
  water on land: piers run from the bank out over the water, stilt cabins keep their floor
  dry, and no lake house's pool lies across a road. Landmarks are excused from the road
  test: a driveway ending at the door is the point.
- **`check:assets`** — every image path in the database exists on disk. It found three
  crests still pointing at `.webp` files that stopped being written when the crests became
  SVG, and the cause: the seed's update branch was not setting the paths, so rows created
  before a change kept the old one for ever. It also counts what each gallery folder holds
  and names the thin ones, without failing on them: a gallery fills up over several
  sittings, and a page that is missing one is not a broken page. Menus are counted the same
  way, photograph by photograph.
- **`tests/palette.test.ts`** — reads the tokens from `globals.css`: every saturated one
  stands at least 0.08 (OKLab) from the reference's colours, and no interface file names
  the retired teal or araucária. The founding teal and gold were within 0.04 of the
  reference's deep green and mustard.
- **`tests/content.test.ts`** — every place colour keeps the pale text at 4.5:1 or more
  and stands at least 0.08 (OKLab) from each colour of the reference site. Two of the old
  colours were its orange-red to within 0.02; the owner's condition was "not the
  reference's colours", and this is what keeps a new place from drifting back.

## The hub's interface

Pins are HTML in an absolutely positioned layer above the canvas. `pin-projector.tsx`
projects each place's world position and writes the result straight into
`style.transform`, outside React — sixty reconciliations a second would be a bug, not a
detail. The pins' DOM order never changes, which is what gives the keyboard a stable tab
order while the camera moves.

Choosing a pin does not navigate. The camera flies (`camera-rig.tsx`, a quadratic Bézier
so the path arcs over the ridge rather than through it), the pins hide, and the card opens
when the camera settles. The card traps Tab and hands focus back to its pin on Escape.

Left alone for three seconds the camera does two things: it resumes its slow sway, and, if
it is back in its widest band, it eases the aim back onto the composed wide shot. Both are
in `camera-rig.tsx`, because all of it contends for one camera.

Three quality tiers (`quality-tier.ts`) set the pixel ratio, the resolution of the lake's
reflection (none on the lowest) and whether ambient occlusion runs. drei's `PerformanceMonitor` steps down one tier after a
sustained drop under 30 fps and never back up, so the image does not oscillate;
`?quality=high|medium|low` pins one, and the tier in use is on the root as `data-quality`.
Test the unpinned path in a real, headed Chrome: every headless capture that pinned a tier
missed the freeze described above.

**Walk mode** swaps the camera's owner: in the air `CameraRig`, on foot `WalkScene` and its
follow camera — never both. A pin then walks the character to its place instead of flying
the camera. The walker is a pure step (`lib/walk/movement.ts`) over the walk world, and the
frame loop writes its position straight into the scene, as the projector does for pins.

**The townsfolk** mount once the scene has drawn its first frame and the walk world has been
built in an idle moment. Each is a `SkeletonUtils` clone of one of the six people with its
own materials and mixer; their positions go into a small shared list the walker collides
with. Off-screen they are culled in every pass; far away they cast no shadow and animate
every fourth frame.

`viewport-framing.tsx` widens the vertical field of view by however much the viewport
falls short of 16:9, which holds the horizontal field — the axis the town is laid out
across — at what it was composed for. That is the whole of the hub's responsive behaviour.

## The pages

`ContentShell` carries the header, the footer and Lenis; the hub deliberately gets none of
them. `Reveal` animates content in once, and is careful to render everything visible
when scripting or motion is unavailable — including clearing its own mark if the first
client render happened before the motion preference was known.

A place page is a stack of bands, in this order (`app/[place]/page.tsx`):

```
place-hero.tsx          pinned photograph and crest            (sticky, behind everything)
place-welcome.tsx       "Bem-vindo a", facts, the faded place with prints over it
marquee.tsx             the ribbon: bunting, the motto looping, the call to action boxed
menu-block.tsx          the Serra's ridge, then the menu on the place's colour
  menu-grid.tsx         ticket cards and the <dialog> one opens      (client)
experience-itinerary    numbered stops, alternating sides
place-sections.tsx      the gallery mosaic
postcard-share.tsx      fog, the postcard, the share buttons
```

**The hero is pinned and every band after it paints its own opaque ground.** That is the
whole trick of the page sliding over the place, and it has a consequence: a band must never
fade in as a whole, or the hero shows through it while it does. Bands reveal their content
(`<Reveal as="div">`) and keep their ground. The parallax is CSS tied to scrolling
(`animation-timeline`), declared only where it is supported and motion is welcome.

Each page takes its colour from its place's `accent`, which `place-theme.tsx` expands into
the wash, the veil, the deep and the ink the bands are built from — fifteen places read as
fifteen pages rather than one page fifteen times. The crests take it too: `crestSvg` accepts
the accent and an id suffix, because one page now draws the same crest up to five times.

**A menu** is a table (`menu_item`) plus a heading on `place`, read by `getPlaceMenu` —
kept off `Place` so the hub does not carry 135 dishes. A photograph path is a promise, not
a file: `lib/public-file.ts` turns a missing one into `null`, and the card draws
`photo-stand-in.tsx` instead of asking for it. Dropping the file in replaces the stand-in on
the next reload in development, and on the next build in production.

The gallery band reads `public/images/places/<slug>/` from disk rather than the database:
pictures arrive in batches and are named by whoever makes them, and ninety rows of nothing
but a path would turn the seed, which is for words, into a file of filenames. An empty
folder falls back to the pictures the page already has, and `galleryLayout` picks a mosaic
that leaves no hole for any count.

**The contest page** (`app/embaixador/`, `components/contest/`, `lib/contest/`) is the
reference's "be the mayor" page in our own words and colours. It is fictional, says so
first in its rulebook, and has no form. Its calendar marks today's phase with
`campaignStatus`, in Lages' time zone, and the page revalidates hourly so the mark does not
freeze at build time.

The words of the pages live in `web/prisma/content/` (places, menus) and
`web/src/lib/contest/content.ts`, all free of side effects so the tests can read them.
`prisma/seed.ts` only writes them.

Navigation is full-document, through plain `<a>` elements. That is what lets the browser
run the iris as a cross-document view transition, which is how the reference does it; the
client router would need an experimental flag, and the demo cannot afford one. The
`no-html-link-for-pages` lint rule is switched off for this reason and no other.

## Assets

The only files fetched for the 3D scene are the six people in `public/models/characters/`
— CC0 models by Quaternius, cut to six clips and meshopt-compressed to about 0.5 MB each.
`public/models/CREDITS.md` records where each came from and how it was processed. Nothing
else is vendored.

- **Wordmark** — `scripts/build-logo.py` cuts two files from `logo.png`: one with the paper
  card shaped to the emblem and faded out, for use over the map, and one cut out, for the
  cream header. Neither works in both places, which is why there are two. The card's
  corner fleurons survive the crop as four small marks; the mask drops any small island
  standing more than 14px from the emblem, and the script empties Next's image cache so
  the new file is actually served.
- **Crests** — `scripts/build-crests.ts` draws an SVG per place from its pin glyph, in the
  place's own colour. The name is set smaller when it is long: the rim's text path drops
  whatever does not fit, and "Galpão do Fogo de Chão" was losing a letter at each end.
- **Photographs** — generated from `docs/image-prompts.md` and committed under
  `web/public/images/`. They are always enlargements: the generator tops out at 1280×720
  and 1152×864, and the files lose almost nothing when knocked down to 1280 and back, which
  is what an interpolated image does. `scripts/sharpen-photos.py` puts back the edges the
  enlargement smeared — destructive, so each result is recorded by digest and skipped next
  time — converts any PNG or JPEG it finds to WebP first, and empties the optimiser's
  cache, which keys on the URL and not on the file behind it.
- **The Grok manifest** — `npm run images:prompts` writes `docs/grok/manifest.jsonl`, one
  line per photograph still missing (path, aspect ratio, full prompt), from the briefs in
  the content modules and the gallery lines of `docs/image-prompts.md`. `docs/grok/README.md`
  has the one instruction that makes Grok Build work through it.

## Adding a place

1. Add it to `SITES` in `sites.ts` with its pad and clearing radii.
2. Give it a model in `MODEL_REGISTRY` and a row in `SITE_LANDMARKS`.
3. Add a driveway in `road-network.ts` so it can be reached. If it is open ground — a
   square, an apron — add its model to `OPEN_GROUND` in `lib/walk/obstacles.ts`, so walk
   mode walks through it instead of round it.
4. Add a pin glyph to `pin-icons.ts`.
5. Add the place and its experiences to `prisma/content/places.ts` — its accent must pass
   `tests/content.test.ts` — and its menu to `prisma/content/menus.ts`, then
   `npm run db:seed`.
6. Add a brief to `docs/image-prompts.md`, run `npm run images:prompts`, generate what the
   manifest lists, then `npm run images:sharpen`.
7. Run `npm run check` and `npm test`.

Steps 1–3 are separate files on purpose, and step 7 is what catches it when one is
forgotten.
