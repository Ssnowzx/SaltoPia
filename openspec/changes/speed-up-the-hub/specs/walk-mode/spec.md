## MODIFIED Requirements

### Requirement: Entering and leaving walk mode

The hub SHALL offer, once the visitor is exploring, a way into walk mode. Entering it SHALL
open the character creator; leaving it SHALL return the visitor to the aerial view of the
neighbourhood with the pins and the navigation bar as they were. The aerial camera and the
walking camera MUST never both be in control.

Entering walk mode MUST NOT stall the hub. What walk mode needs - the ground it may walk on,
the routes across it - SHALL be prepared while the world goes on drawing, and no frame
SHALL wait on that preparation for more than 100 ms.

#### Scenario: Visitor enters walk mode
- **WHEN** the visitor, exploring the hub, chooses to walk
- **THEN** the character creator opens over the world, with the square in view

#### Scenario: First entry of a visit
- **WHEN** the visitor enters walk mode for the first time in a visit
- **THEN** the world goes on drawing while the creator opens and the visitor makes a character
- **AND** no frame is held for more than 100 ms by walk mode's preparation

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

Whichever person is chosen, and however many times the choice changes, the character SHALL
stand, walk and run with that person's own animation, and a newly chosen person SHALL appear
already standing rather than passing through a rest pose.

#### Scenario: Visitor changes a choice
- **WHEN** the visitor picks another person, outfit colour or skin tone
- **THEN** the character standing in the square changes to match without leaving the creator

#### Scenario: Visitor walks after changing the person
- **WHEN** the visitor picks two other people in turn in the creator and then starts walking
- **THEN** the character walks with its legs moving, as the person first shown would

#### Scenario: Visitor starts walking
- **WHEN** the visitor confirms the creator
- **THEN** the character, labelled with its name, is under the visitor's control in the square
