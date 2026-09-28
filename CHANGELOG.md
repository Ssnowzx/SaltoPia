# Changelog

Notable changes to Saltopia, in the format of [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
The project adheres to [Semantic Versioning](https://semver.org/). No version has been
released yet: `web/package.json` is at 0.1.0, and everything below is unreleased. It is
grouped by date and by the OpenSpec change that specified it.

## [Unreleased]

### 2026-09-28 — `elevate-place-pages`

#### Added

- A photographed **menu** on every place page: 135 items, 9 per place, that open larger
  in place (new `menu_item` table and `place.menu_title` / `menu_lede`).
- Place pages rebuilt in bands:
  - a pinned hero;
  - a welcome band with scattered prints;
  - a ribbon with bunting;
  - the menu on the place's colour under a ridge of araucárias;
  - the experiences as an itinerary;
  - the gallery;
  - a postcard to share.
- **`/embaixador`**, the ambassador contest, presented as fictional. It has how to take
  part, a deck of campaign ideas, a calendar that marks today's phase, the prize with
  partner links, and the rules.
- The Grok photo pipeline:
  - `npm run images:prompts` writes a manifest of missing photographs;
  - `images:sharpen` converts PNG and JPEG to WebP;
  - 228 new photographs: 135 menu, 3 contest and 90 gallery.
- The "Embaixador" link in the header and a contest card in the footer.

#### Changed

- Twelve place colours moved away from the reference site's palette. A test holds every
  place colour ≥ 0.08 (OKLab) from it and ≥ 4.5:1 against pale text.
- The seed's words moved into typed content modules (`web/prisma/content/`).
- Crests are drawn in their place's colour, and long names shrink to fit the rim.

### 2026-09-28 — `adopt-night-palette`

#### Changed

- The interface palette is now night, wine and champagne across the hub, the header, the
  place card, walk mode and every page.
- The place card is painted in its place's colour.

#### Removed

- The teal, teal-deep, teal-dark, araucaria and sky colour tokens.

#### Fixed

- Four small marks at the corners of the wordmark, left over from the paper card's
  ornaments.

### 2026-09-28 — `add-contest-invitation`

#### Added

- A card that invites to the contest once per visit. It never covers the title screen, a
  place card or the character creator, and `?convite` forces it.

#### Changed

- Three lines that were translations of the reference's copy were rewritten.
- The wordmark files were renamed to `saltopia-wordmark*.png`, so no cached copy of the
  old image is served.

### 2026-09-28 — `document-the-product`

#### Added

- Standards-based documentation, indexed in `docs/README.md`:
  - vision and scope;
  - an SRS (ISO/IEC/IEEE 29148) with a traceability matrix;
  - an arc42 architecture description with C4 diagrams;
  - 14 ADRs;
  - the data model with an ER diagram;
  - a test plan (ISO/IEC/IEEE 29119-3);
  - manuals for visitors, partners, and installation and operation, in Portuguese;
  - `CONTRIBUTING.md` and this changelog.
- `npm run test:coverage`.

### 2026-09-24 — `elevate-world-realism`, `add-walking-character`, `add-living-townsfolk`

#### Added

- A physically based sunset sky that lights the world, aerial perspective, a planar
  reflection on the lake, an outer ring of land, roads with kerbs and verges, ten house
  designs, groves, and quality tiers that step down on a slow machine.
- **Walk mode:** create a character and walk the community, with a passport of the places
  visited.
- **Townsfolk:** fifteen people who stroll and stand about, and who wave when approached.

#### Fixed

- Piers, stilt cabins, pools and the lakefront street placed where they belong.
- Walkers standing on the paving and pavements instead of sinking into them.

### 2026-09-14 to 2026-09-15 — `add-serranopolis-experience`

#### Added

- The 3D hub, generated in code:
  - the Salto do Rio Caveiras reservoir, the town, the farms on the plateau, the
    fairground, the lakeside restaurant and the UFO port;
  - HTML pins, fly-to, place cards and offers on pins;
  - a title state, and the iris page transition.
- Place and experience pages, the experiences index and "Planejar visita", with a gallery
  of six photographs per place.
- The MariaDB data layer through Prisma, with 15 places and 25 experiences.
- The Saltopia wordmark (the project was renamed from Serranópolis), and photographic heroes
  and experience images.
