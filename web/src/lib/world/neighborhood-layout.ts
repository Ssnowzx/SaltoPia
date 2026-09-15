import type { BufferGeometry } from "three";

import {
  type BuildingSpec,
  createAraucariaGeometry,
  createBroadleafGeometry,
  createBuildingGeometry,
  createBushGeometry,
  createConiferGeometry,
  createFenceGeometry,
  createLamppostGeometry,
  createRockGeometry,
  createStoneWallGeometry,
} from "./builders";
import { LAKE, TERRAIN, UFO_PORT, VEHICLES, WORLD_COLORS, WORLD_SEED } from "./constants";
import { createAmusementParkGeometry, createRestaurantGeometry } from "./attractions";
import { createFarmGeometry } from "./farms";
import { CHALET_SITES, SITES, siteAt } from "./sites";
import {
  createBosqueSignGeometry,
  createChapelGeometry,
  createCtgGeometry,
  createEstacaoGeometry,
  createGalpaoGeometry,
  createLakeHouseGeometry,
  createMiranteGeometry,
  createPousadaGeometry,
  createPracaGeometry,
  createSaltoGeometry,
  createShopGeometry,
  createVineRowGeometry,
  createVinicolaGeometry,
} from "./landmarks";
import { createRandom } from "./noise";
import { SHIRT_COLORS, createParasolGeometry, createPersonGeometry, createSeatedPersonGeometry } from "./people";
import {
  createAFrameGeometry,
  createKayakGeometry,
  createPalmGeometry,
  createPierGeometry,
  createSailboatGeometry,
  createSedanGeometry,
  createStiltCabinGeometry,
  createYachtGeometry,
} from "./props";
import { ROAD_POLYLINES, YARDS, type Waypoint } from "./road-network";
import { createUfoPortGeometry } from "./ufo-port";
import { eastShoreXAt, farShoreZAt, lakeDistance, peninsulaDistance, riverDistance, terrainHeightAt } from "./terrain";

/**
 * What the community at the Salto is made of, as data.
 *
 * This is the file a reviewer opens to see the town's composition - the reason the
 * scene is assembled from a layout at all rather than shipped as one opaque binary.
 * See design.md D1.
 */

/** Every kind of object that can stand on the terrain or float on the lake. */
export type ModelKey =
  | "araucaria"
  | "araucariaB"
  | "araucariaYoung"
  | "conifer"
  | "broadleaf"
  | "broadleafWarm"
  | "bush"
  | "rock"
  | "palm"
  | "houseWhitewash"
  | "houseYellow"
  | "houseTimber"
  | "houseMint"
  | "cabana"
  | "lakeHouse"
  | "shopBrick"
  | "shopYellow"
  | "shopMint"
  | "shopTimber"
  | "aFrameShingle"
  | "aFrameSlate"
  | "aFrameTile"
  | "stiltCabin"
  | "pier"
  | "sedanWhite"
  | "sedanDark"
  | "sedanSilver"
  | "sailboatMoored"
  | "yachtMoored"
  | "kayak"
  | "personA"
  | "personB"
  | "personC"
  | "personD"
  | "personSeated"
  | "parasolRed"
  | "parasolTeal"
  | "fence"
  | "stoneWall"
  | "lamppost"
  | "vineRow"
  | "praca"
  | "chapel"
  | "galpao"
  | "mirante"
  | "vinicola"
  | "ctg"
  | "estacao"
  | "pousada"
  | "bosqueSign"
  | "salto"
  | "ufoPort"
  | "farmRed"
  | "farmOchre"
  | "farmTimber"
  | "amusementPark"
  | "restaurant";

