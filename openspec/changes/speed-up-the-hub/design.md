## Context

See proposal.md - Why for the measurements; requirements are in `specs/walk-mode/spec.md`
and `specs/world-map/spec.md`.

All numbers below were measured on 2026-10-07 on the owner's M5, in Chrome through
Playwright with the Metal backend, at 1920x1080. Frame times were taken with vsync and
the frame-rate limit off, so a frame lasts as long as its work. Parts of the scene were
switched off in the page to price each one. Headless frames otherwise come in 16.7 ms
vsync bands and hide the difference.

| Quality, view | Median frame | Trees hidden | Shadow pass off | People hidden (median / p90) |
| --- | --- | --- | --- | --- |
| high, wide shot | 20.2 ms (p90 34.5) | 7.4 ms | 14.3 ms | 18.3 / 19.7 ms |
| medium, wide shot | 14.2 ms (p90 32.0) | 5.8 ms | 10.5 ms | 14.5 / 15.9 ms |
| low, wide shot | 13.1 ms (p90 29.2) | 4.8 ms | 11.0 ms | 13.3 / 14.1 ms |
| high, on foot | 17.7 ms (p90 33.2) | 11.8 ms | 14.8 ms | 18.3 / 20.2 ms |

The world's triangles come from the instanced models. Araucárias are 1,052 copies at 2,668
triangles, 68% of the total. Broadleaf trees are 1,525 at 664, 24%. Everything else
together is 8%. The instanced groups are not frustum-culled, since one batch spans the
map. They are drawn in the view, in the sun's 4096² shadow map and, near the lake, in
the mirror.

## Goals / Non-Goals

**Goals:**

- Fix the cause of each measured problem rather than lowering everything.
- Keep near views and the high tier looking exactly as before. The before/after captures
  at 2x are the check.
- Keep the work pure where it can be, so it is unit-tested: the choice of tree detail,
  the grid built in slices, the shared skeleton, the character's animation.

**Non-Goals:**

- A worker thread for the walk world or the routes. Slicing on the main thread is enough
  and keeps every caller synchronous.
- Impostors, billboards or a second tree model drawn by hand. The simple tree is the same
  procedural tree, built coarser.
- Chunking the woods into tiles for frustum culling. The trees' cost is their triangles,
  and the wide shot sees nearly all of them anyway.

## Decisions

### D1 - An animation mixer per person, owned by the character

`WalkCharacter` used drei's `useAnimations`, which keeps one `AnimationMixer` for the
component's whole life, rooted at the group round the model. Its cleanup calls
`uncacheAction` with the actions where three expects clips, so nothing is ever uncached.
three caches property bindings by root and track name, and the six people share one rig
with 57 identical track names. Picking another person in the creator therefore reused
bindings that still pointed at the first person's bones. The new person was never
posed, and its legs stood still while it slid along. Leaving walk mode unmounted the
component and its mixer, which is why that cured it.

The character now builds its own mixer on the model's scene, one per scene. It advances
the mixer in its frame loop. When the scene changes or the character goes, it stops the
mixer and uncaches its root. The mixer and its actions live in a small pure module,
`lib/walk/character-animation.ts`, which is tested against two rigs with the same bone
names. Nothing plays yet when a new person appears, so its first clip starts at full
weight instead of fading in from the rest pose.

*Alternative:* `key={config.model}` on the character would remount it per person. That
also cures the bug, but it replays the wave on every choice and recreates the name tag.
It also leaves drei's leak in place for whoever reuses the hook.

### D2 - The walk world and its route grid, prepared in slices

The route grid samples 310 × 310 cells; on the M5 it takes 1.2 s in one idle callback.
The walk world's own build - the props of the open places read from their geometry - takes
about 140 ms, two of its fourteen places (the fairground and the UFO port) about 64 ms
each. Both ran as single tasks: the grid right after walk mode opened, the world in the
townsfolk's idle callback.

Both are now built in slices:

- `createWalkGridBuilder` fills cells until its time check says stop and can be resumed.
  `buildWalkGrid` is the same builder run to the end.
