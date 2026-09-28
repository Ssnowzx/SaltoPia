# ADR-0014: Take walking heights from the drawn geometry

- **Status:** Accepted
- **Date:** 2026-09-24

## Context

Twice, a walker's height was worked out by a rule (first the square's paving, then the
pavements), and twice the feet sank, because the rule and the builder that drew the
surface drifted apart.

## Decision

Every raised surface the walker can stand on is rasterised from the geometry that draws it
into one height field, on a half-metre grid read bilinearly (`lib/walk/height-field.ts`).
The scene and the walk world share one road geometry.

## Consequences

- The feet stand on what is drawn, and any new raised surface must be added to the field.
- Building the field costs about 30 ms.
- Source: `add-living-townsfolk` design D5.