/** Which shading a model wants: foliage reads better soft, everything built reads flat. */
export const MODEL_SHADING: Readonly<Record<ModelKey, "flat" | "smooth">> = {
  araucaria: "smooth",
  araucariaB: "smooth",
  araucariaYoung: "smooth",
  conifer: "flat",
  broadleaf: "smooth",
  broadleafWarm: "smooth",
  bush: "smooth",
  rock: "flat",
  palm: "flat",
  houseWhitewash: "flat",
  houseYellow: "flat",
  houseTimber: "flat",
  houseMint: "flat",
  cabana: "flat",
  lakeHouse: "flat",
  shopBrick: "flat",
  shopYellow: "flat",
  shopMint: "flat",
  shopTimber: "flat",
  aFrameShingle: "flat",
  aFrameSlate: "flat",
  aFrameTile: "flat",
  stiltCabin: "flat",
  pier: "flat",
  sedanWhite: "flat",
  sedanDark: "flat",
  sedanSilver: "flat",
  sailboatMoored: "flat",
  yachtMoored: "flat",
  kayak: "smooth",
  personA: "smooth",
  personB: "smooth",
  personC: "smooth",
  personD: "smooth",
  personSeated: "smooth",
  parasolRed: "flat",
  parasolTeal: "flat",
  fence: "flat",
  stoneWall: "flat",
  lamppost: "flat",
  vineRow: "smooth",
  praca: "flat",
  chapel: "flat",
  galpao: "flat",
  mirante: "flat",
  vinicola: "flat",
  ctg: "flat",
  estacao: "flat",
  pousada: "flat",
  bosqueSign: "flat",
  salto: "flat",
  ufoPort: "flat",
  farmRed: "flat",
  farmOchre: "flat",
  farmTimber: "flat",
  amusementPark: "flat",
  restaurant: "flat",
};

const HOUSE_BASE: Omit<BuildingSpec, "wallColor" | "roofColor"> = {
  width: 6.2,
  depth: 5.0,
  height: 3.4,
  roofHeight: 2.1,
  chimney: true,
  windows: true,
};

/**
 * Resolves a model key to geometry. This registry is the seam design.md D1 keeps open:
 * swapping a procedural builder for a loaded `.glb` is a change here and nowhere else.
 */
export const MODEL_REGISTRY: Readonly<Record<ModelKey, () => BufferGeometry>> = {
  araucaria: () => createAraucariaGeometry("mature", 9, 3),
  araucariaB: () => createAraucariaGeometry("mature", 7.6, 11),
  araucariaYoung: () => createAraucariaGeometry("young", 4.6, 5),
  conifer: () => createConiferGeometry(6.4),
  broadleaf: () => createBroadleafGeometry(4.4, 2),
  broadleafWarm: () => createBroadleafGeometry(4.0, 9),
  bush: () => createBushGeometry(0.9),
  rock: () => createRockGeometry(1.7),
  palm: () => createPalmGeometry(5.4, 4),
  houseWhitewash: () =>
    createBuildingGeometry({ ...HOUSE_BASE, wallColor: WORLD_COLORS.whitewash, roofColor: WORLD_COLORS.tile, wallSurface: "plaster", roofSurface: "tiles" }),
  houseYellow: () =>
    createBuildingGeometry({ ...HOUSE_BASE, wallColor: WORLD_COLORS.paleYellow, roofColor: WORLD_COLORS.slate, wallSurface: "plaster", roofSurface: "slate" }),
  houseTimber: () =>
    createBuildingGeometry({ ...HOUSE_BASE, wallColor: WORLD_COLORS.timber, roofColor: WORLD_COLORS.tileDark, wallSurface: "planks", roofSurface: "tiles" }),
  houseMint: () =>
    createBuildingGeometry({ ...HOUSE_BASE, wallColor: WORLD_COLORS.mint, roofColor: WORLD_COLORS.slateDark, wallSurface: "plaster", roofSurface: "slate" }),
  cabana: () =>
    createBuildingGeometry({ width: 4.8, depth: 4.2, height: 2.9, roofHeight: 1.7, wallColor: WORLD_COLORS.timberDark, roofColor: WORLD_COLORS.shingle, wallSurface: "planks", roofSurface: "shingle", windows: true }),
  lakeHouse: () => createLakeHouseGeometry(),
  shopBrick: () => createShopGeometry(0),
  shopYellow: () => createShopGeometry(1),
  shopMint: () => createShopGeometry(2),
  shopTimber: () => createShopGeometry(3),
  aFrameShingle: () => createAFrameGeometry(WORLD_COLORS.shingle, "shingle"),
  aFrameSlate: () => createAFrameGeometry(WORLD_COLORS.slateDark, "slate"),
  aFrameTile: () => createAFrameGeometry(WORLD_COLORS.tile, "tiles"),
  stiltCabin: () => createStiltCabinGeometry(),
  pier: () => createPierGeometry(10),
  sedanWhite: () => createSedanGeometry(WORLD_COLORS.sedanWhite),
  sedanDark: () => createSedanGeometry(WORLD_COLORS.sedanDark),
  sedanSilver: () => createSedanGeometry(WORLD_COLORS.sedanSilver),
  sailboatMoored: () => createSailboatGeometry(WORLD_COLORS.whitewash),
  yachtMoored: () => createYachtGeometry(),
  kayak: () => createKayakGeometry(WORLD_COLORS.lantern),
  personA: () => createPersonGeometry(SHIRT_COLORS[0]),
  personB: () => createPersonGeometry(SHIRT_COLORS[1]),
  personC: () => createPersonGeometry(SHIRT_COLORS[2]),
  personD: () => createPersonGeometry(SHIRT_COLORS[5]),
  personSeated: () => createSeatedPersonGeometry(SHIRT_COLORS[3]),
  parasolRed: () => createParasolGeometry(WORLD_COLORS.ember),
  parasolTeal: () => createParasolGeometry(WORLD_COLORS.coretoGreen),
  fence: () => createFenceGeometry(8),
  stoneWall: () => createStoneWallGeometry(9),
  lamppost: () => createLamppostGeometry(),
  vineRow: () => createVineRowGeometry(4.5),
  praca: () => createPracaGeometry(),
  chapel: () => createChapelGeometry(),
  galpao: () => createGalpaoGeometry(),
  mirante: () => createMiranteGeometry(),
  vinicola: () => createVinicolaGeometry(),
  ctg: () => createCtgGeometry(),
  estacao: () => createEstacaoGeometry(),
  pousada: () => createPousadaGeometry(),
  bosqueSign: () => createBosqueSignGeometry(),
  salto: () => createSaltoGeometry(),
  ufoPort: () => createUfoPortGeometry(),
  farmRed: () => createFarmGeometry(WORLD_COLORS.barnRed),
  farmOchre: () => createFarmGeometry(WORLD_COLORS.barnOchre),
  farmTimber: () => createFarmGeometry(WORLD_COLORS.timber),
  amusementPark: () => createAmusementParkGeometry(),
  restaurant: () => createRestaurantGeometry(),
};

