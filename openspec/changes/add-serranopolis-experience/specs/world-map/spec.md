## Purpose

Defines the 3D neighbourhood that acts as the site's hub — what a visitor sees and can do
inside it, how the camera behaves, what happens while it loads, and what the experience
degrades to when the device cannot render it.

## ADDED Requirements

### Requirement: The hub is a non-scrolling 3D surface

The route `/` SHALL present the neighbourhood as a fullscreen WebGL surface. The document
MUST NOT scroll: its scrollable height stays equal to the viewport height. Navigation
happens through the world, not through scroll position.

#### Scenario: Visitor attempts to scroll the hub
- **WHEN** the visitor scrolls, swipes vertically, or presses Page Down on `/`
- **THEN** the document does not scroll to new content
- **AND** the gesture is interpreted as a camera control (zoom) or ignored

#### Scenario: Hub presented on a phone
- **WHEN** `/` is opened at a viewport 400px wide
- **THEN** the world fills the viewport with no horizontal overflow
- **AND** every point of interest remains reachable, through the map or the navigation menu

### Requirement: Entry sequence

The hub SHALL open on a title state showing the wordmark, the tagline and a single
"EXPLORAR SERRANÓPOLIS" action, over the world already rendering behind it. Choosing that
action clears the title state and hands control of the world to the visitor.

#### Scenario: Visitor arrives at the hub
- **WHEN** `/` finishes loading
- **THEN** the wordmark, tagline and the explore action are visible over the rendered world
- **AND** the pins and the full navigation bar are not yet shown

#### Scenario: Visitor starts exploring
- **WHEN** the visitor activates the explore action
- **THEN** the title state leaves
- **AND** the pins and navigation bar appear
- **AND** the camera is under the visitor's control

### Requirement: Camera choreography

The camera SHALL hold a low aerial three-quarter view of the neighbourhood. When idle it
drifts continuously — a slow, bounded orbit — so the world never reads as a still image.

The visitor SHALL be able to orbit by dragging and zoom by wheel or pinch. Orbit and zoom
MUST be bounded so that the camera cannot go below the terrain, cannot invert, and cannot
travel far enough to lose the neighbourhood from frame.

#### Scenario: World left untouched
- **WHEN** no input has been received for 3 seconds and no flight is in progress
- **THEN** the camera resumes its idle drift
- **AND** the drift stays within the bounds that keep the neighbourhood in frame

#### Scenario: Visitor drags past a bound
- **WHEN** the visitor drags or zooms beyond a configured limit
- **THEN** the camera stops at the limit without snapping back or passing through terrain

### Requirement: Flight to a point of interest

The system SHALL be able to fly the camera to a framed view of any point of interest over
`--duration-flight` using `--ease-flight`. A flight already in progress MUST be superseded
by a newly requested one rather than queued or run concurrently.

#### Scenario: Flight requested
- **WHEN** a flight to a point of interest is requested
- **THEN** the camera reaches that point's framed view within `--duration-flight`
- **AND** idle drift is suspended for the duration of the flight

#### Scenario: Second flight requested mid-flight
- **WHEN** a flight is requested while another is running
- **THEN** the running flight is cancelled from its current position
- **AND** the camera continues to the newly requested view without a visible jump

### Requirement: Scene composition from data

The neighbourhood SHALL be composed at runtime from a typed layout describing each placed
object's model, position, rotation and scale — not delivered as a single pre-baked scene
file. Repeated objects (trees, rocks, street furniture) MUST be drawn with instancing.

Araucária trees, the signature tree of the Serra Catarinense and absent from every available
CC0 kit, SHALL be generated procedurally.

#### Scenario: Layout entry references a missing model
- **WHEN** the layout names a model that fails to load
- **THEN** the rest of the neighbourhood still renders
- **AND** the failure is reported in the console rather than blanking the scene

#### Scenario: Repeated scenery
- **WHEN** the same model appears more than 20 times in the layout
- **THEN** those copies are drawn as a single instanced batch

### Requirement: Loading experience

The hub SHALL show determinate loading progress while 3D assets download, and MUST NOT
present the explore action until the neighbourhood can be rendered.

The total compressed 3D payload MUST NOT exceed 8 MB.

#### Scenario: Assets still downloading
- **WHEN** the visitor opens `/` and assets are incomplete
- **THEN** a progress indicator reflecting real load progress is shown
- **AND** the explore action is not yet available

#### Scenario: Payload budget exceeded
- **WHEN** a build produces a compressed 3D payload above 8 MB
- **THEN** this violates the performance budget and the build is treated as failing

### Requirement: Performance budget

On integrated graphics at 1920x1080 the hub SHALL sustain 60fps during idle drift and hold
at or above 30fps during a camera flight.

The renderer MUST cap its pixel ratio at 2 so that a high-density display does not multiply
fragment cost without visible benefit.

#### Scenario: Sustained frame rate measured
- **WHEN** the hub runs for 30 seconds of idle drift on integrated graphics at 1080p
- **THEN** the median frame time stays at or below 16.7ms

#### Scenario: High-density display
- **WHEN** the hub renders on a display reporting a device pixel ratio above 2
- **THEN** the drawing buffer is sized using a pixel ratio of 2

### Requirement: Fallback when the world cannot render

When WebGL2 is unavailable or the renderer fails to initialise, the hub SHALL present a
static illustrated view of the neighbourhood carrying the same points of interest as
navigable links. The visitor MUST NOT reach a blank screen or a dead end.

#### Scenario: Device without WebGL2
- **WHEN** a visitor opens `/` on a device where WebGL2 cannot be initialised
- **THEN** a static illustrated neighbourhood is shown
- **AND** every point of interest is reachable as a link
- **AND** no error dialog is presented

#### Scenario: Renderer fails after a successful start
- **WHEN** the WebGL context is lost during the session
- **THEN** the experience switches to the static view rather than freezing on a dead canvas
