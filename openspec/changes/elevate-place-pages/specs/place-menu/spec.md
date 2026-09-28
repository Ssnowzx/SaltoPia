## Purpose

Defines a place's menu: the photographed things each establishment offers, how they are
shown on its page and opened for a closer look, and how an item is drawn before its
photograph exists.

## ADDED Requirements

### Requirement: Every place has a menu

Every published place SHALL have a menu. A menu has a heading of the place's own, a
one-sentence lede, and its items in a set order. Each item SHALL carry a name, a one-line
description, an optional short tag and a photograph.

The menu SHALL be content, not code. Adding, removing, reordering or renaming an item, or
changing a menu's heading, SHALL NOT require any component to change.

Only published items SHALL be shown.

#### Scenario: Place page opened
- **WHEN** a visitor opens a place page
- **THEN** the menu section shows the place's own menu heading and lede
- **AND** every published item of that place is shown, in the menu's order

#### Scenario: Place has no menu items yet
- **WHEN** a place has no published menu items
- **THEN** the menu section is omitted rather than rendered empty
- **AND** every other section of the page still renders

#### Scenario: Menus differ between places
- **WHEN** two places' pages are compared
- **THEN** each shows its own heading and its own items

### Requirement: Menu items as cards on the place's colour

The menu SHALL be drawn on a full block of the place's colour. Each item SHALL be a card
with its photograph above a perforated line and its name below it. Some cards with a
photograph SHALL carry the place's crest as a stamp. A card still showing its stand-in
carries no stamp, because the stand-in already shows the crest.

The grid SHALL lay itself out from the number of items: three columns on a wide viewport,
two on a medium one and one at phone width. A last row that is not full SHALL be centred
rather than left-aligned.

#### Scenario: Grid at phone width
- **WHEN** the menu is rendered at a viewport 400px wide
- **THEN** the cards stack to a single column
- **AND** nothing overflows horizontally

#### Scenario: A last row with one item
- **WHEN** a menu with seven items is rendered on a wide viewport
- **THEN** the seventh card is centred under the six above it

### Requirement: Opening a menu item

Activating a menu item SHALL open it larger without leaving the page. The larger view
SHALL show its photograph, name, tag and description. It SHALL be closable with a visible
control, with the Escape key and by activating the area around it. Closing SHALL return
focus to the card that opened it. While it is open, the page behind it SHALL NOT scroll.

Every card SHALL be reachable and operable by keyboard.

#### Scenario: Visitor opens an item
- **WHEN** the visitor activates a menu card
- **THEN** the item is shown larger over the page, with its name, tag and description
- **AND** the address of the page does not change

#### Scenario: Visitor closes with the keyboard
- **WHEN** an item is open and the visitor presses Escape
- **THEN** the larger view closes
- **AND** focus returns to the card that opened it

### Requirement: An item before its photograph

An item whose photograph is not available yet SHALL still be drawn complete, with a
stand-in made from the place's colour, its crest and the item's name. No broken image, no
empty frame and no request for a missing file SHALL appear. When the photograph arrives,
it SHALL replace the stand-in with no change except to content.

#### Scenario: Photograph missing
- **WHEN** a place page is rendered and one of its menu items has no photograph on disk
- **THEN** that card shows the stand-in
- **AND** the page makes no request that fails for that item's image

#### Scenario: Photograph added
- **WHEN** the item's photograph is added at its expected path
- **THEN** the card and the larger view show the photograph

### Requirement: Every photograph has a brief

Every menu item SHALL have a photographic brief, recorded with the path and the aspect
ratio its photograph is expected at. The briefs SHALL be available as one
machine-readable list, with one entry per photograph still missing, so that an image
generator can work through the list file by file.

#### Scenario: Owner lists what is missing
- **WHEN** the owner generates the list of briefs
- **THEN** it holds one entry for each menu photograph not yet on disk
- **AND** each entry has the file's path, its aspect ratio and a complete prompt
