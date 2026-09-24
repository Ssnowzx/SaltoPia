## Why

Walk mode puts a detailed, animated person in the world, and beside it the community's
people were still the first procedural figures - a box for a body, a ball for a head -
standing stock still. The owner saw it at once on 2026-09-24: the townsfolk must be the same
kind of people as the visitor's character, and they must be alive.

## What Changes

- The procedural figures are removed. The community's people are drawn with the same CC0
  characters as walk mode, varied in person, outfit colour and skin tone.
- Some **stroll** - round the square, along the pavements, down the fairground's midway -
  pausing at the end of their way before turning back. Others **stand**: a pair talking in
  the square, someone at a shop window, someone looking out from the lookout - and now and
  then they gesture.
- In walk mode they **notice the visitor**: a townsperson approached stops, turns and
  waves. The visitor cannot walk through them.
- Under reduced motion they stand where they are rather than stroll.
- The character models, already downloaded for walk mode, are now fetched once the world
  has been drawn, since the townsfolk need them from the air as well. The world's first
  frame still waits for no model.

*Mirrors:* nothing in the reference; visitmeatopia.com's city is unpeopled.

## Non-goals

- Conversation, quests or any interaction beyond the greeting.
- Crowds or traffic simulation; a dozen or so people on authored routes.
- Townsfolk in the farms, the plateau or anywhere far from the community.

## Capabilities

### New Capabilities

- `townsfolk`: who the community's people are, where they walk or stand, how they move, how
  they greet the visitor, and how they behave under reduced motion.

### Modified Capabilities

None in `openspec/specs`. The loading scenario of `add-walking-character`'s `world-map`
delta, still unarchived, is corrected in place: character models are not requested before
the world has been drawn.

## Impact

- New `web/src/lib/walk/townsfolk.ts` (routes and behaviour, pure and tested) and
  `web/src/components/walk-mode/townsfolk.tsx`.
- `neighborhood-layout.ts` and `people.ts`: the procedural people go; the parasols stay.
- Walk mode's movement: the townsfolk join its obstacles.
