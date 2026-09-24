## MODIFIED Requirements

### Requirement: Loading experience

The hub MUST NOT present the explore action until the neighbourhood can be rendered.

The total compressed 3D payload MUST NOT exceed 8 MB. Nothing in the world is downloaded:
every object in it is generated at runtime, so the budget is spent on code rather than on
models. The one exception is the people - the visitor's walking character and the
townsfolk: their models are downloaded only after the world has been drawn, and they count
toward the same budget. A person's model that cannot be downloaded MUST NOT stop the hub
from working.

#### Scenario: World still being built
- **WHEN** the visitor opens `/` and the scene has not been drawn
- **THEN** the title state is shown and the explore action is not yet available

#### Scenario: Payload budget exceeded
- **WHEN** a build produces a compressed 3D payload above 8 MB
- **THEN** this violates the performance budget and the build is treated as failing

#### Scenario: Hub first drawn
- **WHEN** the hub is loaded and the world is drawn for the first time
- **THEN** no character model had been requested before that frame

#### Scenario: A character model fails to download
- **WHEN** a character's model cannot be downloaded
- **THEN** the hub goes on working, without that person