/** One object placed in the world. Y comes from the terrain, or the waterline for boats. */
export interface Placement {
  readonly model: ModelKey;
  readonly x: number;
  readonly z: number;
  readonly rotationY: number;
  readonly scale: number;
  /** Lift above the sampled ground, for objects that sit on a deck or plinth. */
  readonly yOffset: number;
  /** Floats at the lake's surface instead of standing on the ground. */
  readonly afloat?: boolean;
}

function placed(model: ModelKey, x: number, z: number, rotationY = 0, scale = 1): Placement {
  return { model, x, z, rotationY, scale, yOffset: 0 };
}

function afloat(model: ModelKey, x: number, z: number, rotationY = 0, scale = 1): Placement {
  return { model, x, z, rotationY, scale, yOffset: 0, afloat: true };
}

/** Boats read small from the map's distance, so they are built oversized on purpose. */
function afloatBig(model: ModelKey, x: number, z: number, rotationY = 0, scale = 1): Placement {
  return { ...afloat(model, x, z, rotationY, scale * 1.6), yOffset: VEHICLES.boatFreeboard * 1.6 };
}

/**
 * The houses of the community, along the east shore the way the reference photograph
 * has them: the big lakefront places near the water, the rest stepping back up the
 * slope behind the road.
 */
function distanceToPolyline(px: number, pz: number, points: readonly Waypoint[], closed: boolean): number {
  let best = Number.POSITIVE_INFINITY;
  const count = closed ? points.length : points.length - 1;
  for (let index = 0; index < count; index += 1) {
    const [ax, az] = points[index];
    const [bx, bz] = points[(index + 1) % points.length];
    best = Math.min(best, distanceToSegment(px, pz, ax, az, bx, bz));
  }
  return best;
}

/** Scenery keeps off the roads, the yards, the rails and the water. */
/**
 * How much ground each building takes, for the spacing pass. Approximate on purpose -
 * it is a keep-out radius, not a measurement.
 */
