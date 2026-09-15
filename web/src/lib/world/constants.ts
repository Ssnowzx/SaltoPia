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
  rockDark: "#6f716c",
  /** Frost on the peaks. */
  frost: "#eef3f6",
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
} as const;

/** Sky gradient stops - late golden hour over the campos. See design.md D6. */
export const SKY_COLORS = {
  high: "#f4cf86",
  mid: "#f0b26a",
  low: "#e69357",
  haze: "#f3e4cb",
} as const;

/** Terrain extent. The neighbourhood sits in a bowl this wide. */
export const TERRAIN = {
  /** Side length in world units. */
  size: 300,
  /** Vertices per side. Higher reads smoother but costs geometry. */
  segments: 160,
} as const;

/** Water surface height. The river trench is carved deeper than this. */
export const WATER_LEVEL = -2.2;

/** Where a road or rail deck sits when it crosses the river. */
export const BRIDGE_DECK_HEIGHT = 0.7;

/** Roads. */
export const ROAD = {
  width: 4.4,
  /** Lift above the terrain so the ribbon never z-fights with it. */
  lift: 0.16,
  /** Radius of the ring road around the square. */
  ringRadius: 11.5,
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
  count: 12,
  minHeight: 60,
  maxHeight: 94,
  /** Horizontal extent they wander across. */
  spread: 230,
  /** World units per second. */
  driftSpeed: 1.5,
} as const;

/** The bank of mist the Mirante da Neblina looks out over. */
export const MIST = {
  count: 9,
  height: 15,
  nearZ: -66,
  farZ: -92,
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
  fov: 46,
  near: 0.5,
  far: 1200,
  /** Where the camera sits before the visitor takes control. */
  initialPosition: [0, 54, 122] as const,
  /** What it looks at. */
  target: [0, 4, -14] as const,
  /** Orbit distance limits. */
  minDistance: 40,
  maxDistance: 200,
  /** Polar angle limits, in radians. Stops the camera going under the terrain or overhead. */
  minPolarAngle: 0.2,
  maxPolarAngle: 1.42,
} as const;

/** Idle drift - the slow bounded orbit that keeps the world from reading as a still image. */
export const DRIFT = {
  /** Seconds of no input before drift resumes. See the world-map spec. */
  resumeAfterSeconds: 3,
  /** Radians per second. Deliberately slow enough to be felt rather than watched. */
  speed: 0.018,
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
