## Purpose

Lets the visitor create a character and walk the community on foot, visiting each of the
establishments, as a second way through the same world the hub shows from the air.

## ADDED Requirements

### Requirement: Entering and leaving walk mode

The hub SHALL offer, once the visitor is exploring, a way into walk mode. Entering it SHALL
open the character creator; leaving it SHALL return the visitor to the aerial view of the
neighbourhood with the pins and the navigation bar as they were. The aerial camera and the
walking camera MUST never both be in control.

#### Scenario: Visitor enters walk mode
- **WHEN** the visitor, exploring the hub, chooses to walk
- **THEN** the character creator opens over the world, with the square in view

#### Scenario: Visitor leaves walk mode
- **WHEN** the visitor chooses to stop walking
- **THEN** the character is removed and the camera returns to the composed wide shot
- **AND** pins and the navigation bar behave as they do from the air

### Requirement: Creating a character

The creator SHALL let the visitor choose one of six people, an outfit colour, a skin tone and
a name of up to 16 characters, and SHALL show the character as it will walk, in the world,
while the choices are made. The name SHALL be optional; without one the character is
called by a default name. The last character created SHALL be remembered in the browser and
offered again next time.

#### Scenario: Visitor changes a choice
- **WHEN** the visitor picks another person, outfit colour or skin tone
- **THEN** the character standing in the square changes to match without leaving the creator

#### Scenario: Visitor starts walking
- **WHEN** the visitor confirms the creator
- **THEN** the character, labelled with its name, is under the visitor's control in the square

### Requirement: Walking the world

The character SHALL walk under the arrow keys or W, A, S and D, relative to the direction
the camera faces, and run while Shift is held. On a touch screen a joystick SHALL do the
same. Clicking or tapping the ground SHALL send the character walking to that spot.

The character SHALL stand on the ground it is over - the terrain, the pavement, the road -
and SHALL be animated standing, walking and running to match its speed.

#### Scenario: Visitor walks with the keyboard
- **WHEN** the visitor holds W with the camera behind the character
- **THEN** the character walks away from the camera, with its walking animation
- **AND** with Shift held it runs

#### Scenario: Visitor taps the ground
- **WHEN** the visitor taps a spot of open ground in view
- **THEN** the character walks there and stops

### Requirement: Where the character can go

The character MUST NOT walk into the lake or the river, through a building, or off the edge
of the map. Meeting one, it SHALL slide along it rather than stop dead where the way is
open to one side.

#### Scenario: Character walks at the lake
- **WHEN** the visitor walks the character toward the water's edge
- **THEN** it stops at the bank and does not enter the water

#### Scenario: Character walks into a house
- **WHEN** the visitor walks the character into a wall at an angle
- **THEN** it slides along the wall and does not pass through it

### Requirement: The camera follows the character

A camera SHALL follow the character from behind and above, keeping it in frame as it moves.
The visitor SHALL be able to turn the camera round the character by dragging and to bring
it nearer or further within bounds, without it passing under the ground.

Under reduced motion the camera SHALL keep up with the character at once rather than easing
after it.

#### Scenario: Visitor turns the camera
- **WHEN** the visitor drags across the world while walking
- **THEN** the camera circles the character, which stays in frame

### Requirement: Visiting establishments on foot

Each of the fifteen establishments SHALL have an arrival area. When the character is inside
one, the interface SHALL name the place and offer to visit it; accepting SHALL open the same
place card the pins open, from which the place's page is reached.

The visitor SHALL also be able to choose a place from a list and have the character walk
there on its own, along a route that keeps to the ground it is allowed on.

#### Scenario: Character arrives at a place
- **WHEN** the character walks into the square's arrival area
- **THEN** the interface offers to visit Praça do Pinhão
- **AND** accepting opens its place card

#### Scenario: Visitor chooses a place from the list
- **WHEN** the visitor chooses a place from the list
- **THEN** the character walks to that place's arrival area by itself, around water and buildings
- **AND** any movement input from the visitor takes control back

### Requirement: The passport

Arriving at a place SHALL mark it visited. The interface SHALL show how many of the fifteen
have been visited and which, remembered in the browser across visits. Visiting all fifteen
SHALL be acknowledged.

#### Scenario: A first visit
- **WHEN** the character arrives at a place not visited before
- **THEN** the passport count goes up by one and the place is marked

#### Scenario: The last place
- **WHEN** the character arrives at the fifteenth place not yet visited
- **THEN** the interface congratulates the visitor on seeing all of Saltopia

### Requirement: Returning to the walk

When the visitor opens a place's page from walk mode and comes back to the hub, the hub SHALL
resume walk mode with the same character where it was left.

#### Scenario: Visitor returns from a page
- **WHEN** the visitor, walking, opens a place's page and then navigates back to the hub
- **THEN** walk mode resumes with the same character at the same place
