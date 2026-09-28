# ADR-0007: Keep the menu off the Place type

- **Status:** Accepted
- **Date:** 2026-09-28

## Context

`getPlaces()` feeds the hub, and the hub's data travels to the browser with every pin.
Each place now has a menu of about nine items.

## Decision

A menu is its own table (`menu_item`), with its heading on `place` (`menu_title`,
`menu_lede`). It is read by `getPlaceMenu(slug)` as a separate `PlaceMenu` type, on the
one page that shows it. `Place` is unchanged.

## Consequences

- The hub does not carry 135 dishes.
- A page makes two queries instead of one.
- Source: `elevate-place-pages` design D1.
