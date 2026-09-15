## Purpose

Defines the markers that make the 3D neighbourhood legible — how each point of interest is
labelled above the world, how it responds to the visitor, and what opens when one is chosen.

## ADDED Requirements

### Requirement: Pins are interface, not scenery

Each point of interest SHALL be marked by an interface element rendered above the 3D
surface, not by geometry inside the scene. A pin MUST remain crisp at any camera distance
and its label MUST remain horizontal regardless of camera orientation.

#### Scenario: Camera orbits the neighbourhood
- **WHEN** the camera orbits so that a place is viewed from a different angle
- **THEN** the pin stays upright and its label stays horizontal and legible
- **AND** the label does not tilt, skew or mirror with the world

#### Scenario: Camera zooms out
- **WHEN** the camera zooms away from the neighbourhood
- **THEN** pin and label text stay at a readable size rather than shrinking with the world

### Requirement: Pins track their place

Every pin SHALL sit over the screen position of the place it marks, updated each frame.

A pin whose place is behind the camera, or occluded by terrain, MUST be hidden rather than
drawn floating over unrelated scenery.

#### Scenario: Camera moves
- **WHEN** the camera drifts, orbits, zooms or flies
- **THEN** each pin follows its place's screen position with no visible lag against the world

#### Scenario: Place passes behind the camera
- **WHEN** a place's world position falls behind the camera plane
- **THEN** its pin is hidden

#### Scenario: Place hidden by terrain
- **WHEN** a hill or building stands between the camera and a place
- **THEN** that place's pin is hidden or visibly de-emphasised, so it never reads as sitting
  on top of the obstruction

### Requirement: Pin states

A pin SHALL react to pointer hover by scaling up over `--duration-hover`, and MUST present a
pointer cursor to signal that it is actionable.

Pins SHALL be hidden while a camera flight is in progress and restored when it settles.

#### Scenario: Pointer enters a pin
- **WHEN** the pointer moves over a pin
- **THEN** the pin scales up over `--duration-hover`
- **AND** the cursor becomes a pointer

#### Scenario: Camera in flight
- **WHEN** a camera flight is running
- **THEN** all pins are hidden for its duration
- **AND** they return once the camera settles

### Requirement: A place running an offer is marked

A place MAY carry a short offer. A place that carries one SHALL be marked on its pin in a
way that is legible at map distance and distinct from every other pin, and the same offer
SHALL appear on that place's card and on its page, so that what drew the visitor across
the map is still there when they arrive.

Marking MUST stay the exception: the mark sits over the pin without changing the pin's own
shape, and any motion in it MUST be suppressed under `prefers-reduced-motion`.

#### Scenario: Place with an offer
- **WHEN** a place carries an offer
- **THEN** its pin carries the offer's text and reads as marked from across the map
- **AND** the same text appears on the place's card and on its page

#### Scenario: Place without an offer
- **WHEN** a place carries no offer
- **THEN** its pin is drawn exactly as it would be with the feature absent

#### Scenario: Reduced motion
- **WHEN** `prefers-reduced-motion: reduce` is set
- **THEN** the mark is still visible and still legible
- **AND** nothing about it animates

### Requirement: Pins are reachable without a pointer

Every pin SHALL be operable by keyboard. Pins MUST expose an accessible name matching the
place they mark, and MUST be reachable in a stable, predictable order that does not
reshuffle as the camera moves.

#### Scenario: Keyboard navigation
- **WHEN** the visitor moves focus through the hub with the Tab key
- **THEN** each pin receives focus in a stable order independent of camera position
- **AND** the focused pin shows a visible focus indicator
- **AND** activating it with Enter or Space behaves exactly as a click

#### Scenario: Screen reader encounters the map
- **WHEN** a screen reader reaches the pin overlay
- **THEN** each pin is announced with the name of the place it marks

### Requirement: Choosing a pin opens a place card, not a page

Activating a pin SHALL fly the camera to that place and open a place card. Activating a pin
MUST NOT change the route.

The card SHALL carry the place's crest, its name, a one-line description, a "VISITAR" action
that navigates to the place page, and a dismiss action that returns the visitor to free
exploration.

#### Scenario: Pin activated
- **WHEN** the visitor activates a pin
- **THEN** the camera flies to that place
- **AND** the place card animates in
- **AND** the browser URL is unchanged

#### Scenario: Visitor dismisses the card
- **WHEN** the visitor dismisses the place card
- **THEN** the card leaves
- **AND** pins are restored and idle drift resumes

#### Scenario: Visitor chooses to visit
- **WHEN** the visitor activates "VISITAR" on a place card
- **THEN** the application navigates to that place's page

#### Scenario: Card opened by keyboard
- **WHEN** the place card opens after keyboard activation
- **THEN** focus moves into the card
- **AND** Escape dismisses it and returns focus to the originating pin

### Requirement: Modal dialogs blur the world

A modal dialog layered over the neighbourhood SHALL blur the 3D surface behind it over
`--duration-panel`, so that the world reads as depth behind the content rather than
competing with it. The place card is not modal: the camera has just flown to the place,
and the card MUST leave the world sharp so the place stays the subject.

#### Scenario: Dialog opens over the world
- **WHEN** a modal dialog opens on the hub
- **THEN** the 3D surface behind it animates to a blurred state over `--duration-panel`
- **AND** the blur is removed when the dialog closes

#### Scenario: Place card opens over the world
- **WHEN** a place card opens after a flight
- **THEN** the 3D surface behind it is not blurred
