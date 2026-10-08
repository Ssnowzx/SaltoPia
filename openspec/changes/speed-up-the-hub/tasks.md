## 1. The character keeps its legs

- [ ] 1.1 Move the character's mixer and actions into `lib/walk/character-animation.ts`, one mixer per scene, with the first clip at full weight; verify with a unit test that after a second rig with the same bone names takes over, updating moves the second rig's bones
- [ ] 1.2 Use it in `walk-character.tsx` in place of drei's `useAnimations`, uncaching the root when the scene changes or the character goes; verify in the browser that after picking two other people in the creator the character's legs move as it walks

## 2. Walk mode opens without a freeze

- [ ] 2.1 A walk grid builder that fills cells until told to stop and resumes; verify with a unit test that a grid built in slices equals one built at once, and that each slice respects its stop
- [ ] 2.2 An idle runner that gives each slice a budget, with a timeout and a timer fallback; read the open places' props one place at a time, passing over triangles at no height that matters; warm the walk world and the grid through it, with `walkWorld()` and `walkGrid()` finishing what is left when called early; verify with unit tests that an early call returns the complete result, and by a byte-for-byte comparison of all fourteen places that the faster reading gives the same cells
- [ ] 2.3 Verify in the browser that entering walk mode for the first time holds no frame for more than 100 ms

## 3. Distant trees drawn simpler

- [ ] 3.1 A `simple` detail for the araucária and the broadleaf builders, with the same random sequence; verify with a unit test of the triangle counts and that the simple tree's bounds match the full tree's
- [ ] 3.2 The pure choice of detail by distance with a margin, and the packing of matrices and tints into two batches; verify with unit tests: near copies full, far copies simple, no switch inside the margin, packing keeps every copy once
- [ ] 3.3 Draw the four tree models as two batches each, reassigned when the camera has moved 2 m; verify with before/after captures at 2x (wide shot, aimed zoom, on foot) and the frame-time breakdown

## 4. One skeleton per townsperson

- [ ] 4.1 `lib/walk/skeletons.ts`: bind every part of a person to one skeleton, folding each part's inverse-bind difference into its bind matrix and keeping its own skeleton when the difference is not one matrix; verify with a unit test that a vertex skins to the same place before and after
- [ ] 4.2 Use it for every townsperson; verify in the browser that the townsfolk carry 15 skeletons, look as before in a close capture, and that the CPU time spent updating skeletons each frame falls

## 5. Tiers that save more

- [ ] 5.1 Shadow map size and multisampling per tier, and `antialias: false` on the canvas; verify the frame-time breakdown per tier and that a forced tier change keeps the canvas drawing

## 6. Documentation and close

- [ ] 6.1 Update the SRS (NFR-01 with measured numbers), the traceability matrix, the test plan, ADR-0013's tier list, new ADR-0015 (two levels of detail for trees), the changelog and the architecture's building blocks where they name what changed
- [ ] 6.2 Run `npm test`, `npm run lint`, `npm run check` and `npm run build`; verify all pass
- [ ] 6.3 Verify in headed Chrome, unpinned quality: hub and walk mode run, no GL error, canvas alive after a tier change
