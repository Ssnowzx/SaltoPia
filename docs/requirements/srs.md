# Saltopia — Software Requirements Specification

| | |
| --- | --- |
| Document | Software Requirements Specification, structured after ISO/IEC/IEEE 29148:2018 §9.6 |
| Product | Saltopia |
| Version | 1.1, 2026-10-07 (FR-65 to FR-67 and NFR-01's measurements, from `speed-up-the-hub`) |
| Related | [`vision.md`](vision.md) · [`traceability.md`](traceability.md) · [`../testing/test-plan.md`](../testing/test-plan.md) · [`../architecture/README.md`](../architecture/README.md) |

## 1. Introduction

### 1.1 Purpose

This document states what Saltopia must do (functional requirements) and how well
(non-functional requirements and constraints). Its readers are the development team, the
course evaluators and whoever turns the assignment into a product.

### 1.2 Scope

Saltopia is a web application that presents an imagined community at the Salto do Rio
Caveiras reservoir (Lages, SC) as an explorable 3D map. Each establishment on the map has
its own page. The business case and scope are in [`vision.md`](vision.md), and the initial
release covers features FE-1 to FE-7 there.

### 1.3 How this document relates to the specs

The **authoritative, testable statement of each functional requirement is an OpenSpec
requirement** under `openspec/changes/<change>/specs/<capability>/spec.md`. Each is written
with SHALL/MUST and `WHEN/THEN` scenarios. This SRS gives every one of them a stable ID, a
one-line statement and its status, and adds the non-functional requirements and
constraints that the specs do not own. When the two disagree, the spec wins and this
document is corrected.

### 1.4 Product overview

- **Product perspective:** a standalone web application with no external runtime services.
  It has a browser front end (Next.js), a relational store (MariaDB) behind a data layer,
  and static assets. See the context diagram in
  [`../architecture/README.md`](../architecture/README.md) §3.
- **Product functions:** the hub (3D map, pins, fly-to, place cards), place pages
  (story, menu, experiences, gallery, share), experience pages, walk mode, the ambassador
  contest and its invitation.
- **User characteristics:**
  - Visitors: non-technical, often on a phone, some preferring reduced motion.
  - Partners: supply content, but have no access to the system in this release.
  - Evaluators: technical.
- **Limitations:** no accounts, no data collected from visitors, Portuguese only, runs
  locally. See `vision.md` §2.4.

### 1.5 Definitions

| Term | Meaning |
| --- | --- |
| Hub | The home route `/`: the full-screen 3D map |
| Place | A point of interest and establishment; has a pin, a card and a page |
| Pin | The HTML marker drawn over a place on the map |
| Place card | The panel that opens over the map when a pin is chosen |
| Experience | Something to do at a place, with its own page |
| Menu item | Something a place serves or sells, shown on its page |
| Offer | A short promotion shown as a ribbon on a place's pin and card |
| Accent | A place's own colour, from which its page's colours are mixed |
| Walk mode | Exploring the world on foot as a character |
| Title state | The opening screen of the hub, before "Explorar Saltopia" |
| Reduced motion | The visitor's system setting `prefers-reduced-motion: reduce` |
| Reference site | `visitmeatopia.com`, whose interaction model Saltopia adapts |
| OpenSpec | The spec-driven workflow used for every change (`openspec/`) |

### 1.6 References

- ISO/IEC/IEEE 29148:2018, *Requirements engineering*
- ISO/IEC 25010:2011, *Product quality model* (NFR categories below)
- W3C, *Web Content Accessibility Guidelines (WCAG) 2.1*, level AA
- Lei nº 13.709/2018, *Lei Geral de Proteção de Dados* (LGPD)
- The OpenSpec changes in `openspec/changes/`

## 2. Functional requirements

**Status:** ✅ implemented and verified · 🟡 partial · ⛔ not built. **Source** is the
OpenSpec change and capability holding the full requirement, with its scenarios.

### 2.1 World map (source: `add-serranopolis-experience/world-map`; FR-06 also `add-walking-character/world-map`; FR-65 `speed-up-the-hub/world-map`)

| ID | Requirement | Status |
| --- | --- | --- |
| FR-01 | The hub is a full-screen 3D surface; the document does not scroll | ✅ |
| FR-02 | The hub opens on a title state with the wordmark and one "Explorar Saltopia" action. It is not replayed when the visitor comes back from inside the site | ✅ |
| FR-03 | The camera holds a low three-quarter view and drifts when idle. Orbit and zoom are bounded, and a zoom aims at what the visitor points at | ✅ |
| FR-04 | Choosing a place flies the camera to it (GSAP, 2 s, `power2.inOut`); under reduced motion the camera arrives instantly | ✅ |
| FR-05 | The neighbourhood is composed from typed layout data | ✅ |
| FR-06 | The explore action waits for the world to be drawn; character models load only after it | ✅ |
| FR-07 | The whole neighbourhood stays in frame at any viewport shape; one finger orbits and two fingers zoom | ✅ |
| FR-65 | Every tree within 200 m of the camera is drawn in full. A farther tree may be drawn in a simpler form that keeps its outline and colour, and it does not switch back and forth while the camera rests | ✅ |

### 2.2 Map pins (source: `add-serranopolis-experience/map-pins`)

| ID | Requirement | Status |
| --- | --- | --- |
| FR-08 | Pins are interface over the canvas, not scene geometry. They stay crisp at any distance and their labels stay horizontal | ✅ |
| FR-09 | Pins follow their place every frame and hide behind the camera. They are also meant to hide behind terrain | 🟡 not hidden behind terrain |
| FR-10 | Pins react to hover and focus, and hide during a flight | ✅ |
| FR-11 | A place running an offer is marked with a ribbon and a slow ring | ✅ |
| FR-12 | Pins are reachable and operable by keyboard | ✅ |
| FR-13 | Choosing a pin opens the place card; navigation happens only from the card | ✅ |
| FR-14 | While a dialog is open over the world, the world is blurred | ✅ |

### 2.3 Page transitions (source: `add-serranopolis-experience/page-transitions`)

| ID | Requirement | Status |
| --- | --- | --- |
| FR-15 | Navigation is revealed by an iris: a circle growing over `--duration-transition`, `ease-in` | ✅ |
| FR-16 | The transition never traps the visitor | ✅ |
| FR-17 | The transition is suppressed under reduced motion | ✅ |

### 2.4 Place pages (source: `add-serranopolis-experience/place-pages`, modified by `elevate-place-pages/place-pages`)

| ID | Requirement | Status |
| --- | --- | --- |
| FR-18 | A place page presents, in order: pinned hero, welcome band, ribbon, menu, itinerary, gallery, postcard and footer. It scrolls normally and creates no WebGL | ✅ |
| FR-19 | Each page is built around its place's colour. The colour is content, keeps pale text at ≥ 4.5:1 and stays ≥ 0.08 (OKLab) from the reference's colours | ✅ |
| FR-20 | A ribbon band loops seamlessly, with a call to action that never overlaps it | ✅ |
| FR-21 | Experiences appear as ticket cards on the index and as an itinerary on the place page, and each links to its experience page | ✅ |
| FR-22 | An experience page shows hero, description, practical details and a link back. An experience asked for under the wrong place is a 404 | ✅ |
| FR-23 | Sections animate in once when scrolled to, and are readable if the animation never runs | ✅ |
| FR-24 | Every page carries the same navigation: Destinos, Experiências, Embaixador, the wordmark and Planejar visita. It collapses at phone width with nothing unreachable | ✅ |
| FR-25 | Every place and experience page has its own title, description and social image | ✅ |
| FR-26 | The hero stays pinned while the page slides over it; under reduced motion it neither scales nor drifts | ✅ |
| FR-27 | A page ends with a postcard and three ways to share: the share sheet, WhatsApp and copy link | ✅ |

### 2.5 Place menu (source: `elevate-place-pages/place-menu`)

| ID | Requirement | Status |
| --- | --- | --- |
| FR-28 | Every published place has a menu (heading, lede, items in order) held as content | ✅ |
| FR-29 | Items are ticket cards on the place's colour; the grid centres a short last row and is one column at phone width | ✅ |
| FR-30 | An item opens larger in place. It closes with the X, Esc or a click outside, and focus returns to the card | ✅ |
| FR-31 | An item without a photograph shows a drawn stand-in, with no broken image and no failed request | ✅ |
| FR-32 | Every menu photograph has a brief, listed with its path and aspect in a machine-readable manifest | ✅ |

### 2.6 Walk mode (source: `add-walking-character/walk-mode`; FR-66 and FR-67 `speed-up-the-hub/walk-mode`)

| ID | Requirement | Status |
| --- | --- | --- |
| FR-33 | The visitor can enter walk mode from the map and leave it | ✅ |
| FR-34 | The visitor creates a character: person, outfit, skin tone and name | ✅ |
| FR-35 | The character walks and runs with the keyboard, click-to-walk or a touch stick | ✅ |
| FR-36 | The character cannot walk into the lake or river, through a building or off the map, and slides along what stops it | ✅ |
| FR-37 | The camera follows the character | ✅ |
| FR-38 | Places can be visited on foot and their card opened | ✅ |
| FR-39 | A passport records the places visited, kept in the browser | ✅ |
| FR-40 | Coming back from a page resumes the walk where it was | ✅ |
| FR-66 | Entering walk mode never holds a frame for more than 100 ms. What it needs is prepared while the world goes on drawing | ✅ |
| FR-67 | Whichever person is chosen, and however many times the choice changes, the character stands, walks and runs with that person's own animation | ✅ |

### 2.7 Townsfolk (source: `add-living-townsfolk/townsfolk`)

| ID | Requirement | Status |
| --- | --- | --- |
| FR-41 | Townsfolk are the same kind of people as the visitor's character, varied | ✅ |
| FR-42 | Some stroll along routes and some stand and gesture | ✅ |
| FR-43 | A townsperson approached stops, turns and waves; the visitor cannot walk through them | ✅ |
| FR-44 | Under reduced motion townsfolk stand still | ✅ |
| FR-45 | Townsfolk arrive after the world is drawn; a failed model leaves them out without breaking the hub | ✅ |

### 2.8 World appearance (source: `elevate-world-realism/world-appearance`, modified by `add-living-townsfolk`)

| ID | Requirement | Status |
| --- | --- | --- |
| FR-46 | One sun and one sky light the world | ✅ |
| FR-47 | Distance is carried by atmosphere | ✅ |
| FR-48 | The lake reflects its surroundings | ✅ |
| FR-49 | The ground varies like land | ✅ |
| FR-50 | Streets read as streets | ✅ |
| FR-51 | Buildings read as built | ✅ |
| FR-52 | Vegetation grows like vegetation | ✅ |
| FR-53 | Nothing stands where it cannot: no land object in water, no piers on land, no floating objects | ✅ |
| FR-54 | The world is generated and downloads no texture, map or model, apart from the people | ✅ |
| FR-55 | Ambient motion honours reduced motion | ✅ |

### 2.9 Ambassador contest (source: `elevate-place-pages/ambassador-contest`)

| ID | Requirement | Status |
| --- | --- | --- |
| FR-56 | `/embaixador` presents hero, how to take part, idea deck, calendar, prize, rulebook and footer | ✅ |
| FR-57 | The contest is presented as fictional; the page has no form and sends no visitor input | ✅ |
| FR-58 | The idea deck deals every idea once before any repeats, and announces each to assistive technology | ✅ |
| FR-59 | The calendar marks the phase running on the viewing date (America/Sao_Paulo), the next one between phases, or the end | ✅ |
| FR-60 | The prize names its partners and links to their pages | ✅ |
| FR-61 | The contest's scene holds still under reduced motion | ✅ |

### 2.10 Contest invitation (source: `add-contest-invitation/contest-invitation`)

| ID | Requirement | Status |
| --- | --- | --- |
| FR-62 | The invitation appears once per browser session on the first allowed page, never on the contest page; `?convite` forces it | ✅ |
| FR-63 | It never covers the title state, a place card or the character creator | ✅ |
| FR-64 | It shows the wordmark, the copy and a fictional notice. It closes with its action, the X, Esc or a click outside, and keeps focus while open | ✅ |

## 3. Non-functional requirements

Categories follow ISO/IEC 25010.

| ID | Category | Requirement | Source | Status |
| --- | --- | --- | --- | --- |
| NFR-01 | Performance efficiency | On integrated graphics at 1920×1080 the hub sustains 60 fps when idle and ≥ 30 fps during a flight; below 30 fps it steps its quality down, one tier at a time and never back up | `world-map` Performance budget | 🟡 on the M5 (Apple integrated graphics), production build, vsync on: 60 fps on every tier, idle, in flight and on foot (the high tier held 46 before `speed-up-the-hub`). With the CPU throttled 4x the high tier holds 48 fps from the air and during a flight, and the lowest tier 60. Not yet measured on the presentation machine |
| NFR-02 | Performance efficiency | The renderer's pixel ratio is capped at 2 | `world-map` Performance budget | ✅ |
| NFR-03 | Performance efficiency | The compressed 3D payload is ≤ 8 MB. The world downloads nothing but six character models | `world-map` Loading; `world-appearance` | ✅ |
| NFR-04 | Usability / accessibility | Every defined text/background token pairing meets WCAG 2.1 AA | `design-system` Palette tokens | 🟡 night/mist, champagne/night and every place accent are tested; not every pairing |
| NFR-05 | Usability / accessibility | Every animation respects reduced motion, and every destination stays reachable with it on | `design-system` Motion contract | ✅ |
| NFR-06 | Usability / accessibility | Everything interactive is operable by keyboard; dialogs trap focus and return it on close | `map-pins`, `place-menu`, `contest-invitation` | ✅ |
| NFR-07 | Usability | No horizontal overflow at 390–400 px; the navigation collapses to one control | `place-pages`, `world-map` | ✅ |
| NFR-08 | Security / privacy | No personal data is collected, stored on a server or sent. Browser storage holds only the five keys in the data model | `ambassador-contest`; `data-model.md` | ✅ |
| NFR-09 | Reliability | A missing asset (photograph, character model) never breaks a page or the hub | `place-menu`, `townsfolk`, `place-pages` | ✅ |
| NFR-10 | Reliability | Storage that is unavailable or forbidden never breaks a feature | `walk-mode`; code (`try/catch` on every access) | ✅ |
| NFR-11 | Availability | Without WebGL2, or when the renderer fails, the hub shows a static view with every place as a link | `world-map` Fallback | ⛔ not built |
| NFR-12 | Maintainability | TypeScript `strict`, no `any`, no class inheritance, functions ≤ 50 lines, no magic numbers | `CLAUDE.md` §4 | ✅ enforced by review and lint |
| NFR-13 | Maintainability | Only the data layer (`lib/places.ts`) talks to the database; components use domain types | `CLAUDE.md` §3 | ✅ |
| NFR-14 | Maintainability | Unit-test line coverage ≥ 80% on pure logic | `CLAUDE.md` §6 | ✅ 96.8% lines of the modules under test (see test plan) |
| NFR-15 | Portability | Moving to a server is a change of `.env`, never of code | `CLAUDE.md` §3 | ✅ |

## 4. Constraints

| ID | Constraint | Source |
| --- | --- | --- |
| DC-01 | Stack: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, three.js with react-three-fiber, GSAP, Lenis on content pages only, MariaDB 11 through Prisma 7 | `CLAUDE.md` §3; ADR-0002 to ADR-0005 |
| DC-02 | Palette: night, wine and champagne on cream; every saturated token ≥ 0.08 (OKLab) from the reference's colours | `design-system` Palette tokens (as modified by `adopt-night-palette`) |
| DC-03 | Typography: two self-hosted families. Yellowtail for short decorative lines only (≥ 20 px, ≤ 40 characters), Figtree for everything else | `design-system` Typography tokens |
| DC-04 | Shape: radii of 16 / 8 / 100 px; experience and menu cards use the ticket silhouette | `design-system` Shape tokens |
| DC-05 | Language: identifiers, comments, commits and specs in English; everything a visitor reads in Brazilian Portuguese | `CLAUDE.md` §4 |
| DC-06 | Process: no behaviour change without an OpenSpec change validated before implementation | `CLAUDE.md` §2; ADR-0009 |
| DC-07 | Originality: no asset, text, name or colour from the reference site | `vision.md` P3 |
| DC-08 | 3D assets are generated in code or CC0, with every file's origin recorded | `CLAUDE.md` §5 |

## 5. Interfaces

- **User interface:** a web browser, desktop or mobile. The pages are described by the
  place-pages, place-menu and ambassador-contest specs, and the hub by world-map and
  map-pins.
- **Software interfaces:**
  - MariaDB 11 through Prisma 7's MariaDB driver adapter, reachable only from
    `lib/places.ts`;
  - no third-party runtime API;
  - WhatsApp is only a link (`wa.me`).
- **Content production (offline, not a runtime interface):** photographs are generated
  with Grok Build from `docs/grok/manifest.jsonl`.

## 6. Logical database requirements

The entities, attributes, constraints and invariants are specified in
[`../architecture/data-model.md`](../architecture/data-model.md). Summary:
- `place` 1—n `experience`;
- `place` 1—n `menu_item`;
- slugs unique per scope;
- `published` flags;
- `position` ordering.

## 7. Verification

Every requirement is verified by at least one of:
- a unit test (`web/tests/`);
- a static check (`npm run check`: layout, assets, types, lint);
- a scripted browser capture (headless Chromium at 1440 and 390 px, with reduced motion
  emulated where relevant).

[`traceability.md`](traceability.md) maps each ID to its verification, and
[`../testing/test-plan.md`](../testing/test-plan.md) describes the approach.
