## 1. Guard first

- [x] 1.1 Add OKLab chroma to `lib/colour.ts`, and add `tests/palette.test.ts`, which reads the tokens from `globals.css`. Verify it fails on the current teal and gold, then passes after 2.1.

## 2. Tokens and roles

- [x] 2.1 In `globals.css`, remove the teal family and araucária and set gold to `#D9BF86`. Verify the palette test passes.
- [x] 2.2 Recolour the hub: the intro, the pins, and the place card in its place's colour. Verify with a capture of the title state, the map and an open card.
- [x] 2.3 Recolour the header, walk mode's HUD and character creator, `/experiencias`, `/planejar`, the experience page, the 404 and the experience card. Verify the palette test's retired-token search finds nothing.
- [x] 2.4 Update the crest defaults and rim to champagne and run `build:crests`. Verify a crest sample renders.

## 3. Wordmark

- [x] 3.1 Make `build-logo.py` drop mask islands smaller than 0.5% of the largest, and run `build:logo`. Verify on a grey composite that the four corner marks are gone from both files.

## 4. Close

- [x] 4.1 Run `npm test`, `npm run check` and `npm run build`, and capture the hub at 1440 and 390. Verify all pass and the title state shows no teal and no marks.