const FOOTPRINT: Readonly<Partial<Record<ModelKey, number>>> = {
  pousada: 11,
  praca: 11,
  galpao: 9,
  ctg: 9,
  estacao: 11,
  vinicola: 8,
  mirante: 6,
  salto: 16,
  chapel: 4,
  pier: 5,
  ufoPort: 40,
  farmRed: 26,
  farmOchre: 26,
  farmTimber: 26,
  amusementPark: 30,
  restaurant: 9,
  lakeHouse: 8.4,
  houseWhitewash: 3.6,
  houseYellow: 3.6,
  houseTimber: 3.6,
  houseMint: 3.6,
  cabana: 2.8,
  shopBrick: 4.2,
  shopYellow: 4.2,
  shopMint: 4.2,
  shopTimber: 4.2,
  aFrameShingle: 3.4,
  aFrameSlate: 3.4,
  aFrameTile: 3.4,
  stiltCabin: 4.0,
};

function footprintOf(placement: Placement): number {
  return (FOOTPRINT[placement.model] ?? 2) * placement.scale;
}

/** Candidate nudges, nearest first, so a building moves as little as it has to. */
const NUDGES: ReadonlyArray<readonly [number, number]> = (() => {
  const offsets: Array<readonly [number, number]> = [[0, 0]];
  for (let ring = 1; ring <= 7; ring += 1) {
    for (let step = 0; step < 12; step += 1) {
      const angle = (step / 12) * Math.PI * 2 + ring * 0.27;
      offsets.push([Math.cos(angle) * ring * 2.6, Math.sin(angle) * ring * 2.6]);
    }
  }
  return offsets;
})();

/** Clearance from the centre of the nearest road ribbon, negative when overlapping it. */
function roadClearance(x: number, z: number): number {
  let clearance = Number.POSITIVE_INFINITY;
  for (const road of ROAD_POLYLINES) {
    clearance = Math.min(clearance, distanceToPolyline(x, z, road.points, road.closed) - road.width / 2);
  }
  for (const yard of YARDS) {
    clearance = Math.min(clearance, Math.hypot(x - yard.x, z - yard.z) - yard.radius);
  }
  return clearance;
}

/**
 * Nudges buildings off each other, off the roads and out of the water.
 *
 * Hand-placed coordinates drift out of true every time a road or a landmark moves, and
 * the result was a house standing inside another house on top of the street. Each one
 * now takes the nearest spot that clears everything already placed, so the guarantee
 * holds however the network is redrawn.
 */
function spaceApart(movable: readonly Placement[], fixed: readonly Placement[]): readonly Placement[] {
  const settled: Placement[] = [...fixed];
  const placed: Placement[] = [];

  for (const building of movable) {
    const radius = footprintOf(building);
    const spot =
      NUDGES.find(([dx, dz]) => {
        const x = building.x + dx;
        const z = building.z + dz;
        if (lakeDistance(x, z) < radius + 1.5) return false;
        if (roadClearance(x, z) < radius * 0.85) return false;
        return settled.every((other) => Math.hypot(x - other.x, z - other.z) >= (radius + footprintOf(other)) * 0.92);
      }) ?? [0, 0];

    const moved = { ...building, x: building.x + spot[0], z: building.z + spot[1] };
    settled.push(moved);
    placed.push(moved);
  }

  return placed;
}

const AUTHORED_HOUSES: readonly Placement[] = [
  // Lakefront, looking west over the water, from the south end up to the square.
  placed("lakeHouse", 30, 86, Math.PI * 0.95),
  placed("lakeHouse", 44, 40, Math.PI * 0.9),
  placed("lakeHouse", 70, -14, Math.PI * 0.75),
  placed("cabana", 20, 116, 2.8),
  placed("cabana", 34, 60, 2.6),
  placed("cabana", 54, -10, 2.4),
  // Behind the road, stepping back up the slope and out along it in both directions.
  placed("houseYellow", 62, 112, 3.0),
  placed("houseTimber", 116, 114, 2.9),
  placed("houseMint", 78, 104, 3.0),
  placed("houseYellow", 100, 88, 3.1),
  placed("houseWhitewash", 86, 74, 2.9),
  placed("houseMint", 112, 74, 3.1),
  placed("houseWhitewash", 124, 82, 2.8),
  placed("cabana", 136, 96, 3.0),
  placed("houseYellow", 152, 84, 2.7),
  placed("houseMint", 134, 62, 3.1),
  placed("houseTimber", 120, 22, 2.9),
  placed("houseWhitewash", 96, 22, 2.8),
  placed("houseYellow", 104, -6, 2.6),
  placed("houseTimber", 90, -26, 2.7),
  placed("houseWhitewash", 112, -36, 2.8),
  placed("houseMint", 142, 30, 3.0),
];

