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
  frame still waits for no model, and a model that fails to download leaves its people
  out instead of taking the hub down.
- Walk mode's own defects, reported with screenshots: the feet sank into the square's
  paving and, later, to the ankle into every pavement; the walker went through the
  square's planters. The feet now stand on what is drawn - paving, pavement, verge - and
  the square's props stand in the way.
- The world's own defects, found placing the townsfolk: a pier across the square, piers and
  stilt cabins under the water, a kayak under the paving, pools across the street, and the
  lakefront street dipping under the water's level.

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

- `world-appearance` (added by `elevate-world-realism`, still unarchived): "Nothing stands
  where it cannot" now says where piers, stilt cabins, pools and shore roads stand, and "The
  world stays generated" excepts the people's models, as the `world-map` spec already does.

The loading requirement of `add-walking-character`'s `world-map` delta, still unarchived, is
corrected in place: character models are not requested before the world has been drawn,
and one that fails to download does not stop the hub.

## Impact

- New `web/src/lib/walk/townsfolk.ts` (routes and behaviour, pure and tested),
  `web/src/lib/walk/crowd.ts`, `web/src/components/walk-mode/townsfolk.tsx` and
  `recolour.ts`, shared with the visitor's character.
- `neighborhood-layout.ts` and `people.ts`: the procedural people go; the parasols stay.
  Piers, stilt cabins, the kayak and the lake houses' pools move; `terrain.ts` builds roads
  above the lake's level.
- Walk mode's movement: the townsfolk join its obstacles; the square's props are read from
  its geometry (`prop-occupancy.ts`), and every surface stood on from the drawn geometry
  (`height-field.ts`), sharing one road geometry with the scene.
- `check:layout` gains checks for piers, stilt cabins, floating things on land and pools
  on roads.
- New dependency `react-error-boundary`, so a failed model download is contained without a
  class of our own.
