## Context

See proposal.md for the motivation. The current state matters for three reasons:

- **Most of a place page's words live in the seed, and its pictures on disk.** Words sit in
  `prisma/seed.ts` as one 336-line module that runs on import. Photographs are files at
  conventional paths. The gallery folders are empty: the 90 gallery briefs in
  `docs/image-prompts.md` were never generated. Each page therefore shows its hero plus one
  to three experience crops.
- **`Place` reaches the hub.** `getPlaces()` feeds the hub's pins and cards, and it is
  serialised into the hub's payload. Anything added to `Place` travels to the map.
- **The specs this change modifies (`place-pages`, `design-system`) belong to
  `add-serranopolis-experience`**, which is still unarchived at 66/72. As with
  `add-living-townsfolk`, the deltas here are written against those requirements and are
  archived after it.

The reference was measured on 2026-09-28 in headless Chromium at 1440x900, after closing
its contest popup:

- smithfield-square is 8,487px tall:
  - a pinned 800px hero (`pin-spacer`);
  - a 1,392px welcome band on `#FEF2DF` whose crest carries on from the hero, over a sepia
    street illustration;
  - an 88px ribbon;
  - a 4,759px recipe block on `#C04C2E` with 19 ticket cards in three columns (416px wide,
    a 368px image inset, the last card centred), a round badge stamped on some cards;
  - a 641px mint `#CDE8DE` postcard band;
  - a 789px footer that sells the contest.
- mayor-of-meatopia is 5,591px tall: a cream hero with a photo-filled wordmark and flat
  silhouettes, a deep green `#0C5A50` band with a diagonal edge ("How to run"), a fanned
  three-card deck with "Get another idea", a calendar of three pennants with a "Right now"
  arrow, and a prize band.

None of this change touches WebGL. The place pages and the contest page create no 3D
context, so the 8 MB 3D budget and the DPR cap do not apply. The mobile fallback is the
page itself at 390px.

## Goals / Non-Goals

**Goals:**
- A place page that holds 8,000px or more of varied bands and carries 15 or more pictures
  once the menu photographs exist, and still reads complete before they do.
- The owner can generate every missing photograph from one manifest, and each photograph
  appears with no change to code.
- Every colour on the new surfaces is a token or a place colour, and none repeats the
  reference.

**Non-Goals:**
- Changing `Place` or anything the hub serialises.
- Adding a scroll animation library. GSAP is already in the bundle, but these pages do not
  need it: see D4.

## Decisions

### D1 - A menu is a table; its heading lives on the place

The migration adds `menu_item`:

| Column | Type |
| --- | --- |
| `id` | Int, primary key |
| `slug` | VarChar(96) |
| `name` | VarChar(120) |
| `description` | VarChar(240) |
| `tag` | VarChar(32), nullable |
| `image` | VarChar(255) |
| `place_id` | foreign key to `place`, cascade on delete |
| `position` | Int |
| `published` | Boolean |
| `created_at`, `updated_at` | timestamps |

`(place_id, slug)` is unique, as for experiences. `place` gains `menu_title`
(VarChar(80)) and `menu_lede` (VarChar(240)).

Both heading columns sit on `place` rather than in a `menu` table: a place has exactly one
menu, and a one-to-one table would only add a join.

The domain type is separate from `Place`:

```ts
interface MenuItem { slug; name; description; tag: string | null; image: string | null }
interface PlaceMenu { title; lede; items: readonly MenuItem[] }
```

`getPlaceMenu(slug)` in `lib/places.ts` returns it. The place page calls it next to
`getPlaceBySlug`. `Place` does not change, so the hub's payload does not grow by 135 items.

*Alternative considered:* a `menu` field on `Place`. Rejected, because `getPlaces()` would
carry every menu to the map.

### D2 - A photograph's path is stored; its presence is read at render

`image` holds `/images/menu/<place>/<item>.webp`, the same way `experience.image` does, so
that `check:assets` and the manifest read one field.

`getPlaceMenu` maps a path to `null` when the file is not in `public/`. The check goes
through `lib/public-file.ts` (`server-only`, `existsSync`). Its result is memoised in
production builds and read fresh in development, so a file dropped in during
`npm run dev` shows on the next reload.

