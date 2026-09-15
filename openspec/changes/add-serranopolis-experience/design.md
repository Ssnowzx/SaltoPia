## Context

See proposal.md — Why.

The reference implementation at `visitmeatopia.com` was measured directly rather than
guessed at: its pages were rendered in headless Chromium, its stylesheets read from the live
document, and its bundles inspected. The numbers below are observed, not estimated.

**What the reference actually does**

| Aspect | Observed |
| --- | --- |
| Framework | Next.js 16.2.11 (Turbopack), React 19.3 canary, Emotion for styling |
| 3D | three.js via `@react-three/fiber`; `GLTFLoader` + DRACO; `InstancedMesh`, `Points`, `VideoTexture` |
| Animation | GSAP 3.38.1 with `Draggable` and `useGSAP`; `duration: 2`, `ease: "power2.inOut"` |
| Hub document height | 918px against a 900px viewport — the hub does not scroll |
| City payload | A single `Map.v45.glb` of **16.3 MB**, with ~160 textures unpacked as blobs |
| Pins | `<div>` + inline `<svg>` (54×75) in an absolute overlay; positioned by inline `transform: translate(-50%,-50%) translate(Xpx, Ypx)`; hover `transform: scale()` at `0.2s ease-in-out` |
| Pin colour | `#E75B37`; label `background #FFFDF6`, `border-radius 100px`, `padding 4px 8px` |
| Page transition | View Transitions API. `@keyframes hole { 0% { clip-path: circle(0%) } 100% { clip-path: circle(100%) } }` on `::view-transition-new(root)` for `1.5s ease-in`; `::view-transition-old(root)` has no animation; a `.no-transition` class zeroes all durations |
| Content pages | Ordinary scroll — district 5401px, recipe 4547px — with **no canvas** |
| Palette | `#E75B37` `#C04C2E` `#9A3D25` `#FFFDF6` `#FEF2DF` `#FFEDCE` `#83C5AD` `#355D4F` `#0C5B53` `#3C3231` |
| Type | `cinema-script` (display) + `proxima-nova` (UI), both Adobe Typekit |
| Other | Kontent.ai headless CMS; `react-modal`; Google Tag Manager |

**Constraints specific to this project**

- Two of the reference's fonts are licensed Adobe Typekit families and cannot be used.
- The reference's 16.3 MB single-GLB approach is a poor fit for an unknown classroom
  network, and it hides the city's composition inside a binary the professor cannot inspect.
- No budget: every asset must be CC0 or generated.
- The evaluation is a live demo. A failure mode that blanks the screen costs more than any
  amount of visual polish gains.

## Goals / Non-Goals

**Goals:**

- Reproduce the reference's *choreography* — the hub-and-spoke model, the projected pin
  overlay, the fly-to-then-card flow, the iris transition — at matching timing fidelity.
- Keep the neighbourhood's composition readable as source: a reviewer should be able to open
  one file and see what the town is made of.
- Stay demonstrable on unknown hardware, including hardware with no working WebGL.
- Carry an identity that is genuinely of the Serra Catarinense, not the reference's palette
  with the hues rotated.

**Non-Goals:**

- A headless CMS. Content is typed TypeScript modules in the repository; adding a CMS later
  changes the data source, not any spec.
- Geographic accuracy. Serranópolis is a *fictional* new neighbourhood of Lages. It borrows
  the region's architecture, vegetation, light and culture, not its street plan.
- Authentication, user accounts, or the reference's photo-upload contest mechanic.
- Matching the reference's asset *volume*. Eight points of interest, not ten districts with
  ninety recipes.

## Decisions

### D1 — Compose the neighbourhood from a typed layout, not a pre-baked GLB

The reference ships one 16.3 MB `Map.glb`. This project instead keeps a
`neighborhood-layout.ts` module listing every placed object as
`{ model, position, rotation, scale }`, loads a small set of CC0 kit models, and assembles
the scene at runtime.

*Why:* the layout becomes reviewable and diffable source — which matters for an academic
submission — and the payload drops to the handful of distinct models actually used rather
than a monolith containing every instance. It also removes Blender from the critical path,
so the neighbourhood can be edited without leaving the editor.