/** The chalet village on the ridge behind the far shore, stepping up the slope. */
const FAR_SHORE_CHALETS: readonly Placement[] = CHALET_SITES.map(([x, z], index) => {
  const models: readonly ModelKey[] = ["aFrameShingle", "aFrameSlate", "aFrameTile"];
  // They look out over the water, with just enough variation that the row of roofs
  // does not line up into a single edge.
  return placed(models[index % 3], x, z, 0.14 * (index % 5) - 0.28, 1.9);
});

/** The stilt cabins and piers along the peninsula's south shore. */
const PENINSULA_CABINS: readonly Placement[] = [
  placed("stiltCabin", -148, -30),
  placed("stiltCabin", -128, -28.5, 0.1),
  placed("stiltCabin", -104, -27.5),
  placed("stiltCabin", -80, -28.5, -0.1),
  placed("stiltCabin", -56, -31),
  placed("pier", -140, -28, Math.PI),
  placed("pier", -92, -27, Math.PI),
  placed("pier", -66, -30, Math.PI),
];

/**
 * The landmarks and the community around them.
 *
 * Landmark coordinates match the `world_x` / `world_z` seeded for each place, so a pin
 * and its building agree without either knowing about the other.
 */

/** Every landmark, positioned from the site table. */
const SITE_LANDMARKS: readonly Placement[] = ([
  ["pousada", "pousada-da-geada"],
  ["praca", "praca-do-pinhao"],
  ["galpao", "galpao-do-fogo"],
  ["ctg", "ctg-porteira-do-tropeiro"],
  ["estacao", "estacao-velha"],
  ["vinicola", "vinicola-de-altitude"],
  ["mirante", "mirante-da-neblina"],
  ["bosqueSign", "bosque-das-araucarias"],
  ["salto", "salto-caveiras"],
  ["ufoPort", "porto-de-ovnis"],
  ["farmRed", "fazenda-do-cedro"],
  ["farmOchre", "fazenda-santa-barbara"],
  ["farmTimber", "fazenda-dos-pinheiros"],
  ["amusementPark", "parque-caveiras"],
  ["restaurant", "deck-do-lago"],
] as ReadonlyArray<readonly [ModelKey, string]>).map(([model, slug]) => {
  const site = siteAt(slug);
  return placed(model, site.x, site.z, site.rotationY);
});

/** The shops along the road through the middle of the community. */
const AUTHORED_SHOPS: readonly Placement[] = [
  placed("shopBrick", 62, 96, Math.PI * 0.95),
  placed("shopYellow", 66, 80, Math.PI * 0.95),
  placed("shopMint", 72, 64, Math.PI * 0.95),
  placed("shopTimber", 80, 46, Math.PI * 0.95),
];

/** The landmarks, which never move: pads, pins and driveways all point at them. */
const PINNED: readonly Placement[] = [
  ...SITE_LANDMARKS,
  placed("pier", 38, 8, Math.PI * 0.5),
  placed("chapel", 74, -42, Math.PI),
  ...PENINSULA_CABINS,
  ...FAR_SHORE_CHALETS,
];

const SPACED_BUILDINGS: readonly Placement[] = [
  ...PINNED,
  ...spaceApart([...AUTHORED_HOUSES, ...AUTHORED_SHOPS], PINNED),
];

/** The dwellings, which get a mown lawn around them. Shops face the street instead. */
const HOUSES: readonly Placement[] = SPACED_BUILDINGS.filter((placement) =>
  ["lakeHouse", "houseWhitewash", "houseYellow", "houseTimber", "houseMint", "cabana"].includes(placement.model),
);