A `null` image renders the stand-in (D8). The stand-in is not an `<img>`, so a missing
photograph causes no request at all, let alone a 404.

The welcome prints and the contest page's photographs go through the same helper.

### D3 - Place colours and the night token

The OKLab distance is measured to the reference swatches. Contrast is measured against
mist `#F6EFE2`.

| Place | Was | Now | Distance | Contrast |
| --- | --- | --- | --- | --- |
| praca-do-pinhao | `#1f6068` (0.043) | `#6b3424` pinhão | 0.150 | 8.6 |
| galpao-do-fogo | `#a8442f` (0.053) | `#3d2c25` carvão | 0.146 | 11.6 |
| bosque-das-araucarias | `#24443a` (0.070) | `#263a2e` | 0.104 | 10.6 |
| ctg-porteira-do-tropeiro | `#8a5426` | `#7f4b20` couro | 0.128 | 6.3 |
| estacao-velha | `#3f5c6b` (0.066) | `#4f5873` ardósia | 0.094 | 6.2 |
| pousada-da-geada | `#44718c` | `#3f6886` geada | 0.105 | 5.2 |
| fazenda-do-cedro | `#a8722a` (3.6:1) | `#8a5c1c` ocre | 0.108 | 5.1 |
| fazenda-santa-barbara | `#98553a` (0.075) | `#566227` erva-mate | 0.096 | 5.8 |
| fazenda-dos-pinheiros | `#2f5b43` (0.030) | `#2a3a1c` musgo | 0.110 | 10.7 |
| parque-caveiras | `#c0432f` (0.018) | `#a3325f` framboesa | 0.117 | 5.8 |
| deck-do-lago | `#136f78` | `#1d5a8a` lago | 0.100 | 6.4 |
| ovni-porto | `#413f7c` | `#4b2f7a` violeta | 0.172 | 9.2 |

Mirante `#565a91`, vinícola `#7b2d3f` and salto `#2a6a86` stay as they are.

The reference swatches are `#C04C2E`, `#E75B37`, `#0C5A50`, `#00A08A`, `#CDE8DE`,
`#FEF2DF` and `#F9A825`. A test holds every place to at least 0.08 from each and at least
4.5:1 against mist, so a future colour cannot drift back.

`--color-night: #1F2346` is the deep surface of the content pages. Mist on night is 13.2:1
and gold on night is 7.6:1. The content footer moves from araucária to night.

Crests on the content pages take the place colour: the disc is the accent and the ring is
`--place-deep`. `crestSvg` accepts optional colours and an id suffix. The suffix comes
from `useId`, because one page now draws a place's crest up to five times and the
`textPath` ids must stay unique. `npm run build:crests` rewrites the files with the same
colours, so the hub's card matches the page it opens.

### D4 - Scroll motion is CSS, scroll-driven

The pinned hero is `position: sticky; top: 0; height: 100svh` inside a wrapper. Every band
after it is `position: relative; z-index: 1` with an opaque ground, so the page slides over
the hero, which is the reference's pin-spacer effect with no script.

The parallax uses scroll-driven CSS animations with `animation-timeline: view()` or
`scroll()` and `animation-timing-function: linear`. It is declared inside
`@supports (animation-timeline: view())` and
`@media (prefers-reduced-motion: no-preference)`:

- hero photograph: `scale(1)` to `scale(1.12)` over the first 100svh;
- hero crest and title: `translateY(0)` and `opacity: 1` to `translateY(-14vh)` and
  `opacity: 0` over the same range;
- welcome prints: `translateY(48px)` to `translateY(-48px)` across the print's time in
  view. Each print gets its own range (`--drift` of 32/48/64px), so they separate.

Where the feature is not supported (Firefox without its flag, Safari before 26) the page
is static and complete.

*Alternative considered:* GSAP ScrollTrigger with scrub. Rejected because it needs Lenis
wiring, runs on the main thread, and would be the only ScrollTrigger on the site. CSS does
the same with no script.

Reveals keep the existing `Reveal` component (700ms, `--ease-ui`). Cards inside a revealed
section stagger through `[data-stagger]` and `--i`, using
`transition-delay: calc(var(--i) * 70ms)` with at most 8 steps, so a nine-card grid finishes
within about 1.3s.

