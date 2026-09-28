# ADR-0003: Render map pins as projected HTML

- **Status:** Accepted
- **Date:** 2026-09-14

## Context

Pins must stay crisp at any distance, keep their labels upright under orbit, carry
styles and transitions, and be reachable by keyboard and screen reader.

## Decision

A pin is an HTML element in an overlay above the canvas. Every frame a projector writes
each pin's screen position straight to its DOM node's `transform`, outside React state.

## Consequences

- The pins are accessible and styleable, and FR-08 to FR-12 follow from this.
- There is one DOM write per pin per frame, which is negligible for 15 pins. Routing it
  through React would cost 60 reconciliations a second, so it is not routed there.
- Hiding a pin behind terrain needs a raycast, which is not built yet (FR-09, partial).
- Source: `add-serranopolis-experience` design D3.
