# Model credits

Everything in the world is generated in code. The only downloaded 3D models are six people -
the visitor's character in walk mode and the townsfolk - fetched after the world has been
drawn.

| File | Source | Author | Licence |
| --- | --- | --- | --- |
| `characters/man-casual.glb` | *Ultimate Modular Men Pack* - Casual - https://poly.pizza/bundle/Ultimate-Modular-Men-Pack-ZiH8muWqwQ | Quaternius | CC0 1.0 |
| `characters/man-hiker.glb` | *Ultimate Modular Men Pack* - Adventurer - same bundle | Quaternius | CC0 1.0 |
| `characters/man-farmer.glb` | *Ultimate Modular Men Pack* - Farmer - same bundle | Quaternius | CC0 1.0 |
| `characters/woman-casual.glb` | *Ultimate Modular Women Pack* - Casual - https://poly.pizza/bundle/Ultimate-Modular-Women-Pack-aCBDXDdTNN | Quaternius | CC0 1.0 |
| `characters/woman-hiker.glb` | *Ultimate Modular Women Pack* - Adventurer - same bundle | Quaternius | CC0 1.0 |
| `characters/woman-formal.glb` | *Ultimate Modular Women Pack* - Formal - same bundle | Quaternius | CC0 1.0 |

CC0 asks for no attribution; it is recorded because an academic work must be able to show
where everything came from.

## Processing

Downloaded as GLB from Poly Pizza on 2026-09-24 and reduced with
[glTF-Transform](https://gltf-transform.dev) 4:

1. Every animation except `Idle`, `Idle_Neutral`, `Walk`, `Run`, `Wave` and `Interact`
   removed, and the survivors renamed without their `CharacterArmature|` prefix.
2. `resample`, `dedup`, `prune`, `weld`, `quantize`, then `meshopt` at level `medium`.

About 1.4 MB each before, 0.5 MB after. The loader decodes meshopt with the decoder bundled
in `three-stdlib`; nothing is fetched from a CDN.
