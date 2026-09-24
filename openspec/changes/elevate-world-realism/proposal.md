## Why

The hub is the first and longest thing the panel will look at, and it reads as a toy: a
pool-blue lake with a visible grid in it, a cartoon sun with a fan of rays, dark box
houses sitting on circular lawn "stickers", brown ribbons for streets, palms standing in
the water and the edge of the world showing on the right. The owner's brief on
2026-09-24 was to make the world look professional, realistic and beautiful, with the
streets and the houses called out by name.

## What Changes

- The sky becomes a physically based sunset - atmospheric scattering, a real sun disc and
  a lit, drifting cloud layer - instead of a painted gradient with a ray fan. The same
  sky lights the world: every lit surface takes its ambient light and reflections from it.
- Distance is carried by atmosphere: far land dissolves into the colour of the sky behind
  it, warmer toward the sun, so the horizon is never a hard cream band or a cut edge.
- The lake reflects what stands around it - the far shore, the hills, the boats, the
  sky - with moving ripples, a sun glitter path, a darker, natural body colour and
  shallows that show the bank beneath.
- The ground stops being one flat green: meadow, dry pasture, forest floor and mown
  yards vary across it, and the circular lawn discs under the houses are removed.
- Streets become asphalt with kerbs and pavements, white edge lines and a yellow centre
  line, and junctions that meet cleanly; unpaved tracks become earth with wheel ruts that
  fade into the grass.
- Houses are rebuilt in the region's vernacular - rendered masonry and painted timber,
  ceramic tile roofs with real eaves, gable walls in the wall's own material, framed and
  glazed windows that catch the light, porches and chimneys - in more variants, so a
  street is not one house repeated.
- Trees are fuller and grow in groves with open ground between them, with colour varying
  tree to tree; the araucárias carry the candelabra crown that identifies the region.
- Defects fixed: palms standing in the lake, the world's edge visible at the right of the
  wide shot, the chalets reading as a grid of red triangles.
- Nothing is downloaded. Every texture, sky and model stays generated at runtime, which
  keeps the existing 8 MB payload rule satisfied at zero.

*Mirrors:* the reference's hand-authored city model - one textured, lit 16.3 MB scene
(`Map.v45.glb`, ~160 textures) - in visual fidelity, reached here by generation rather
than by a download.

## Non-goals

- Changing the composition. The lake, the island, the community, the places and their
  pins keep their positions; the camera keeps its framing, bounds and flights.
- Photogrammetry, downloaded textures, HDRIs or model packs. The world stays generated -
  that is a standing design decision (design.md D1 of the founding change) and a
  `world-map` requirement.
- A day/night cycle or weather. The world stays at one golden-hour moment.
- The content pages. Only the hub's world changes.

## Capabilities

### New Capabilities

- `world-appearance`: How the hub's world must look and read - sky and light,
  atmospheric depth, water, ground, streets, buildings, vegetation - and the visual
  defects it must never show (floating or submerged objects, flicker, a visible world
  edge). Mirrors the reference's textured, lit city model.

### Modified Capabilities

None. The `world-map` requirements - composition from data, instancing, the payload
budget, the frame-rate budget, the fallback - are unchanged and are the constraints this
change is held to.

## Impact

- `web/src/components/world-map/`: sky, clouds, lights, post effects, the neighbourhood
  meshes, a new reflection pass for the lake.
- `web/src/lib/world/`: materials (world, terrain, lake, a new road material), the
  procedural textures, building builders and variants, road ribbons, the scatter, the
  layout's house list.
- `web/scripts/check-layout.ts`: gains checks for objects standing in the water.
- No new dependencies: `three`'s own sky and the existing post-processing stack cover it.
- Frame cost rises (a reflection pass, image-based light). It is held inside the
  existing `world-map` performance budget with quality switches in `constants.ts`.
