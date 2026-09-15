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
"EXPLORAR SALTOPIA" action, over the world. Choosing that action clears the title state and
hands control of the world to the visitor.

The title state SHALL be present from the first paint, and the explore action SHALL be
unavailable until the world has been drawn, so that the visitor can never enter a world
that is not there. If the world has still not been drawn after a bounded wait, the action
SHALL become available anyway rather than leave the visitor with no way forward.

Returning to the hub from within the site SHALL NOT replay the title state. A reload, a
typed address or a fresh visit SHALL play it.

#### Scenario: Visitor arrives at the hub
- **WHEN** `/` is first painted
- **THEN** the wordmark, tagline and the explore action are visible
- **AND** the explore action is unavailable until the world has been drawn
- **AND** the pins and the full navigation bar are not yet shown

#### Scenario: World cannot be drawn
- **WHEN** the world has not been drawn after the bounded wait
- **THEN** the explore action becomes available regardless
- **AND** the visitor is never left on a screen with no way forward

#### Scenario: Visitor returns from a place page
- **WHEN** the visitor navigates back to `/` from a page of this site
- **THEN** the hub opens with the world under the visitor's control and no title state

#### Scenario: Visitor reloads the hub
- **WHEN** the visitor reloads `/`
- **THEN** the title state plays again

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

A zoom is aimed: it moves toward whatever the visitor pointed at, which moves what the
camera is looking at. Zooming in and back out therefore does not return the camera to
where it started. Whenever the camera is back in its widest band, the view SHALL settle
onto the composed wide shot, so that pulling back always gives the same framing of the
neighbourhood rather than whatever the last aimed zoom left behind.

#### Scenario: World left untouched
- **WHEN** no input has been received for 3 seconds and no flight is in progress
- **THEN** the camera resumes its idle drift
- **AND** the drift stays within the bounds that keep the neighbourhood in frame

#### Scenario: Visitor drags past a bound
- **WHEN** the visitor drags or zooms beyond a configured limit
- **THEN** the camera stops at the limit without snapping back or passing through terrain

#### Scenario: Visitor zooms in on something and back out
- **WHEN** the visitor zooms toward a point and then zooms back out to the widest view
- **THEN** the view settles onto the composed wide shot of the neighbourhood
- **AND** the nearest buildings are whole rather than cut by the edge of the frame
- **AND** the settling is a movement, so under reduced motion it resolves at once

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

The hub MUST NOT present the explore action until the neighbourhood can be rendered.

The total compressed 3D payload MUST NOT exceed 8 MB. Nothing in the world is downloaded:
every object is generated at runtime, so the budget is spent on code rather than on models.

#### Scenario: World still being built
- **WHEN** the visitor opens `/` and the scene has not been drawn
- **THEN** the title state is shown and the explore action is not yet available

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

### Requirement: One composition at any viewport shape

The hub SHALL hold its composition whatever the shape of the viewport: the whole
neighbourhood stays in frame on a phone held upright as it does on a wide screen, with no
horizontal overflow at any width.

On a touch screen one finger SHALL orbit the world and two SHALL zoom it, and the gesture
MUST NOT be handed to the page as a scroll.

#### Scenario: Hub on a tall viewport
- **WHEN** `/` is opened at a viewport taller than it is wide
- **THEN** the neighbourhood is framed whole rather than cropped to a strip
- **AND** no point of interest is pushed off the sides

#### Scenario: Visitor drags on a touch screen
- **WHEN** the visitor drags one finger across the world
- **THEN** the camera orbits
- **AND** the page does not scroll or bounce

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