- The open places' props are read one place at a time.
- A small idle runner (`lib/idle-work.ts`) gives each slice a budget of 8 ms. It uses the
  browser's idle callbacks, with a timeout so work still advances when the frame loop
  leaves no idle time, and falls back to a timer where idle callbacks do not exist.

`walkWorld()` and `walkGrid()` stay synchronous. Called before their slices are done,
they finish what is left there and then. That happens only if a route is wanted in the
first seconds, and it costs no more than before. The triggers are unchanged: the world
starts once the hub is drawn, the grid once walk mode opens.

A place is read whole, so the slowest place sets the longest slice. Reading a place
spent most of its time making a string key for every sample, including samples at no
height that matters. It now passes over triangles wholly above, below or between the
heights it looks for, and keys cells by number. Its output is identical, compared byte
for byte over all fourteen places. Reading every open place went from 124 ms to 44 ms,
and the longest slice of the whole preparation from 69 ms to 35 ms.

### D3 - Trees at two levels of detail, chosen by distance

The araucária and the broadleaf builders take a detail, `full` or `simple`. The simple
tree has:

- tufts of 20 faces instead of 80, built 6.5% larger, since a 20-face tuft shows less of
  its sphere (a mean silhouette radius of 0.916 against 0.976);
- branches with four open sides instead of six closed ones. Their ends sit in the trunk
  and in the tufts;
- a trunk that stays closed, because its top shows from above.

The random sequence is the same, so every branch and tuft stands where it does in the full
tree, and the bounds of every simple tree stay within 5% of its height of the full tree's.
The full builders were split into smaller functions on the way. All 59 models hash the same
as before, vertex for vertex.

| Tree | Full | Simple |
| --- | --- | --- |
| Araucária (mature) | 2,668 triangles | 768 |
| Broadleaf | 664 triangles | 184 |

The counts are pinned by a unit test.

For the four models that have a simple form (`araucaria`, `araucariaB`, `broadleaf`,
`broadleafWarm`), each instanced group draws two meshes, full and simple. Each holds
every copy and draws only those assigned to it. Copies are assigned by their distance
from the camera, with a margin so a copy at the edge does not flicker: a copy becomes
full inside 200 m and simple again beyond 230 m. Copies are reassigned whenever the
camera has moved 2 m since the last assignment, and the matrices and tints are packed
into the two meshes. That is about a thousand distance checks and some copying, well
under a millisecond, and nothing at all while the camera rests.

The distance comes from the captures. At 110 m the simpler tufts showed their facets in
a 2x capture of an aimed zoom, side by side with the full trees. A broadleaf tuft is
about 2 m across. On the owner's Retina screen it stays under 18 px only beyond about
200 m, and on a 1080p projector under 11 px. Half the trees stand beyond 250-390 m in
the usual views, so the margin keeps most of the saving:

| Full within | Tree triangles kept: wide shot | On foot at the spawn |
| --- | --- | --- |
| 110 m | 31% | 31% |
| 200 m | 43% | 47% |
| 250 m | 49% | 65% |

The choice and the packing are pure functions in `lib/world/tree-detail.ts`. The shadow
map and the mirror draw the same two meshes, so a far tree also casts the simpler shadow.
At 0.19 m per shadow texel that difference is not visible.

The world-map spec asked for "a single instanced batch" per model. The trees were already
split in two by the lake's reach, and now they are in four. The modified requirement asks
for instancing in a few batches, which is what the rule was for.

*Alternatives:*

- Simplifying the full tree for every view would show in walk mode, where the owner looks
  closely.
- Simplifying only on the lower tiers would leave the M5 at 50 fps on the high tier.
- Spatial tiles with per-tile detail would need hundreds of instanced meshes and add
  draw calls.

### D4 - One skeleton per townsperson

`SkeletonUtils.clone` gives every skinned part its own copy of the skeleton, so the 15
townsfolk carried 177 skeletons. three recomputes each skeleton and uploads its bone
texture on every render, and the wide shot renders the scene twice a frame (view and
mirror): 354 skeleton updates and 354 texture uploads a frame. Measured in the production
build with the CPU throttled 4x, that was 2.39 ms of every frame.

