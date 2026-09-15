/**
 * Every fixed number the 3D neighbourhood depends on.
 *
 * Nothing in the scene may use a literal for a duration, a colour, a camera bound or a
 * terrain dimension - see CLAUDE.md, "sem numero magico". When a value appears here it
 * can be tuned in one place and reasoned about without reading the renderer.
 *
 * The world is the community at the Salto do Rio Caveiras reservoir, seen at sunset from
 * the south: the lake with its island in the middle distance, the houses on the near
 * shore, low forested hills dissolving into haze behind.
 */

/** Scene colours. Brand tokens live in globals.css; these are the world's own palette. */
export const WORLD_COLORS = {
  /** Highland grass in full light. */
  grass: "#8fb554",
  /** Grass in shade, and the darker patches between fields. */
  grassDeep: "#5f8a45",
  /** Mown lawns around the houses. */
  lawn: "#a5cc66",
  /** Dry highland straw on exposed ground. */
  straw: "#cfb884",
  /** Sand on the lake shore. */
  sand: "#d6c59b",
  /** Bare basalt. */
  rock: "#7d807b",
  /** Basalt catching direct sun. */
  rockLight: "#a3a59e",
  /** Basalt in shadow. */
  rockDark: "#5e615d",
  /** Forest on the far hills - olive, going tan on the tops, like the plateau in the photo. */
  forest: "#5f7f40",
  hilltop: "#a89a58",
  /** What distance drains the far hills toward. */
  hillHaze: "#c9a878",
  /** Araucaria foliage. */
  canopy: "#2f6b4d",
  /** Araucaria foliage in shade. */
  canopyDark: "#24523c",
  /** Conifer mass behind the town. */
  conifer: "#3a7a52",
  /** Broadleaf native trees. */
  foliage: "#7ea346",
  /** Broadleaf trees turning in the cold. */
  foliageWarm: "#b5bd4e",
  /** Palm fronds. */
  palm: "#5f9a4e",
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
  /** Terracotta-orange render, the lakeside houses. */
  terracotta: "#c9773f",
  /** Dark slate roofs, the lakeside houses. */
  slateDark: "#3b4a52",
  /** Live embers. */
  ember: "#c4522e",
  emberGlow: "#ff8a3d",
  /** Earth tracks. */
  road: "#a7845c",
  /** The stone-sett streets Lages is known for. */
  street: "#8f8c85",
  /** Kerbs and pavements. */
  kerb: "#b8b3a8",
  /** Stone paving in the square. */
  paving: "#c9bfae",
  /** Dressed stone - walls, platforms, the well. */
  stone: "#9a948a",
  stoneDark: "#77716a",
  /** Ironwork. */
  metal: "#5c5f63",
  rail: "#8a8e93",
  ballast: "#8b8378",
  /** Clouds: lit tops and shaded undersides. */
  cloud: "#f8ecd6",
  cloudShade: "#dcc4a6",
  /** Lit lantern glass. */
  lantern: "#f2c14e",
  /** Vine rows. */
  vine: "#4e8a48",
  vinePost: "#6b4b32",
  /** The pickup that drives the streets. */
  carBody: "#b8432f",
  carCab: "#f4ead8",
  wheel: "#2e241c",
  /** Parked cars. */
  sedanWhite: "#f1efe9",
  sedanDark: "#3a3f45",
  sedanSilver: "#b9bcc0",
  /** The train. */
  trainBody: "#324453",
  trainRoof: "#a85031",
  trainWagon: "#6b4b32",
  /** The boat. */
  boatHull: "#f3efe6",
  boatTrim: "#1f6068",
  /** Chimney smoke and spray. */
  smoke: "#f3ede4",
  /** The sun disc. */
  sun: "#ffe7b8",
  /** White water on the falls and at the plunge pool. */
  foam: "#eaf5f7",
  /** Pool water. */
  pool: "#7fc4d6",
  /** Roof and wall variety. */
  slate: "#4a5560",
  paleYellow: "#f1dc9c",
  mint: "#cfe0d2",
  shingle: "#5c3f2e",
  wine: "#7b2d3f",
  frostBlue: "#5b7f9e",
  coretoGreen: "#4f8f86",
} as const;

/** Sky gradient stops - sunset over the reservoir: blue overhead, gold at the sun. */
export const SKY_COLORS = {
  high: "#e8732a",
  mid: "#f0a03c",
  low: "#f7d264",
  haze: "#f4dca4",
} as const;

