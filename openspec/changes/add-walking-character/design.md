## Context

See proposal.md - Why; requirements in `specs/walk-mode/spec.md` and the `world-map` delta.

The hub is one R3F canvas. `CameraRig` owns the camera through a drei `OrbitControls` held
to an arc; `WorldMap` holds the interface state (title, focus, flight) and renders the pin
overlay and the place card outside the canvas. Ground height anywhere is `landHeightAt`
(`outer-land.ts`); road surfaces float over the graded ground by the lifts in
`road-surfaces.ts`. Buildings are placements with a keep-out radius (`footprintOf`); trees
are placements too. Places carry `worldPosition` from the database, and `SITES` holds the
same positions for the world. Navigation to a page is a full-document load (founding D24),
and a session flag decides whether the title state replays.

## Goals / Non-Goals

**Goals:** a character that reads as a person in this world, movement that never breaks the
world's rules (water, walls, edge), and a visit flow that reuses the place card rather than
inventing a second one.

**Non-Goals:** physics, jumping, animation blending beyond crossfades, interiors.

## Decisions

### D1 - Six CC0 people from one rig

Quaternius' *Ultimate Modular Men* and *Ultimate Modular Women* packs (CC0 1.0, from Poly
Pizza) share one armature and one set of clips. Six are used: casual, hiker and farmer men;
casual, hiker and formal women. Each file is cut down to the six clips walk mode plays
(`Idle`, `Idle_Neutral`, `Walk`, `Run`, `Wave`, `Interact`), quantized and
meshopt-compressed with glTF-Transform: about 0.5 MB each, down from 1.4 MB. The processing
is recorded in `public/models/CREDITS.md`.

Loaded with drei's `useGLTF` with Draco off (it would fetch a decoder from a CDN) and
meshopt on (its decoder ships in the bundle), only when walk mode opens. Each character's
materials are cloned so the outfit colour and the skin tone can be set per character: the
outfit and skin material names are listed per model. The model is scaled to 1.75 m from
its own bounds.

*Alternatives:* a procedural person like the crowd in `people.ts` - zero payload, but it
does not read as a person at the distance walk mode is seen from, and the owner asked for
realism explicitly. Mixamo characters are not CC0 and the project records a CC0 source for
every model.

*Budget / fallback:* one skinned mesh of ~7k triangles and one mixer: negligible. 3 MB for
all six against the 8 MB budget; the world itself stays at zero.

### D2 - One mode at a time

`WorldMap` holds `mode: "air" | "create" | "walk"`. `CameraRig` runs in `air` only; in
`create` and `walk` a `WalkCamera` owns the camera. Leaving walk mode hands the camera back
to the rig, which returns it to the composed wide shot. Pins stay on screen in every mode;
in walk mode a pin sends the character walking to its place instead of flying the camera.

### D3 - Movement is a pure step over the world's rules

`lib/walk/movement.ts` advances a character one frame: input (a direction relative to the
camera's heading, and whether running) becomes a velocity (walk 2.2 m/s, run 5.5 m/s,
turning at 10 rad/s), and the step is resolved against the world:

- **blocked ground** - water (ground under `LAKE.level + 0.15`, or inside the river gorge),
  and outside the map's square;
- **obstacles** - buildings as circles of 0.85 of their footprint, tree trunks as 0.45 m
  circles, bucketed on a 16 m grid.

A blocked step tries its X and Z parts alone, so the character slides along a bank or a wall;
an overlap with a circle is pushed out along the circle's normal. The rules are data handed
in, so the step is tested without a scene.

### D4 - The ground under the feet

The feet stand on the highest of the ground (`landHeightAt`) and every surface drawn over it:
the road geometry's upward faces - carriageway, kerb-high pavement, verge, track, car park -
and the open places' floors, rasterised once into a half-metre height field and read back
with bilinear interpolation, so a kerb is climbed rather than jumped. The first version put
the feet at the carriageway's lift anywhere on a street; on the pavement they sank to the
ankle, and on the verges deeper (fixed in `add-living-townsfolk`).

