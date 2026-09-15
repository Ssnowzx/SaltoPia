## Purpose

Defines how the experience moves between the 3D hub and its content pages, so that leaving
the world feels like stepping through an opening rather than a page swap.

## ADDED Requirements

### Requirement: Iris reveal between pages

Navigation between application routes SHALL be revealed by an expanding circular aperture:
the incoming page is clipped to a circle that grows from nothing to cover the viewport over
`--duration-transition` with an `ease-in` curve, while the outgoing page holds still
underneath and does not animate.

#### Scenario: Visitor navigates from the hub to a place page
- **WHEN** the visitor activates "VISITAR" on a place card
- **THEN** the place page is revealed by a circle expanding to fill the viewport over
  `--duration-transition`
- **AND** the hub remains stationary beneath it throughout

#### Scenario: Visitor navigates between two content pages
- **WHEN** the visitor moves from a place page to one of its experience pages
- **THEN** the same iris reveal plays

### Requirement: The transition never traps the visitor

The transition SHALL be presentational only. Navigation MUST complete even if the animation
cannot run, is interrupted, or is unsupported by the browser.

#### Scenario: Browser without View Transitions support
- **WHEN** a visitor navigates in a browser that does not support view transitions
- **THEN** navigation completes immediately with no animation and no error

#### Scenario: Visitor navigates again mid-transition
- **WHEN** a new navigation starts while a transition is playing
- **THEN** the in-flight transition is abandoned
- **AND** the newest destination is the one that ends up displayed

#### Scenario: Back navigation
- **WHEN** the visitor uses browser back
- **THEN** the previous route is restored
- **AND** returning to the hub does not replay the entry title state

### Requirement: Transition suppression

The system SHALL provide a way to suppress the transition for a specific navigation, and
MUST suppress it for every navigation when the visitor has requested reduced motion.

#### Scenario: Reduced motion requested
- **WHEN** `prefers-reduced-motion: reduce` is set and the visitor navigates
- **THEN** no iris animation plays
- **AND** the destination page is displayed immediately

#### Scenario: Navigation marked as non-animating
- **WHEN** a navigation is explicitly marked to skip the transition
- **THEN** the destination is displayed with no animation
