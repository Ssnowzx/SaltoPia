## MODIFIED Requirements

### Requirement: Place page anatomy

A place page SHALL present, in order:
- a full-viewport cinematic hero carrying the place's crest and a scroll cue;
- a welcome band that carries the crest on from the hero and gives the place's name, its
  tagline, its description and its facts, over a faded picture of the place with a
  scatter of photographic prints;
- a horizontally scrolling ribbon band with a persistent call to action;
- the place's menu, on a block of the place's own colour;
- the place's experiences as an itinerary;
- a gallery of the place's own photographs;
- a postcard to share the page;
- the site footer.

The call to action in the ribbon band MUST NOT overlap the moving content.

The menu, the itinerary and the gallery SHALL each lay themselves out from how many items
they have, so that a short list does not leave a hole where a row was expected.

The gallery SHALL draw its first picture larger than the rest. When a place has no gallery
of its own yet, the gallery SHALL fall back to the pictures the page already carries, so
that a page is complete before its last photograph is. The prints in the welcome band SHALL
fall back the same way.

Unlike the hub, a place page SHALL scroll normally and MUST NOT render a 3D surface.

#### Scenario: Place page opened
- **WHEN** a visitor opens a place page
- **THEN** the hero fills the viewport and shows the place's crest and a scroll cue
- **AND** the page scrolls normally
- **AND** no WebGL context is created

#### Scenario: Place has no gallery of its own yet
- **WHEN** a place has no gallery photographs
- **THEN** the gallery shows the pictures the page already carries
- **AND** no empty frame or broken image is rendered

#### Scenario: Place has no experiences yet
- **WHEN** a place has no published experiences
- **THEN** the itinerary is omitted rather than rendered empty
- **AND** every other section still renders

#### Scenario: Sections in order
- **WHEN** a place page with a menu, experiences and a gallery is opened
- **THEN** the hero, welcome band, ribbon, menu, itinerary, gallery, postcard and footer
  appear in that order

### Requirement: Each place has its own colour

Every place SHALL carry a colour of its own, and its page SHALL be built around that colour
rather than around the site palette. The veil under the hero's type, the ribbon band, the
ground of the menu, the tint of the pale bands and the postcard's ink SHALL all take it,
and the page SHALL alternate pale and saturated bands.

The colour MUST be content, not code, so that changing it does not change a component.

Text on the saturated ground MUST stay legible: every place colour SHALL reach at least
4.5:1 contrast against the page's pale text colour.

No place colour SHALL reproduce the reference site's signature colours: its orange-red,
coral, deep green, teal, mint or mustard. Every place colour SHALL stand at least 0.08 away
from each of them in OKLab distance.

#### Scenario: Two places compared
- **WHEN** a visitor moves from one place's page to another's
- **THEN** the two pages read as different places rather than as one template twice

#### Scenario: A place's colour is changed
- **WHEN** a place's colour is changed in the content
- **THEN** every band on its page follows, with no component edited

#### Scenario: Colours checked
- **WHEN** the place colours are checked
- **THEN** each reaches 4.5:1 against the pale text colour
- **AND** each stands at least 0.08 away in OKLab from every signature colour of the
  reference

### Requirement: Experience card grid

On the experiences index, each experience SHALL be presented as a ticket-silhouette card
carrying its photograph, its name and the crest of its place.

On a place page, the place's experiences SHALL be presented as an itinerary. Each stop
SHALL show its photograph large, its number in the itinerary, its kind, its duration, its
name and its description, and the stops SHALL alternate sides on a wide viewport.

In both forms, activating an experience SHALL navigate to that experience's page.

#### Scenario: Experience card activated
- **WHEN** the visitor activates an experience card or an itinerary stop
- **THEN** the application navigates to `/[place]/experiencias/[experience]`

#### Scenario: Grid at phone width
- **WHEN** the experiences index or a place's itinerary is rendered at a viewport 400px wide
- **THEN** the items stack to a single column with no horizontal overflow

### Requirement: Persistent navigation

Every page, hub included, SHALL carry the same navigation bar with:
- a "Destinos" menu listing all places;
- an "Experiências" link;
- a link to the ambassador contest;
- the wordmark, linking to the hub;
- a primary call to action.

The footer of every content page SHALL also invite the visitor to the contest.

#### Scenario: Visitor opens the destinations menu
- **WHEN** the visitor opens the "Destinos" menu from any page
- **THEN** every place in the neighbourhood is listed
- **AND** activating one navigates to that place's page

#### Scenario: Navigation on a small viewport
- **WHEN** the navigation is rendered at a viewport 400px wide
- **THEN** it collapses to a control that opens the full set of destinations and links
- **AND** no navigation item, the contest link included, becomes unreachable

#### Scenario: Visitor goes to the contest
- **WHEN** the visitor activates the contest link in the navigation or the footer
- **THEN** the application navigates to `/embaixador`

## ADDED Requirements

### Requirement: Pinned hero

A place page's hero SHALL stay in place while the page's next band slides up over it, so
that the page reads as opening onto the place. Scrolling back up SHALL uncover it again.
Under reduced motion the hero SHALL hold its composition without any parallax or scaling,
while the pinning itself, which is scrolling rather than animation, may remain.

#### Scenario: Visitor scrolls past the hero
- **WHEN** the visitor scrolls down from the top of a place page
- **THEN** the hero holds its position while the welcome band covers it from below

#### Scenario: Reduced motion
- **WHEN** `prefers-reduced-motion: reduce` is set
- **THEN** no part of the hero scales or drifts as the page scrolls

### Requirement: Sharing a place as a postcard

A place page SHALL end with a postcard of the place: its picture, its name, its crest as a
stamp and a postmark. Beside the postcard it SHALL offer three ways to share the page:
- the system share sheet where one exists, and otherwise a copied link;
- WhatsApp;
- copying the link.
Copying SHALL be confirmed on screen and announced to assistive technology.

#### Scenario: Visitor copies the link
- **WHEN** the visitor activates "Copiar link"
- **THEN** the page's address is copied to the clipboard
- **AND** the control confirms it on screen for a moment

#### Scenario: Visitor shares on WhatsApp
- **WHEN** the visitor activates "WhatsApp"
- **THEN** WhatsApp opens in a new tab with the place's name and the page's address
