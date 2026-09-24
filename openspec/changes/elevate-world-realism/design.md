## Context

See proposal.md - Why. The requirements are in `specs/world-appearance/spec.md`.

The world is generated in code (founding change, D1 revised): every object is a merged
`BufferGeometry` carrying a vertex colour and a `surface` id per vertex, drawn with one of
two shared `MeshStandardMaterial`s that sample a 4x4 canvas atlas. Instanced meshes group
placements by model. The terrain is a 620-unit, 262-segment plane with baked vertex
colours; roads are ribbons in layers 0.15 apart; the lake is a `ShaderMaterial` that fakes
its reflection from an analytic sky gradient and an atlas ripple tile. The sky is a painted
gradient sphere with a ray fan; clouds are blob meshes. Fog is three's linear fog in one
colour. Light is a warm directional sun, a second warm directional, a hemisphere and an
ambient. Post: N8AO, bloom (threshold 1.0), vignette, ACES tone mapping, MSAA x4.

What the captures of 2026-09-24 show (headless Chromium, 1600x900, wide shot and 8-notch
zooms): the ripple tile repeats as a visible grid over the whole lake; the lake is
`#22b3b8` turquoise; the ray fan dominates the upper right; houses on 7-unit lawn discs
read as stickers; gable triangles are painted in roof tile; streets are `#838079` ribbons
with a pale shoulder; palms authored at `(3..35, 16..118)` now stand in the water after the
shoreline moved; past `x = 310` the terrain ends and the haze plane at `y = -14` shows as a
pale block at the right of the frame.

Constraints carried over: nothing downloaded (`world-map` - Loading experience); instancing
for anything repeated more than 20 times; `devicePixelRatio` capped at 2; 60 fps idle on
integrated graphics at 1080p (`world-map` - Performance budget); every animation behind
`prefers-reduced-motion`.

## Goals / Non-Goals

**Goals:**

- Replace every painted stand-in for a physical effect (sky gradient, ray fan, fake
  reflection, one-colour fog, flat-colour roads) with a model of the effect, still
  generated at runtime.
- Keep the shared-material, instanced architecture: one program per material family, one
  draw call per model.
- Degrade gracefully: the heaviest effects switch off on weak hardware without any visible
  breakage.

**Non-Goals:**

- Physically correct units or a real-world sun position for Lages. The sun keeps the
  composed direction `SUN_DIRECTION = (0.62, 0.22, -1)`, about 10.6 degrees up.
- Cascaded shadows, SSR, volumetric light, GPU-driven grass. Each was considered and
  costs more than the demo machine can be assumed to have.

## Decisions

### D1 - A physically based sky, and the same sky as the ambient light

The sky is drawn with the Preetham model and its built-in cloud layer, taken from
`three/examples/jsm/objects/Sky.js` (`Sky.SkyShader`, used as a shader definition on our
own `ShaderMaterial` - not by subclassing its `Mesh`). The sun disc is the model's own HDR
disc, which alone crosses the bloom threshold; the ray fan and the blob clouds are deleted.

Starting parameters: turbidity 6, rayleigh 2.2, mieCoefficient 0.006, mieDirectionalG 0.86,
cloudCoverage 0.32, cloudDensity 0.45, cloudElevation 0.62. Final values are recorded in
`constants.ts` as `SKY` and here once tuned against captures.

Once at load, a PMREM environment is rendered from the sky with the sun disc hidden and
assigned to `scene.environment`. Every `MeshStandardMaterial` then takes its ambient light
and specular reflection from it. The hemisphere and ambient lights are removed; the second
warm directional is removed; the key light stays, its colour matched to the sky's sun
colour at that elevation.

*Why:* the painted gradient and the three fill lights were four approximations of one
thing, and they disagreed - the shadows went olive, the windows reflected nothing. One
analytic sky answers all four.

