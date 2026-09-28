# ADR-0012: Generate photographs from briefs through a manifest

- **Status:** Accepted
- **Date:** 2026-09-28

## Context

The pages need 268 realistic photographs, and there are no real establishments to
photograph. The image generator (Grok Build) takes a prompt and an aspect ratio per call.
It cannot spell reliably, and its output is an enlargement.

## Decision

Every photograph has a written brief next to its content. `npm run images:prompts` writes
`docs/grok/manifest.jsonl` with only the missing files, as path, aspect ratio and full
prompt, and Grok Build works through it. `npm run images:sharpen` then converts to WebP,
restores the edges and empties the image cache. Anything with words (postmarks, labels,
the contest's type) is built in code, never generated.

## Consequences

- Adding a place or a dish includes writing its brief.
- The manifest is generated, not committed.
- Partners' own photographs can replace any generated one at the same path.
- Source: `elevate-place-pages` design D13.