*Alternative considered:* authoring in Blender and exporting one DRACO-compressed GLB, as
the reference does. Rejected for this project: it produces a better-looking result faster but
makes the town opaque to review and puts a 16 MB download in front of the demo. It stays
available as a later optimisation — the layout can be baked into a single GLB without any
spec changing.

**Revised during implementation (2026-09-14).** The layout's `model` key resolves through a
registry to a **procedural builder**, not to a downloaded `.glb`. Kenney publishes its kits
behind a JavaScript-rendered page with no direct link, and Poly Pizza's API requires a key —
so vendoring CC0 kits was not a step that could be taken without the user fetching files
themselves.

Building the geometry in code turned out to be the better answer rather than merely the
available one: the 3D payload drops to zero, there is no licence provenance to defend, and
the town's composition becomes fully readable source — which is the reason this decision
existed in the first place. The `world-map` spec is unaffected: it requires composition
"from a typed layout describing each placed object's model, position, rotation and scale",
and a builder key satisfies that exactly as a file path would.

The registry keeps one loader-shaped seam, so a CC0 or hand-authored GLB can replace any
builder later without touching the layout or the scene.

### D2 — Generate araucária trees procedurally

The araucária is the visual signature of the Serra Catarinense: a bare trunk with a flat,
candelabra-like crown. No CC0 kit ships one, and substituting generic conifers would make
the town read as alpine rather than Brazilian.

They are therefore built in three.js geometry — a trunk plus radially arranged flattened
crown segments, with seeded per-tree variation in height, crown radius and segment count —
and drawn as a single instanced batch.

*Why:* it is the cheapest way to get the one silhouette that carries the region's identity,
and a seeded generator gives a forest of individuals from one geometry.

*Alternative considered:* 2D billboard sprites from generated art. Rejected — billboards
break the moment the camera orbits, and the hub orbits continuously.

### D3 — Pins as projected HTML, matching the reference

Each frame, each place's world position is projected to normalised device coordinates and
written to the pin's `transform`. A place behind the camera plane is hidden. Occlusion is
resolved by a raycast against terrain and building meshes.

*Why:* this is what the reference does, and the reasons hold — HTML labels stay crisp at any
distance, stay upright under orbit, take styling and transitions directly, and are reachable
by keyboard and screen reader in a way that geometry never is.

*Cost:* a DOM write per pin per frame. With eight pins this is negligible. The transform is
written directly to the node rather than routed through React state, so the render loop does
not trigger a reconciliation pass sixty times a second.

### D4 — Iris transition via the View Transitions API, with the same numbers

```css
@keyframes iris {
  from { clip-path: circle(0%); }
  to   { clip-path: circle(100%); }
}
::view-transition-old(root) { animation: none; }
::view-transition-new(root) { animation: 1.5s ease-in both iris; }
```

Identical in construction and timing to the reference. The outgoing page deliberately does
not animate: the effect reads as an aperture opening onto the new page rather than as a
cross-fade.

Support is feature-detected. Where `startViewTransition` is absent, navigation proceeds
plainly — the transition is decoration and never gates arrival.

### D5 — Free type that carries the same roles

| Role | Reference | Here | Why |
| --- | --- | --- | --- |
| Display script | `cinema-script` (Typekit) | **Yellowtail** | Same retro sign-painter register — a brush script with a painted ductus rather than a formal copperplate |
| Interface sans | `proxima-nova` (Typekit) | **Figtree** | Geometric-humanist with a 400–900 range, so the heavy display weights the layout depends on exist |

Both are self-hosted through `next/font/google`, which removes the third-party request and
generates a metric-adjusted fallback, holding layout shift near zero.

### D6 — Palette derived from the region, mapped onto the reference's roles (superseded in part by D12)

The reference's palette works because of its *structure*, not its hues: one saturated warm
accent doing all the pointing, a near-white warm surface for content, a soft cool secondary
for decorative script, and a deep desaturated tone to sit under everything. That structure
is kept; every hue is replaced from the Serra.

