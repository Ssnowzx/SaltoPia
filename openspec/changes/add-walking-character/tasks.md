## 1. Assets

- [x] 1.1 Add the six optimized CC0 character models under `public/models/characters/` and record source, licence and processing in `public/models/CREDITS.md`; verify each file loads in the browser with its six clips
- [x] 1.2 Describe the six characters as data (model path, label, outfit and skin materials) and the outfit and skin palettes; verify the types check

## 2. The rules of the world (pure, tested)

- [x] 2.1 `walkHeightAt` - ground plus road lift; verify with a unit test that a point mid-carriageway stands above the graded ground by the carriageway's lift
- [x] 2.2 The walk world - blocked ground and obstacle circles bucketed on a grid; verify with unit tests that a point in the lake and a point inside a house are blocked and a point on a street is not
- [x] 2.3 `stepCharacter` - velocity, turning, sliding and push-out; verify with unit tests that a step into water stops at the bank and a step into a wall at an angle slides
- [x] 2.4 A* with string pulling on the walkability grid; verify with unit tests that a route around an obstacle exists and every point on it is walkable
- [x] 2.5 Arrival areas for the fifteen places; verify with a unit test that each area contains at least one walkable cell

## 3. Walk mode in the scene

- [x] 3.1 Mode state in `WorldMap`; `CameraRig` runs only in the air; verify switching modes never leaves two controllers active
- [x] 3.2 The character: model, cloned materials, outfit and skin, scale, animation crossfades by speed, name tag; verify in a capture
- [x] 3.3 The follow camera with orbit and zoom limits and reduced-motion snap; verify in a capture
- [x] 3.4 Keyboard, touch joystick and click-to-walk input; verify walking with each in the browser
- [x] 3.5 Auto-walk along a route, cancelled by any input; verify a route to a place across the map

## 4. Interface

- [x] 4.1 The way in (a button in the hub) and out; verify entering and leaving restores the aerial view
- [x] 4.2 The character creator dialog: six people, outfit, skin, name, remembered; verify keyboard operation and that choices change the character live
- [x] 4.3 The HUD: place prompt and visit action opening the place card, place list for auto-walk, passport with congratulations; verify arriving at the square offers its card
- [x] 4.4 Resume the walk when returning from a page; verify by opening a page from walk mode and pressing back

## 5. Close

- [x] 5.1 Verify the hub loaded from the air requests no character model, and walk mode requests exactly one
- [x] 5.2 Run `npm run check`, `npm run lint`, `npm test` and `npm run build`; verify all pass
- [x] 5.3 Update README with walk mode's controls
