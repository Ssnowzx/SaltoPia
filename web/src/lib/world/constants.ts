/**
 * Every fixed number the 3D neighbourhood depends on.
 *
 * Nothing in the scene may use a literal for a duration, a colour, a camera bound or a
 * terrain dimension - see CLAUDE.md, "sem numero magico". When a value appears here it
 * can be tuned in one place and reasoned about without reading the renderer.
 */

/** Colours, matching the `--color-*` tokens in globals.css. */
export const WORLD_COLORS = {
  /** Highland grass in full light. */
  grass: "#8fb862",
  /** Grass in shade, and the darker patches between fields. */
  grassDeep: "#66914a",
  /** Dry highland straw on exposed ground. */
  straw: "#d8bf86",
  /** Bare basalt on the ridges. */
  rock: "#8d8f88",
  /** Basalt catching direct sun. */
  rockLight: "#aeb0a7",
  /** Cold highland water. */
  water: "#6fb3c4",
  /** Araucaria canopy. */
  canopy: "#28604a",
  /** Conifer mass behind the town. */
  conifer: "#356b4c",
  /** Araucaria bark. */
  bark: "#4a3a2c",
  /** Whitewashed walls. */
  whitewash: "#f4ead8",
  /** Unpainted timber. */
  timber: "#8a5f3c",
  /** Dark roof tile. */
  tile: "#a85031",
  /** Ember terracotta, the brand accent, used sparingly in the scene. */
  ember: "#c4522e",
  /** Earth roads. */
  road: "#8a6a4a",
} as const;

/** Sky gradient stops - late golden hour over the campos. See design.md D6. */
export const SKY_COLORS = {
  high: "#f2c879",
  mid: "#e89f5e",
  low: "#d97b4a",
  haze: "#f0e2cc",
} as const;

/** Terrain extent. The neighbourhood sits in a bowl this wide. */
export const TERRAIN = {
  /** Side length in world units. */
  size: 300,
  /** Vertices per side. Higher reads smoother but costs geometry. */
  segments: 150,
  /** Where the ground plane sits before displacement. */
  baseHeight: 0,
} as const;

/** Water plane height. Slightly below zero so the river cuts into the valley floor. */
export const WATER_LEVEL = -2.2;

/** Camera framing and the bounds that keep the neighbourhood in frame. */
export const CAMERA = {
  fov: 38,
  near: 0.5,
  far: 900,
  /** Where the camera sits before the visitor takes control. */
  initialPosition: [0, 44, 104] as const,
  /** What it looks at. */
  target: [0, 6, -30] as const,
  /** Orbit distance limits. */
  minDistance: 45,
  maxDistance: 190,
  /** Polar angle limits, in radians. Stops the camera going under the terrain or overhead. */
  minPolarAngle: 0.22,
  maxPolarAngle: 1.31,
  /** How far the orbit target may be panned from the origin. */
  maxTargetOffset: 26,
} as const;

/** Idle drift - the slow bounded orbit that keeps the world from reading as a still image. */
export const DRIFT = {
  /** Seconds of no input before drift resumes. See the world-map spec. */
  resumeAfterSeconds: 3,
  /** Radians per second. Deliberately slow enough to be felt rather than watched. */
  speed: 0.018,
  /** How far the drift may wander from where the visitor left the camera, in radians. */
  amplitude: 0.5,
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
