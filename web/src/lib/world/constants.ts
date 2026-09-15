/**
 * Every fixed number the 3D neighbourhood depends on.
 *
 * Nothing in the scene may use a literal for a duration, a colour, a camera bound or a
 * terrain dimension - see CLAUDE.md, "sem numero magico". When a value appears here it
 * can be tuned in one place and reasoned about without reading the renderer.
 */

/** Scene colours. Brand tokens live in globals.css; these are the world's own palette. */
export const WORLD_COLORS = {
  /** Highland grass in full light. */
  grass: "#8fb862",
  /** Grass in shade, and the darker patches between fields. */
  grassDeep: "#66914a",
  /** Dry highland straw on exposed ground. */
  straw: "#d8bf86",
  /** Bare basalt. */
  rock: "#8d8f88",
  /** Basalt catching direct sun. */
  rockLight: "#aeb0a7",
  /** Basalt in shadow, and mountain flanks. */
  rockDark: "#5e615d",
  /** Frost on the peaks. */
  frost: "#f4f7f8",
  /** Cold highland water. */
  water: "#6fb3c4",
  /** Shallows along the banks. */
  waterEdge: "#a9d6de",
  /** Araucaria foliage. */
  canopy: "#2f6b4d",
  /** Araucaria foliage in shade. */
  canopyDark: "#24523c",
  /** Conifer mass behind the town. */
  conifer: "#3a7a52",
  /** Broadleaf native trees. */
  foliage: "#5d9a4e",
  /** Broadleaf trees turning in the cold. */
  foliageWarm: "#9fae4a",
  /** Araucaria bark. */
  bark: "#4a3a2c",
  /** Whitewashed walls. */
  whitewash: "#f4ead8",
  /** Unpainted timber. */
  timber: "#8a5f3c",
  /** Weathered timber. */
  timberDark: "#5f4028",
  /** Roof tile. */
  tile: "#a85031",
  /** Roof tile in shade, and dark ironwork. */
  tileDark: "#7e3a24",
  /** Ember terracotta, the brand accent. */
  ember: "#c4522e",
  /** Live embers. */
  emberGlow: "#ff8a3d",
  /** Earth roads. */
  road: "#a7845c",
  /** Stone paving in the square. */
  paving: "#c9bfae",
  /** Dressed stone - walls, platforms, the well. */
  stone: "#9a948a",
  /** Stone in shade. */
  stoneDark: "#77716a",
  /** Ironwork. */
  metal: "#5c5f63",
  /** Rails. */
  rail: "#8a8e93",
  /** Track ballast. */
  ballast: "#8b8378",
  /** Cloud in sun. */
  cloud: "#fff5e6",
  /** Cloud underside. */
  cloudShade: "#f6dcc0",
  /** Lit lantern glass. */
  lantern: "#f2c14e",
  /** Vine rows. */
  vine: "#4e8a48",
  /** Vineyard posts. */
  vinePost: "#6b4b32",
  /** The pickup that drives the circuit. */
  carBody: "#c4522e",
  carCab: "#f4ead8",
  wheel: "#2e241c",
  /** The train. */
  trainBody: "#324453",
  trainRoof: "#c4522e",
  trainWagon: "#6b4b32",
  /** Chimney smoke. */
  smoke: "#f3ede4",
  /** The sun disc. */
  sun: "#ffe9b0",
  /** White water on the falls and at the plunge pool. */
  foam: "#eaf5f7",
  /** Roof and wall variety, so no two landmarks share a palette. */
  slate: "#4a5560",
  paleYellow: "#f1dc9c",
  mint: "#cfe0d2",
  shingle: "#5c3f2e",
  wine: "#7b2d3f",
  frostBlue: "#5b7f9e",
  coretoGreen: "#4f8f86",
} as const;

/** Sky gradient stops - late golden hour over the campos. See design.md D6. */
export const SKY_COLORS = {
  high: "#e66a33",
  mid: "#f0a340",
  low: "#f4cf7a",
  haze: "#f6e5bc",
} as const;

/** The river's width along its course. Half-widths, in world units. */
export const RIVER = {
  halfWidth: 4.2,
  /** The sheet of the falls. */
  fallsHalfWidth: 12,
  /** The plunge pool below them. */
  poolHalfWidth: 8,
  /** The reservoir behind the weir on the plateau. */
  reservoirHalfWidth: 9,
  /** The lake the river opens into south of town. */
  lakeHalfWidth: 17,
  lake: { startZ: 60, fullZ: 84, taperZ: 108, endZ: 130 },
  reservoir: { startZ: -80, fullZ: -94 },
} as const;

/** Map pins. */
export const PIN = {
  /** How far above the ground the pin's anchor floats. */
  anchorHeight: 9,
} as const;

