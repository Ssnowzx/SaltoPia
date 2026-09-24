## 1. Baseline and tooling

- [x] 1.1 Capture the before set - wide shot plus zooms on the community, a junction, the lake and the far shore - at 1600x900 with pins hidden, and keep it beside the change; verify the files exist
- [x] 1.2 Add a `test` script running Node's test runner through tsx, with one passing smoke test; verify `npm test` exits 0

## 2. Sky, light and atmosphere (D1, D2, D11)

- [x] 2.1 Replace the sky dome and the ray fan with the Preetham sky and its cloud layer, parameters in `SKY` in `constants.ts`; verify the wide shot shows a sun disc with no rays and sun-lit cloud edges
- [x] 2.2 Delete the blob `Clouds` component and stop the sky's cloud clock under reduced motion; verify with `prefers-reduced-motion: reduce` that two captures 2 s apart show identical clouds
- [x] 2.3 Render a PMREM environment from the sky once at load and assign it to the scene; remove the hemisphere, ambient and second directional lights; match the key light to the sky's sun colour; verify a wall facing away from the sun is lit and readable in a close capture
- [x] 2.4 Replace the fog chunks with directional aerial perspective and blend the sky below the horizon into the same function; verify the far hills are paler than the near ones and no band separates land from sky
- [x] 2.5 Soften shadows with PCF radius and re-tune bias; verify no shadow acne on roofs and no peter-panning under trees in a close capture
- [x] 2.6 Tune exposure, bloom, AO and add the colour grade; verify only the sun disc and the glitter path bloom

## 3. The world's edge (D3)

- [x] 3.1 Build the outer ring of land meeting the terrain's border without a step, extend the lake surface west to its shore, delete the haze plane; verify captures at both ends of the orbit arc, fully zoomed out, show no terrain edge

## 4. Water (D4)

- [x] 4.1 Write `planar-reflection.ts` (mirror camera, oblique clip plane, texture matrix) with unit tests for a point above the plane mirroring below it and the clip plane rejecting points under the water; verify `npm test` passes
- [x] 4.2 Add the reflection pass component, hiding water and pins while it renders, sized by the quality tier; verify a boat's reflection appears under it in a close capture
- [x] 4.3 Rewrite the lake shader - procedural ripple normals, reflection, Fresnel, depth colour and shoreline alpha, sun glitter - and a sky-only river variant; verify no grid pattern at full zoom and the bank visible through the shallows
- [x] 4.4 Hold the ripples still under reduced motion; verify two captures 2 s apart are identical under `prefers-reduced-motion: reduce`

## 5. Ground (D5)

- [x] 5.1 Add the grove field as a pure function shared by terrain and scatter, with a unit test that it is deterministic and spans both open and wooded values over the map
- [x] 5.2 Rebuild the terrain colour field (meadow, pasture, forest floor, yard tint) and delete the lawn disc mesh; verify no disc is visible around any house in a close capture
- [x] 5.3 Sample the grass texture at two scales with macro brightness noise; verify the wide shot shows no repeating tile on the slopes

## 6. Streets and tracks (D6)

- [x] 6.1 Generate the asphalt, earth and paving textures and the road material with shader-drawn markings; verify white edge lines and a yellow broken centre line in a close capture
- [x] 6.2 Give ribbons `roadUv` and `marking`, zeroing markings within a junction radius, with a unit test that a vertex at a junction has `marking = 0` and one mid-street has 1
- [x] 6.3 Build raised pavements with kerb faces along town streets and grass verges outside town; verify the kerb reads as a step in a close capture
- [x] 6.4 Add junction patches and delete the centre-line ribbons; verify the lakefront/main street junction joins as one surface with no line across it
- [x] 6.5 Rebuild tracks with ruts and soft alpha-to-coverage edges; verify the plateau track fades into the grass
- [x] 6.6 Verify no road surface flickers: a 6-frame capture sequence during a flight shows no striping on any road

## 7. Buildings (D7)

- [x] 7.1 Add per-surface roughness and metalness to the world material, and a board-and-batten atlas tile; verify windows mirror the sky in a close capture
- [x] 7.2 Rewrite the building builder - gable walls, overhanging slab roofs with fascia and ridge, hip option, framed windows with shutters, porches; verify eaves overhang and gables are wall in a close capture
- [x] 7.3 Define the ten dwelling designs and register them; verify each builds without error in the console
- [x] 7.4 Assign designs so no dwelling's nearest dwelling shares its design, and make `check:layout` read footprints from the layout and enforce the rule; verify `npm run check:layout` passes and fails when two neighbours are forced equal
- [x] 7.5 Rebuild the chalets (glazed gable, deck, wing) and alternate them with a gable chalet; verify the far shore no longer reads as a grid in the wide shot

## 8. Vegetation (D8)

- [x] 8.1 Gate the scatter with the grove field; verify the slope behind the community shows clusters with open grass between
- [x] 8.2 Add per-instance colour jitter to vegetation; verify neighbouring trees differ in shade
- [x] 8.3 Rebuild broadleaf crowns with displaced clusters and bent normals, and the araucária with its cupped crown; verify both silhouettes in a close capture

## 9. Defects (D9)

- [x] 9.1 Accept land props only clear of the water and drop authored ones that fail; add a land-object-on-water check to `check:layout`; verify it passes and that no palm stands in the lake in the wide shot

- [x] 9.2 Move the Mirante da Neblina, found under water, onto a hill of its own and reseed its position and camera; verify a flight to it arrives over dry ground
- [x] 9.3 Replace the faceted chimney smoke with soft billboards that hold still under reduced motion; verify in a close capture

## 10. Quality tiers and budget (D10)

- [x] 10.1 Add the quality tiers with `PerformanceMonitor`, coarse-pointer devices starting at `medium`; verify forcing each tier renders without error and the `low` tier's lake still reflects the sky
- [x] 10.2 Verify the payload rule: the network log of a hub load shows no image, environment or model request for the world
- [x] 10.3 Measure median frame time over 30 s of idle drift at 1920x1080 on the `high` tier and record it in design.md

- [x] 10.4 Keep the canvas alive across a tier change - one composer per tier, decline only under 30 fps; verify in headed Chrome with a throttled CPU that the tier drops, no blit error is logged and consecutive canvas-only frames differ

## 11. Close

- [x] 11.1 Capture the after set at the before set's camera positions and put the pairs side by side for review
- [x] 11.2 Run `npm run check`, `npm run lint`, `npm test` and `npm run build`; verify all pass
- [x] 11.3 Record the final tuned values (sky, fog, colours, exposure) in design.md
