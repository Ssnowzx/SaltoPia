## Context

See proposal.md - Why; requirements in `specs/townsfolk/spec.md`. Walk mode
(`add-walking-character`) already loads six CC0 Quaternius people with `Idle`, `Walk`,
`Run`, `Wave` and `Interact` clips, and resolves movement against a walk world of blocked
ground, obstacle circles and raised floors. The old townsfolk were `personA`-`personD` and
`personSeated` placements: procedural figures in instanced batches.

## Decisions

### D1 - The same six people, cloned

Each townsperson clones its model's scene with three's `SkeletonUtils.clone`, so bones are
its own and one file serves every person drawn from it, and clones its materials once to
take its own outfit and skin. Its own `AnimationMixer` plays the shared clips.

### D2 - Behaviour is a pure step

`lib/walk/townsfolk.ts` holds each townsperson's plan - a route to stroll (a loop, or out and
back) or a place to stand, with a heading and a gesture - and a pure step:

- strollers walk at 1.1-1.4 m/s along the route's arc length, and at the end of an out-and-back
  route stand 2-5 s before turning back;
- standers turn to their heading and gesture every 9-16 s, seeded per person;
- within 2.2 m of the visitor in walk mode, anyone stops, faces the visitor and waves -
  once per 20 s - and resumes after the visitor has moved beyond 3.5 m;
- under reduced motion everyone stands idle where they are - no strolling, no gestures.

Routes and places are derived from the layout where it knows better - pavements from the
street curves, the shop windows from the shops' placements - and checked by a unit test
against the walk world, so a route can never cross water, a wall or a prop.

### D3 - One crowd for collisions

The townsfolk's positions are written each frame into a small shared list the walk world
reads as extra obstacle circles of 0.35 m. The list is module state, like the world clock:
it changes every frame and nothing in React renders from it.

### D4 - After the first frame

The townsfolk mount once the scene has reported itself drawn - the drawn frame itself, not
the backstop timer that opens the way in when no frame comes. They first wait for an idle
moment to build the walk world they stand on (about half a second of work), then each
model loads inside its own Suspense and error boundary: until it arrives its people are
absent, and if it never arrives they stay absent. Heights are looked up in the walk world
and cached on a quarter-metre grid, since one lookup crosses every road (about 70 µs).

Off screen a person costs nothing: each skinned mesh is culled against bounds fitted to its
rest pose with room for the arms, in the view, the shadow and the lake's mirror alike.
Beyond 70 m from the camera a person casts no shadow and its mixer advances every fourth
frame, the frames staggered per person.

### D5 - The feet on what is drawn

Every surface stood on above the ground is read from the geometry that draws it: the road
surface's upward faces are rasterised, at the cell centres of a half-metre grid, into the
same height field as the open places' floors, and a height is read back by bilinear
interpolation between the four nearest centres (at a surface's edge, the cell's own). The
road geometry takes seconds to build, so the scene and the walk world share one; the
rasterising itself takes about 30 ms.

*Alternative:* working the pavement's height out by rule - carriageway, kerb, pavement,
verge, with the junction gaps. It would restate the road builder's rules a second time,
and the two would drift.

## Implementation record (2026-09-24)

- Fifteen townsfolk: five in the square (a stroller round it between the benches and the
  lamps, turning back at the café; a talking pair; one at the brazier; one at a café table),
  three on the pavements, one at a shop window, one by the lake, and one each at the
  fairground's midway and carousel, the inn, the CTG and the lookout.
- Placing them showed the world's own defects, fixed here and now checked by
  `check:layout`: the square's pier ran from the shore across the paving and the
  bandstand; the peninsula's three piers ran from the water into the bank under the
  ground; four stilt cabins stood flooded to the windows; a kayak lay under the square's
  paving; two lake houses' pools lay across the lakefront street; and the lakefront street
  dipped under the water's level for twelve metres, so its edge was sawtoothed by the water
  and a walker was stopped on it. With the old placements the new checks report eight
  problems; with the new, none.
- On the pavements the feet still sank to the ankle, the visitor's and the townsfolk's alike:
  the walk world put them at the carriageway's height on any part of a street, and the
  pavement stands a kerb higher. They now stand on the road geometry itself (D5); a unit
  test holds them at the pavement's top along the lakefront street, and captures on two
  pavements show the shoes on the slabs.
- Aborting the models' download used to take the whole hub down: a failed `useGLTF` throws
  to the nearest error boundary, and there was none. The townsfolk and the visitor's
  character now each have one (`react-error-boundary`, so no class of our own).
- Headed Chrome on the development Mac, air view at the high tier: 27-32 fps with the
  townsfolk and 26-32 without, in alternating runs - within the noise. No GL error; the
  canvas keeps changing; walking into the talking pair stops the visitor in front of them.

## Risks / Trade-offs

- [Fourteen skinned people cost frame time, and the lake's mirror draws them again] → about
  seven thousand triangles each, one mixer each; measured on the tiers before closing.
- [A route authored against today's layout breaks when the layout moves] → the walkability
  test fails, rather than a townsperson walking through a wall.
