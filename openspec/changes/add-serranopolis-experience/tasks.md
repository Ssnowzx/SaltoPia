## 1. Design system foundation

- [ ] 1.1 Define all `--color-*` tokens from design.md D6 in the Tailwind v4 theme layer; verify by rendering a swatch page at `/dev/tokens` showing each token with its name and hex, matching the D6 table exactly
- [ ] 1.2 Wire Yellowtail and Figtree through `next/font/google` as `--font-script` and `--font-sans`; verify in DevTools that no request leaves the app origin for fonts and that both families report `loaded`
- [x] 1.3 Add radius, motion and duration tokens from the `design-system` spec; verify they appear as CSS custom properties on `:root`
- [ ] 1.4 Write a contrast test asserting every foreground/background token pairing named in the spec meets its WCAG AA threshold; verify the test fails when a token is deliberately darkened
- [ ] 1.5 Build the ticket-silhouette card as a CSS mask utility; verify the notches render over three different page backgrounds with no visible seam or background bleed

## 2. Content model and copy

- [x] 2.1 Define `Place` and `Experience` types in `src/types/index.ts` with no `any`; verify `tsc --noEmit` passes
- [x] 2.2 Write the eight places from design.md D7 as typed modules with Brazilian Portuguese names, descriptions and metadata; verify every slug in D7 resolves to a record
- [x] 2.3 Write two to three experiences per place with Portuguese copy; verify each experience's `placeSlug` matches an existing place
- [ ] 2.4 Add a build-time check that every referenced asset path exists on disk; verify it fails when a path is deliberately broken

## 3. Static fallback (built before the 3D hub — design.md D8)

- [ ] 3.1 Build the static illustrated neighbourhood view with all eight places as positioned links; verify every place page is reachable from it by keyboard alone
- [ ] 3.2 Add WebGL2 capability detection that routes to the fallback; verify by forcing detection to fail and confirming the fallback renders with no console error
- [ ] 3.3 Handle `webglcontextlost` by switching to the fallback; verify using `WEBGL_lose_context` in DevTools that the page degrades instead of freezing

## 4. Navigation and page shell

- [ ] 4.1 Build the persistent navigation bar (Destinos menu, Experiências, wordmark, primary CTA); verify it renders identically on hub, place and experience pages
- [ ] 4.2 Make the Destinos menu list all eight places and navigate correctly; verify each entry lands on its place page
- [ ] 4.3 Collapse the navigation at 400px width; verify no item becomes unreachable and no horizontal overflow appears
- [ ] 4.4 Build the shared footer; verify it renders on every content page

## 5. Iris page transition

- [ ] 5.1 Implement the `iris` keyframes and `::view-transition-*` rules from design.md D4; verify by navigating hub → place that the incoming page is revealed by an expanding circle over 1.5s while the outgoing page holds still
- [ ] 5.2 Feature-detect `startViewTransition` and fall through to plain navigation; verify navigation still completes with the API stubbed out
- [ ] 5.3 Suppress the transition under `prefers-reduced-motion: reduce` and via an explicit opt-out; verify with the emulated setting that navigation is instant
- [ ] 5.4 Verify a navigation started mid-transition lands on the newest destination, not the abandoned one

## 6. 3D neighbourhood scene

- [ ] 6.1 Vendor the chosen CC0 kit models into `web/public/models/` with a `CREDITS.md` recording each source and licence; verify the total compressed payload is under 8 MB
- [x] 6.2 Set up the R3F canvas with pixel ratio capped at 2, the golden-hour sky gradient from D6, and scene lighting; verify the rendered sky matches the specified stops
- [x] 6.3 Define `neighborhood-layout.ts` as typed placement data; verify a deliberately malformed entry is a compile error, not a runtime one
- [x] 6.4 Build the loader that composes the scene from the layout, instancing any model used more than 20 times; verify with `renderer.info` that instanced models produce one draw call each
- [x] 6.5 Handle a failed model load by skipping that entry and logging; verify the rest of the scene still renders when one path is broken
- [x] 6.6 Build the procedural araucária generator with seeded variation (D2); verify 30 trees render as one instanced batch and no two share the same silhouette
- [ ] 6.7 Apply the unifying material and palette pass across kits (Risks); verify models from two different kits read as one art direction side by side

## 7. Camera choreography

- [ ] 7.1 Implement bounded orbit and zoom controls; verify the camera cannot pass below terrain, cannot invert, and cannot lose the neighbourhood from frame
- [ ] 7.2 Implement idle drift resuming after 3 seconds of no input; verify it starts on time and stays within bounds
- [ ] 7.3 Implement `flyTo` at `duration: 2` / `power2.inOut`; verify the camera arrives at the framed view within 2 seconds
- [ ] 7.4 Make a new flight supersede one in progress from its current position; verify two rapid pin activations produce no jump or double-move
- [ ] 7.5 Resolve flights instantly under reduced motion; verify with the emulated setting that the camera arrives with no interpolation

