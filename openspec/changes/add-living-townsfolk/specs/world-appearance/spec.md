## MODIFIED Requirements

### Requirement: Nothing stands where it cannot

No object that belongs on land SHALL stand in the water, and no object that belongs on the
water SHALL stand on land. A pier SHALL run from the bank out over the water with its deck
above it, and a building on stilts SHALL keep its floor above the water. A road SHALL stay
above the water's level wherever it runs along the shore. Nothing that belongs to one
place - a house's pool - SHALL reach across a road. No object SHALL float visibly above the
ground or be sunk into it. No two surfaces SHALL flicker against each other.

#### Scenario: Palms along the shore
- **WHEN** the layout is checked
- **THEN** every palm, tree, building, lamp and person stands on land clear of the waterline

#### Scenario: Piers, stilt cabins and boats
- **WHEN** the layout is checked
- **THEN** every pier starts on the bank and ends over the water with its deck above it
- **AND** every stilt cabin's floor stands above the water
- **AND** every boat and kayak floats on water, none on land

#### Scenario: The lakefront street on a low shore
- **WHEN** the visitor looks or walks along the lakefront street where the shore is lowest
- **THEN** the street's surface stands above the water, with no water across its edge

#### Scenario: A house's pool
- **WHEN** the layout is checked
- **THEN** no house's pool lies across a road

#### Scenario: Close inspection
- **WHEN** the visitor zooms toward any building, tree or vehicle
- **THEN** it meets the ground without a visible gap or a buried base

### Requirement: The world stays generated

The appearance SHALL be produced without downloading any texture, environment map, sky
image or model for the world. Everything the world shows is generated in the visitor's
browser. The one exception is the people - the visitor's walking character and the
townsfolk - whose models are downloaded after the world has been drawn.

#### Scenario: Network inspection
- **WHEN** the hub is loaded and the world has been drawn
- **THEN** no image, environment map or model file has been requested for the 3D world other than the people's models