### D5 - A follow camera the visitor can turn

A drei `OrbitControls` whose target is the character's head, distance 4-22 m, polar
0.35-1.42 rad, no pan. Each frame the camera is moved by the same displacement as the
character, so it follows without undoing the visitor's own orbit. Movement input is read
relative to the camera's azimuth. Under reduced motion the follow is immediate.

### D6 - Walking somewhere by itself

`lib/walk/pathfinding.ts`: A* over a 2 m grid of the map (310 x 310 cells), walkable where D3
allows, eight-connected, with the path then pulled taut by line-of-sight so the character
walks straight lines, not stairs. The grid is built once, lazily, the first time a route is
asked for. Any movement input cancels the route.

### D7 - Arriving at a place

A place's arrival area is a circle round its site, of the landmark's footprint plus 5 m, so
it is reachable from outside the building. Inside it the HUD names the place and offers to
visit (E, or the button); visiting opens the existing `PlaceCard`. Routes end at the nearest
walkable cell inside the area.

### D8 - What the browser remembers

- `localStorage["saltopia:character"]` - the last character created.
- `localStorage["saltopia:passport"]` - slugs visited.
- `sessionStorage["saltopia:walk"]` - character and position, written when a page is opened
  from walk mode; read on return, when the title state is already skipped (founding D25),
  to resume walking.

Every read and write is guarded: storage can be unavailable, and then the walk simply does
not resume and the passport starts empty.

### D9 - Input

drei `KeyboardControls` for the keys; a touch joystick of our own, drawn only on a coarse
pointer; click-to-walk by marching the pointer's ray against `landHeightAt` (a click that
moved the pointer more than 6 px was a drag, not a click). Nothing raycasts the terrain
mesh, which is 137k triangles.

## Implementation record (2026-09-24)

- Verified end to end in headless Chromium: the hub loaded from the air requests no model;
  entering walk mode requests the chosen character only; all six load with their clips; a
  route from the square to the Galpão arrives in about 22 s; the arrival prompt opens the
  card; the page opened from it and a browser back resume the walk at the Galpão; leaving
  returns to the composed wide shot; on an emulated phone the stick walks the character.
- Resuming first put the walker back at the spawn: the hub hydrates with the server's
  snapshot, which has no saved walk, and a ref keeps its first value. The saved place is
  now applied in a layout effect once the client's snapshot is in, before the follow camera
  frames the walker.
- Two of the square's hedges stood across the widened shore street, one over the zebra
  crossing; only the two on the lake side are built now.
- An open place's arrival area follows its levelled pad (0.7 of it), not a building: at the
  8 m minimum a visitor could stand in the square without having arrived there.
- React's compiler lint forbids writing to values that come from hooks or props; the
  three.js objects the frame loop mutates are reached through refs or module functions.
- Changed since by `add-living-townsfolk`: the six models are fetched once the world has
  been drawn, for the townsfolk, rather than only when walk mode opens; the character is
  wrapped in an error boundary, so a failed download leaves the walk without a body instead
  of the hub without a world; its recolouring moved to `recolour.ts`, shared with the
  townsfolk; and the feet stand on the drawn surfaces (D4). The procedural crowd named
  under D1's alternatives is gone.

## Risks / Trade-offs

- [A route through a gap narrower than the grid] → 2 m cells and obstacle radii leave the
  streets and paths walkable; unreachable targets fall back to the nearest reachable cell.
- [Model load on a slow network] → the creator shows the world and a loading line until the
  character arrives; the 0.5 MB file is small.
- [Walk mode costs frame time on the demo machine] → a single skinned mesh; the quality tiers
  of `elevate-world-realism` still apply.

## Migration Plan

Front-end only. The `world-map` delta modifies a requirement whose spec exists only in the
still-open founding change: archive `add-serranopolis-experience` first, then this change.
