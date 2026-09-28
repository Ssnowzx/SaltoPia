# ADR-0006: Keep content as typed modules and seed it

- **Status:** Accepted
- **Date:** 2026-09-28

## Context

The words of the site (places, experiences, 135 menu items, photo briefs) grew beyond
what one seed script could carry. Rules such as colour contrast, text lengths and unique
slugs needed tests that should not depend on a database.

## Decision

The words live in side-effect-free modules: `web/prisma/content/places.ts` and
`menus.ts`, typed by `content/types.ts`. `prisma/seed.ts` only writes them. The seed is
authoritative: it rewrites every field and deletes places it no longer carries. The
contest's copy lives in `web/src/lib/contest/content.ts`, because it is page copy rather
than records.

## Consequences

- `tests/content.test.ts` holds the content to its rules with no database.
- Until the partner panel exists, content is edited in code by the team.
- Source: `elevate-place-pages` design D14.