| Role | Reference | Serranópolis | Drawn from |
| --- | --- | --- | --- |
| Primary accent | `#E75B37` | `#C4522E` | Embers of the fogo de chão |
| Button | `#C04C2E` | `#A8431F` | — |
| Button hover | `#9A3D25` | `#83341A` | — |
| Card surface | `#FFFDF6` | `#FFF9EC` | Morning mist over the campos |
| Page background | `#FEF2DF` | `#F3E4C8` | Dry highland grass |
| Script accent | `#83C5AD` | `#9CC4B2` | Erva-mate leaf |
| Deep surface | `#0C5B53` | `#1E4A3A` | Araucária canopy |
| Body text | `#3C3231` | `#2E241C` | Araucária bark |
| — | — | `#7FA3B8` | Frost, and the cold water of the Rio Canoas |
| — | — | `#D9A441` | Ripe pinhão |
| — | — | `#7B2D3F` | High-altitude wine |

The last three have no counterpart in the reference. They exist because the Serra's identity
is partly *cold* — frost, mist, altitude — and a palette built only from warm tones would
describe a different place.

Sky gradient: `#F2C879` → `#E89F5E` → `#D97B4A`, with a mist band at `#F0E2CC` along the
horizon. This is late golden hour over the campos, which is when the region looks most like
itself, and it preserves the reference's warm-sky-over-cool-land contrast.

### D7 — Eight points of interest

| Slug | Name | What it is |
| --- | --- | --- |
| `galpao-do-fogo` | Galpão do Fogo de Chão | Costela on the stake over open fire |
| `praca-do-pinhao` | Praça do Pinhão | The central square; Festa do Pinhão |
| `mirante-da-neblina` | Mirante da Neblina | Lookout over the canyon and the cloud sea |
| `vinicola-de-altitude` | Vinícola de Altitude | High-altitude winery and its terraces |
| `ctg-porteira-do-tropeiro` | CTG Porteira do Tropeiro | Gaúcho traditions centre |
| `bosque-das-araucarias` | Bosque das Araucárias | Araucária forest trail |
| `estacao-velha` | Estação Velha | The old railway station, now a market |
| `pousada-da-geada` | Pousada da Geada | Rural inn with a lit hearth |
| `salto-caveiras` | Salto do Rio Caveiras | The falls over two basalt ledges beside the 1940s brick powerhouse - Lages' own Salto, rebuilt here |

Nine rather than the reference's ten: enough to fill the map legibly, few enough that each
gets a genuinely written page instead of filler.

### D8 — Fallback is built first, not last

The static-illustration fallback required by `world-map` is implemented before the 3D hub,
not after. A fallback added last is a fallback that has never been seen.

*Why:* the demo runs on a machine nobody has tested. WebGL is the single point of failure,
and the cost of discovering that at the podium is total.

### D9 — Art direction sourced from generated illustration

The 3D models are CC0 geometry, deliberately plain. The *character* comes from 2D
illustration generated to a written art-direction brief: the wordmark, each place's crest,
each place page's cinematic hero, the marquee motifs, and the fallback map.

*Why:* this splits the problem along its natural seam — geometry is what CC0 kits are good
at, and identity is what they are uniformly bad at. Every generated asset is specified by a
prompt kept in the repository, so the art is reproducible rather than a one-off nobody can
regenerate.

### D10 — The camera is held to an arc, not a full orbit

The reference does not let the visitor orbit the city all the way round, and after
building a full orbit here it became clear why: from behind, the back of the serra, the
edge of the terrain and the ends of the railway are all in view, and none of them is
worth building for. The world is composed to be seen from the south.

The orbit is therefore limited to an azimuth arc of ±0.72 rad around the front, with
polar and distance bounds. Idle drift is a slow sinusoidal sway inside that arc from
wherever the visitor left the camera, rather than a continuous rotation that would press
against the stops.

*Why:* it keeps every frame a frame someone composed, and it removes an entire class of
edge-of-world artefacts instead of papering over them. The `world-map` spec already
requires the camera never to lose the neighbourhood from frame; an arc is the direct
way to satisfy it.

### D11 — Roads as one loop and one driveway per landmark

