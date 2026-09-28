## 1. Pure logic (tested first)

- [x] 1.1 `lib/colour.ts` holds WCAG contrast and OKLab distance. Verify with unit tests on known pairs: mist on night is 13.2:1, and Parque Caveiras' old colour is 0.018 from the reference orange-red.
- [x] 1.2 `lib/contest/campaign.ts` holds `campaignStatus(today, phases)` and `nextIdea(index, count)`. Verify with unit tests covering before, inside each phase, between phases and after the end, and that every idea appears once before any repeats.
- [x] 1.3 `lib/menu-layout.ts` holds `pickPrints` (menu photos present, then experiences, then gallery, capped at 5) and `stampedAt(index)`. Verify with unit tests, including a place with no menu photographs.

## 2. Content and data

- [x] 2.1 Move the seed's words into `prisma/content/places.ts` with no side effects, and verify `npm run db:seed` produces the same places as before.
- [x] 2.2 Apply the D3 colours and add `menuTitle` and `menuLede` for all 15 places. Verify with `tests/content.test.ts`: contrast of 4.5:1 or more against mist and 0.08 or more from every reference swatch.
- [x] 2.3 Write `prisma/content/menus.ts` with 9 items per place (name, description, optional tag, photo brief). Verify with the content test: 6 to 12 items, unique slugs, the image path convention, and a non-empty brief.
- [x] 2.4 Add the `menu_item` table and the two `place` columns in the migration `add_place_menu`. Verify that `prisma migrate dev` applies cleanly on the local MariaDB (port 3307) and that the seed writes 135 items.
- [x] 2.5 Add `lib/public-file.ts` and `getPlaceMenu(slug)`. `Place` stays unchanged. Verify that a missing file maps to `null` and that the hub's payload does not change size.

## 3. Shared pieces

- [x] 3.1 Add the `--color-night` and `--duration-deal` tokens, the paper grain utility, and the scroll-driven keyframes behind `@supports` and `no-preference`. Verify that no literal brand hex appears outside `globals.css`.
- [x] 3.2 Give `crestSvg` optional colours and an id suffix, and have `PlaceCrest` use `useId`. Run `build:crests`. Verify that ids are unique on a page with five crests and that the hub card shows the new colours.
- [x] 3.3 Add `lib/smooth-scroll.ts` (pause and resume Lenis) and wire it into `LenisProvider`. Verify the page does not scroll under an open dialog.
- [x] 3.4 Add a stand-in component for a missing photograph. Verify that a page whose menu has no photographs issues no failing image request.

## 4. Place page

- [x] 4.1 Build the pinned hero with a bigger crest, "Role para explorar" and parallax. Verify in a capture that the welcome band slides over the pinned hero, and that nothing scales under emulated reduced motion.
- [x] 4.2 Build the welcome band: the crest across its edge, the name, the facts, and the faded scene with prints. Verify with 1440 and 390 captures.
- [x] 4.3 Rework the ribbon with bunting, a bold loop, the pinhão glyph and the call to action in its own box. Verify the call to action never overlaps the text.
- [x] 4.4 Build the menu block: the ridge, the heading, a flex grid that centres its last row, ticket cards with stamps, and the dialog. Verify keyboard open, Escape close and focus return in the browser, a single column at 390px, and a centred last row with 7 items.
- [x] 4.5 Build the itinerary of experiences. Verify rows alternate at 1440, stack at 390, and link to the experience page.
- [x] 4.6 Restyle the gallery. Verify the fallback still shows the page's pictures when the folder is empty.
- [x] 4.7 Build the postcard share band with the stamp, postmark and fog. Verify copy link, WhatsApp and the share sheet fallback, and that the fog holds still under reduced motion.
- [x] 4.8 Recompose `app/[place]/page.tsx` in the spec's order and fetch the menu. Verify that all 15 place pages render at 1440 and 390 with no horizontal overflow and no WebGL context.

## 5. Contest page

- [x] 5.1 Put the contest copy in `lib/contest/content.ts`: steps, suggestions, 8 ideas, phases, prize with partner slugs, and rules. Verify that every partner slug exists among the places (unit test).
- [x] 5.2 Build the hero with the photo-filled wordmark, ribbon and skyline scene (wheel and UFO). Verify both stop under reduced motion.
- [x] 5.3 Build "Como se candidatar" with the highlights, prints, badges and fictional fine print. Verify there is no form or input on the page.
- [x] 5.4 Build the idea deck with its deal animation and live region. Verify that "Outra ideia" cycles all 8, and that the swap is instant under reduced motion.
- [x] 5.5 Build the calendar with the trail, the stops and the "Agora" / "A seguir" / "Encerrado" marking, with `revalidate = 3600`. Verify that on 2026-09-28 the first phase reads "Agora".
- [x] 5.6 Build the prize (photo, partner links, sash) and the rulebook. Verify the partner links navigate and the rulebook's first item says the contest is fictional.
- [x] 5.7 Add the page's metadata and social image. Verify that `/embaixador` has its own title and description.

## 6. Navigation and footer

- [x] 6.1 Add the "Embaixador" link to the header, wide and narrow. Verify it is reachable at 390px from the menu panel.
- [x] 6.2 Move the footer to night, with the big wordmark and the contest card. Verify its contrast with the colour helpers and a link to `/embaixador`.

## 7. Image briefs and tooling

- [x] 7.1 Add `scripts/write-image-prompts.ts` (`npm run images:prompts`), which writes `docs/grok/manifest.jsonl` (missing photos only) and the menu section of `docs/image-prompts.md`. Verify there is one line per missing photograph, each with path, aspect and prompt.
- [x] 7.2 Add the contest page's briefs (two people, one hamper) to the manifest. Write `docs/grok/README.md` with the single instruction for Grok Build. Verify the file lists the command and the sharpen step.
- [x] 7.3 Extend `images:sharpen` to the `menu` and `contest` folders, converting PNG and JPEG to WebP. Verify on a sample PNG in the scratchpad.
- [x] 7.4 Extend `check:assets` to report thin menus without failing on them. Verify it prints the count per place.

## 8. Close

- [x] 8.1 Capture a place page and the contest page top to bottom at 1440 and 390, and compare them against the reference captures for rhythm and density. Verify the place page height is at least 8,000px with a full menu. *Measured 7,670 to 8,978px at 1440 (the reference is 8,487). The six places with a single experience end below 8,000, because their itinerary has one stop. The target was a proxy for density and is not met for those pages.*
- [x] 8.2 Update `docs/architecture.md` (menu, contest, colour rules, night token) and the design notes. Verify the docs name the new files.
- [x] 8.3 Run `npm test`, `npm run check` and `npm run build`. Verify all pass.