*Alternatives:* a Poly Haven HDRI (CC0) would look better still, but it is a download of
1.5-6 MB and breaks "nothing downloaded". drei's `<Sky>` is the same shader behind a
component that hides the parameters we need to tune.

*Budget / fallback:* one full-screen sky fragment pass (4-octave fbm) and a one-off PMREM
of 256 px per face. Identical on every tier; no fallback needed. Under reduced motion the
cloud clock stops.

### D2 - Atmospheric perspective replaces one-colour fog

Three's fog chunks are replaced globally (`ShaderChunk.fog_*`) before any material
compiles. The vertex chunk passes the world-space view direction, recovered as
`(vec4(mvPosition.xyz, 0.0) * viewMatrix).xyz` - correct for instanced meshes too, because
`mvPosition` already carries the instance matrix. The fragment chunk mixes toward an
in-scatter colour that depends on direction: `FOG.sunward` toward the sun's azimuth,
`FOG.away` elsewhere, blended by `pow(max(dot(dirXZ, sunXZ), 0), 3)`. Density is
`1 - exp(-((d - near) / (far - near) * 2.4)^1.6)` for `d > near`.

The sky shader blends to the same function below `direction.y = 0.04`, so land at infinity
and sky at the horizon are one colour by construction and the horizon cannot show as a
band.

*Why:* a single fog colour can only match the sky in one direction; toward the sun the land
stayed cold, away from it the land glowed.

*Budget / fallback:* a few ALU per fragment. Identical on every tier.

### D3 - An outer ring of land closes the world's edge

The terrain's east edge is 414 units from the hub camera - nearer than the far shore's
hills - so no fog curve can hide it. A second, coarse terrain ring from 310 to 1400 units
out continues the land to the horizon: its height is the natural height function faded
into rolling forested hills, its inner edge sampled from the same function as the main
terrain's border so the two meet without a step, its colour a dark forest canopy with
low-frequency mottling. The lake's water surface is extended west to meet the ring's
rising shore. The haze plane at `y = -14` is deleted.

*Budget / fallback:* about 9,000 vertices, one draw call, no shadows. Every tier.

### D4 - A planar reflection for the lake, drawn by our own pass