## 8. Pin overlay

- [ ] 8.1 Build the pin component (inline SVG teardrop + pill label) styled from tokens; verify against the `design-system` spec values
- [ ] 8.2 Project each place's world position to screen space each frame, writing the transform directly to the DOM node outside React's render cycle; verify with the React Profiler that camera movement triggers no component re-render
- [ ] 8.3 Hide pins whose place is behind the camera plane; verify by orbiting 180° that no pin appears over empty sky
- [ ] 8.4 Hide or de-emphasise pins occluded by terrain via raycast; verify a place behind a hill loses its pin
- [ ] 8.5 Add hover scale at 200ms and a pointer cursor; verify timing in DevTools
- [ ] 8.6 Hide all pins during a camera flight and restore on settle; verify across a full pin → card → dismiss cycle
- [ ] 8.7 Make pins keyboard operable with a stable tab order independent of camera position, accessible names, and visible focus; verify the order does not change after orbiting

## 9. Place card

- [ ] 9.1 Build the place card (crest, name, one-line description, VISITAR, dismiss); verify it matches the ticket/card treatment from the design system
- [ ] 9.2 Open the card after the flight settles, without changing the route; verify the URL is unchanged after activating a pin
- [ ] 9.3 Blur the 3D surface behind the card over 300ms; verify the blur is applied on open and fully removed on close
- [ ] 9.4 Trap focus in the card when opened by keyboard, and return focus to the originating pin on Escape; verify with keyboard only
- [ ] 9.5 Make VISITAR navigate to the place page through the iris transition; verify the full hub → card → page sequence

## 10. Place pages

- [ ] 10.1 Build the `/[place]` route with the six-section anatomy from the `place-pages` spec; verify no WebGL context is created on these pages
- [ ] 10.2 Build the full-viewport cinematic hero with crest and scroll cue; verify at 400px and 1920px widths
- [ ] 10.3 Build the seamless infinite marquee band with a persistent CTA; verify by recording one full loop that no seam or restart is visible
- [ ] 10.4 Freeze the marquee and make its full text readable under reduced motion; verify with the emulated setting
- [ ] 10.5 Build the experience card grid using the ticket silhouette; verify it collapses to one column at 400px with no horizontal overflow
- [ ] 10.6 Omit the grid entirely when a place has no experiences; verify with a place whose experience list is empty
- [ ] 10.7 Build the share block and wire the footer; verify links resolve

## 11. Experience pages

- [ ] 11.1 Build the `/[place]/experiencias/[experience]` route with hero, description, practical details and back-to-place link; verify the back link returns to the correct parent
- [ ] 11.2 Return a not-found response for an experience requested under the wrong place; verify with a deliberately mismatched URL

## 12. Scroll behaviour

- [ ] 12.1 Wire Lenis smooth scroll on content pages only; verify the hub creates no Lenis instance
- [ ] 12.2 Build scroll-driven section reveals playing once each; verify a section does not re-animate on a second pass
- [ ] 12.3 Render all sections in their final visible state when reduced motion is set or scripting is unavailable; verify with JavaScript disabled that no section is left transparent

## 13. Metadata and polish

- [ ] 13.1 Give every place and experience page a unique title, description and social preview image; verify with a link preview debugger that a place page shows its own values
- [ ] 13.2 Add the wordmark, favicon and social preview assets; verify they render in tab and preview
- [ ] 13.3 Run `npm run lint` and `tsc --noEmit` clean, with no `console.log` and no unused imports remaining

## 14. Verification pass

- [ ] 14.1 Measure hub frame rate over 30 seconds of idle drift on integrated graphics at 1080p; verify median frame time is at or below 16.7ms and record the number
- [ ] 14.2 Measure frame rate during a camera flight; verify it holds at or above 30fps
- [ ] 14.3 Confirm the hub's document height equals the viewport height and does not scroll
- [ ] 14.4 Walk the entire experience by keyboard alone, hub included; verify every place and experience is reachable and no focus trap is inescapable
- [ ] 14.5 Walk the entire experience with `prefers-reduced-motion: reduce`; verify every destination reachable with motion enabled is still reachable
- [ ] 14.6 Walk the entire experience with WebGL disabled; verify the fallback carries all eight places and nothing blanks
- [ ] 14.7 Verify the compressed 3D payload is under 8 MB and record the number