export const LANDMARKS: readonly Placement[] = [
  ...SPACED_BUILDINGS,

  // Palms along the foreground shore, as in the photograph.
  ...([
    [16, 54], [20, 64], [13, 74], [23, 82], [10, 92], [6, 104],
    [27, 34], [21, 26], [35, 16], [30, 44], [18, 112], [3, 118],
  ] as ReadonlyArray<readonly [number, number]>).map(([x, z], index) =>
    placed("palm", x, z, index * 0.7, 0.9 + (index % 3) * 0.12),
  ),

  // Parked cars in the car parks and the yards.
  placed("sedanWhite", 21.5, 97.5, 1.27),
  placed("sedanDark", 25, 96.4, 1.27),
  placed("sedanSilver", 28.5, 95.3, 1.27),
  placed("sedanWhite", 23.5, 104, 1.27),
  placed("sedanDark", 27, 102.9, 1.27),
  placed("sedanSilver", 30.5, 101.8, 1.27),
  placed("sedanSilver", 142, 105, 0.5),
  placed("sedanWhite", 145, 107, 0.5),
  placed("sedanDark", 186, -186, 0.9),

  // The vineyard on the slope above the winery.
  ...[126, 132].flatMap((x) => [-26, -22, -18, -14, -10].map((z) => placed("vineRow", x, z))),

  // Lamps along the shore street and the square.
  ...([[46, 24], [50, 12], [58, -2], [36, 60], [44, 80], [60, 82], [98, 70], [124, 92]] as ReadonlyArray<readonly [number, number]>).map(
    ([x, z]) => placed("lamppost", x, z),
  ),

  // Fences and taipas across the campo behind the town.
  placed("fence", 100, 118, 0.3),
  placed("fence", 136, 60, 0.4),
  placed("stoneWall", 140, 20, 0.2),
  placed("stoneWall", 96, -46, 0.3),

  // People, where people actually are.
  ...([
    [30, 56, 0.3], [36, 58, 2.6], [26, 54, 1.4], [40, 62, 3.0],
    [58, 12, 0.5], [50, 10, 2.4], [56, 2, 1.1], [62, 6, 2.9],
    [66, 76, 0.2], [74, 74, 2.8], [82, 72, 1.0], [70, 78, 2.2],
    [124, 94, 0.2], [128, 92, 2.8],
    [136, -100, 0.9], [132, -104, 2.2],
    [104, 72, 1.0], [100, 70, 2.4],
    [92, 36, 0.7], [88, 34, 2.9],
  ] as ReadonlyArray<readonly [number, number, number]>).map(([x, z, rotation], index) => {
    const models: readonly ModelKey[] = ["personA", "personB", "personC", "personD"];
    return placed(models[index % 4], x, z, rotation);
  }),
  placed("personSeated", 34, 52, 2.6),
  placed("personSeated", 52, 4, 1.2),
  placed("personSeated", 134, -102, 0.4),

  // Parasols by the water.
  placed("parasolRed", 28, 48),
  placed("parasolTeal", 34, 40),
  placed("parasolRed", 44, 26),
  placed("parasolTeal", 24, 74),

  // Boats: moored at the piers and pulled up on the shore.
  // Moorings: off the piers, clear of both boats' loops. One moored on a loop is a
  // collision every lap.
  afloatBig("yachtMoored", -84, -20, 0.2),
  afloatBig("yachtMoored", -120, -22, 2.9),
  afloatBig("yachtMoored", 28, 0, 1.8, 0.95),
  afloatBig("yachtMoored", 8, -60, 0.6),
  afloatBig("sailboatMoored", 30, -30, 1.2),
  afloatBig("sailboatMoored", -64, -22, 2.4),
  afloatBig("sailboatMoored", 14, -84, 0.7),
  afloatBig("sailboatMoored", -136, -22, 2.1),
  afloatBig("sailboatMoored", 6, -86, 1.5),
  afloat("kayak", 36, 4, 0.4),
  afloat("kayak", 30, -10, 2.2),
  afloat("kayak", 40, -14, 1.1),
  afloat("kayak", -136, -20, 0.3),
  afloat("kayak", -92, -18, 2.6),

  // Boulders below the falls.
  placed("rock", 124, -102, 0.4, 2.0),
  placed("rock", 130, -95, 1.2, 1.8),
  placed("rock", 118, -108, 2.1, 1.6),
];

/** Lawns around the houses and the resort. */
export const LAWNS: ReadonlyArray<{ readonly x: number; readonly z: number; readonly radius: number }> = [
  ...HOUSES.map((house) => ({
    x: house.x,
    z: house.z,
    radius: house.model === "lakeHouse" ? 10 : house.model === "cabana" ? 5 : 7,
  })),
  ...SITES.filter((site) => site.slug !== "porto-de-ovnis" && site.slug !== "bosque-das-araucarias").map((site) => ({
    x: site.x,
    z: site.z,
    radius: site.pad * 0.6,
  })),
];