The first road network — a ring, a circuit and connecting spokes — read as a tangle:
three concentric structures with short connectors, roads overlapping, and a road running
between a house and the barn. It was replaced with one street around the square and one
driveway per landmark, each ending in a round yard in front of the place it serves.

*Why:* a road that goes somewhere and stops there is legible; a road that merely
connects two other roads is noise. The pickup drives the loop; nothing else needs a
vehicle on it.

### D12 — The world is the community at the Salto do Rio Caveiras reservoir

Recomposed on 2026-09-15 from two references the user supplied: a drone photograph of
the reservoir at sunset (the lake with a wooded island in the middle, houses with lawns
and pools on the near shore, low forested hills going blue at the horizon) and a low-poly
rendering of the same scene (turquoise water with boats, cabins on stilts, a row of
A-frame chalets on the far shore, a big sun with rays).

- The lake sits in the middle distance with the island kept in the centre; the community
  is in the foreground; the dam, the falls and the powerhouse are at the lake's east end.
- The street network is real: a main road enters from the south-east, loops the
  community's block with two cross streets, and each landmark has one driveway ending
  in a yard or car park. No road passes through a building.
- Landmarks are spread around the shore and the hills rather than clustered at a square.
- Water is its own shader: Fresnel toward the sunset, a glitter path toward the sun, and
  two scrolling ripple layers - because the previous flat-coloured water was the weakest
  element in the frame.
- The interface palette moved from orange to teal and gold. The orange read as a copy
  of the reference site; teal and gold come from the water and the light in the photo.

*Why:* the user's brief moved from "like the reference" to "Lages, as it is" - the
reservoir is the real place, and a community by a lake with an island is a composition
the reference site does not have.

### D13 — Openings are built in the wall's own frame

Windows and doors are authored centred on x = 0, facing +Z, with the wall's outer face
at z = 0, and a single `onWall` helper rotates and translates them onto whichever of a
box's four walls they belong to.

*Why:* the previous version built each opening at the *front* wall's z and then rotated
it onto the side walls. Rotating a point already offset along +Z moves that offset onto
±X, and the code then added half the width on top - so every side window ended up half
the building's depth out in mid-air. On a shop 5 units deep that is a pane of glass
floating 2.5 units off the facade, visible across the whole map.

The lesson generalises: placement arithmetic composes badly when the source frame
already carries an offset. Building in a neutral local frame and transforming once
removes the whole class of error, and it is why every opening now also gets a back wall
and both side walls for free.

### D14 — The map is composed to the reference photograph, not to a map

The world was rebuilt a third time, this time framed shot-for-shot against the
reference the user supplied: the bay fills the left of the frame and runs toward the
viewer, a wooded peninsula with stilt cabins and piers reaches in from the west, the
community climbs the east shore on the right, a lakefront resort with pool, solar
panels and a car park sits in the foreground, a row of A-frame chalets lines the far
shore, and low golden hills close the horizon in overlapping bands.

Consequences worth recording, because each was a bug first:

- The shoreline is authored as two curves - an east shore given as (z, x) control
  points and a far shore as (x, z) - intersected as half-spaces, with the peninsula cut
  back out. An ellipse cannot make a bay that opens toward the camera.
- The far hills sit at z = -212 and beyond. At z = -150 their front edge reached z =
  -92, which is in front of the far shore at z = -120, so they stood between the camera
  and the chalets instead of behind them. A dome's radius is its reach, not its centre.
- The hills are banded by distance and drained toward a haze colour in proportion, so
  the horizon reads as layers. A single row at one colour reads as a wall.

*Why:* the user's instruction moved from "like the reference site" to "like this
photograph of Lages". Composition is now the specification, and it is checked by
putting the render beside the photograph.

### D15 — Two rendering defects worth naming, because both are easy to repeat

**The shadow map's edge is a visible object.** The directional light's orthographic
frustum was +/-150 while the terrain grew to 420 across. Anything outside that frustum
samples beyond the depth texture and comes back fully shadowed, so the scene grew a
dark slab with a hard diagonal edge across half the frame. The frustum must contain
everything that receives shadow - for a 420-unit terrain that is +/-300, since the
diagonal is what projects into the light's view. Meshes too far to matter, like the
horizon hills, are better taken out of `receiveShadow` than covered by a bigger map.

