## Why

On 2026-10-07 the owner reported three problems. The first time the visitor enters walk
mode, the character slides without moving its legs and everything is slow; leaving and
entering again is the only cure. On a weaker computer the whole hub is "super lento". The
hub is judged live on a machine nobody has tested, so both reach the presentation.

Measured the same day, on the owner's M5 in Chrome at 1920x1080:

- **The frozen legs.** They follow from choosing another person in the creator. The
  character's animation stays bound to the bones of the person shown first, and the six
  people share one rig, so the binding silently carries over. Leaving walk mode builds a
  new character, which is why leaving and coming back cures it.
- **The first entry.** Opening walk mode for the first time stops the hub for about a
  second while the route grid is built: 96,100 cells, each asking the terrain whether it is
  dry. The walk world itself took 2 s of the same kind of work the first time it was
  built. On a weak machine that is several seconds of a frozen screen.
- **Weak machines.** One frame draws 8.7 to 10.6 million triangles. Two tree models make
  92% of the world's geometry: 1,052 araucárias at 2,668 triangles each and 1,525
  broadleaf trees at 664. Each is drawn again for the sun's shadow and for the lake's
  mirror. Hiding the trees takes the frame from 20.2 ms to 7.4 ms. The 15 townsfolk carry
  177 skeletons, each recomputed and uploaded on every render: 354 updates a frame, 2.4 ms
  of it on a CPU four times slower. Even the lowest quality tier keeps a 4096² shadow map
  and multisampling.

## What Changes

- **The character keeps its legs.** Choosing another person in the creator gives that
  person its own animation, so the character walks and runs with its legs moving. The
  person also appears in its standing pose rather than blending in from a rest pose.
- **Walk mode opens without a freeze.** The route grid is built a slice at a time in the
  browser's idle moments. A route asked for before the grid is finished completes it on
  the spot.
- **Distant trees are drawn simpler.** Araucárias and broadleaf trees far from the camera
  are drawn with coarser tufts and thinner-sided branches: 768 instead of 2,668 triangles,
  and 184 instead of 664. The outline stays the same. Near the camera every tree is
  drawn as before. The choice follows the camera, with a margin, so a tree at the edge
  does not flicker between the two.
- **One skeleton per townsperson.** Each person's parts move with one skeleton instead of
  about twelve. That cuts the townsfolk's CPU cost per frame about ninefold.
- **Quality tiers that save more.** Below the high tier the sun's shadow map is 2048²
  instead of 4096², and the lowest tier gives up multisampling. The canvas no longer
  multisamples an image the effect composer has already smoothed.

*Mirrors:* nothing in the reference. This is our own budget on our own world.

## Non-goals

- Changing what the world looks like on a capable machine. Near trees, the high tier and
  the composition stay as they are.
- A static fallback for machines without WebGL. That is `add-serranopolis-experience`'s
  open task, not this change.
- Fewer townsfolk, fewer trees or a smaller map.
- Moving the walk world or the route grid to a worker.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `walk-mode` (added by `add-walking-character`, still unarchived):
  - "Creating a character" says the person chosen walks with its own animation, after any
    number of changes.
  - "Entering and leaving walk mode" says entering never stalls the hub.
- `world-map` (added by `add-serranopolis-experience`, still unarchived):
  - "Scene composition from data" lets repeated scenery be drawn in a few instanced
    batches rather than exactly one, and says distant trees may be drawn simpler while
    near ones are drawn in full.
  - "Performance budget" spells out how quality steps down on weak hardware.

## Impact

- `web/src/components/walk-mode/walk-character.tsx`: an animation mixer per person,
  replacing drei's `useAnimations`.
- `web/src/lib/walk/pathfinding.ts` and `navigator.ts`: the grid is built incrementally
  and warmed in slices.
- `web/src/lib/world/builders.ts`: a simplified build of the araucária and the broadleaf.
  New `web/src/lib/world/tree-detail.ts` holds the pure choice of detail, which is tested.
  `components/world-map/neighborhood.tsx` draws each tree group twice: full and simple.
- `web/src/components/walk-mode/townsfolk.tsx`, with new pure `lib/walk/skeletons.ts`:
  one skeleton per person.
- `web/src/components/world-map/world-map.tsx`, `post-effects.tsx`,
  `lib/world/constants.ts`: shadow map size and multisampling per tier, and
  `antialias: false` on the canvas.
- Docs: the SRS (NFR-01, now measured) and the traceability matrix, the test plan, ADR-0015
  on the trees' two levels of detail, ADR-0013's tier list, and the changelog.