/** The lake's shading. */
export const LAKE_COLORS = {
  deep: "#22b3b8",
  shallow: "#6fe0d8",
  /** What the surface reflects at a grazing angle - the pale sky near the horizon. */
  reflection: "#bfeee6",
  /** The sun's glitter path. */
  glitter: "#ffe6a0",
} as const;

/** Where the sun sits, as a direction from the origin: upper right, just above the hills. */
export const SUN_DIRECTION = { x: 0.62, y: 0.22, z: -1 } as const;

/** Terrain extent. */
export const TERRAIN = {
  size: 420,
  segments: 210,
} as const;

/** The reservoir. */
export const LAKE = {
  /** Water surface height. */
  level: 0.6,
  /** Lake bed height. */
  floor: -4.2,
  /** Where the dam sits, at the reservoir's north-east corner. */
  dam: { x: 112, z: -104 },
  /** River level below the dam. */
  riverLevel: -5,
  riverHalfWidth: 5,
  /** The extent the water surface mesh is built over. */
  bounds: { minX: -210, maxX: 150, minZ: -150, maxZ: 110 },
} as const;

/** The river below the dam, kept as its own block for the falls geometry. */
export const RIVER = {
  level: -5,
  floor: -7.5,
  halfWidth: 5,
  fallsStartX: 112,
  fallsEndX: 119,
} as const;

/** Where a road or rail deck sits when it crosses water. */
export const BRIDGE_DECK_HEIGHT = 1.5;

/** Streets and tracks. */
export const ROAD = {
  streetWidth: 5.2,
  /** Kerb and pavement strip either side of a street. */
  kerbExtra: 1.6,
  drivewayWidth: 3.6,
  trailWidth: 3.0,
  pathWidth: 2.4,
  /** Lift above the terrain so the ribbon never z-fights with it. */
  lift: 0.16,
} as const;

/** Atmospheric depth. The far hills dissolve into this. */
export const FOG = {
  near: 280,
  far: 720,
} as const;

/** The railway. */
export const RAIL = {
  bedWidth: 2.9,
  gauge: 1.15,
  railWidth: 0.22,
  lift: 0.14,
  sleeperSpacing: 1.7,
} as const;

/** Clouds drifting over the valley - thin sunset streaks, not cumulus. */
export const CLOUDS = {
  count: 11,
  minHeight: 64,
  maxHeight: 108,
  spread: 420,
  driftSpeed: 1.1,
} as const;

/** The haze lying on the far shore. */
export const MIST = {
  count: 8,
  height: 9,
  nearZ: -92,
  farZ: -112,
} as const;

/** Vehicles. */
export const VEHICLES = {
  carSpeed: 6.5,
  trainSpeed: 8.5,
  trainCarSpacing: 3.9,
  boatSpeed: 4.2,
} as const;

/** Chimney smoke. */
export const SMOKE = {
  puffsPerSource: 7,
  lifeSeconds: 4.8,
  riseSpeed: 1.5,
} as const;

/** The Porto de OVNIs on the plateau, the map's most distant attraction. */
export const UFO_PORT = { x: 22, z: -196 } as const;

/** Map pins. */
export const PIN = {
  anchorHeight: 9,
} as const;

/** Rendering quality switches, for the presentation machine. */
export const QUALITY = {
  postProcessing: true,
  ambientOcclusion: true,
} as const;

/** Camera framing and the bounds that keep the neighbourhood in frame. */
export const CAMERA = {
  fov: 52,
  near: 0.5,
  far: 1400,
  /** From the south, high enough to see over the community to the lake and island. */
  initialPosition: [34, 68, 168] as const,
  target: [16, 2, -54] as const,
  minDistance: 40,
  maxDistance: 205,
  /** No top-down view: the town is composed for a low, cinematic angle. */
  minPolarAngle: 0.78,
  maxPolarAngle: 1.38,
  /** The world is built to be seen from the south, so the orbit is held to an arc. */
  minAzimuthAngle: -0.42,
  maxAzimuthAngle: 0.42,
} as const;

/** Idle drift - a slow sway within the azimuth arc. */
export const DRIFT = {
  resumeAfterSeconds: 3,
  speed: 0.09,
  amplitude: 0.14,
} as const;

/** Camera flight to a point of interest. Matches the reference implementation. */
export const FLIGHT = {
  durationSeconds: 2,
  ease: "power2.inOut",
} as const;

/** Renderer limits. */
export const RENDERER = {
  maxPixelRatio: 2,
} as const;

/** Seed for every pseudo-random decision in the scene, so the town is identical each load. */
export const WORLD_SEED = 20260914;
