# ADR-0010: Use the night palette, guarded by a distance test

- **Status:** Accepted
- **Date:** 2026-09-28

## Context

The owner asked that Saltopia not use the reference site's colours. Measured in OKLab:
- the founding teal sat 0.043 from the reference's deep green;
- araucaria sat 0.070 from the same green;
- the gold sat 0.039 from its mustard;
- one place colour sat 0.018 from its orange-red.

## Decision

The interface palette is night `#1F2346`, wine `#7B2D3F` and champagne `#D9BF86` on cream
paper. The teal family and araucaria are retired. Every place keeps its own accent. Two
tests make the rule permanent:
- `tests/palette.test.ts` reads the tokens from `globals.css`, requires every saturated
  token to stand ≥ 0.08 from each reference colour, and fails if a retired token reappears;
- `tests/content.test.ts` holds every place accent to the same distance and to ≥ 4.5:1
  against pale text.

## Consequences

- The rule cannot drift back.
- The 3D world keeps its own palette: its teal water is the reservoir, not the brand.
- Source: `elevate-place-pages` design D3; `adopt-night-palette` design D1, D2 and D6.
