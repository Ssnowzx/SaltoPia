# ADR-0008: Treat an asset path as a promise, and draw a stand-in

- **Status:** Accepted
- **Date:** 2026-09-28

## Context

Pictures arrive after words: menu names were seeded before their photographs existed. A
broken image or a 404 on a partner's page would be a visible defect.

## Decision

A photograph's path is stored as a convention (`/images/menu/<place>/<item>.webp`), and
its presence is checked when the page is rendered (`lib/public-file.ts`). A missing file
becomes `null`, and the card draws a stand-in: the place's colour, its crest and the
item's name. No request is made for it. Galleries are folders read from disk, and they
fall back to the pictures the page already has.

## Consequences

- A page is complete before its last photograph (FR-31, NFR-09).
- A photograph dropped in appears on the next reload in development, and on the next
  build in production.
- A `media` table (data-model product step 2) would replace the convention with rows.
- Source: `elevate-place-pages` design D2 and D8.
