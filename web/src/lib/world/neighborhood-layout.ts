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
import { LAKE, TERRAIN, WORLD_COLORS, WORLD_SEED } from "./constants";
import {
  SALTO_ORIGIN,
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
import { RAIL_LINE, ROAD_POLYLINES, YARDS, type Waypoint } from "./roads";
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
  | "salto";

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
  return afloat(model, x, z, rotationY, scale * 1.6);
}

/**
 * The houses of the community, along the east shore the way the reference photograph
 * has them: the big lakefront places near the water, the rest stepping back up the
 * slope behind the road.
 */
const HOUSES: readonly Placement[] = [
  // Lakefront, looking west over the water.
  placed("lakeHouse", 46, 34, Math.PI * 0.9),
  placed("lakeHouse", 72, -10, Math.PI * 0.75),
  placed("cabana", 34, 44, 2.6),
  placed("cabana", 58, 0, 2.4),
  // Behind the road, on the slope.
  placed("houseWhitewash", 84, 54, 2.9),
  placed("houseYellow", 96, 50, 3.1),
  placed("houseTimber", 92, 12, 2.7),
  placed("houseMint", 104, 6, 3.0),
  placed("houseWhitewash", 112, 40, 2.8),
  placed("houseYellow", 76, 92, 3.0),
  placed("houseTimber", 92, 96, 2.9),
  placed("houseMint", 108, 88, 3.1),
  placed("houseWhitewash", 120, 66, 2.8),
  placed("houseYellow", 106, -30, 2.6),
  placed("houseTimber", 122, 16, 2.9),
  placed("cabana", 132, 44, 3.0),
  placed("houseMint", 66, 118, 3.0),
  placed("houseWhitewash", 90, 126, 2.9),
];