/** Rendering quality switches, for the presentation machine. */
export const QUALITY = {
  postProcessing: true,
  ambientOcclusion: true,
} as const;

/** Terrain extent. The neighbourhood sits in a bowl this wide. */
export const TERRAIN = {
  /** Side length in world units. */
  size: 300,
  /** Vertices per side. Higher reads smoother but costs geometry. */
  segments: 160,
} as const;

/** Water surface height in the valley. The river trench is carved deeper than this. */
export const WATER_LEVEL = -2.2;

/**
 * The scarp the river comes over. North of the lip the whole valley floor steps up
 * onto a plateau; the river descends the step as the waterfall.
 */
export const WATERFALL = {
  /** Where the plateau begins (top of the upper step). */
  lipZ: -77,
  /** Where the valley floor resumes (foot of the lower step). */
  footZ: -66,
  /** Total height of the two steps. */
  drop: 12,
} as const;

/** Where a road or rail deck sits when it crosses the river. */
export const BRIDGE_DECK_HEIGHT = 0.7;

/** Roads. */
export const ROAD = {
  width: 4.4,
  drivewayWidth: 3.6,
  trailWidth: 3.0,
  pathWidth: 2.4,
  /** Lift above the terrain so the ribbon never z-fights with it. */
  lift: 0.16,
} as const;

/** Atmospheric depth. The far edge of the terrain dissolves into this. */
export const FOG = {
  near: 260,
  far: 760,
} as const;

/** The railway through the old station. */
export const RAIL = {
  bedWidth: 2.9,
  /** Distance between the two rails. */
  gauge: 1.15,
  railWidth: 0.22,
  lift: 0.14,
  sleeperSpacing: 1.7,
} as const;

/** Clouds drifting over the valley. */
export const CLOUDS = {
  count: 14,
  minHeight: 62,
  maxHeight: 100,
  /** Horizontal extent they wander across. */
  spread: 270,
  /** World units per second. */
  driftSpeed: 1.5,
  /** Coral clouds against the sunset, like the reference - shaded underneath. */
  colorTop: "#f2a077",
  colorBottom: "#d9633c",
} as const;

/** The bank of mist the Mirante da Neblina looks out over. */
export const MIST = {
  count: 8,
  height: 25,
  nearZ: -74,
  farZ: -96,
} as const;

/** Vehicles. */
export const VEHICLES = {
  /** World units per second. */
  carSpeed: 6.5,
  trainSpeed: 8.5,
  /** Distance between the centres of consecutive train cars. */
  trainCarSpacing: 3.9,
} as const;

/** Chimney smoke. */
export const SMOKE = {
  puffsPerSource: 7,
  /** Seconds a puff lives before it recycles. */
  lifeSeconds: 4.8,
  /** World units per second. */
  riseSpeed: 1.5,
} as const;

/** Camera framing and the bounds that keep the neighbourhood in frame. */
export const CAMERA = {
  fov: 48,
  near: 0.5,
  far: 1400,
  /** Where the camera sits before the visitor takes control - far enough that every
   * landmark, the lake in front and the serra behind share the frame. */
  initialPosition: [0, 54, 156] as const,
  /** What it looks at. */
  target: [0, 2, -20] as const,
  /** Orbit distance limits. */
  minDistance: 32,
  maxDistance: 230,
  /** Polar angle limits, in radians. No top-down view: the town is composed for a
   * low, cinematic angle, and from above the clouds sit between camera and ground. */
  minPolarAngle: 0.62,
  maxPolarAngle: 1.32,
  /**
   * Azimuth limits, in radians. The world is built to be seen from the south, like
   * the reference - a full orbit would show the back of the serra and the edge of the
   * terrain, so the camera is held to an arc.
   */
  minAzimuthAngle: -0.72,
  maxAzimuthAngle: 0.72,
} as const;

/** Idle drift - a slow sway within the azimuth arc, so the world never reads as a still. */
export const DRIFT = {
  /** Seconds of no input before drift resumes. See the world-map spec. */
  resumeAfterSeconds: 3,
  /** Radians per second of the sway's phase. */
  speed: 0.09,
  /** How far the sway carries from where the visitor left the camera, in radians. */
  amplitude: 0.14,
} as const;

/** Camera flight to a point of interest. Matches the reference implementation. */
export const FLIGHT = {
  durationSeconds: 2,
  ease: "power2.inOut",
} as const;

/** Renderer limits. */
export const RENDERER = {
  /**
   * A denser display multiplies fragment cost without visible benefit at this art
   * direction, so the drawing buffer is capped. Required by the world-map spec.
   */
  maxPixelRatio: 2,
} as const;

/** Seed for every pseudo-random decision in the scene, so the town is identical each load. */
export const WORLD_SEED = 20260914;
