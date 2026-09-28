## Why

On 2026-09-28, after seeing the new place pages, the owner asked for the home page in "a
mesma cor nova" and called it the new design. The hub, the header, the place card, walk
mode and the older pages still wear the founding palette, and measured against the
reference three of its colours are the reference's own:
- the teal family sits 0.043–0.049 (OKLab) from its deep green;
- araucária sits 0.070 from the same green;
- the gold sits 0.039 from its mustard.

The owner also pointed at four small marks, one at each corner of the wordmark on the
title screen.

## What Changes

- **The interface palette becomes night, wine and champagne** on the cream paper. Teal,
  teal-deep, teal-dark and araucária leave the interface entirely: filled buttons,
  links, script headings and focus rings move to night and wine. Gold becomes champagne
  `#D9BF86`, which keeps its role on pins, highlights and dark surfaces and stands clear
  of the reference's mustard.
- The hub's title state: "Bem-vindo a" in wine and the explore button in night. The
  button's orange shadow, the reference's hue, goes.
- The place card takes its place's colour: the same colour its page opens in. The
  card becomes the door to that page.
- The pins: champagne with a night glyph.
- The header, walk mode's panels, the character creator, `/experiencias`, `/planejar`,
  the experience pages and the 404 follow the same roles.
- The wordmark loses the four marks: they are the corner ornaments of the paper card it
  was cut from, and the cut now drops anything that is not the emblem.

*Mirrors:* nothing new. The reference keeps its orange, teal and mustard, and this change
moves the whole site off them.

## Non-goals

- The 3D world's own colours: the lake, the terrain and the boats. The water is teal
  because the reservoir is.
- Moving the paper creams. A neutral off-white sits near any cream, and it is not a colour
  anyone reads as the reference's.
- New layout on the hub. This is a recolour and one asset fix.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `design-system` (added by `add-serranopolis-experience` and modified by
  `elevate-place-pages`, both unarchived; archive after them): "Palette tokens" loses the
  teal family and araucária, gives the primary roles to night and wine, moves gold to
  champagne, and requires every saturated token to stand clear of the reference's
  colours.

## Impact

- `web/src/app/globals.css` tokens. Every interface component that named `teal*` or
  `araucaria`.
- `crest.ts` defaults and rim colour, then `npm run build:crests`.
- `scripts/build-logo.py` drops the emblem mask's small islands, then `npm run build:logo`.
- A test reads the tokens from `globals.css` and holds the saturated ones to the 0.08
  distance.
