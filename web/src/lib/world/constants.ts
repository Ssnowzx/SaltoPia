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
  grass: "#7e9c49",
  /** Grass in shade, and the darker patches between fields. */
  grassDeep: "#577639",
  /** Drier pasture - the campo going yellow in the cold. */
  pasture: "#a29b5b",
  /** The floor of the woods. */
  forestFloor: "#46532d",
  /** Mown lawns around the houses. */
  lawn: "#88ad50",
  /** Bare earth on banks too steep for grass. */
  bankEarth: "#6a5a42",
  /** The lake bed, seen at the waterline. */
  lakeBed: "#4f5238",
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
  canopy: "#2d5f45",
  /** Araucaria foliage in shade. */
  canopyDark: "#1f4834",
  /** Conifer mass behind the town. */
  conifer: "#3a7a52",
  /** Broadleaf native trees. */
  foliage: "#7ea346",
  /** The shaded heart of a broadleaf crown. */
  foliageDark: "#4f7535",
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
  /** The woods beyond the map, seen from far off. */
  farCanopy: "#34502b",
  farCanopyLight: "#4b6636",
  farPasture: "#8a9657",
  /** Pool water. */
  pool: "#7fc4d6",
  /** Low sunlight, as it comes through leaves. */
  sunlight: "#ffcf8a",
  /** A window lit from inside. */
  windowLight: "#ffb566",
  /** Window glass: dark, so what shows in it is the sky it reflects. */
  glass: "#26313a",
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

/** The lake's colours - a highland reservoir, not a swimming pool. */
export const LAKE_COLORS = {
  /** Open water seen straight down: dark, green-blue. */
  deep: "#1a4047",
  /** A few metres out from the bank. */
  shallow: "#2f5549",
  /** The bank itself, seen through the first metre of water. */
  bed: "#4a4633",
  /** The sky a ripple reflects when there is no planar pass: overhead, and at the horizon. */
  zenith: "#5d7aa8",
  horizon: "#e9c39a",
  /** The sun's glitter path, HDR so it alone blooms on the water. */
  glitter: "#fff0d0",
} as const;

/** The water surface's ripples and reflection - design.md D4 of elevate-world-realism. */
export const WATER = {
  /** Cycles per world unit of the broadest ripple octave. */
  rippleFrequency: 0.11,
  /** Scales the ripple slope: higher is a choppier surface. */
  rippleHeight: 0.38,
  driftSpeed: 0.18,
  /** Fine ripples fade out between these distances from the eye. */
  detailNear: 70,
  detailFar: 420,
  /** How far a ripple bends the reflection, in texture units. */
  distortion: 0.024,
  glitterSharpness: 700,
  glitterStrength: 60,
} as const;

/** The planar reflection pass. */
export const REFLECTION = {
  /** Share of the drawing buffer's width and height the reflection is rendered at. */
  scale: 0.5,
  /** Lowers the clip plane under the surface so the shoreline does not open a seam. */
  clipBias: 0.003,
  /** The layer the water sits on, which the mirror camera does not draw. */
  waterLayer: 1,
  /** The layer for woods further than `reach` from the water, which no reflection shows. */
  unreflectedLayer: 2,
  reach: 90,
} as const

/**
 * Where the sun sits, as a direction: upper right, about 3.5 degrees over the horizon - low
 * enough to stand in the wide shot just above the far hills, as it does in the reference
 * photograph. The key light is raised above it; see SUN_LIGHT.
 */
export const SUN_DIRECTION = { x: 0.62, y: 0.072, z: -1 } as const;

/**
 * The physically based sky (Preetham model) and its cloud layer - design.md D1 of
 * elevate-world-realism. Values are the model's own parameters.
 */