**Coplanar faces flicker.** Window glass was a 0.1-deep box centred at z = -0.05, so
its front face landed exactly on the wall's face at z = 0. Two surfaces at identical
depth means whichever the rasteriser resolves first wins per pixel and per frame -
which is what made every window in the town blink. Glazing now sits 0.09 behind the
wall face. Any inset detail needs real clearance, not a nominal offset.

### D16 — The project is Saltopia

Renamed on 2026-09-15 from Serranopolis, to the name on the wordmark the user supplied:
**SALTOPIA**, over a banner reading *Salto Caveiras - Serra Catarinense*, with *Est.
2028*. The header and title screen carry that lockup.

### D17 — Camera flights are relative to the ground, and the camera cannot leave the world

Two faults in one sitting, both from treating a relative quantity as absolute.

**Zoom.** `maxDistance` was 300 against a terrain 420 across, so pulling back took the
camera past the terrain's own edge and filled the lower frame with the plane beneath it.
The bound is now 205 - inside the world. The `world-map` spec already required the
camera never to lose the neighbourhood from frame; a distance bound larger than the
world cannot satisfy that.

**Flight targets.** A place's seeded `world` and `camera` Y were read as absolute
heights. That is harmless while every place sits near y = 0, and wrong the moment one
does not: the UFO port stands on a plateau about 20 units up, so the camera flew to a
target 20 units underground and arrived inside the apron. Both are now offsets from
`terrainHeightAt` at the place, which is what they always meant.

### D18 — Porto de OVNIs

A tenth place, and deliberately the most distant: a concrete apron ringed with beacons
on the plateau behind the reservoir, a control tower with a dish, a hangar, a windsock,
and a saucer holding station overhead on a light beam. It is built tall because at that
range only the tower, the beam and the saucer read at all.

Placing it revealed that the hills' gold crown began at 55% of their height - so the
plateau it stands on read as desert up close. The crown now starts at 82%, which also
greens the whole horizon band.

### D19 — Roads are graded into the terrain, not draped over it

Every road, driveway, yard and car park is data in `road-network.ts`, which imports
nothing. The terrain reads it and grades the ground under each ribbon - flat across the
road's width at the road's own level, easing back over a shoulder - along the exact
curve the ribbon is drawn on. Draping a ribbon over ungraded ground never worked: lifted
a little, the ground came through its edges on every bump; lifted more, it floated on
every crest. The ribbons are then drawn in layers (all shoulders, all tracks and yards,
all carriageways, all lines) so a junction is a carriageway crossing a carriageway.

The layers sit 0.15 apart. At 0.06 the shoulder and the carriageway fell within the
depth buffer's precision of each other at the hub's distance, and which one showed was
decided quad by quad - a ladder of pale rungs down every curve.

Paved surfaces map inside a single atlas tile. The atlas lookup wraps with `fract()`,
and at each wrap the derivative jumps, the GPU picks the coarsest mip and samples the
neighbouring tile - a dark seam across every street every couple of metres.

### D20 — Hills that carry buildings are terrain

The ridge behind the far shore and the band behind it are bumps in the height function,
not dome meshes on top of it. A flat pad levels the ground under a dome but not the dome
itself, so anything placed inside one was buried. The chalet village stands on the ridge
and the three farms on the band behind it, each reached by the plateau track. Only the
far band and the shoulders outside the frame remain backdrop meshes.

### D21 — The waterline is shaded per pixel

The reservoir is a river, not a beach: grass runs to the water and the bank is a strip
of wet earth, drawn in the terrain's fragment shader from the interpolated ground height
and signed distance to the water. As a vertex colour, at one vertex every 2.4 units, a
strip that narrow was a sawtooth along every diagonal stretch of shore.

The terrain itself is smooth-shaded. Flat-shaded, every slope was a zig-zag of light
and dark triangles: a wall of facets along the channel bank, a ladder of pale rungs down
any road on an embankment. Buildings, trees and the backdrop hills keep their facets.

### D23 — Attractions for partners