### D5 - The welcome band: a faded place, with prints scattered over it

The crest (160px, 112px on phones) sits centred with `translate-y-[-50%]` across the top
edge of the band, where the hero's crest left off. Below it, in order:
- "Bem-vindo a" in Yellowtail at 40px;
- the name in Figtree 800, uppercase, `clamp(40px, 6vw, 80px)`, in `--place-ink`;
- the tagline in bold;
- the description (18px, maximum width 720px);
- four facts as chips with glyphs.

Under the text sits a 720px scene:
- the hero photograph, `grayscale(1) sepia(0.3)` at 0.5 opacity with `multiply` over
  `--place-veil`, masked by `linear-gradient(to bottom, transparent, #000 35%)` so that it
  rises out of the paper;
- up to five prints: white 10px borders, a 44px bottom margin with the caption in Yellowtail
  at 22px, and a strip of translucent tape;
- rotations taken from a fixed table, `[-7, 4, -3, 6, -5]` degrees.

The prints are chosen by `pickPrints(menu, experiences, gallery, 5)` in this order: menu
photographs present, experience photographs, gallery. They are `aria-hidden`, because the
same pictures are in the menu and itinerary with proper text.

*Alternative considered:* cut-out product photographs like the reference's packshots.
Rejected, because the generator cannot give reliable transparency, and prints are a motif
of our own.

### D6 - The ribbon: bunting over the band

The band is `--place-deep` and 88px tall. Its top edge is a row of triangular pennants
(bandeirinhas) drawn in inline SVG in accent, gold and mist, a festa motif of the Serra.

The loop repeats the tagline in Figtree 800, uppercase, 30px, with a pinhão glyph between
repeats. It keeps the existing 38s linear loop and its reduced-motion stop.

The call to action stands in a mist box at the right edge, outside the moving strip, as in
the reference. The text never runs under the button.

### D7 - The menu block

- **Above the block:** a 120px ridge in the accent, a single inline SVG path of hills with
  seven araucárias. It uses `viewBox="0 0 1440 120"` and `preserveAspectRatio="none"`, and
  only the hills stretch (the trees are separate `<use>` elements positioned in
  percentages).
- **Heading:** the kicker in Yellowtail (`--place-wash`), `menu_title` in Figtree 800,
  uppercase, `clamp(36px, 5vw, 64px)`, in mist, and `menu_lede` at 18px/600.
- **Layout:** a flex grid (`flex-wrap`, `justify-center`, `gap-8`) with the basis at
  `calc((100% - 2 * 2rem) / 3)` from `lg`, `calc((100% - 2rem) / 2)` from `sm` and 100%
  below. It is a flex grid rather than a CSS grid so that a short last row centres itself
  (spec: place-menu).
- **Card:**
  - a mist ground with an SVG paper grain at 6%;
  - a 16px inset photograph with a 12px radius, aspect 4/5;
  - the existing `.ticket-perforation` with its notches in `--ticket-ground`;
  - the name in Figtree 800, uppercase, 18px, in `--place-ink`, then the description at
    14px/400 and a tag pill.
- **Stamp:** a crest stamp, 76px and rotated -12deg, overlapping the photograph's top-right
  corner on every card where `index % 3 === 1`.
- **Hover:** `translateY(-6px) rotate(-0.6deg)` over `--duration-hover` with `--ease-ui`,
  and the photograph scales to 1.05 over 500ms.
- **Larger view:** a native `<dialog>` opened with `showModal()`, which gives the focus
  trap, Escape and the top layer. `::backdrop` is `color-mix(night 72%)`. Clicking the
  backdrop closes it. Closing restores focus explicitly to the opener, because focus
  return varies between browsers. The dialog animates `scale(0.96)` and `opacity: 0` to
  rest over `--duration-panel` with `--ease-ui`, and does not animate under reduced
  motion. Scroll is locked with `html:has(dialog[open]) { overflow: hidden }` plus
  `pauseSmoothScroll()` / `resumeSmoothScroll()` from a small module holding the Lenis
  instance, because Lenis would otherwise keep scrolling the page under the dialog.

### D8 - The stand-in

For an item with no photograph:
- a `--place-veil` ground;
- a repeating pinhão glyph pattern at 7% as a CSS `mask` of an inline SVG data URI in
  accent;