interface Clearing {
  readonly x: number;
  readonly z: number;
  readonly radius: number;
}

/** Ground kept clear of scattered scenery so landmarks and homes stay legible. */
const CLEARINGS: readonly Clearing[] = [
  ...SITES.map((site) => ({ x: site.x, z: site.z, radius: site.clearing })),
  ...CHALET_SITES.map(([x, z]) => ({ x, z, radius: 7 })),
  // The approach lane south of the UFO port's apron.
  { x: UFO_PORT.x, z: UFO_PORT.z + 45, radius: 16 },
  // The chapel, the pier and the usina, which have no pin of their own.
  { x: 74, z: -42, radius: 9 },
  { x: 38, z: 8, radius: 7 },
  { x: 128, z: -112, radius: 8 },
  { x: 134, z: -98, radius: 8 },
];

function isInClearing(x: number, z: number, extra = 0): boolean {
  return CLEARINGS.some((clearing) => Math.hypot(x - clearing.x, z - clearing.z) < clearing.radius + extra);
}

function distanceToSegment(px: number, pz: number, ax: number, az: number, bx: number, bz: number): number {
  const abx = bx - ax;
  const abz = bz - az;
  const lengthSquared = abx * abx + abz * abz || 1;
  const t = Math.min(1, Math.max(0, ((px - ax) * abx + (pz - az) * abz) / lengthSquared));
  return Math.hypot(px - (ax + abx * t), pz - (az + abz * t));
}

function isOnInfrastructure(x: number, z: number): boolean {
  if (ROAD_POLYLINES.some((road) => distanceToPolyline(x, z, road.points, road.closed) < road.width / 2 + 2.2)) return true;
  if (YARDS.some((yard) => Math.hypot(x - yard.x, z - yard.z) < yard.radius + 2)) return true;
  if (LAWNS.some((lawn) => Math.hypot(x - lawn.x, z - lawn.z) < lawn.radius - 1)) return true;
  if (x > LAKE.dam.x && riverDistance(x, z) < 12) return true;
  return lakeDistance(x, z) < 3;
}

/**
 * Scatters trees, bushes and rocks.
 *
 * Seeded, so the woods are identical on every load. The peninsula is a dense stand of
 * olive broadleaf with araucarias through it; the community's slope is dotted with
 * round trees; a conifer forest closes the right of the frame, as it does in the
 * reference photograph.
 */
