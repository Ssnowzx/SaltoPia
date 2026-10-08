## MODIFIED Requirements

### Requirement: Scene composition from data

The neighbourhood SHALL be composed at runtime from a typed layout describing each placed
object's model, position, rotation and scale — not delivered as a single pre-baked scene
file. Repeated objects (trees, rocks, street furniture) MUST be drawn with instancing: the
copies of a model are drawn together, in a few batches, never one by one.

Araucária trees, the signature tree of the Serra Catarinense and absent from every available
CC0 kit, SHALL be generated procedurally.

A tree far from the camera MAY be drawn in a simpler form of itself that keeps its outline
and its colour. Within 200 m of the camera every tree SHALL be drawn in full. A tree MUST NOT
switch back and forth between the two while the camera holds still or barely moves.

#### Scenario: Layout entry references a missing model
- **WHEN** the layout names a model that fails to load
- **THEN** the rest of the neighbourhood still renders
- **AND** the failure is reported in the console rather than blanking the scene

#### Scenario: Repeated scenery
- **WHEN** the same model appears more than 20 times in the layout
- **THEN** those copies are drawn instanced, in a few batches rather than one per copy

#### Scenario: Visitor walks among the araucárias
- **WHEN** the visitor, on foot, stands among araucárias
- **THEN** every tree within 200 m of the camera is drawn in full detail

#### Scenario: The composed wide shot
- **WHEN** the hub shows its composed wide shot
- **THEN** the distant woods keep the outline and the colour they have in full detail

### Requirement: Performance budget

On integrated graphics at 1920x1080 the hub SHALL sustain 60fps during idle drift and hold
at or above 30fps during a camera flight.

When the frame rate stays below 30fps, the hub SHALL step its image quality down one tier at
a time, and never back up within a visit. Each step gives up image refinements - ambient
occlusion, the lake's reflection, pixel density, shadow resolution, multisampled edges - and
never an object of the world.

The renderer MUST cap its pixel ratio at 2 so that a high-density display does not multiply
fragment cost without visible benefit.

#### Scenario: Sustained frame rate measured
- **WHEN** the hub runs for 30 seconds of idle drift on integrated graphics at 1080p
- **THEN** the median frame time stays at or below 16.7ms

#### Scenario: Weak hardware
- **WHEN** the frame rate stays below 30fps for a few seconds
- **THEN** the hub steps down one quality tier, keeping every object of the world in view
- **AND** it does not step back up within the visit

#### Scenario: High-density display
- **WHEN** the hub renders on a display reporting a device pixel ratio above 2
- **THEN** the drawing buffer is sized using a pixel ratio of 2