- the place crest at 42% width, centred;
- the item's name in Yellowtail at 24px underneath;
- a small caption: "Foto em breve".

It fills the same box as the photograph, so the card does not change height when the photo
arrives.

### D9 - The itinerary

The band is `--place-wash`. The heading is "O que fazer" in Yellowtail followed by
"Experiências" in Figtree 800.

Each stop is a row, `md:grid-cols-[1.15fr_1fr]`, reversed on even rows:
- the photograph at aspect 4/3 with the card radius and a gold offset frame
  (`box-shadow: 14px 14px 0 var(--color-gold)`);
- then the number as a 96px Figtree 800 outline (`-webkit-text-stroke: 2px`, accent, no
  fill), the kind pill, the duration, the name at 32px/800, the description at 18px, and a
  button, "Ver experiência".

The rows stack on phones. `/experiencias` keeps its ticket cards.

### D10 - The postcard

The band is `color-mix(in srgb, var(--color-frost) 38%, var(--color-mist))`, crossed by
three blurred fog ellipses:
- `filter: blur(28px)`, white at 55%;
- a 60s linear infinite drift of `translateX(-6%)` to `translateX(6%)`;
- still under reduced motion.

On the left:
- "Leve alguém junto" in Yellowtail;
- "Compartilhe {name}" in Figtree 800;
- the three share buttons, as they already work.

On the right, the postcard:
- 3:2 on mist, rotated 3deg, `box-shadow: 0 30px 60px` night at 25%;
- 62% of it is the hero photograph, with "Lembranças de" in Yellowtail and the name in
  Figtree 800 over its lower-left corner;
- the other side carries a stamp (the crest inside a square with perforated edges made by
  a `radial-gradient` mask), a round postmark in SVG ("LAGES · SC", "SALTOPIA" and today's
  date as DD.MM.AAAA, with three wavy cancel lines), a handwritten line in Yellowtail
  ("Guardei um lugar pra você.") and three ruled address lines.

Everything is drawn in code, so no generated image has to spell anything.

### D11 - Footer and header

The footer is `--color-night`. Its top row is the wordmark at 96px tall. Below it, the
existing three columns plus a contest card:
- "Saltopia precisa de você" in Yellowtail;
- "Seja embaixador" in Figtree 800;
- one sentence;
- a gold button to `/embaixador`.

The header gains "Embaixador" as a script link after "Experiências" on wide viewports and a
row in the narrow panel. The primary call to action stays "Planejar visita".

### D12 - The contest page

It is a server page at `app/embaixador/page.tsx`, `revalidate = 3600`, so the calendar's
marking follows the viewing date within an hour. Its palette is night, wine, gold, mist and
frost. It has no teal and no orange-red.

1. **Hero** on a mist ground:
   - "Candidate-se a" in Yellowtail, wine, 44px;
   - the wordmark "EMBAIXADOR" in Figtree 800, `clamp(56px, 13vw, 208px)`,
     `letter-spacing: -0.02em`, filled with `/images/heroes/salto-caveiras.webp` through
     `background-clip: text`, with `-webkit-text-stroke: 3px` night and a night duplicate
     layer offset 6px/6px behind;
   - "DE SALTOPIA" on a wine ribbon with notched ends
     (`clip-path: polygon(0 0, 100% 0, 97% 50%, 100% 100%, 0 100%, 3% 50%)`);
   - the headline "Um ano de Serra na sua mesa" in Figtree 800, `clamp(28px, 4vw, 48px)`,
     wine;
   - a one-line lede;
   - the scene, an inline SVG skyline in night: hills, araucárias, the chapel, the Ferris
     wheel turning 360deg in 40s linear infinite, and the UFO crossing
     `translateX(-10vw)` to `translateX(10vw)` in 28s ease-in-out infinite alternate with
     a 3s bob. Both stop under reduced motion.
2. **Como se candidatar** on night, entering through the ridge edge from D7 in night:
   - "Como se" in Yellowtail, frost, then "CANDIDATAR" in Figtree 800 at 96px;
   - the steps, with key words on a gold marker highlight
     (`background: linear-gradient(transparent 55%, gold 55%)`);
   - five suggestions;
   - `#EmbaixadorDeSaltopia` and `@saltopia` as highlighted chips;
   - two tilted prints of people at -5deg and 4deg with camera and video badges drawn in
     SVG (no platform logos);
   - the fine print, which says the contest is fictional;
   - a button, "Ler o regulamento", linking to `#regulamento`.
