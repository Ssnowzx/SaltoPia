## Purpose

Defines the scrolling pages a visitor reaches from the neighbourhood — one per place, and
one per experience within a place — including their section anatomy, their reveal behaviour
and the navigation that stays with the visitor throughout.

## ADDED Requirements

### Requirement: Place page anatomy

A place page SHALL present, in order: a full-viewport cinematic hero carrying the place's
crest and a scroll cue; a narrative block introducing the place; a horizontally scrolling
marquee band with a persistent call to action; a grid of experience cards; a share block;
and the site footer.

Unlike the hub, a place page SHALL scroll normally and MUST NOT render a 3D surface.

#### Scenario: Place page opened
- **WHEN** a visitor opens a place page
- **THEN** the hero fills the viewport and shows the place's crest and a scroll cue
- **AND** the page scrolls normally
- **AND** no WebGL context is created

#### Scenario: Place has no experiences yet
- **WHEN** a place has no published experiences
- **THEN** the experience grid is omitted rather than rendered empty
- **AND** every other section still renders

### Requirement: Marquee band

The marquee band SHALL scroll its content horizontally and continuously, looping with no
visible seam or restart. Its call to action MUST remain reachable while the content moves
beneath it.

#### Scenario: Marquee runs
- **WHEN** the marquee band is in view
- **THEN** its content scrolls continuously with no visible jump at the loop point

#### Scenario: Visitor activates the marquee call to action
- **WHEN** the visitor activates the band's call to action
- **THEN** it behaves as an ordinary link, unaffected by the motion of the content

### Requirement: Experience card grid

Each experience SHALL be presented as a ticket-silhouette card carrying its photograph, its
name and the crest of its place. Activating a card SHALL navigate to that experience's page.

#### Scenario: Experience card activated
- **WHEN** the visitor activates an experience card
- **THEN** the application navigates to `/[place]/experiencias/[experience]`

#### Scenario: Grid at phone width
- **WHEN** the grid is rendered at a viewport 400px wide
- **THEN** cards stack to a single column with no horizontal overflow

### Requirement: Experience page anatomy

An experience page SHALL present a hero with the experience's name and photograph, a
description, practical details for the visitor, a link back to its parent place, and the
site footer.

#### Scenario: Visitor returns to the place
- **WHEN** the visitor activates the back-to-place link
- **THEN** the application navigates to the parent place page

#### Scenario: Experience requested under the wrong place
- **WHEN** an experience slug is requested under a place that does not contain it
- **THEN** the application responds with a not-found page rather than rendering mismatched
  content

### Requirement: Scroll-driven reveal

Sections below the hero SHALL animate into view as they are scrolled to, each playing once.
Content MUST remain readable if the reveal never runs.

#### Scenario: Section scrolled into view
- **WHEN** a section enters the viewport for the first time
- **THEN** it animates into place
- **AND** it does not re-animate on subsequent passes

#### Scenario: Reveal cannot run
- **WHEN** scripting is unavailable or reduced motion is requested
- **THEN** every section is rendered visible in its final state
- **AND** no content is left permanently hidden or transparent

### Requirement: Persistent navigation

Every page, hub included, SHALL carry the same navigation bar: a "Destinos" menu listing all
places, an "Experiências" link, the wordmark linking to the hub, and a primary call to
action.

#### Scenario: Visitor opens the destinations menu
- **WHEN** the visitor opens the "Destinos" menu from any page
- **THEN** every place in the neighbourhood is listed
- **AND** activating one navigates to that place's page

#### Scenario: Navigation on a small viewport
- **WHEN** the navigation is rendered at a viewport 400px wide
- **THEN** it collapses to a control that opens the full set of destinations
- **AND** no navigation item becomes unreachable

### Requirement: Page metadata

Every place and experience page SHALL carry a unique title, a description, and a social
preview image specific to that page.

#### Scenario: Place page shared to a social platform
- **WHEN** a place page URL is shared
- **THEN** the preview shows that place's own title, description and image, not the site's
  generic values