Two more places, built to be sold: Parque Caveiras, a fairground on the east slope
whose Ferris wheel and carousel are live meshes that turn, and Deck do Lago, a timber
restaurant on the shore with its deck on piles over the water. Both are sites like any
other - pad, clearing, driveway, pin, seeded copy - so nothing about them is special-cased.

### D24 — Content pages are full documents; the heroes are renders of the world

Every navigation between the hub and a content page is a full-document load through a
plain anchor, and the iris runs as the browser's cross-document view transition
(`@view-transition { navigation: auto }` on the root group, exactly as the reference
does it). Next's client router would need its experimental view-transition flag to do
the same, and the demo cannot afford an experimental path. The `no-html-link-for-pages`
lint rule is switched off for this reason. Coming back to the hub reads a session flag
so the title state does not replay.

The place heroes are renders of the map from each place's own flight camera, made by
`scratchpad/meatopia/shot-heroes.js` with the interface hidden; the experience images
are crops of them, and the crests are SVGs drawn from the pin glyphs
(`scripts/build-crests.ts`). Nothing is fetched from anywhere. The pages' final images are **photographs** generated
from the briefs in `docs/image-prompts.md` and dropped in at the same paths: the map is
the stylised layer, the pages are the real place - the user's call, 2026-09-15, after
seeing a first set made in the map's own low-poly style.

### D25 — The title state waits for the world

The entry screen - wordmark, tagline, the way in - is on from the first paint, over the
translucent cream the world reads through and nothing else. Only the way in waits for the
scene to be drawn (two frames, counted by `SceneReady`), because there is nothing to
explore until then. Two heavier versions were tried and both read as a slab in front of
the site: a curtain over the whole screen, which hid the wordmark too, and then an opaque
sky behind the wordmark that lifted when the world arrived.

Coming back to the hub skips the title state, but only from inside the site: the session
flag alone made every reload skip it, so the site appeared to jump straight into the map
and the opening was never seen. A browser-back counts, and so does a navigation whose
referrer is one of our own pages; a reload, a typed address and a fresh visit all open on
the title.

The wordmark comes in two files, built by `scripts/build-logo.py`, because the artwork
is printed on a paper card and neither keeping it nor cutting it off works everywhere.
Over the map the cut-out emblem's own drop shadow reads as a dirty edge; over the
header's cream pill the card reads as a paler box inside it. So the entry screen takes
the card, shaped to the emblem and dissolving to transparent - grow the silhouette a
little, blur it a lot, then pull the midtones down so only a faint glow is left - and the
header and footer take the emblem alone.

Both start from the same silhouette: connectivity finds the sheet (a colour key cannot
tell the paper from the cream inside the banner), then a saturation test takes the torn
edge and the shadow the emblem casts on it, which a brightness test misses. Paper is
never saturated and painted scenery always is, so the emblem's outline stops the test
at its own border.

Type over the world carries a halo in the page's own cream. Dark type on a busy picture
is unreadable however dark it is, and a panel behind it would have put a box over the
map the entry screen exists to show.

The way in is disabled while the sky is up, and a timeout opens it regardless after eight
seconds - this is judged live on a machine nobody has tested, and a visitor must never
be left on a sky that does not clear.

Traffic shuttles. The pickup followed the main road as a loop, so at the north end it
jumped back to the south end in front of the visitor; the route now runs from the
south-east entrance the length of the community, over the channel bridge and up the
plateau to the Ovni Porto's gate, and two vehicles drive it out and back, half a cycle
apart.

### D26 — One composition, widened to fit the viewport

The hub is composed for a wide screen, and a phone held upright is half as wide for the
same height. Rather than author a second camera, the vertical field of view widens by
however much the viewport falls short of 16:9, which holds the horizontal field - the one
the town is laid out across - at what it was meant to be; the orbit's distance limits
follow. It is capped at 86 degrees, past which the view tips toward the sky.

Below `sm` the navigation folds into one menu: side by side in a 393px pill the call to
action ran across the wordmark. The place card becomes a sheet along the bottom, because a
centred panel covered the very place the camera had just flown to, and on wider screens it
is anchored between the header and the foot of the window rather than centred on the
window - centred, it ran under the header on a phone held sideways. Its link is focused
with `preventScroll`, or the browser scrolls the place's name out of the card's top.