3. **Precisa de ideias?** on mist: three cards styled as truco playing cards (the Serra's
   card game), the corner glyphs pinhão, araucária, drop and star, fanned at -8, 0 and
   8deg. The front card shows the idea's title in Yellowtail and one sentence. "Outra
   ideia" deals the next card:
   - the front card leaves by `translateX(-120%) rotate(-18deg)` and `opacity: 0` over
     450ms (`--duration-deal`) with `--ease-ui`;
   - the cards behind step forward over `--duration-panel`;
   - the order comes from `nextIdea(index, count)`;
   - `aria-live="polite"` on the front card;
   - under reduced motion the text swaps with no transition.
4. **Calendário** on wine:
   - a dashed trail (SVG path, `stroke-dasharray 8 10`) across three stops drawn as the
     map's pin glyph, each with its dates and one line;
   - the current stop gets a handwritten "Agora" in Yellowtail and a drawn arrow, the next
     stop "A seguir" (between phases), and after the end a "Encerrado" seal;
   - the status comes from `campaignStatus(today, phases)`, a pure function on
     `YYYY-MM-DD` strings in `America/Sao_Paulo`, derived with `Intl.DateTimeFormat`;
   - the phases are 01.09 to 31.10.2026 (inscrições), 10.11 to 24.11.2026 (votação) and
     05.12.2026 (posse na Praça do Pinhão).
5. **O prêmio** on night:
   - the hamper photograph at 4:3 in a tilted frame;
   - the prize list with partner links: 12 cestas from Fazenda do Cedro, Vinícola de
     Altitude and Fazenda dos Pinheiros, a weekend at Pousada da Geada, dinner for two at
     Deck do Lago, and the official sash;
   - a wine sash banner across the band carrying the prize line.
6. **Regulamento** (`id="regulamento"`) on mist: five `<details>` items. The first says
   the contest is fictional.

The words live in `lib/contest/content.ts`, as typed constants in Portuguese.

### D13 - The briefs are generated from the content

Each menu item in `prisma/content/menus.ts` carries `photo`, an English subject of one or
two sentences, next to its Portuguese words.