export const SKY = {
  /** Haze in the air: higher is a milkier, redder low sun. */
  turbidity: 4,
  rayleigh: 3,
  mieCoefficient: 0.004,
  mieDirectionalG: 0.9,
  cloudCoverage: 0.32,
  cloudDensity: 0.45,
  cloudElevation: 0.62,
  cloudScale: 0.0002,
  cloudSpeed: 0.00002,
  /** Scales the model's radiance into the range the tone mapper expects. */
  exposure: 1.2,
  /**
   * The brightest the drawn sky may be. The model's sun disc runs to thousands, and the
   * bloom spread that across half the frame as an orange veil over the town.
   */
  ceiling: 14,
  /** Colour grade applied to the model's output. */
  saturation: 1.45,
  /** Multiplied into the sky's colour. */
  tint: { r: 1.06, g: 0.98, b: 0.9 },
  /** Half the size of the box the sky is drawn on - inside the camera's far plane. */
  scale: 1000,
} as const;

/**
 * Aerial perspective - the colour the air adds with distance, by direction of view.
 * Linear colours given as sRGB hex; `brightness` scales them to the sky's radiance.
 */
export const ATMOSPHERE = {
  /** Toward the sun: the gold of the low sky. */
  sunward: "#ffd49a",
  /** Across the light. */
  side: "#e8c3a3",
  /** Away from the sun: the cool violet-grey of the shadowed sky. */
  away: "#b4afc4",
  brightness: 0.6,
  /** How quickly the air thickens past `FOG.near`, and how sharply. */
  falloff: 1.5,
  curve: 1.9,
} as const;

/**
 * The key light: from the sun's own azimuth, so shadows fall away from the sun in the sky,
 * but raised to about 24 degrees. At the disc's true 10.6 degrees every tree threw a shadow
 * across half the town and the facades facing the camera were all in shade.
 */
export const SUN_LIGHT = {
  position: { x: 238, y: 158, z: -294 },
  /** Where it points: the middle of the community. */
  target: { x: 50, y: 0, z: 10 },
  color: "#ffd3a1",
  intensity: 3.0,
} as const;

/** Image-based light rendered from the sky once at load. */
export const ENVIRONMENT = {
  intensity: 1.15,
  /** The brightest the baked sky may be, in the sky's own radiance units. */
  ceiling: 1.2,
  /** The ground colour the environment sees below the horizon - bounce light off grass. */
  ground: "#3e4a2c",
} as const;

/** Terrain extent. */
export const TERRAIN = {
  // Wide enough to carry the UFO port out to the far end of the plateau and still
  // leave land behind it. The segment count keeps roughly the same metres per vertex.
  size: 620,
  segments: 262,
} as const;

