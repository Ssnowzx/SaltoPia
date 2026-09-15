## Why

Conventional destination websites present a place as a stack of scrolling sections, which
flattens the one thing a highland town actually sells: the feeling of being inside a
landscape. `visitmeatopia.com` proved a different model works — a navigable 3D world as the
site's hub, with content pages hanging off it — and earned an Awwwards Honorable Mention for
it in August 2026.

This change builds **Serranópolis**, a fictional new neighbourhood of Lages, Santa Catarina,
using that same interaction model with an entirely original theme, palette, art and copy.
It is the deliverable for a 5th-semester academic presentation, so it must run convincingly
on a laptop in a classroom, not only on a workstation.

## What Changes

- Add a **3D world map hub** at `/`: a fullscreen WebGL canvas holding a low-poly
  neighbourhood of the Serra Catarinense. The document does not scroll. The camera drifts
  continuously and flies to a point of interest on demand.
  *(Mirrors Meatopia's fullscreen `<canvas>` hub with a non-scrolling document.)*
- Add an **HTML pin overlay** above the canvas. Each point of interest is a `div` + inline
  SVG positioned every frame by projecting its 3D world position to screen space — not a 3D
  sprite. Pins scale on hover and hide while the camera is in flight.
  *(Mirrors Meatopia's `div` + `svg` overlay layer driven by per-frame projection.)*
- Add a **place detail card**. Clicking a pin does **not** navigate: the camera flies to the
  place and a card animates in carrying the place's crest, name and a "VISITAR" action.
  Only that action performs a route change.
  *(Mirrors Meatopia's click-pin → camera flight → card → VISIT flow.)*
- Add **place pages** at `/[place]`: ordinary long scroll pages with no canvas — cinematic
  hero, narrative block, infinite marquee band, experience card grid, share block, footer.
  *(Mirrors Meatopia's district page anatomy.)*
- Add **experience pages** at `/[place]/experiencias/[experience]`: scrolling detail pages
  for an individual thing to do or eat.
  *(Mirrors Meatopia's `/[district]/recipes/[recipe]` pages.)*
- Add an **iris page transition** using the View Transitions API: the incoming page is
  revealed by a circle expanding from 0% to 100% over 1.5s ease-in while the outgoing page
  holds still.
  *(Mirrors Meatopia's `@keyframes hole` on `::view-transition-new(root)`.)*
- Add a **design system** of palette, typography and motion tokens drawn from the Serra
  Catarinense — araucária green, ember terracotta, highland straw, frost blue, mist cream.
- Add a **typed neighbourhood layout** file that composes the 3D scene from CC0 low-poly
  kit models plus procedurally generated araucária trees, rather than one pre-baked GLB.

**BREAKING**: none. This is a greenfield project.

## Capabilities

### New Capabilities

- `design-system`: The palette, typography, spacing, radius and motion tokens every other
  capability draws from, plus the accessibility contract for reduced motion.
- `world-map`: The 3D neighbourhood hub — scene composition, camera choreography, idle
  drift, fly-to, loading, performance budget and the non-WebGL fallback.
- `map-pins`: The HTML pin overlay projected from 3D world positions, its hover and
  visibility behaviour, and the place detail card that opens from a pin.
- `place-pages`: The scrolling place and experience pages, their section anatomy, and the
  scroll-driven reveal behaviour.
- `page-transitions`: The iris route transition, its reduced-motion behaviour, and the rule
  for which navigations animate.

### Modified Capabilities

None — this is the project's first change.

## Impact

**New dependencies** (already installed in `web/`):
`three`, `@react-three/fiber`, `@react-three/drei`, `gsap`, `@gsap/react`, `lenis`,
`@types/three`.

**Affected code**: all of `web/src` — this change establishes the application.

**Third-party assets**: CC0 low-poly model kits (Kenney, Quaternius, Poly Pizza) vendored
into `web/public/models/`. CC0 requires no attribution, but the project records provenance
in `web/public/models/CREDITS.md` anyway, because an academic submission must be able to
show where every asset came from.

**Performance budget**: the hub must hold 60fps on integrated graphics at 1080p and
degrade — not break — on a device without WebGL2. The 3D payload is capped at 8 MB
compressed, roughly half of Meatopia's single 16.3 MB GLB, because the classroom network is
an unknown.

**Risk**: WebGL is the single point of failure for the hub. The non-WebGL fallback is
therefore a requirement in `world-map`, not an afterthought — on presentation day a machine
that cannot render the map must still show a usable site.