export function createScatter(): readonly Placement[] {
  const random = createRandom(WORLD_SEED);
  const placements: Placement[] = [];
  const half = TERRAIN.size / 2;

  const scatter = (
    model: ModelKey,
    count: number,
    scaleRange: readonly [number, number],
    propose: () => readonly [number, number],
    accept: (x: number, z: number, height: number) => boolean,
    clearance = 2,
  ): void => {
    let placedCount = 0;
    let attempts = 0;
    while (placedCount < count && attempts < count * 30) {
      attempts += 1;
      const [x, z] = propose();
      if (Math.abs(x) > half - 8 || Math.abs(z) > half - 8) continue;
      if (isInClearing(x, z, clearance)) continue;
      if (isOnInfrastructure(x, z)) continue;
      const height = terrainHeightAt(x, z);
      if (height < LAKE.level + 0.3) continue;
      if (!accept(x, z, height)) continue;
      placements.push({
        model,
        x,
        z,
        rotationY: random() * Math.PI * 2,
        scale: scaleRange[0] + random() * (scaleRange[1] - scaleRange[0]),
        yOffset: 0,
      });
      placedCount += 1;
    }
  };

  const onPeninsula = (): readonly [number, number] => [-180 + random() * 155, -78 + random() * 50];
  const inCommunity = (): readonly [number, number] => [30 + random() * 130, -50 + random() * 180];
  const onFarShore = (): readonly [number, number] => {
    const x = -160 + random() * 300;
    return [x, farShoreZAt(x) - random() * 40];
  };
  const onRightEdge = (): readonly [number, number] => [130 + random() * 70, -120 + random() * 250];

  const onLand = (x: number, z: number): boolean => lakeDistance(x, z) > 2;
  const peninsulaGround = (x: number, z: number): boolean => peninsulaDistance(x, z) < -2;
  const inland = (x: number, z: number): boolean => x - eastShoreXAt(z) > 2;

  // The peninsula: dense olive woods with araucarias standing through them.
  scatter("broadleafWarm", 90, [0.9, 1.4], onPeninsula, peninsulaGround, 0);
  scatter("broadleaf", 70, [0.9, 1.4], onPeninsula, peninsulaGround, 0);
  scatter("araucaria", 20, [0.9, 1.25], onPeninsula, peninsulaGround, 0);
  scatter("araucariaB", 16, [0.9, 1.25], onPeninsula, peninsulaGround, 0);

  // The community's slope.
  scatter("broadleafWarm", 70, [0.8, 1.3], inCommunity, (x, z) => onLand(x, z) && inland(x, z), 2);
  scatter("broadleaf", 55, [0.8, 1.3], inCommunity, (x, z) => onLand(x, z) && inland(x, z), 2);
  scatter("araucaria", 16, [0.8, 1.15], inCommunity, (x, z) => onLand(x, z) && inland(x, z), 3);
  scatter("araucariaYoung", 14, [0.7, 1.2], inCommunity, (x, z) => onLand(x, z) && inland(x, z), 3);
  scatter("bush", 80, [0.7, 1.3], inCommunity, (x, z) => onLand(x, z) && inland(x, z), 1);

  // The conifer forest closing the right of the frame.
  scatter("conifer", 110, [0.8, 1.35], onRightEdge, onLand, 2);
  scatter("conifer", 60, [0.8, 1.4], onFarShore, onLand, 2);

  // Woods behind the far shore.
  scatter("broadleafWarm", 110, [0.9, 1.5], onFarShore, onLand, 2);
  scatter("broadleaf", 80, [0.9, 1.5], onFarShore, onLand, 2);

  // Basalt on the high ground.
  scatter("rock", 45, [0.6, 2.2], inCommunity, (_x, _z, height) => height > 14);

  // Woods running back over the plateau, so the horizon is forested land receding into
  // haze rather than bare domes. They thin out toward the UFO port's clearing.
  const onPlateau = (): readonly [number, number] => [-215 + random() * 430, -126 - random() * 92];
  scatter("conifer", 230, [0.8, 1.5], onPlateau, onLand, 2);
  scatter("broadleafWarm", 190, [0.9, 1.7], onPlateau, onLand, 2);
  scatter("broadleaf", 150, [0.9, 1.7], onPlateau, onLand, 2);
  scatter("araucaria", 46, [0.9, 1.35], onPlateau, onLand, 3);

  // The high plateau carrying the UFO port. Left bare it read as desert from the port's
  // own camera, which is the one view where it fills the frame.
  const onFarPlateau = (): readonly [number, number] => [-230 + random() * 460, -220 - random() * 100];
  scatter("conifer", 220, [0.8, 1.5], onFarPlateau, onLand, 3);
  scatter("broadleafWarm", 150, [0.9, 1.7], onFarPlateau, onLand, 3);
  scatter("araucaria", 54, [0.9, 1.4], onFarPlateau, onLand, 4);
  scatter("rock", 60, [0.7, 2.4], onFarPlateau, onLand, 3);

  // The outskirts: everything outside the community, to the edge of the map. Araucaria
  // country - left bare, the edges of the frame read as pasture with nothing on it.
  const outskirts = (x: number, z: number): boolean => {
    const beyondTown = x - eastShoreXAt(z) > 150 || z > 156 || z < -128 || x < -205;
    return onLand(x, z) && beyondTown;
  };
  const onOutskirts = (): readonly [number, number] => [-300 + random() * 600, -318 + random() * 616];
  scatter("araucaria", 520, [0.85, 1.4], onOutskirts, outskirts, 3);
  scatter("araucariaB", 380, [0.85, 1.4], onOutskirts, outskirts, 3);
  scatter("conifer", 420, [0.8, 1.5], onOutskirts, outskirts, 2);
  scatter("broadleaf", 300, [0.9, 1.6], onOutskirts, outskirts, 2);
  scatter("bush", 220, [0.7, 1.3], onOutskirts, outskirts, 1);

  return placements;
}

/** Ground height for a placement, so callers do not reach into the terrain module. */
export function groundHeightFor(placement: Placement): number {
  if (placement.afloat) return LAKE.level + placement.yOffset;
  return terrainHeightAt(placement.x, placement.z) + placement.yOffset;
}
