## Purpose

Defines how the hub's 3D world must look and read - sky, light, atmosphere, water,
ground, streets, buildings and vegetation - and the visual defects it must never show,
so that the world reads as a believable place at golden hour rather than as a toy.

## ADDED Requirements

### Requirement: One sun and one sky light the world

The sky SHALL be graded as a sunset seen through an atmosphere: deep blue overhead,
warming to gold and orange toward a sun that sits low over the hills. The sun SHALL read
as a bright disc with a soft glow, not as a painted fan of rays. A layer of cloud SHALL be
lit by that sun, bright on the edges that face it and darker away from it.

Every lit surface in the world SHALL take its light from that same sun and sky: shadows
fall away from the sun, and faces turned away from it are lit by the sky rather than
going black.

#### Scenario: Visitor looks at the wide shot
- **WHEN** the hub is showing its composed wide shot
- **THEN** the sun is a disc low over the hills with no ray fan around it
- **AND** the sky shades from blue overhead to gold toward the sun
- **AND** the clouds are brighter on their sunward edges

#### Scenario: A house in the shade of its own roof
- **WHEN** the visitor zooms toward a building's wall facing away from the sun
- **THEN** that wall is visibly lit by the sky, with its colour still readable
- **AND** the building's shadow falls on the side away from the sun

### Requirement: Distance is carried by atmosphere

Land SHALL fade toward the colour of the sky behind it as it recedes, warmer in the
direction of the sun and cooler away from it, so that the far hills read as layers of
distance.

From any camera position the visitor can reach, the world MUST NOT show its own edge: no
end of the terrain, no plane beneath it, no hard band where the land stops and the sky
begins.

#### Scenario: Horizon in the wide shot
- **WHEN** the hub shows its composed wide shot
- **THEN** the farthest hills are paler and closer to the sky's colour than the near ones
- **AND** no straight edge of land, and no flat band of a single colour, separates the land from the sky

#### Scenario: Camera at the edge of its orbit
- **WHEN** the visitor orbits to either end of the permitted arc and zooms fully out
- **THEN** no edge of the terrain and nothing beneath it is visible in the frame

### Requirement: The lake reflects its surroundings

The lake SHALL reflect what stands around it - the far shore, the hills, the boats and
the sky - in the right place, broken up by moving ripples. The sun SHALL lay a glittering
path across the water toward the viewer. The body colour of the water SHALL read as a
highland reservoir - dark green-blue in the deep, clearing toward the bank - and the bank
SHALL show through the shallows at the water's edge.

No repeating tile, grid or seam pattern MUST be visible on the water at any zoom the
visitor can reach.

#### Scenario: Boats near the far shore
- **WHEN** the visitor zooms toward a boat on the water
- **THEN** a broken reflection of the boat and of the shore behind it is visible beneath it

#### Scenario: Water surface at close zoom
- **WHEN** the visitor zooms fully into any stretch of open water
- **THEN** no regular grid, repeating tile or straight seam is visible on the surface

### Requirement: The ground varies like land

The ground SHALL vary across the world the way highland land does: meadow, drier pasture,
darker ground under woods, and mown grass around the houses. Changes between them SHALL be
gradual and irregular.

The ground MUST NOT carry shapes that read as decals: no circular or perfectly regular
patches of a different green around buildings.

#### Scenario: Houses on the slope
- **WHEN** the visitor zooms toward the houses of the community
- **THEN** no house stands on a visible disc of a different colour
- **AND** the grass around the houses blends into the surrounding ground without a hard edge

### Requirement: Streets read as streets

Paved streets SHALL read as asphalt, darker than the ground around them, with a kerb and a
pavement along each side, a continuous white line along each edge and a broken yellow line
down the centre. Where two paved streets meet, their surfaces SHALL join as one: no edge of
one street drawn across the other, no gap between them, and no painted line crossing the
junction.

Unpaved tracks SHALL read as earth, with wheel ruts, and SHALL blend into the grass at their
edges rather than ending in a hard line.

No road surface, line, kerb or yard MUST flicker, shimmer or show a ladder of stripes at any
zoom the visitor can reach.

#### Scenario: A junction on the main street
- **WHEN** the visitor zooms toward the junction where the lakefront street meets the main street
- **THEN** the two carriageways join as one surface
- **AND** no centre or edge line runs across the junction
- **AND** no kerb or pavement is drawn across either carriageway

#### Scenario: Track over the plateau
- **WHEN** the visitor zooms toward the plateau track
- **THEN** it reads as earth with ruts, fading into the grass at its sides

#### Scenario: Road surface under movement
- **WHEN** the camera drifts or flies over any road
- **THEN** no part of its surface, lines or kerbs flickers or stripes

### Requirement: Buildings read as built

Every building SHALL be built the way buildings are: roofs overhang their walls at the
eaves; the triangle under a gable is wall, in the wall's own material; windows are framed
and glazed, and the glass catches the light of the sky; doors have a step or a porch.

Dwellings SHALL be drawn in the region's vernacular - rendered masonry in pale colours and
painted timber, under ceramic tile or dark roofs - in enough variety that a street is not
one house repeated: no dwelling SHALL stand beside a neighbour of the same design.

#### Scenario: A house seen close up
- **WHEN** the visitor zooms toward any house
- **THEN** its roof visibly overhangs its walls
- **AND** its gable ends are wall, not roof tile
- **AND** its windows show frames and glass that reflect the sky

#### Scenario: A row of houses
- **WHEN** the layout is checked
- **THEN** no dwelling's nearest neighbouring dwelling is of the same design

### Requirement: Vegetation grows like vegetation

Trees SHALL grow in groves and woods with open ground between them, not spread evenly
across the land. Neighbouring trees of the same kind SHALL differ in colour and size. The
araucárias SHALL show the region's signature silhouette: a bare trunk under a flat,
cup-shaped crown of upturned branches ending in dense tufts.

#### Scenario: The slope behind the community
- **WHEN** the visitor looks at the land between the houses and the woods
- **THEN** trees stand in clusters with open grass between them
- **AND** neighbouring trees differ in shade of green

### Requirement: Nothing stands where it cannot

No object that belongs on land SHALL stand in the water, and no object that belongs on the
water SHALL stand on land. No object SHALL float visibly above the ground or be sunk into
it. No two surfaces SHALL flicker against each other.

#### Scenario: Palms along the shore
- **WHEN** the layout is checked
- **THEN** every palm, tree, building, lamp and person stands on land clear of the waterline

#### Scenario: Close inspection
- **WHEN** the visitor zooms toward any building, tree or vehicle
- **THEN** it meets the ground without a visible gap or a buried base

### Requirement: The world stays generated

The appearance SHALL be produced without downloading any texture, environment map, sky
image or model for the world. Everything the world shows is generated in the visitor's
browser.

#### Scenario: Network inspection
- **WHEN** the hub is loaded and the world has been drawn
- **THEN** no image, environment map or model file has been requested for the 3D world

### Requirement: Ambient motion honours reduced motion

The world's ambient motion - drifting cloud and moving ripples - SHALL hold still when the
visitor has asked for reduced motion. Holding still MUST NOT change what the world shows
beyond the motion itself.

#### Scenario: Visitor prefers reduced motion
- **WHEN** `prefers-reduced-motion: reduce` is set and the hub is shown
- **THEN** the clouds do not drift and the water's ripples do not move
- **AND** the sky, the reflections and the light are otherwise the same as with motion
