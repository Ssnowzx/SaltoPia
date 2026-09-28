## Why

On 2026-09-28 the owner put a place page next to visitmeatopia.com/smithfield-square and
asked for that level on every page. The reference page runs to about 8,500 pixels and
shows more than thirty pictures. Ours runs to about 4,000 and shows five, because each
place has one or two experience photographs and an empty gallery folder. The owner also
pointed at a page we never built, the reference's contest page, and set one condition:
**not the reference's colours**. Two place colours were almost exactly its orange-red
(Parque Caveiras sits 0.018 away in OKLab), and three more sat close to its deep green.

## What Changes

- **A place page rebuilt around more pictures and a stronger sequence of bands**:
  - a hero that stays pinned while the page slides up over it;
  - a welcome band where the crest carries on from the hero, over a faded picture of the
    place with a scatter of prints;
  - a ribbon band;
  - **a menu of about nine photographed items per place on a block of the place's
    colour**;
  - the experiences as an illustrated itinerary instead of a second card grid;
  - the gallery;
  - a postcard to share the page;
  - a footer that promotes the contest.
- **Every place gets a menu.** A menu item has a name, a line of description, an optional
  tag and a photograph. The menu's heading is the place's own ("Cardápio do galpão",
  "Rótulos da cantina"). Opening an item shows it larger. An item whose photograph has
  not arrived yet is still drawn, never shown as a broken image.
- **A new page, `/embaixador`: the ambassador contest.** Visitors are invited to run for
  Embaixador de Saltopia by posting about the place. The page has how to take part, a
  deck of campaign ideas that deals a new one on request, a campaign calendar that marks
  the phase running today, the prize (partner products, a stay, a dinner, the sash) and
  a short rulebook. The rulebook says the contest is fictional and part of an academic
  project. Nothing is collected, and the page submits nothing.
- **The persistent navigation and the footer link to the contest.**
- **Place colours move away from the reference palette.** Nine of the fifteen change.
  Each one stays legible under the page's pale text. The content pages' footer moves
  from the deep green to a new night-blue token.
- **Image briefs for the new photographs**: nine per place for the menu plus the contest
  page's pictures. They are written to `docs/image-prompts.md` and to a manifest that the
  owner's Grok CLI can work through file by file (path, aspect ratio, prompt).

*Mirrors:*
- Place page: smithfield-square's pinned hero, its "Welcome to" band with a scene under
  it, the ribbon marquee with its fixed call to action, the recipe cards on a
  saturated block, the "Wish you were here" postcard, and the footer that sells the
  contest.
- `place-menu`: the reference's recipe grid. It has recipes and we have each
  establishment's menu.
- `ambassador-contest`: mayor-of-meatopia. That page has a hero wordmark, "How to run"
  with tilted photos, the "Get another idea" card deck, the campaign calendar with a
  "Right now" marker, and the prize. We keep the structure. The title, copy, colours,
  shapes and art are our own.

## Non-goals

- A working contest. No form, no upload, no vote, no account and no data stored.
- A page per menu item. The reference has one per recipe, but here an item opens in
  place.
- Prices, stock or ordering on the menus.
- A popup that advertises the contest on every page, as the reference does. It would get
  in the way of the live presentation.
- Changing the hub, the map or the brand teal used by the header and the map. The owner's
  condition is about the pages. The brand teal comes from the reservoir and is recorded
  in the founding design.
- Generating the photographs. The owner generates them with Grok from the briefs, and
  the pages are complete without them.

## Capabilities

### New Capabilities

- `place-menu`: what a place's menu is, how its items are shown and opened, and how an
  item without a photograph yet is drawn.
- `ambassador-contest`: the contest page: its sections, the idea deck, the calendar's
  current phase, the prize, and the rule that the contest is presented as fictional and
  collects nothing.

### Modified Capabilities

- `place-pages` (added by `add-serranopolis-experience`, still unarchived):
  - "Place page anatomy" gains the pinned hero, the welcome scene, the menu, the
    itinerary and the postcard.
  - "Each place has its own colour" now requires distance from the reference palette and
    contrast with the page's pale text.
  - "Experience card grid" becomes the itinerary.
  - "Persistent navigation" gains the contest link.
- `design-system` (same change): the palette gains a night token for the content pages'
  deep surfaces.

## Impact

- **Database**: a new `menu_item` table, plus `menu_title` and `menu_lede` columns on
  `place`, added in one migration. The place colours change in the seed. The seed's words
  move into content modules (`prisma/content/`) so that the tests can check them.
- **Data layer**: `getPlaceMenu(slug)` in `lib/places.ts`, which drops photographs that
  are not on disk. The `Place` type is unchanged, so the hub's payload does not grow.
- **Components**: `components/content/` gains the welcome, menu, itinerary, postcard and
  contest sections. The hero, marquee, gallery, footer and header change.
- **New route**: `app/embaixador/page.tsx`.
- **Pure logic, tested**: the contest phase for a date, idea dealing, the menu layout,
  colour distance and contrast.
- **Tooling**: `scripts/write-image-prompts.ts` generates the manifest and the menu
  briefs from the content. `check:assets` reports thin menus and does not fail on them.
  `images:sharpen` also processes the menu folder.
- **No new dependency.**
