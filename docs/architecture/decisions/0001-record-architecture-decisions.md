# ADR-0001: Record architecture decisions

- **Status:** Accepted
- **Date:** 2026-09-28

## Context

Decisions about Saltopia were recorded from the first day, but only inside each OpenSpec
change's `design.md`, numbered per change (D1, D2… restarting in every change). To learn
why the world is generated, or why the menu is not on `Place`, a reader had to know which
change to open. The project is becoming a product, and it is assessed as Software
Engineering work.

## Decision

The decisions that shape the architecture are kept as Architecture Decision Records in
`docs/architecture/decisions/`, in Michael Nygard's format: context, decision,
consequences, status. They are numbered in one sequence and never renumbered. An ADR that
is replaced is marked *Superseded by* and kept.

Each change's `design.md` stays the detailed record of how a change was built. An ADR is
written when a decision constrains later changes, and it links to the design section it
came from.

## Consequences

- There is one place to learn why the system is shaped the way it is.
- Some duplication with the design documents is accepted. The ADR is the summary; the
  design keeps the measurements and the alternatives in full.