The first measurement blamed them for periodic long frames. With vsync and the frame-rate
limit off, the 90th-percentile frame fell from 29 ms to 14 ms when the skeletons stopped
updating. Once they were shared that frame stayed long. The long frames came in a
`9 25 2 3 9` pattern, a stall made up by two short frames. That is the GPU queue filling
up in an uncapped run, not a stutter a visitor sees, so the p90 of uncapped runs is not
used as evidence anywhere in this change.

The parts of a person share their bones but not their inverse bind matrices. Mesh
quantization folds a different dequantization into each skin. So for each part, the
difference `M = I_ref⁻¹ · I_part` is worked out from the first bone. It is checked to hold
for every bone, then folded into the part's bind matrix (`bindMatrix ← M · bindMatrix`),
and the part is bound to the reference skeleton. The skinned result is the same: three
skins with `bone · I · bindMatrix`, and `I_ref · M = I_part`. A part for which the check
fails keeps its own skeleton. This lives in `lib/walk/skeletons.ts` and is tested on a
synthetic two-part rig.

With one skeleton per person, every one of the 177 parts passed the check in the live
scene: 15 skeletons, 30 updates a frame and 0.27 ms, about nine times less. The visitor's
own character keeps the loader's four or five skeletons. One person's worth does not
matter.

### D5 - What each tier gives up

| Tier | Reflection | AO | Pixel ratio | Shadow map | Multisampling |
| --- | --- | --- | --- | --- | --- |
| high | 0.5 | on | ≤ 2 | 4096² | 4 |
| medium | 0.35 | off | ≤ 1.5 | 2048² | 4 |
| low | off | off | 1 | 2048² | off |

- A 2048² map halves the shadow's sharpness. Below the high tier that trade is right: the
  4096² map is 64 MB of depth that a weak GPU writes every frame.
- three resizes the map when `mapSize` changes, so a tier change needs no other work.
- The canvas is created with `antialias: false`. The composer draws into its own
  multisampled buffer, so the canvas's multisampling only resolved a finished image a
  second time.

## Risks / Trade-offs

- [The simple tree pops in when it changes] → The two forms share every position and
  outline. The change happens past 200 m, where a tuft is a few pixels, and the margin
  keeps a tree from switching back while the camera rests. Captured at 2x before and
  after at the wide shot, an aimed zoom and on foot.
- [Folding the bind difference is wrong for some part] → It is checked bone by bone, and a
  part that fails keeps its own skeleton. Townsfolk are captured close up before and after.
- [A route wanted in the first seconds finishes the grid at once] → No worse than today.
  The grid starts building as walk mode opens, while the visitor is in the creator.
- [Multisampling off on the lowest tier shows jagged edges] → Only on a machine already
  below 30 fps on the medium tier, where frame rate matters more than edges.

## Implementation record (2026-10-07)

The numbers in Context come from the development build. These come from production builds
of `HEAD` (2b43b4a) and of this change, served side by side, on the M5 at 1920x1080:

| Measure | Before | After |
| --- | --- | --- |
| High tier, vsync on, from the air | 46 fps, 30% of frames missed | 60 fps, none missed |
| High tier, vsync on, CPU throttled 4x, from the air / in flight / on foot | 34 / 41 / 48 fps | 48 / 48 / 51 fps |
| Low tier, uncapped, from the air / on foot | 60 / 79 fps | 118 / 147 fps |
| High tier, uncapped, from the air / on foot | 47 / 53 fps | 59 / 63 fps |
| Longest frame entering walk mode, vsync on | 317 ms; 1.1-1.2 s throttled | 17 ms; 50-117 ms throttled |
| Skeleton updates a frame (high tier) | 354, 2.39 ms throttled | 30, 0.27 ms throttled |
| Tree triangles from the wide shot | 3.82 million | 1.64 million (43%) |

Visual checks were made on 2x captures of the same views, with reduced motion:

- the walk views are pixel-identical before and after;
- the wide shot and the aimed zoom change 0.9-1.2% of pixels, all on trees beyond 200 m;
- two captures of the same build differ by about 6%, from the pins, the boats and the UFO.

The tier change was checked unpinned under a heavy throttle: high, then medium, then low.
The canvas went on drawing and the console reported no GL error.

## Migration Plan

Nothing to migrate: no data, no storage key and no URL changes. Rollback is reverting the
commits.