`scripts/write-image-prompts.ts` (`npm run images:prompts`) writes two things:
- `docs/grok/manifest.jsonl`, with one line per missing photograph: `path`,
  `aspect_ratio` and `prompt`. The prompt is the condensed PHOTO block (positive phrasing,
  as Grok Build's imagine guidance asks), then the subject, then a framing line for the
  aspect.
- the menu section of `docs/image-prompts.md`, between `<!-- menu:start -->` and
  `<!-- menu:end -->`.

The contest page's photographs are listed in the same file. Menu photographs and the
contest's people are 3:4; the hamper is 4:3.

`docs/grok/README.md` gives the one prompt to hand Grok Build: go through the manifest,
call `image_gen` for each line, and save to the path.

`images:sharpen` adds `menu` and `contest` to its folders. Before sharpening, it converts
any `.png`, `.jpg` or `.jpeg` it finds there to `.webp` at quality 90 next to the
original, so whatever format Grok saves in, the page finds a `.webp`.

### D14 - Content modules, so words can be tested

`prisma/seed.ts` is split:
- `prisma/content/places.ts` holds the places and experiences, unchanged except for the
  colours and the new headings;
- `prisma/content/menus.ts` holds 9 items per place;
- `seed.ts` only writes them.

Both content modules are side-effect free, so `tests/content.test.ts` can check:
- every published place has a heading, a lede and 6 to 12 items;
- slugs are unique per place;
- each image path matches `/images/menu/<place>/<item>.webp`;
- each brief is non-empty;
- the colour rules from D3 hold.

Pure logic, each tested in its own file:
- `lib/colour.ts`: contrast and OKLab distance;
- `lib/contest/campaign.ts`: `campaignStatus` and `nextIdea`;
- `lib/menu-layout.ts`: `pickPrints` and `stampedAt`.

## Implementation notes

Where the build departed from the decisions above, and why:

- **D14:** the menu's heading and lede live with its items in `prisma/content/menus.ts`,
  not in `places.ts`. A heading read beside its own items is easier to keep true. The
  seed still writes them to `place.menu_title` and `place.menu_lede`.
- **D5:** the welcome crest sits inside the band, above "Bem-vindo a", not across its top
  edge. Across the edge, its top half landed on the hero's scroll cue on first load.
- **D7:** the ridge's sky is the ribbon's `--place-deep`, so the menu rises out of the
  ribbon rather than out of a strip of its own. The araucária was redrawn as a cup of
  upswept branches with a tufted top, because a thin saucer read as an umbrella.
- **D7:** each card is an `<article>` with one full-size button over it. A `<button>` may
  not contain a heading, and it would have read the whole card as its name.
- **D7:** the crest stamp appears only on cards that have a photograph. On a stand-in it
  repeated the stand-in's own crest (spec amended).
- **D8/D2:** the stand-in and the dialog both work before any photograph exists. At the time
  of writing, all 135 menu photographs are stand-ins.
- **D9:** the gallery's layout comes from `galleryLayout(count)` in `lib/menu-layout.ts`.
  The previous rule left a hole with three pictures, which is the fallback every place has
  today.
- **D10:** the heading is "Mande um postal", and the place's name moves into the sentence
  below. "de Praça do Pinhão" is not Portuguese, and the page cannot contract the
  preposition without knowing each name's gender.
- **D11:** the footer's contest invitation is a full-width card above the columns, as the
  reference places its own. In a fourth column, every destination name broke onto two
  lines.
- **D11:** the header's "Embaixador" link shows from `lg` up, and the "Destinos" menu
  carries it at every width. Between `sm` and `lg` there is no room for it beside the
  wordmark.
- **D12:** the two photographs in "Como se candidatar" float beside the text only from `xl`
  up. Below that they sit above the text, because at `lg` they covered the title.
- **D12:** the idea deck fans out less on phones (16% and 6deg instead of 34% and 9deg), and
  its band clips horizontally. The full fan ran 60px off a 390px screen.
- **D13:** the manifest also carries the 90 gallery briefs that were already in
  `docs/image-prompts.md`, after the menus and the contest. Grok gets one list for every
  missing picture.
- **D13:** a menu brief does not name its place. The name only invited the generator to
  paint a sign.
- **Crests:** a long place name is set smaller on the rim. The rim's text path had been
  cutting "Galpão do Fogo de Chão" to "ALPÃO DO FOGO DE CHÃ" on every crest since the
  founding change. It showed now because one page draws the crest up to five times.

## Risks / Trade-offs

- [135 photographs are a lot to generate, and until then the menus are mostly stand-ins]
  → The stand-in is designed as a card in its own right, the manifest lists only what is
  missing, and every photograph the owner adds appears on reload.
- [Scroll-driven CSS is missing in Firefox and older Safari] → The pages are complete and
  static without it. The presentation runs in Chrome.
- [`<dialog>` focus return differs between engines] → Focus is restored by hand on close.
- [A 9-item grid plus prints means more image bytes per page] → Every photograph goes
  through `next/image`, lazy below the fold, with `sizes` matched to the column (at most
  about 420px CSS, 840px at DPR 2).
- [A static contest page would freeze "Agora" at build time] → `revalidate = 3600`, and in
  development the page renders per request.
- [Machine-written Portuguese copy for 135 items] → The words are checked by the owner in
  the review of this change. The tests guard structure, not taste.
- [Accent changes also recolour the hub's cards and crests] → Intended: the card is the
  door to the page, and the two should match. The pins keep their own colours.

## Migration Plan

1. `prisma migrate dev --name add_place_menu`, which only adds a table and two nullable
   columns.
2. `npm run db:seed` upserts the places (new colours and headings) and the menu items.
3. `npm run build:crests` rewrites the crest files in the place colours.
4. Rollback is a new migration that drops `menu_item` and the two columns. The content
   modules keep the old colours in git history.

## Open Questions

- The contest's name. "Embaixador de Saltopia" is used so that the reference's "Mayor" is
  not copied. If the owner prefers "Prefeito", only `lib/contest/content.ts` and the route
  change.
