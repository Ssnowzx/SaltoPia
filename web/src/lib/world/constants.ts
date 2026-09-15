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
  road: "#9c8a6e",
  /** The stone-sett streets Lages is known for. */
  /** The wet earth at the waterline. There is no sand on a river bank. */
  wetBank: "#5d5a3a",
  barnRed: "#a8442f",
  barnOchre: "#b87a36",
  street: "#838079",
  roadLine: "#e6dcc4",
  /** Kerbs and pavements. */
  kerb: "#c2bcaf",
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
  cloud: "#fff3e4",
  cloudShade: "#e6b49a",
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
  /** Dusk overhead: a sunset sky is violet-blue at the zenith, not orange all the way up. */
  high: "#6f6fa4",
  mid: "#dc8a56",
  low: "#f6c66a",
  haze: "#f2d6ae",
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
  // Wide enough to carry the UFO port out to the far end of the plateau and still
  // leave land behind it. The segment count keeps roughly the same metres per vertex.
  size: 620,
  segments: 262,
} as const;

/** The reservoir. */
export const LAKE = {
  /** Water surface height. */
  level: 0.6,
  /** Lake bed height. */
  /** Shallow: the water is opaque, and a deep basin only makes the banks steep. */
  floor: -3.0,
  /** Where the dam sits, at the reservoir's north-east corner. */
  dam: { x: 112, z: -104 },
  /** River level below the dam. */
  riverLevel: -5,
  riverHalfWidth: 5,
  /** The extent the water surface mesh is built over. */
  // The basin covers everything west of the east shore, so the water surface has to
  // reach the terrain edge: stopping short left a dry trench at the frame edge.
  bounds: { minX: -318, maxX: 126, minZ: -158, maxZ: 318 },
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

/** Streets and tracks. Widths live in road-network.ts, where the terrain reads them. */
export const ROAD = {
  /** The broken centre line: dash pitch and width. */
  centreLineSpacing: 13,
  centreLineWidth: 0.26,
  /** Lift above the graded ground, so the ribbon never z-fights with it. */
  lift: 0.18,
} as const;

/** Atmospheric depth. The far hills dissolve into this. */
export const FOG = {
  /** The town is clear, the far shore is lightly veiled, the back hills dissolve. */
  near: 270,
  far: 900,
} as const;

/** Clouds drifting over the valley - thin sunset streaks, not cumulus. */
export const CLOUDS = {
  count: 9,
  minHeight: 96,
  maxHeight: 132,
  spread: 420,
  driftSpeed: 1.1,
} as const;

/** Vehicles. */
export const VEHICLES = {
  carSpeed: 6.5,
  boatSpeed: 4.2,
  /**
   * How high a hull rides above the surface. The water is opaque, and a boat placed at
   * the surface showed nothing but its deck - a plank adrift in the middle of the lake.
   */
  boatFreeboard: 0.45,
} as const;

/** Chimney smoke. */
export const SMOKE = {
  puffsPerSource: 7,
  lifeSeconds: 4.8,
  riseSpeed: 1.5,
} as const;

/** The Porto de OVNIs on the plateau, the map's most distant attraction. */
export const UFO_PORT = { x: 22, z: -288 } as const;

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
  // Far enough back to hold the whole spread: the places run from the pousada at the
  // south end to the dam in the north, and a tighter frame cut the southern half off.
  initialPosition: [44, 92, 220] as const,
  target: [44, 2, -45] as const,
  minDistance: 40,
  maxDistance: 290,
  /** No top-down view: the town is composed for a low, cinematic angle. */
  minPolarAngle: 0.78,
  maxPolarAngle: 1.24,
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
  /** Base duration, plus a little per unit travelled, capped. */
  durationSeconds: 1.7,
  secondsPerUnit: 0.0035,
  maxDurationSeconds: 3,
  ease: "power2.inOut",
  /** How high the path arcs above the higher end, as a share of the distance. */
  arcLift: 0.22,
} as const;

/** Renderer limits. */
export const RENDERER = {
  maxPixelRatio: 2,
} as const;

/** Seed for every pseudo-random decision in the scene, so the town is identical each load. */
export const WORLD_SEED = 20260914;
