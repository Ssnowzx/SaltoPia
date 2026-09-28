# ADR-0004: Navigate with full documents and a cross-document view transition

- **Status:** Accepted
- **Date:** 2026-09-15

## Context

The reference reveals each new page through an expanding circle (an iris). Next's client
router can only animate a route change with an experimental flag, and the demo cannot
depend on an experimental path.

## Decision

Every navigation between the hub and a page is a full document load through a plain
`<a>`. The iris is the browser's cross-document view transition, enabled with
`@view-transition { navigation: auto }` and animated on `::view-transition-new(root)`
(1.5 s, `ease-in`). A session flag stops the hub replaying its title state when the
visitor comes back from inside the site.

## Consequences

- The transition is native, and it disappears cleanly where it is unsupported or motion
  is reduced (FR-15 to FR-17).
- Each navigation reloads the page, so the hub rebuilds its world when the visitor
  returns.
- The `no-html-link-for-pages` lint rule is switched off for this reason only.
- Source: `add-serranopolis-experience` design D4 and D24.