### D27 — Offers mark a few pins, never all of them

A place may carry a short `offer`. Its pin takes a wine ribbon over the head and a slow
ring that fades outward under it, and the same line appears on the place card and on the
page's hero. Wine against the pins' gold is the only colour on the map that is neither
landscape nor interface, which is what makes four of them read at a glance.

The restraint is the design: nine of fifteen places carry one and six deliberately do
not, the pin's own shape is untouched, and the ring is faint and slow. A ribbon on every
pin would be a carnival, and the eye would stop seeing any of them. They are spread
across the map rather than clustered, so no corner of the frame is all ribbons. The labels are short because they are read on
a pin the size of a thumbnail from across the map, and the ring is behind
`prefers-reduced-motion`.

### D28 — A place page is built around the place's colour

Every place carries an `accent`, and `placeTheme` mixes the wash, the veil, the deep and
the ink from it into custom properties on the page root. No band knows which place it is
drawing: they ask for `var(--place-accent)`. Fifteen places are therefore fifteen pages
rather than one page fifteen times, and changing a colour is a change to content.

The page alternates pale and saturated, and the experiences sit on a full block of the
accent. A couple of cards on a pale page reads as an empty page; the same cards on a
saturated ground read as a collection. The reference does exactly this, in one colour per
district, which is what makes its place pages hold together over 7800 pixels.

The gallery and the experience grid both lay out from their own length, because a place
with one experience was leaving a hole where a row was expected.

A place's gallery is a folder, `public/images/places/<slug>/`, read at build time rather
than listed in the database. Pictures arrive in batches and are named by whoever makes
them; ninety rows of nothing but a path would turn the seed, which is for words, into a
file of filenames. A place with an empty folder falls back to the pictures it already has,
so a page works before the last photograph does, and `check:assets` reports a thin gallery
instead of failing on one.

### D22 — Light from two temperatures

The key light is warm and aimed at the community; the fill is a cool sky hemisphere.
With an orange fill under an orange sky the shadows went olive-brown and the whole frame
read as one colour. The water reflects the sky gradient by direction - turquoise where
the eye looks steeply into it, the sunset's gold toward the far shore - with normals
taken from the ripple field's gradient rather than a difference of unrelated samples.
The sun disc is HDR so it alone crosses the bloom threshold. AgX tone mapping was tried
and read washed-out beside ACES.

## Risks / Trade-offs

- **WebGL unavailable or unstable on the demo machine** → The static fallback is a spec
  requirement and is built first (D8). Context loss mid-session also routes to it, so a
  crash degrades instead of freezing.
- **Runtime composition looks cruder than the reference's hand-authored map** → Accepted,
  and partly bought back by D9: character is carried by the illustrated layer. The layout
  can be baked into a single authored GLB later with no spec change (D1).
- **Per-frame DOM writes for pins** → Bounded at eight pins, written outside React's render
  cycle (D3). If the count ever grows past a few dozen, this needs re-measuring.
- **CC0 kits are stylistically inconsistent between sources** → Restrict to as few kits as
  possible, and unify them with a shared material and palette pass at load rather than
  accepting each kit's baked-in colours.
- **8 MB payload budget is tight for a town** → Instancing (D1) and procedural trees (D2) do
  most of the work. If the budget is threatened, object *variety* is cut before object
  *count*; a sparse town reads worse than a repetitive one.
- **Generated illustration may come back stylistically inconsistent across places** → The
  art-direction brief fixes palette, lighting, camera height and rendering style as shared
  constants, varying only the subject per place.
- **The reference is a live commercial site** → Only its architecture and timing are
  reproduced. No asset, no string, and no name is copied. The 16.3 MB GLB downloaded during
  analysis is confined to the scratch directory and is never vendored into this repository.

## Open Questions

- Whether to bake the final layout into a single DRACO-compressed GLB before the
  presentation. Deferred: it is a build-step optimisation that changes no spec and no task
  beyond its own, and the decision wants a real measurement of the classroom network.