The lake is a horizontal plane at `LAKE.level`, which is the one case a planar reflection
handles exactly. A `useFrame` callback at the default priority (it runs before the
composer's priority-1 render) mirrors the camera across the water plane, applies an oblique
near plane at the surface so nothing below the water is drawn, hides the water meshes and
the pins, and renders the scene into a half-float target at `REFLECTION.scale` of the
drawing buffer. The math - mirror, oblique clip, texture matrix - is a pure module
(`planar-reflection.ts`) and unit-tested.

Three's `Reflector` was not used: it renders inside its own `onBeforeRender`, which fires
once per scene render - and N8AO renders the scene again, doubling the cost silently.

The lake shader, rewritten:

- normal from animated gradient noise evaluated in the shader (three octaves, two drift
  directions) - no texture, so no tile can repeat;
- reflection sampled through the texture matrix, displaced by the normal's `xz`;
- Schlick Fresnel with `F0 = 0.02`, the physical value for water;
- body colour by depth: `LAKE_COLORS.deep #1f4f55` to `LAKE_COLORS.shallow #4f7a5c`, and
  alpha falling to 0 over the first 3 units from the bank so the bed shows through;
- sun specular `pow(max(dot(R, sun), 0), 900)` for the glitter path, HDR so it blooms;
- the river below the dam keeps a non-planar variant that reflects the sky only.

*Alternatives:* screen-space reflection (post-processing's SSR) leaves holes at the frame's
edges exactly where the far shore is; a cube camera is wrong for a plane.

*Budget / fallback:* a second render of the scene at 1/4 of the pixels (0.5 scale). On the
`medium` tier it drops to 0.35; on `low` it is off and the shader reflects the sky
environment instead. Phones start at `medium` (D10).

### D5 - The ground is shaded from fields, not baked flat

The terrain keeps its vertex-coloured, smooth-shaded mesh, with a richer colour field:

- a low-frequency meadow/pasture field between `grass #7fa04c`, `grassDeep #587f3c` and
  `pasture #a8a462`;
- a woodland field - the same grove noise the scatter uses (D8) - darkens the ground under
  woods toward `forestFloor #4a5a30`, so woods stand on their own shade;
- yards: around each dwelling, a noise-perturbed radius tints toward `lawn #8fbc5a` and
  fades over 3 units. The lawn disc mesh and `createLawnGeometry` are deleted.

In the shader, the grass texture is sampled at two scales (1/9 and 1/37 per unit) and a
world-space macro noise modulates brightness by +/-8%, so the tile does not repeat at map
distance.

*Budget / fallback:* one extra texture sample per terrain fragment. Every tier.

### D6 - Roads get their own material and draw their markings in the shader

Roads leave the atlas. They are drawn with a road material whose textures (asphalt,
earth, concrete paving) are separate `RepeatWrapping` canvases, so mipmapping works
without the atlas's `fract()` seam (founding D19). Each ribbon vertex carries
`roadUv = (across 0..1, along metres)` and a `marking` weight:

- **street carriageway:** asphalt `#3f4042` with lighter wheel tracks; white edge lines at
  `across = 0.05 / 0.95`, 0.12 units wide; a yellow `#e0b43a` centre dash 3 units long every
  9 units. Lines are drawn only where `marking = 1`; within a junction radius of another
  street's centre line `marking` falls to 0 at build time, so no line crosses a junction.
- **kerb and pavement:** a real step, not a layer - the pavement is raised 0.15 with a kerb
  face, concrete slab texture, `#b9b3a7`. Where a street runs outside the community the
  pavement becomes a grass verge (`verge` weight).
- **junction patches:** an asphalt disc at every point where a street's end meets another
  street, lifted with the carriageway, covering the corner gaps a ribbon end leaves.
- **tracks:** earth `#8a7453` with two darker ruts at `across = 0.28 / 0.72` and a grass
  median; the outer 20% of each side fades to the grass colour and dissolves with
  alpha-to-coverage over the composer's MSAA target - soft edges with no transparency
  sorting.

The separate centre-line ribbons are deleted; with lines in the carriageway's own shader
there is one layer fewer to fight.

*Budget / fallback:* one draw call, three 512 px textures. Every tier.

### D7 - Buildings are rebuilt, in variants

`createBuildingGeometry` is rewritten, keeping the wall-local opening frame of founding D13:

- walls include the gable triangles, in the wall's material;
- roofs are two slabs 0.18 thick overhanging 0.45 at the eaves and 0.3 at the gables, with
  a fascia board and a ridge cap; hip roofs are an option;
- windows get frames, sills, a glazing bar and optional painted shutters; doors get a step
  and, optionally, a porch canopy on two posts;
- timber houses get corner boards and board-and-batten siding (new atlas tile);
- the world material reads roughness and metalness per surface in the shader: glass 0.08 /
  0.0 with a boosted environment term so windows mirror the sky, metal 0.4 / 0.7, tiles
  0.7, plaster 0.92, foliage 0.8.

Dwellings become ten designs in the regional vernacular (rendered masonry in white, cream,
pale yellow, sage and salmon under ceramic `telha` roofs; painted timber houses in green,
blue and ochre; a two-storey sobrado; lakefront houses with large glazing). The layout
assigns designs so that no dwelling's nearest dwelling shares its design, and
`check:layout` enforces it.

The A-frame chalets get a glazed front gable, a deck and a side wing, and alternate with a
small gable chalet so the far shore stops reading as a grid.

*Budget / fallback:* more triangles per building (roughly 1.5-2k each, 60 buildings) and
ten models instead of four - still one draw call per model. Every tier.

### D8 - Vegetation in groves, with colour per tree

- A grove field (two-octave value noise at 1/70 per unit, thresholded) gates the scatter:
  a candidate is accepted with probability `smoothstep(0.42, 0.62, grove)`, so trees gather
  in woods and leave open ground. The same field darkens the ground (D5).
- Instanced vegetation gets a per-instance colour (`instanceColor`) - a seeded jitter of
  +/-7% in lightness and +/-0.02 in hue - so a wood is many greens.
- Broadleaf crowns are six to nine noise-displaced clusters with normals bent away from
  the crown's centre, so a crown shades as one soft mass instead of a pile of balls; a
  wrap term lets the sun glow through edges seen against it.
- The araucária is rebuilt: a straight trunk bare to 72% of the height, two whorls of
  upturned branches, and flattened dense tufts at the tips forming a shallow cup.

*Budget / fallback:* instance colours are one attribute; clusters add triangles to
instanced geometry only. Every tier.

### D9 - Defects

- Palms, lamps, people and parasols are accepted only on land at least 1.5 units from the
  water (`lakeDistance > 1.5`); authored positions that fail are dropped, not moved, and
  `check:layout` reports any land object on the water.
- Boats keep their loops and moorings.

### D10 - Adaptive quality

drei's `PerformanceMonitor` watches the frame rate and steps a quality tier down after a
sustained decline: `high` (reflection 0.5, AO on, dpr up to 2) → `medium` (reflection 0.35,
AO off, dpr up to 1.5) → `low` (no planar reflection, AO off, dpr 1). A coarse-pointer
device starts at `medium`. Tiers only go down within a session, so the image never
oscillates.

*Why:* this is judged live on a machine nobody has tested; a demo that stutters reads worse
than one with a sky-only lake.

### D11 - Post-processing

Kept: N8AO, ACES tone mapping (AgX was rejected in founding D22), MSAA x4, the vignette.
Bloom moved from threshold 1.0 to 4.0 (see the record below). A contrast/saturation grade
after tone mapping was tried and removed: it works on linear values in this pipeline and
crushed the midtones, taking the whole world a stop darker.

## Implementation record (2026-09-24)

Final values, as tuned against captures (`captures/before`, `captures/after`,
`captures/compare-*.jpg` side by side at the same camera positions):

- **Sky (D1).** `SUN_DIRECTION = (0.62, 0.072, -1)`, about 3.5 degrees up: at 10.6 degrees
  the physical disc sat above the top of the frame. Preetham turbidity 4, rayleigh 3,
  mieCoefficient 0.004, mieDirectionalG 0.9, exposure 1.2; a grade of saturation 1.45 and
  tint (1.06, 0.98, 0.90) on the sky alone, because at a sun this low the model is grey.
  The drawn sky is clamped at 14: the model's disc runs to thousands and even at a bloom
  threshold of 4 it spread an orange veil across half the town. The key light keeps the
  sun's azimuth but stands at 24 degrees (`SUN_LIGHT`, `#ffd3a1`, 3.0). Environment:
  intensity 1.15, baked sky clamped at 1.2 - unclamped, the glow round the sun made every
  rough surface facing it an orange mirror - over a `#3e4a2c` ground disc.
- **Atmosphere (D2).** Sunward `#ffd49a`, side `#e8c3a3`, away `#b4afc4`, brightness 0.6,
  falloff 1.5, curve 1.9, the sunward lobe `pow(toward, 8)`.
- **Outer land (D3).** Reach 1300, rings growing 1.22x, blend 140 m - 45 m where the map
  ends in the lake, or the reservoir ran to the horizon like a sea. Woods continue 70 m
  past the border and thin out. First built wound clockwise, the whole ring was culled.
- **Water (D4).** Depth is measured from the ground under each vertex, not from the
  shoreline curve: the ground is under water several metres inland of the curve, and the
  strip between read as a wide brown beach. Woods more than 90 m from the water sit on a
  layer the mirror camera skips (`REFLECTION.unreflectedLayer`); drawing them twice cost
  as much as the rest of the frame.
- **Streets (D6).** Carriageway 5.6 m (two 2.8 m lanes), pavements 1.4 m. The lakefront
  street has its pavement on the landward side only - with two it no longer fitted between
  the lake and its houses - and no pavement is laid within 9 m of the water. A grass verge
  carries every raised edge down to the field; without it the pavement's 0.63 m float read
  as a pale wall. Paths and yards sit at the track's level, under the carriageway, where at
  its level they fought it in a sawtooth. Wheel tracks fade with the markings inside a
  junction, where two roads overlap. Traffic keeps to the right-hand lane, on the asphalt.
- **Buildings (D7).** Eave 0.45, gable overhang 0.32, slab 0.16. Ten dwelling designs
  (`dwellings.ts`); assignment excludes the designs of every earlier dwelling within 28 m,
  of its nearest dwelling and of any dwelling whose nearest it is. Far shore: A-frames
  with glazed gables alternate with timber chalets. A lit window is decided per 3 m cell,
  30% lit, glow 1.6.
- **Defects (D9).** Beyond the palms: the Mirante da Neblina stood under water in the
  strait, only its flag showing - its hill was inside the lake's basin and was carved away.
  It moved to a hill of its own at (-196, -156) on the far shore, and its seeded position
  and flight camera moved with it. Two cabins and a lamp stood below the waterline; the
  spacing pass now requires dry ground under the whole footprint, and props by the water
  are moved inland or dropped. Chimney smoke became soft billboards: faceted puffs read as
  stones floating over the roofs.
- **Budget (D10).** Median frame time over 10-30 s of idle drift, headless Chromium
  (ANGLE-Metal) on the development Mac at 1920x1080, DPR 1: before the change 33.3 ms;
  after, `high` 50.0 ms, `medium` 34.5 ms, `low` 33.4 ms. Headless frame times come in
  multiples of the 16.7 ms vsync, so these are bands, not measurements; the demo machine's
  integrated graphics was not available, and the 60 fps `world-map` budget remains
  unverified there. The performance monitor steps down from `high` on a sustained drop.
- **Tier changes froze the canvas (found by the owner, 2026-09-24).** Stepping down took
  the AO pass out of a running composer; its multisampled buffer then failed to resolve
  into a depth texture of another format (`glBlitFramebuffer GL_INVALID_OPERATION` every
  frame) and the canvas kept its last image while the HTML pins moved over it - "the pins
  drift away" - and walk mode looked hung. The composer is now keyed on the tier, so each
  tier gets a new one, and the monitor steps down only under 30 fps: at its default of 50,
  the development build dropped a fast Mac a tier at once. Every capture had pinned the
  tier with `?quality=`, which is why none of them showed it; the regression test forces a
  real drop with CPU throttling in headed Chrome and compares canvas-only frames.

## Risks / Trade-offs

- [The reflection pass doubles draw calls] → 0.5 scale, adaptive tiers (D10), pins and
  water hidden during the pass; measured against the 16.7 ms budget before the change is
  closed.
- [Patching `ShaderChunk` globally affects every material in the page] → the hub is the only
  WebGL surface on the site; the patch is applied once, from the world module, and the chunk
  keeps three's uniform names so post-processing and drei materials still compile.
- [Preetham at a low sun can over-saturate to red] → the parameters are tuned against
  captures, and exposure and grade are the last step.
- [Alpha-to-coverage needs MSAA] → the composer runs MSAA x4 on every tier; on a context
  without it, track edges are hard rather than broken.
- [Ten house models raise build time at load] → geometry is built once and cached; measured
  with the scene-ready timer, which must stay under the 8 s entry backstop with margin.

## Migration Plan

Front-end only; no data change and no new dependency. Each decision is verified with
before/after captures at the same camera positions. Rollback is a revert of the files it
touched.
