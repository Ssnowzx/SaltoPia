## Why

The hub is seen from the air: the visitor flies from pin to pin and reads a card. The owner
asked on 2026-09-24 for a way to create a character and walk the community on foot,
visiting each establishment - a second way through the same world that makes the places
feel like somewhere you arrive rather than something you point at.

## What Changes

- A **walk mode** reached from the hub: the visitor creates a character - one of six
  people, outfit colour, skin tone and a name - and is put down in the square.
- The character **walks and runs** under keyboard, pointer or touch control, follows the
  ground and the pavements, cannot walk into the lake, through buildings or off the map,
  and is followed by a camera the visitor can turn and zoom.
- Every one of the fifteen establishments can be **visited on foot**: arriving at one
  offers to open its card, and from the card its page, exactly as the pins do from the air.
  A place can also be chosen from a list and the character walks there by itself.
- A **passport** counts the places visited, remembered in the browser, and marks the
  visit to all fifteen.
- Coming back to the hub from a place page visited on foot **resumes the walk** where the
  visitor left it.
- The characters are **downloaded models** - CC0, by Quaternius - fetched only when the
  visitor opens walk mode. The world itself stays generated.

*Mirrors:* nothing in the reference: visitmeatopia.com has no avatar. The mechanic this
extends is its click-pin-to-card flow (founding change, `map-pins`), which walk mode reaches
on foot instead of by flight.

## Non-goals

- Multiplayer or seeing other visitors.
- Entering buildings or interiors: a visit opens the place's card and page.
- Saving characters to an account or the database; the character lives in the browser.
- Combat, vehicles, jumping or any game mechanic beyond walking and visiting.

## Capabilities

### New Capabilities

- `walk-mode`: creating a character, walking the world with it, the camera that follows it,
  the rules of where it can go, visiting establishments on foot, and the passport.

### Modified Capabilities

- `world-map`: "Loading experience" - the character models become the one downloaded 3D
  asset. They are fetched only on entering walk mode, so the hub's first load still
  downloads no model and the 8 MB budget is unchanged.

## Impact

- New `web/src/components/walk-mode/` (creator, character, controls, camera, HUD) and
  `web/src/lib/walk/` (movement and collision, path finding, visits - pure and tested).
- `web/public/models/characters/*.glb` (six models, ~0.5 MB each after pruning and meshopt
  compression) and `web/public/models/CREDITS.md`.
- `world-map.tsx`, `camera-rig.tsx`, `pin-overlay.tsx`, `site-header.tsx`: a mode switch -
  the aerial rig and walk camera never run together.
- No new npm dependency: `@react-three/drei` already provides glTF loading, animations and
  keyboard controls.