/** The chalets along the far shore, packed tight at the waterline. */
const FAR_SHORE_CHALETS: readonly Placement[] = Array.from({ length: 22 }, (_, index) => {
  const models: readonly ModelKey[] = ["aFrameShingle", "aFrameSlate", "aFrameTile"];
  const x = -92 + index * 9.5;
  return placed(models[index % 3], x, farShoreZAt(x) + 7, 0.05 * (index % 3) - 0.05, 1.9);
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
export const LANDMARKS: readonly Placement[] = [
  // The lakefront resort in the foreground - the building the photograph opens on.
  placed("pousada", 32, 62, Math.PI * 0.92),
  // The square on the shore, with its pier.
  placed("praca", 54, 6),
  placed("pier", 40, 4, Math.PI * 0.5),
  placed("chapel", 68, 22, Math.PI),
  // The rest of the community, spread along the shore road.
  placed("galpao", 92, 30, Math.PI),
  placed("ctg", 104, 66, Math.PI),
  placed("estacao", 126, 96, Math.PI),
  placed("vinicola", 116, -18, Math.PI * 0.85),
  placed("mirante", -132, -96, 0.3),
  placed("bosqueSign", -60, -44, 0.6),
  placed("salto", SALTO_ORIGIN.x, SALTO_ORIGIN.z),

  // The row of shops facing the street, awnings toward the water.
  placed("shopBrick", 62, 72, Math.PI * 0.92),
  placed("shopYellow", 70, 70, Math.PI * 0.92),
  placed("shopMint", 78, 68, Math.PI * 0.92),
  placed("shopTimber", 86, 66, Math.PI * 0.92),

  ...HOUSES,
  ...FAR_SHORE_CHALETS,
  ...PENINSULA_CABINS,

  // Palms along the foreground shore, as in the photograph.
  ...([
    [18, 52], [22, 62], [16, 72], [26, 80], [34, 86], [12, 86],
    [30, 36], [24, 28], [40, 18], [44, 46], [52, 52], [8, 96],
  ] as ReadonlyArray<readonly [number, number]>).map(([x, z], index) =>
    placed("palm", x, z, index * 0.7, 0.9 + (index % 3) * 0.12),
  ),

  // Parked cars in the car parks and the yards.
  placed("sedanWhite", 38, 70, -0.35),
  placed("sedanDark", 41, 72, -0.35),
  placed("sedanSilver", 44, 74, -0.35),
  placed("sedanWhite", 41, 67, -0.35),
  placed("sedanDark", 45, 69, -0.35),
  placed("sedanSilver", 68, 61, -0.3),
  placed("sedanWhite", 71, 63, -0.3),
  placed("sedanDark", 74, 65, -0.3),
  placed("sedanSilver", 123, 99, 0.4),
  placed("sedanWhite", 126, 101, 0.4),
  placed("sedanDark", 112, -90, 1.2),

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
  afloatBig("yachtMoored", -84, -22, 0.2),
  afloatBig("yachtMoored", -120, -20, 2.9),
  afloatBig("yachtMoored", 26, -6, 1.8, 0.95),
  afloatBig("yachtMoored", -30, -70, 0.6),
  afloatBig("sailboatMoored", -10, -20, 1.2),
  afloatBig("sailboatMoored", -46, -6, 2.4),
  afloatBig("sailboatMoored", -20, -54, 0.7),
  afloatBig("sailboatMoored", -70, -60, 2.1),
  afloatBig("sailboatMoored", 6, -86, 1.5),
  afloatBig("kayak", -6, 12, 1.1),
  afloatBig("kayak", -24, 24, 0.4),
  afloatBig("kayak", -52, 16, 2.2),
  afloatBig("kayak", -14, -40, 0.9),
  afloatBig("kayak", -96, -8, 1.8),

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
  { x: 32, z: 62, radius: 15 },
  { x: 116, z: -18, radius: 9 },
  { x: 104, z: 66, radius: 10 },
];

interface Clearing {
  readonly x: number;
  readonly z: number;
  readonly radius: number;
}

/** Ground kept clear of scattered scenery so landmarks and homes stay legible. */
const CLEARINGS: readonly Clearing[] = [
  { x: 32, z: 62, radius: 18 },
  { x: 54, z: 6, radius: 15 },
  { x: 68, z: 22, radius: 9 },
  { x: 92, z: 30, radius: 13 },
  { x: 104, z: 66, radius: 14 },
  { x: 126, z: 96, radius: 16 },
  { x: 116, z: -18, radius: 11 },
  { x: 129, z: -18, radius: 11 },
  { x: -132, z: -96, radius: 9 },
  { x: 118, z: -92, radius: 12 },
  { x: 134, z: -98, radius: 8 },
  { x: -60, z: -44, radius: 4 },
  { x: 42, z: 72, radius: 12 },
  { x: 70, z: 62, radius: 9 },
  { x: 124, z: 100, radius: 8 },
  { x: 74, z: 69, radius: 16 },
  ...HOUSES.map((house) => ({ x: house.x, z: house.z, radius: house.model === "lakeHouse" ? 10 : 6.5 })),
  ...FAR_SHORE_CHALETS.map((chalet) => ({ x: chalet.x, z: chalet.z, radius: 7 })),
  ...PENINSULA_CABINS.map((cabin) => ({ x: cabin.x, z: cabin.z, radius: 5 })),
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
function isOnInfrastructure(x: number, z: number): boolean {
  if (ROAD_POLYLINES.some((road) => distanceToPolyline(x, z, road.points, road.closed) < road.width / 2 + 2.2)) return true;
  if (YARDS.some((yard) => Math.hypot(x - yard.x, z - yard.z) < yard.radius + 2)) return true;
  if (LAWNS.some((lawn) => Math.hypot(x - lawn.x, z - lawn.z) < lawn.radius - 1)) return true;
  if (distanceToPolyline(x, z, RAIL_LINE, false) < 3.8) return true;
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

  return placements;
}

/** Ground height for a placement, so callers do not reach into the terrain module. */
export function groundHeightFor(placement: Placement): number {
  if (placement.afloat) return LAKE.level + placement.yOffset;
  return terrainHeightAt(placement.x, placement.z) + placement.yOffset;
}
