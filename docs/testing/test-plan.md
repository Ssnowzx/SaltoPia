# Saltopia — Test Plan

| | |
| --- | --- |
| Document | Test plan, structured after ISO/IEC/IEEE 29119-3 (test plan and test completion report, condensed) |
| Version | 1.1, 2026-10-07 (performance level and the `speed-up-the-hub` report) |
| Related | [`../requirements/srs.md`](../requirements/srs.md) · [`../requirements/traceability.md`](../requirements/traceability.md) |

## 1. Scope

**In scope:**
- the pure logic of the world, walk mode, colour, content, menus and the contest;
- the content itself;
- the layout of the 3D world;
- the assets the database points at;
- the behaviour of the hub and the pages in a browser.

**Out of scope for this release:**
- load testing (there is no server-side workload beyond static pages);
- security testing (there is no input, account or write path);
- cross-browser testing beyond Chromium. Firefox and Safari are expected to degrade as
  designed, for example without scroll-driven animation.

## 2. Test items

| Item | Location |
| --- | --- |
| Pure logic modules | `web/src/lib/` (`world/`, `walk/`, `contest/`, `colour.ts`, `menu-layout.ts`) |
| Content | `web/prisma/content/`, `web/src/lib/contest/content.ts` |
| Design tokens | `web/src/app/globals.css` |
| World layout | `web/src/lib/world/neighborhood-layout.ts` and its builders |
| Database content and assets | MariaDB after `npm run db:seed`, and `web/public/images/` |
| The running application | `npm run dev` on port 3001 |

## 3. Approach, by level

| Level | Technique | Tool | Command |
| --- | --- | --- | --- |
| Unit | Pure functions tested in isolation. Arrange–act–assert, one behaviour per test, names start with "should", no mocks of our own code | Node's test runner through `tsx` | `npm test` |
| Unit coverage | Line, branch and function coverage of the modules under test | Node's built-in coverage | `npm run test:coverage` |
| Static | Type checking (`strict`), linting, layout invariants of the world, asset existence | `tsc`, ESLint, `scripts/check-layout.ts`, `scripts/check-assets.ts` | `npm run check` |
| Content | Colour rules, menu completeness and lengths, slugs, briefs, contest partners and phases, run as unit tests over the content modules | as unit | `npm test` |
| Integration | Schema and seed applied to a real MariaDB (no mocked database, per `CLAUDE.md` §6) | Prisma migrate, seed | `npx prisma migrate dev`, `npm run db:seed` |
| System (browser) | Scripted runs of every page at 1440×900 and 390×844: HTTP status, no WebGL context on pages, no horizontal overflow, no failed request, keyboard flows, reduced motion emulated, the invitation across fresh sessions | Playwright driving Chromium; Chrome with GPU for the hub | recorded per change in `tasks.md` |
| Build | Production build of every static route | `next build` | `npm run build` |
| Performance (browser) | Frame rate and missed frames of the production build at 1920×1080: vsync on, with and without the CPU throttled 4x, each tier pinned and then unpinned. Parts of the scene are switched off in the page to price them. The original build runs beside the new one from a worktree of `HEAD`, for the comparison | Playwright driving Chrome with the Metal GPU, Chrome DevTools Protocol for the throttle | recorded in the change's `design.md` |

**Principle:** anything that can be decided without a browser is a pure function and gets
a unit test. A 3D component is not tested by screenshot. The function it uses is tested
instead.

**Measuring speed:** judge a stutter with vsync on. With vsync and the frame-rate limit off,
the GPU queue fills and empties in a `9 25 2 3 9` pattern that reads as stutter and is
not. Uncapped runs only measure average throughput.

## 4. Pass/fail criteria

- **Unit and content tests:** every test passes.
- **Static checks:** `tsc` and ESLint report nothing; `check:layout` and `check:assets`
  print `OK`. Thin galleries and menus are reported, not failed.
- **Browser checks:**
  - every page returns 200 (404 for an unknown address);
  - a page creates no WebGL context;
  - `scrollWidth − innerWidth` is 0 at both widths;
  - no request fails;
  - each keyboard flow and reduced-motion expectation in the traceability matrix holds.
- **Coverage:** line coverage of the modules under test is at least 80% (`CLAUDE.md` §6).

## 5. Entry and exit criteria

**Before implementation:** `openspec validate <change>` passes.

**Before every commit** (`CLAUDE.md` §7 and the global rules):
- `npm test`, `npm run lint` and `npx tsc --noEmit` are clean (the last after
  `npm run build`, which generates the route types);
