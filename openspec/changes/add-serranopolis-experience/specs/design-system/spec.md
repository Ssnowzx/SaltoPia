## Purpose

Defines the single source of visual truth for Serranópolis — colour, typography, radius and
motion tokens drawn from the Serra Catarinense landscape — so that every surface of the
experience reads as one place, and so that the accessibility contract for motion is stated
once rather than re-decided per component.

## ADDED Requirements

### Requirement: Palette tokens

The system SHALL expose the palette as named CSS custom properties. Components MUST
reference tokens, never literal colour values. Each token carries a fixed semantic role, and
that role MUST NOT vary by surface.

| Token | Value | Role |
| --- | --- | --- |
| `--color-ember` | `#C4522E` | Primary accent: pins, links, script headings |
| `--color-ember-deep` | `#A8431F` | Filled button background |
| `--color-ember-dark` | `#83341A` | Filled button hover/active |
| `--color-mist` | `#FFF9EC` | Card and panel surface |
| `--color-straw` | `#F3E4C8` | Page background, marquee band |
| `--color-sage` | `#9CC4B2` | Secondary accent on dark surfaces |
| `--color-araucaria` | `#1E4A3A` | Deep surface, footer, marquee text |
| `--color-bark` | `#2E241C` | Body text |
| `--color-frost` | `#7FA3B8` | Cold/altitude accent, water |
| `--color-gold` | `#D9A441` | Highlight, pinhão and highland-grass notes |
| `--color-wine` | `#7B2D3F` | Rare emphasis, high-altitude wine motif |

#### Scenario: Component requests a brand colour
- **WHEN** a component needs any brand colour
- **THEN** it resolves it through a `--color-*` custom property
- **AND** no literal hex value for a brand colour appears outside the token definition file

#### Scenario: Text contrast on every defined pairing
- **WHEN** a token pairing defined by this system places text over a background
- **THEN** the pairing meets WCAG 2.1 AA contrast — at least 4.5:1 for body text and 3:1 for
  text at 24px or larger, or 19px or larger when bold

### Requirement: Typography tokens

The system SHALL use exactly two families, both self-hosted so the experience renders
identically without a third-party font network request.

- `--font-script` — Yellowtail. Used only for short decorative lines: overlines, the
  "Role para explorar" cue, and the first line of a two-line heading. Never for body text,
  never for a full sentence in a paragraph, never below 20px.
- `--font-sans` — Figtree, weights 400/600/800. Used for everything else. Display headings
  use weight 800 with uppercase and tight tracking.

#### Scenario: Script font used for a long passage
- **WHEN** a text run set in `--font-script` exceeds 40 characters
- **THEN** this violates the type contract and the run MUST be set in `--font-sans` instead

#### Scenario: Font loading
- **WHEN** the page loads
- **THEN** both families are served from the application's own origin
- **AND** each declares a fallback stack with a metric-adjusted local fallback, so that no
  layout shift larger than 0.02 CLS is attributable to font swap

### Requirement: Shape and elevation tokens

The system SHALL use a restrained set of radii so that surfaces feel cut from the same
material: `--radius-card: 16px`, `--radius-button: 8px`, `--radius-pill: 100px`.

Cards on place pages additionally use a **ticket silhouette** — a card whose left and right
edges each carry a circular notch at the vertical midpoint, evoking a torn admission ticket.

#### Scenario: Experience card rendered
- **WHEN** an experience card is rendered in a place page grid
- **THEN** it displays the ticket silhouette with notches on both vertical edges
- **AND** the silhouette is produced by CSS masking, so the card's background remains a
  single element that can sit over any page background

### Requirement: Motion tokens and the reduced-motion contract

The system SHALL define motion as tokens: `--ease-flight: power2.inOut` for camera moves,
`--ease-ui: cubic-bezier(0.4, 0, 0.2, 1)` for interface state, `--duration-hover: 200ms`,
`--duration-panel: 300ms`, `--duration-flight: 2000ms`, `--duration-transition: 1500ms`.

When the user has requested reduced motion, the experience MUST remain fully navigable. It
MUST NOT merely disable animation and leave a state the user cannot exit.

#### Scenario: User prefers reduced motion
- **WHEN** `prefers-reduced-motion: reduce` is set
- **THEN** camera flights resolve instantly to their destination rather than interpolating
- **AND** the idle camera drift does not run
- **AND** the iris page transition does not run
- **AND** every destination reachable with motion enabled remains reachable

#### Scenario: Marquee under reduced motion
- **WHEN** `prefers-reduced-motion: reduce` is set and a page contains a marquee band
- **THEN** the marquee holds still and its full text is readable without horizontal scrolling
