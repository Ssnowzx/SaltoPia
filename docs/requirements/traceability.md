# Saltopia — Requirements Traceability Matrix

| | |
| --- | --- |
| Document | Requirements traceability matrix (ISO/IEC/IEEE 29148 §5.2.8, bidirectional) |
| Version | 1.1, 2026-10-07 (FR-65 to FR-67, NFR-01) |
| Related | [`srs.md`](srs.md) · [`../testing/test-plan.md`](../testing/test-plan.md) |

Each row traces an SRS requirement in two directions:
- **back** to the need (vision objective or feature) and to its specification (OpenSpec
  capability);
- **forward** to its verification.

**Verification methods**
- **U** — unit test in `web/tests/` (runs with `npm test`)
- **S** — static check: `check:layout`, `check:assets`, `tsc`, `lint` (runs with
  `npm run check`)
- **B** — scripted browser verification in headless Chromium at 1440 and 390 px (reduced
  motion emulated where relevant). Each run is recorded in its change's `tasks.md`. The
  scripts are not yet in the repository; see test plan §10.
- **R** — code review against the rule

## Functional requirements

| ID | Need | Specification (change / capability) | Verification | Status |
| --- | --- | --- | --- | --- |
| FR-01 | BO-1, FE-1 | add-serranopolis-experience / world-map | B | ✅ |
| FR-02 | FE-1 | add-serranopolis-experience / world-map | B | ✅ |
| FR-03 | FE-1 | add-serranopolis-experience / world-map | B | ✅ |
| FR-04 | FE-1 | add-serranopolis-experience / world-map | B (normal and reduced motion) | ✅ |
| FR-05 | FE-1 | add-serranopolis-experience / world-map | U `dwellings`, `groves`, `noise`, `road-junctions`; S `check:layout` | ✅ |
| FR-06 | FE-1 | world-map (as modified by add-walking-character) | B | ✅ |
| FR-07 | FE-1 | add-serranopolis-experience / world-map | B (1440 and 390) | ✅ |
| FR-08 | FE-1 | add-serranopolis-experience / map-pins | B | ✅ |
| FR-09 | FE-1 | add-serranopolis-experience / map-pins | B | 🟡 |
| FR-10 | FE-1 | add-serranopolis-experience / map-pins | B | ✅ |
| FR-11 | BO-2, FE-1 | add-serranopolis-experience / map-pins | B | ✅ |
| FR-12 | FE-1 | add-serranopolis-experience / map-pins | B (keyboard) | ✅ |
| FR-13 | FE-1 | add-serranopolis-experience / map-pins | B | ✅ |
| FR-14 | FE-1 | add-serranopolis-experience / map-pins | B | ✅ |
| FR-15 | FE-2 | add-serranopolis-experience / page-transitions | B | ✅ |
| FR-16 | FE-2 | add-serranopolis-experience / page-transitions | B | ✅ |
| FR-17 | FE-2 | add-serranopolis-experience / page-transitions | B (reduced motion) | ✅ |
| FR-18 | BO-2, FE-2 | place-pages (as modified by elevate-place-pages) | U `menu-layout` (prints, gallery layout); B (15 pages, 1440/390, no WebGL, no failed request) | ✅ |
| FR-19 | BO-2, FE-2, DC-07 | place-pages (as modified by elevate-place-pages) | U `content` (accent contrast and distance), `colour` | ✅ |
| FR-20 | FE-2 | add-serranopolis-experience / place-pages | B | ✅ |
| FR-21 | FE-2, FE-3 | place-pages (as modified by elevate-place-pages) | B | ✅ |
| FR-22 | FE-3 | add-serranopolis-experience / place-pages | B | ✅ |
| FR-23 | FE-2 | add-serranopolis-experience / place-pages | B (reduced motion: nothing left hidden) | ✅ |
| FR-24 | FE-2 | place-pages (as modified by elevate-place-pages) | B (390: contest link reachable) | ✅ |
| FR-25 | FE-2 | add-serranopolis-experience / place-pages | B | ✅ |
| FR-26 | FE-2 | elevate-place-pages / place-pages | B (pinned; reduced motion: no scaling) | ✅ |
| FR-27 | FE-2 | elevate-place-pages / place-pages | B | ✅ |
| FR-28 | BO-2, FE-2 | elevate-place-pages / place-menu | U `content` (every place has 6–12 items, heading, lede); S seed count | ✅ |
| FR-29 | FE-2 | elevate-place-pages / place-menu | U `menu-layout` (stamps); B (390: one column) | ✅ |
| FR-30 | FE-2 | elevate-place-pages / place-menu | B (keyboard open, Esc, focus returns, page does not scroll) | ✅ |
| FR-31 | FE-2 | elevate-place-pages / place-menu | S `check:assets` (counts); B (no failed request) | ✅ |
| FR-32 | FE-7 | elevate-place-pages / place-menu | U `content` (brief present); `npm run images:prompts` | ✅ |
| FR-33 | FE-4 | add-walking-character / walk-mode | B | ✅ |
| FR-34 | FE-4 | add-walking-character / walk-mode | B | ✅ |
| FR-35 | FE-4 | add-walking-character / walk-mode | U `walk` ("walking"); B | ✅ |
| FR-36 | FE-4 | add-walking-character / walk-mode | U `walk` (water's edge, slide along a wall), `occupancy` | ✅ |
| FR-37 | FE-4 | add-walking-character / walk-mode | B | ✅ |
| FR-38 | FE-4 | add-walking-character / walk-mode | U `walk` (routes, arrival areas); B | ✅ |
| FR-39 | FE-4 | add-walking-character / walk-mode | B | ✅ |
| FR-40 | FE-4 | add-walking-character / walk-mode | B | ✅ |
| FR-41 | FE-4 | add-living-townsfolk / townsfolk | B | ✅ |
| FR-42 | FE-4 | add-living-townsfolk / townsfolk | U `townsfolk` (plans, strolling) | ✅ |
| FR-43 | FE-4 | add-living-townsfolk / townsfolk | U `townsfolk` (stop, face, wave) | ✅ |
| FR-44 | FE-4 | add-living-townsfolk / townsfolk | U `townsfolk` (reduced motion) | ✅ |
| FR-45 | FE-4 | add-living-townsfolk / townsfolk | B (model requests aborted) | ✅ |
| FR-46 | FE-1 | elevate-world-realism / world-appearance | B | ✅ |
| FR-47 | FE-1 | elevate-world-realism / world-appearance | B | ✅ |
| FR-48 | FE-1 | elevate-world-realism / world-appearance | U `planar-reflection`; B | ✅ |
| FR-49 | FE-1 | elevate-world-realism / world-appearance | U `noise`; B | ✅ |
| FR-50 | FE-1 | elevate-world-realism / world-appearance | U `road-junctions`; B | ✅ |
| FR-51 | FE-1 | elevate-world-realism / world-appearance | U `dwellings`; B | ✅ |
| FR-52 | FE-1 | elevate-world-realism / world-appearance | U `groves`; B | ✅ |
| FR-53 | FE-1 | world-appearance (as modified by add-living-townsfolk) | S `check:layout`; U `occupancy`, `walk` | ✅ |
| FR-54 | FE-1, NFR-03 | world-appearance (as modified by add-living-townsfolk) | B (network inspection) | ✅ |
| FR-55 | FE-1 | elevate-world-realism / world-appearance | B (reduced motion) | ✅ |
| FR-56 | BO-3, FE-5 | elevate-place-pages / ambassador-contest | B (all sections, 390 without overflow) | ✅ |
| FR-57 | FE-5, NFR-08 | elevate-place-pages / ambassador-contest | U `contest-content` (rulebook opens with "fictional"); B (no form, no input) | ✅ |
| FR-58 | FE-5 | elevate-place-pages / ambassador-contest | U `campaign` (deck order); B (8 distinct, then repeat) | ✅ |
| FR-59 | FE-5 | elevate-place-pages / ambassador-contest | U `campaign` (status for each date, Lages time zone); B ("Agora" on 2026-09-28) | ✅ |
| FR-60 | BO-2, FE-5 | elevate-place-pages / ambassador-contest | U `contest-content` (partners are places); B | ✅ |
| FR-61 | FE-5 | elevate-place-pages / ambassador-contest | B (reduced motion: wheel and UFO still) | ✅ |
| FR-62 | BO-3, FE-5 | add-contest-invitation / contest-invitation | U `invitation`; B (fresh sessions, `?convite`, contest page) | ✅ |
| FR-63 | FE-5 | add-contest-invitation / contest-invitation | U `invitation` (blocked); B (place card opened first) | ✅ |
| FR-64 | FE-5 | add-contest-invitation / contest-invitation | B (Esc, backdrop, "Agora não", the CTA's destination, reduced motion) | ✅ |
| FR-65 | FE-1 | speed-up-the-hub / world-map | U `tree-detail` (triangle counts, outline within 5% of height, near full and far simple, no switch inside the margin, packing); B (2x captures before and after: walk view pixel-identical, wide shot and zoom ≤ 1.2% of pixels changed) | ✅ |
| FR-66 | FE-4 | speed-up-the-hub / walk-mode | U `walk-preparation` (grid in slices equals the grid at once, a slice stops at its first check, an early call completes it, idle runner), `walk-world-slices` (open places read in slices as at once, an early call completes the world); B (first entry: longest frame 67 ms in development, 17 ms in production) | ✅ |
| FR-67 | FE-4 | speed-up-the-hub / walk-mode | U `character-animation` (a second rig with the same bones is posed, a new person starts at full weight, disposal frees the bindings); B (after picking two other people the thigh bone turns while walking) | ✅ |

## Non-functional requirements

| ID | Specification | Verification | Status |
| --- | --- | --- | --- |
| NFR-01 | world-map / Performance budget | B (production builds, vsync on, with and without the CPU throttled 4x, every tier; an unpinned run under heavy throttle steps high → medium → low with the canvas still drawing and no GL error); not yet measured on target hardware | 🟡 |
| NFR-02 | world-map / Performance budget | R (`dpr` capped per quality tier) | ✅ |
| NFR-03 | world-map / Loading; world-appearance | B (network inspection) | ✅ |
| NFR-04 | design-system / Palette tokens | U `colour`, `content`, `palette` (partial set of pairings) | 🟡 |
| NFR-05 | design-system / Motion contract | B (reduced motion on hub, pages and contest) | ✅ |
| NFR-06 | map-pins, place-menu, contest-invitation | B (keyboard) | ✅ |
| NFR-07 | place-pages, world-map | B (`scrollWidth − innerWidth = 0` at 390 px on every page) | ✅ |
| NFR-08 | ambassador-contest | B (no form or input); R (no network write) | ✅ |
| NFR-09 | place-menu, townsfolk, place-pages | B (stand-ins, aborted model requests) | ✅ |
| NFR-10 | walk-mode | R (`try/catch` on every storage access) | ✅ |
| NFR-11 | world-map / Fallback | — | ⛔ |
| NFR-12 | `CLAUDE.md` §4 | S `tsc --noEmit` (strict), `eslint`; R | ✅ |
| NFR-13 | `CLAUDE.md` §3 | R (only `lib/places.ts` imports the Prisma client) | ✅ |
| NFR-14 | `CLAUDE.md` §6 | U with coverage (`npm run test:coverage`) | ✅ |
| NFR-15 | `CLAUDE.md` §3 | R | ✅ |

## Backward view: needs without coverage

- Every business objective BO-1 to BO-3 and every initial-release feature FE-1 to FE-7 has
  at least one requirement above.
- BO-4 (a paid product) and FE-8 to FE-11 are later releases, and deliberately have no
  requirement yet.