- there is no `console.log` in application code.

**Before every push:**
- `git pull origin main`;
- the checks above;
- `npm run check` and `npm run build`.

**A change is complete** when every task in its `tasks.md` is checked and its stated
verification has been run.

## 6. Test environment

- **Machine:** macOS on Apple silicon, Node 20, Docker Desktop.
- **Services:** MariaDB 11.4 in Docker on port 3307; Next.js dev server on 3001.
- **Headless runs:** Playwright's Chromium. **Hub runs** use installed Chrome with the Metal
  GPU (`--use-angle=metal`), because the software renderer is too slow to capture the
  canvas.
- **Automatic quality:** tested without `?quality=`, because a pinned tier never changes.

## 7. Deliverables

- The unit tests in `web/tests/` (20 files).
- The check scripts in `web/scripts/`.
- The browser verification results, recorded as checked tasks with their observations in
  each change's `tasks.md` and `design.md` implementation notes.
- The traceability matrix.
- This plan and its completion report (§9).

## 8. Responsibilities

The development team writes the tests with the code, in the same change. The OpenSpec
tasks name the verification for each task before it is implemented.

## 9. Test completion report (2026-09-28)

| Measure | Result |
| --- | --- |
| Unit tests | **83 of 83 pass** (15 files) |
| Line coverage, modules under test | **96.8%** |
| Branch coverage, modules under test | **92.2%** |
| Function coverage, modules under test | **66.6%**. Below the 80% target: many builders expose small factory functions that only the 3D scene calls |
| `npm run check` | layout OK, assets OK (55 files), `tsc` clean, ESLint clean |
| `npm run build` | 48 static routes generated |
| Browser: 15 place pages at 1440 px, 5 pages at 390 px, contest at 1440 and 390 | all 200, no WebGL on pages, no overflow, no failed request |
| Browser: menu dialog, keyboard | opens with Enter, closes with Esc, focus returns, page does not scroll |
| Browser: invitation | once per session; not on the contest page; waits for a place card; `?convite` forces it; reduced motion: no animation |
| Browser: reduced motion | no hero, print, fog, wheel or UFO animation; no section left hidden |
| Requirements verified | 63 of 64 FR ✅, 1 partial (FR-09) · 12 of 15 NFR ✅, 2 partial (NFR-01, NFR-04), 1 not built (NFR-11) |

"Modules under test" are the files the unit tests load. Components, `lib/places.ts`
(database) and `lib/public-file.ts` (file system) are covered by the browser runs, not by
unit tests.

### 9.1 Update for `speed-up-the-hub` (2026-10-07)

| Measure | Result |
| --- | --- |
| Unit tests | **107 of 107 pass** (20 files; new: `character-animation`, `walk-preparation`, `walk-world-slices`, `tree-detail`, `skeletons`) |
| Line, branch and function coverage | **96.9%**, **92.1%**, **71.4%** |
| Mutation check | Removing the bind-matrix fold from `shareSkeleton` makes its test fail (vertices off by 255 units) |
| Refactors that must not change a vertex | All 59 models hash identically before and after the builders' change; the faster prop reading gives byte-identical cells for all 14 open places |
| Browser: frozen legs | After picking two other people the character's thigh bone turns while it walks (it stood still before) |
| Browser: first entry of walk mode | Longest frame 17 ms in production and 67 ms in development; before, 1.0-1.2 s, and 4.25 s with the CPU throttled 4x in development |
| Browser: trees | 2x captures before and after: walk view pixel-identical; wide shot and aimed zoom ≤ 1.2% of pixels changed, all on trees beyond 200 m |
| Browser: production, vsync on, M5 | Every tier 60 fps idle, in flight and on foot (high held 46 fps before). CPU throttled 4x: high 48 fps from the air (34 before), low 60 |
| Browser: tier change | Unpinned under heavy throttle: high → medium → low, canvas still drawing, no GL error |

## 10. Risks and contingencies

| Risk | Contingency |
| --- | --- |
| The browser verification scripts are not in the repository, so another person cannot re-run them | Move them into an end-to-end suite (Playwright as a dev dependency, `web/tests/e2e/`) as its own OpenSpec change |
| Function coverage is below 80% | Test the scene-facing factories in `lib/world/` through their outputs |
| Performance has not been measured on the presentation machine | Run the hub unpinned on integrated graphics before the presentation; the quality tiers are the fallback. The M5 numbers in §9.1 are the reference to compare against |
| No fallback without WebGL | Open item NFR-11. Until it is built, the presentation machine is checked for WebGL2 in advance |