/** The land beyond the map's edge - design.md D3 of elevate-world-realism. */
export const OUTER_LAND = {
  /** How far past the terrain's border the ring reaches. */
  reach: 1300,
  /** Each ring of vertices is this much wider than the last. */
  ringGrowth: 1.22,
  /** Over this distance the terrain's own shape gives way to the highland. */
  blendDistance: 140,
  /** The same, where the map ends in the lake: the far shore comes up sooner. */
  lakeBlendDistance: 45,
  /** Over this distance the terrain's colour gives way to woodland. */
  colourBlend: 90,
  baseHeight: 12,
  hillHeight: 56,
  hillFrequency: 0.0045,
  riseFrom: 200,
  riseTo: 1000,
  riseHeight: 70,
  /** The highland never dips below the water: it has no lake of its own. */
  shoreClearance: 1.4,
  /** How far past the border the woods carry on, thinning as they go. */
  treeBand: 70,
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
  bounds: { minX: -470, maxX: 126, minZ: -158, maxZ: 318 },
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

/** How road surfaces are built - design.md D6 of elevate-world-realism. */
export const ROAD_SURFACE = {
  /** Sample spacing along a road, in metres. */
  step: 1.2,
  /** Height of the kerb, and so of the pavement above the carriageway. */
  kerbHeight: 0.15,
  /** The main road is a town street, with pavements, between these z. */
  townNorth: -70,
  townSouth: 150,
  /** Half the length of a zebra crossing along its street. */
  crosswalkHalfLength: 1.8,
  /** Markings stop this far short of another road's edge, and ease back in over `junctionFade`. */
  junctionMargin: 1.2,
  junctionFade: 2.5,
  /** A pavement stops this far short of another road's edge. */
  pavementClearance: 0.4,
  /** No pavement is laid closer than this to the water. */
  waterfrontClearance: 9,
  /** The gravel shoulder of a street out of town. */
  shoulder: 1.1,
  /** The grass verge that carries a road's raised edge down to the field, and its foot's lift. */
  vergeWidth: 1.1,
  vergeFoot: 0.03,
} as const;

/** Road colours, as sRGB hex; the material works in linear. */
export const ROAD_COLORS = {
  asphalt: "#46474a",
  /** Road paint: the white of edge lines, crossings and bays, the yellow of the centre line. */
  line: "#ecebe4",
  centre: "#e2b43c",
  pavement: "#b9b3a6",
  kerb: "#cbc6bc",
  earth: "#8c7554",
  gravel: "#9d9380",
} as const;

/** Scales and widths of the road material's texture and paint, in metres. */
export const ROAD_SHADING = {
  grassFineTile: 9,
  grassBroadTile: 37,
  asphaltTile: 3.5,
  earthTile: 4.5,
  /** Broken centre line: one dash per period, the dash this share of it. */
  dashPeriod: 9,
  dashShare: 0.36,
  centreHalfWidth: 0.07,
  /** Edge lines sit this far in from the carriageway's edge. */
  edgeInset: 0.35,
  edgeHalfWidth: 0.07,
  zebraPitch: 0.9,
  slab: 1,
  bayWidth: 2.6,
} as const;

/** Atmospheric depth. The far hills dissolve into this. */
export const FOG = {
  /** The town is clear, the far shore is lightly veiled, the back hills dissolve. */
  near: 270,
  far: 900,
} as const;

/** Vehicles. */
export const VEHICLES = {
  // The route runs 529 units from the south entrance to the port gate; at 6.5 a single
  // leg took 81 seconds and the traffic read as parked.
  carSpeed: 9.5,
  /** How far right of the centre line traffic drives - half a 2.8 m lane. */
  laneOffset: 1.4,
  boatSpeed: 4.2,
  /**
   * How high a hull rides above the surface. The water is opaque, and a boat placed at
   * the surface showed nothing but its deck - a plank adrift in the middle of the lake.
   */
  boatFreeboard: 0.45,
} as const;

/** Chimney smoke - soft billboards, design.md D9 of elevate-world-realism. */
export const SMOKE = {
  puffsPerSource: 10,
  lifeSeconds: 6.5,
  riseSpeed: 1.3,
  windSpeed: 0.55,
  /** A puff's width in world units at birth, and how much it grows over its life. */
  birthSize: 0.9,
  growth: 3.4,
  opacity: 0.32,
} as const;

/** The Ovni Porto on the plateau, the map's most distant attraction. */
export const UFO_PORT = { x: 22, z: -288 } as const;

/** The finish of each atlas surface - design.md D7 of elevate-world-realism. */
export const SURFACE_FINISH = {
  glassRoughness: 0.06,
  waterRoughness: 0.1,
  metalRoughness: 0.42,
  metalMetalness: 0.6,
  tileRoughness: 0.66,
  /** Windows lit from inside at dusk: the share lit, the glow's strength, and the cell size
   * (per world unit) the lit/dark choice is made over - about one window. */
  litShare: 0.3,
  /** Cycles per world unit of the leaf clumping, and how much low sun comes through a crown's edge. */
  leafScale: 1.3,
  leafTransmission: 0.9,
  windowGlow: 1.6,
  windowCell: 0.34,
} as const;

/** The dwellings' palette: the render, timber paint, roofs and shutters of the Serra. */
export const DWELLING_COLORS = {
  white: "#eee8db",
  cream: "#e6d6b4",
  yellow: "#e9cf86",
  salmon: "#d69a7c",
  sage: "#b9c4a2",
  sobrado: "#efe3cc",
  timberGreen: "#6d8a66",
  timberBlue: "#7f9db4",
  timberOchre: "#c39a50",
  timberNatural: "#8d6440",
  /** Ceramic telha, fresh and weathered. */
  tile: "#b3573b",
  tileDeep: "#94442e",
  slateGrey: "#5a6069",
  /** Painted corrugated iron. */
  tin: "#56606a",
  shingle: "#4a3a2d",
  shutterGreen: "#4d6b4c",
  shutterBlue: "#3f5d78",
  shutterWhite: "#f1ede4",
  trimCream: "#e8e0cd",
} as const;

/** How buildings are put together - design.md D7 of elevate-world-realism. */
export const BUILDING = {
  /** How far a roof reaches past the side walls, and past the gable walls. */
  eave: 0.45,
  gableOverhang: 0.32,
  roofThickness: 0.16,
  /** The gable wall stops this far under the roof slab, so the two never share a plane. */
  gableClearance: 0.03,
  /** One window roughly every this many metres of wall. */
  windowPitch: 2.2,
} as const;

/** Walk mode - design.md of add-walking-character. */
export const WALK = {
  /** Metres per second, walking and running, and how fast the body turns, in rad/s. */
  walkSpeed: 2.3,
  runSpeed: 5.6,
  turnRate: 10,
  /** Speed eases toward its target at this many e-folds per second. */
  acceleration: 9,
  /** The character's own radius, for collisions. */
  radius: 0.35,
  /** The character's height, to which each model is scaled. */
  height: 1.75,
  /** Ground under the water's level plus this is water. */
  wetMargin: 0.15,
  /** How far inside the map's square the character must stay. */
  edgeMargin: 4,
  /** Tree trunks and buildings as obstacles: shares of a placement's scale and footprint. */
  trunkRadius: 0.42,
  buildingShare: 0.85,
  /** Obstacles are bucketed on a grid of this size. */
  obstacleCell: 16,
  /** The path-finding grid's cell, and how far round a place its arrival area reaches. */
  gridCell: 2,
  arrivalMargin: 5,
  arrivalMinimum: 8,
  /** A route's waypoint counts as reached within this distance. */
  waypointReach: 0.8,
} as const;

/** The townsfolk's behaviour - design.md D2 of add-living-townsfolk. */
export const TOWNSFOLK = {
  /** Spacing of points on a pavement route, in metres. */
  routeStep: 3,
  /** How far in front of a shop its window-shopper stands. */
  windowDistance: 4.6,
  turnRate: 5,
  /** A gesture every so many seconds, between these, and how long one lasts. */
  gestureEvery: [9, 16] as const,
  gestureSeconds: 2.4,
  /** Seconds stood at the end of an out-and-back route. */
  pauseAtEnds: [2, 5] as const,
  /** Within this a townsperson stops for the visitor; beyond the second it goes on. */
  noticeWithin: 2.2,
  releaseBeyond: 3.5,
  /** At most one wave per visitor per this many seconds. */
  greetEvery: 20,
  /** A townsperson's radius, for the visitor's collisions. */
  radius: 0.35,
} as const;

/** Where a new walker is put down: by the square, facing the water. */
export const WALK_SPAWN = { x: 57, z: 26, heading: -2.2 } as const;

/** The camera that follows the walker - design.md D5 of add-walking-character. */
export const WALK_CAMERA = {
  lookHeight: 1.45,
  startDistance: 8,
  startLift: 3.2,
  creatorDistance: 4.2,
  creatorLift: 0.2,
  creatorMinDistance: 2.4,
  minDistance: 3.5,
  maxDistance: 24,
  minPolarAngle: 0.35,
  maxPolarAngle: 1.42,
  groundClearance: 0.6,
} as const;

/** Map pins. */
export const PIN = {
  anchorHeight: 9,
} as const;

/**
 * Bloom. The sky near a low sun is itself brighter than 1, and at a threshold of 1 its whole
 * glow bloomed and washed the town orange; only the disc and the glitter on the water are
 * meant to cross this.
 */
export const BLOOM = {
  threshold: 4,
  smoothing: 0.6,
  intensity: 0.45,
  radius: 0.7,
} as const;

/** Rendering quality switches, for the presentation machine. */
export const QUALITY = {
  postProcessing: true,
} as const;

/**
 * The quality tiers, highest first - design.md D10 of elevate-world-realism. Below the high
 * tier the sun's shadow map is a quarter the size - the 4096² map is 64 MB of depth a weak
 * GPU writes every frame - and the lowest tier gives up multisampling. See design.md D5 of
 * speed-up-the-hub.
 */
export type QualityTier = "high" | "medium" | "low";

export interface QualitySettings {
  /** Share of the drawing buffer the lake's reflection renders at; 0 turns it off. */
  readonly reflection: number;
  readonly ambientOcclusion: boolean;
  readonly maxPixelRatio: number;
  /** The sun's shadow map, in texels a side. */
  readonly shadowMapSize: number;
  /** Samples per pixel in the effect composer's buffer; 0 for none. */
  readonly multisampling: number;
}

export const QUALITY_TIERS: Readonly<Record<QualityTier, QualitySettings>> = {
  high: { reflection: 0.5, ambientOcclusion: true, maxPixelRatio: 2, shadowMapSize: 4096, multisampling: 4 },
  medium: { reflection: 0.35, ambientOcclusion: false, maxPixelRatio: 1.5, shadowMapSize: 2048, multisampling: 4 },
  low: { reflection: 0, ambientOcclusion: false, maxPixelRatio: 1, shadowMapSize: 2048, multisampling: 0 },
};

export const QUALITY_ORDER: readonly QualityTier[] = ["high", "medium", "low"];

/** Soft shadow edges: the PCF sampling radius, in shadow-map texels. */
export const SHADOW = {
  radius: 3,
} as const;

/** Camera framing and the bounds that keep the neighbourhood in frame. */
export const CAMERA = {
  fov: 52,
  near: 0.5,
  far: 1400,
  /** From the south, high enough to see over the community to the lake and island. */
  // Far enough back to hold the whole spread: the places run from the pousada at the
  // south end to the dam in the north, and a tighter frame cut the southern half off.
  // High enough that the near shore is inside the frame: from lower down the bottom edge
  // sliced through the first row of houses, which reads as the map being cut off.
  initialPosition: [44, 104, 226] as const,
  target: [44, 2, -45] as const,
  minDistance: 40,
  maxDistance: 320,
  /** No top-down view: the town is composed for a low, cinematic angle. */
  minPolarAngle: 0.78,
  maxPolarAngle: 1.24,
  /** The world is built to be seen from the south, so the orbit is held to an arc. */
  minAzimuthAngle: -0.42,
  maxAzimuthAngle: 0.42,
} as const;

/**
 * How the composed wide shot is recovered after an aimed zoom.
 *
 * Zooming toward the cursor moves what the camera looks at, and zooming back out does not
 * put it back: a visitor who inspects one roof and pulls away is left aimed at that roof,
 * with the near houses cut off below the frame. Past `fromDollyShare` of the dolly range -
 * the band where the view is meant to read as the portrait of the whole neighbourhood -
 * the aim eases back to CAMERA.target.
 */
export const HOME_FRAMING = {
  /** Where in the dolly range the pull begins; 1 is fully pulled back. */
  fromDollyShare: 0.78,
  /** Strength of the ease, in e-folds per second at the far end of the range. */
  ratePerSecond: 1.6,
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

/** How the terrain's surface is textured - design.md D5 of elevate-world-realism. */
export const TERRAIN_SHADING = {
  /** World units per repeat of the grass texture, close up and far off. */
  fineTile: 9,
  broadTile: 37,
  /** Size of the slow brightness variation, and its strength either way. */
  macroScale: 55,
  macroAmount: 0.09,
  /** Ground normal Y below which grass gives way to earth. */
  steepFrom: 0.72,
  steepTo: 0.9,
} as const;

/** How far one tree's shade may stray from its kind's: lightness and warmth, either way. */
export const VEGETATION_TINT = {
  lightness: 0.09,
  warmth: 0.07,
} as const;

/** The grove field: where woods stand and where the pasture is open. */
export const GROVES = {
  /** Cycles per world unit of the broad pattern - woods a few hundred metres across. */
  frequency: 1 / 70,
  /** A finer field that roughens the edge of each wood. */
  edgeFrequency: 1 / 18,
  edgeRoughness: 0.18,
  /** Below this the land is open; above `woodedAbove` it is wood. */
  openBelow: 0.42,
  woodedAbove: 0.62,
} as const;

/** Seed for every pseudo-random decision in the scene, so the town is identical each load. */
export const WORLD_SEED = 20260914;
