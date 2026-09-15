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
import { islandDistance, lakeDistance, riverDistance, terrainHeightAt } from "./terrain";

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
  width: 4.6,
  depth: 3.8,
  height: 2.9,
  roofHeight: 1.6,
  chimney: true,
  windows: true,
};

/**
 * Resolves a model key to geometry. This registry is the seam design.md D1 keeps open:
 * swapping a procedural builder for a loaded `.glb` is a change here and nowhere else.
 */
export const MODEL_REGISTRY: Readonly<Record<ModelKey, () => BufferGeometry>> = {
  araucaria: () => createAraucariaGeometry("mature", 15, 3),
  araucariaB: () => createAraucariaGeometry("mature", 13, 11),
  araucariaYoung: () => createAraucariaGeometry("young", 7, 5),
  conifer: () => createConiferGeometry(9),
  broadleaf: () => createBroadleafGeometry(6, 2),
  broadleafWarm: () => createBroadleafGeometry(5.5, 9),
  bush: () => createBushGeometry(1.1),
  rock: () => createRockGeometry(1.7),
  palm: () => createPalmGeometry(7, 4),
  houseWhitewash: () =>
    createBuildingGeometry({ ...HOUSE_BASE, wallColor: WORLD_COLORS.whitewash, roofColor: WORLD_COLORS.tile, wallSurface: "plaster", roofSurface: "tiles" }),
  houseYellow: () =>
    createBuildingGeometry({ ...HOUSE_BASE, wallColor: WORLD_COLORS.paleYellow, roofColor: WORLD_COLORS.slate, wallSurface: "plaster", roofSurface: "slate" }),
  houseTimber: () =>
    createBuildingGeometry({ ...HOUSE_BASE, wallColor: WORLD_COLORS.timber, roofColor: WORLD_COLORS.tileDark, wallSurface: "planks", roofSurface: "tiles" }),
  houseMint: () =>
    createBuildingGeometry({ ...HOUSE_BASE, wallColor: WORLD_COLORS.mint, roofColor: WORLD_COLORS.slateDark, wallSurface: "plaster", roofSurface: "slate" }),
  cabana: () =>
    createBuildingGeometry({ width: 3.6, depth: 3.2, height: 2.4, roofHeight: 1.3, wallColor: WORLD_COLORS.timberDark, roofColor: WORLD_COLORS.shingle, wallSurface: "planks", roofSurface: "shingle", windows: true }),
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

/** The houses of the community, spread along the streets with room for lawns. */
const HOUSES: readonly Placement[] = [
  // On the lake, north of the main street.
  placed("lakeHouse", -38, 2, Math.PI),
  placed("houseMint", 16, -1, 0.1),
  placed("lakeHouse", 54, 4, Math.PI),
  placed("cabana", -64, 14, 0.4),
  placed("cabana", 66, -4, 2.9),
  // Inside the block.
  placed("houseWhitewash", -30, 26, 0.3),
  placed("houseYellow", -4, 30, 0.1),
  placed("houseTimber", 6, 42, -0.2),
  placed("houseMint", -26, 46, 3.0),
  placed("houseWhitewash", 34, 30, 0.2),
  placed("houseYellow", 44, 44, -0.3),
  placed("houseTimber", 30, 46, 3.1),
  placed("cabana", -4, 48, 0.2),
  // South of the block.
  placed("houseYellow", -30, 64, 3.0),
  placed("houseWhitewash", -4, 66, 3.1),
  placed("houseMint", 28, 66, 2.9),
  placed("houseTimber", 52, 70, 3.0),
];

/** Chalets along the far shore, facing the water. */
const FAR_SHORE_CHALETS: readonly Placement[] = [-44, -34, -24, -14, -4, 6, 16, 26, 36, 46, 56].map((x, index) => {
  const models: readonly ModelKey[] = ["aFrameShingle", "aFrameSlate", "aFrameTile"];
  return placed(models[index % 3], x + (index % 2) * 1.5, -94 + (index % 3) * 1.4, (index % 2 === 0 ? 0.08 : -0.06));
});

/**
 * The landmarks and the town around the square.
 *
 * Landmark coordinates match the `world_x` / `world_z` seeded for each place, so a pin
 * and its building agree without either knowing about the other.
 */
export const LANDMARKS: readonly Placement[] = [
  placed("praca", 0, -2),
  placed("chapel", -22, 0, Math.PI / 2),
  placed("galpao", -52, -2),
  placed("ctg", -40, 36),
  placed("estacao", 88, 76, Math.PI),
  placed("vinicola", 86, 22),
  placed("pousada", 34, -4),
  placed("mirante", -80, -28),
  placed("bosqueSign", 4, -47, 0.6),
  placed("salto", SALTO_ORIGIN.x, SALTO_ORIGIN.z),

  // The row of shops on the main street, facing it.
  placed("shopBrick", -12, 21, Math.PI),
  placed("shopYellow", -2, 21, Math.PI),
  placed("shopMint", 8, 21, Math.PI),
  placed("shopTimber", 70, 46, -Math.PI / 2, 0.9),

  ...HOUSES,
  ...FAR_SHORE_CHALETS,

  // The island: cabins on stilts and its pier.
  placed("stiltCabin", -6, -42),
  placed("stiltCabin", 14, -44),
  placed("pier", 4, -41),

  // The square's pier and the inn's.
  placed("pier", 0, -13, Math.PI),
  placed("pier", 34, -15, Math.PI),

  // Boats moored and pulled up.
  afloat("sailboatMoored", -4, -25, 0.4),
  afloat("sailboatMoored", 6, -27, -0.3),
  afloat("yachtMoored", 37, -25, 0.2),
  afloat("yachtMoored", 9, -33, 2.8, 0.9),
  afloat("kayak", 12, -37, 1.1),
  afloat("kayak", -3, -35, 0.4),
  afloat("kayak", 18, -35, 2.2),
  afloat("kayak", -30, -24, 0.9),

  // Palms along the shore, thickest around the inn and the square.
  placed("palm", 27, -9, 0, 1.05),
  placed("palm", 43, -1, 0, 0.95),
  placed("palm", 47, -10, 0, 1.1),
  placed("palm", 40, -13, 0, 0.9),
  placed("palm", -12, -10, 0, 1.0),
  placed("palm", 9, -9, 0, 0.95),
  placed("palm", -44, -8, 0, 1.0),
  placed("palm", 58, -1, 0, 0.9),
  placed("palm", 24, 4, 0, 1.0),
  placed("palm", -32, -6, 0, 0.95),

  // Parked cars in the car parks and yards.
  placed("sedanWhite", 39, 7, 0.1),
  placed("sedanDark", 42.5, 7, 0.15),
  placed("sedanSilver", 46, 7, 0.05),
  placed("sedanWhite", 40, 10.8, 3.2),
  placed("sedanDark", 13, 21, 0.05),
  placed("sedanSilver", 16.5, 21, 0.1),
  placed("sedanWhite", 19.5, 21, 0),
  placed("sedanWhite", 84, 71, 0.1),
  placed("sedanDark", 88, 71, 0.05),
  placed("sedanSilver", 84, 28, 0.6),
  placed("sedanDark", 80, -24, 1.4),

  // The vineyard, on the slope east of the winery.
  ...[92, 98].flatMap((x) => [14, 17, 20, 23, 26, 29].map((z) => placed("vineRow", x, z))),

  // Lamps around the square and along the street.
  ...Array.from({ length: 6 }, (_, index) => {
    const angle = (index / 6) * Math.PI * 2 + Math.PI / 6;
    return placed("lamppost", Math.cos(angle) * 13.5, -2 + Math.sin(angle) * 13.5);
  }),
  placed("lamppost", 28, 11),
  placed("lamppost", -30, 17),
  placed("lamppost", 50, 30),
  placed("lamppost", -50, 40),

  // Fences and taipas across the campo.
  placed("fence", -66, 30, 0.3),
  placed("fence", 60, 52, 0.4),
  placed("stoneWall", -70, 44, 0.3),
  placed("stoneWall", -62, -20, 0.1),
  placed("stoneWall", 100, 40, 0.2),

  // Boulders in the plunge pool and along the falls.
  placed("rock", 84, -44.5, 0.4, 2.0),
  placed("rock", 88, -36.5, 1.2, 1.8),
  placed("rock", 80, -46, 2.1, 1.6),
  placed("rock", 79, -35, 0.7, 1.7),
];

/** Lawns around the houses and the inn. */
export const LAWNS: ReadonlyArray<{ readonly x: number; readonly z: number; readonly radius: number }> = [
  ...HOUSES.map((house) => ({ x: house.x, z: house.z, radius: house.model === "lakeHouse" ? 9.5 : house.model === "cabana" ? 4.5 : 6.5 })),
  { x: 34, z: -4, radius: 13 },
  { x: 86, z: 22, radius: 8 },
];

interface Clearing {
  readonly x: number;
  readonly z: number;
  readonly radius: number;
}

/** Ground kept clear of scattered scenery so landmarks and homes stay legible. */
const CLEARINGS: readonly Clearing[] = [
  { x: 0, z: -2, radius: 15 },
  { x: -22, z: 0, radius: 9 },
  { x: -2, z: 21, radius: 14 },
  { x: -52, z: -2, radius: 12 },
  { x: -40, z: 36, radius: 14 },
  { x: 88, z: 76, radius: 16 },
  { x: 86, z: 22, radius: 10 },
  { x: 96, z: 21, radius: 10 },
  { x: 34, z: -4, radius: 14 },
  { x: -80, z: -28, radius: 8 },
  { x: 82, z: -28, radius: 10 },
  { x: 86, z: -50, radius: 7 },
  { x: 88, z: -52, radius: 7 },
  // The approach the camera flies down to the falls stays open.
  { x: 62, z: -12, radius: 12 },
  { x: 70, z: -30, radius: 9 },
  { x: 42, z: 8, radius: 8 },
  { x: 16, z: 22, radius: 7 },
  { x: 70, z: 46, radius: 6 },
  ...HOUSES.map((house) => ({ x: house.x, z: house.z, radius: house.model === "lakeHouse" ? 9 : 6 })),
  ...FAR_SHORE_CHALETS.map((chalet) => ({ x: chalet.x, z: chalet.z, radius: 4.2 })),
  { x: -6, z: -42, radius: 4 },
  { x: 14, z: -44, radius: 4 },
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
  if (x > 73 && riverDistance(x, z) < 12) return true;
  return lakeDistance(x, z) < 4 && islandDistance(x, z) > 0;
}

/**
 * Scatters trees, bushes and rocks across the valley and the island.
 *
 * Seeded, so the forest is identical on every load. Araucarias stand alone across the
 * campo and mass onto the island; round broadleaf trees - many of them turning yellow -
 * fill in around the houses; conifers hold the high ground; rocks sit on the rim.
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
      if (Math.abs(x) > half - 6 || Math.abs(z) > half - 6) continue;
      if (isInClearing(x, z, clearance)) continue;
      if (isOnInfrastructure(x, z)) continue;
      const height = terrainHeightAt(x, z);
      if (height < LAKE.level + 0.4) continue;
      if (!accept(x, z, height)) continue;
      placements.push({ model, x, z, rotationY: random() * Math.PI * 2, scale: scaleRange[0] + random() * (scaleRange[1] - scaleRange[0]), yOffset: 0 });
      placedCount += 1;
    }
  };

  const anywhere = (extent = 0.94): (() => readonly [number, number]) => () => [
    (random() - 0.5) * TERRAIN.size * extent,
    (random() - 0.5) * TERRAIN.size * extent,
  ];
  const onIsland = (): readonly [number, number] => [
    LAKE.island.x + (random() - 0.5) * LAKE.island.radiusX * 2,
    LAKE.island.z + (random() - 0.5) * LAKE.island.radiusZ * 2,
  ];
  const inCommunity = (): readonly [number, number] => [(random() - 0.5) * 150, -14 + random() * 90];
  const nearShore = (): readonly [number, number] => {
    const angle = random() * Math.PI * 2;
    const reach = 1.08 + random() * 0.3;
    return [LAKE.centre.x + Math.cos(angle) * LAKE.radiusX * reach, LAKE.centre.z + Math.sin(angle) * LAKE.radiusZ * reach];
  };

  const offIsland = (x: number, z: number): boolean => islandDistance(x, z) > 3;
  const lowGround = (x: number, z: number, height: number): boolean => height > 0 && height < 20 && offIsland(x, z);
  const islandGround = (x: number, z: number): boolean => islandDistance(x, z) < -1.5;

  // The island: a dense stand of araucarias.
  scatter("araucaria", 22, [0.85, 1.2], onIsland, islandGround, 0);
  scatter("araucariaB", 16, [0.85, 1.2], onIsland, islandGround, 0);
  scatter("araucariaYoung", 10, [0.8, 1.3], onIsland, islandGround, 0);
  scatter("broadleaf", 8, [0.8, 1.2], onIsland, islandGround, 0);

  // Araucarias along the shore and across the campo.
  scatter("araucaria", 40, [0.8, 1.25], nearShore, lowGround, 3);
  scatter("araucariaB", 30, [0.8, 1.25], anywhere(0.9), lowGround, 3);
  scatter("araucariaYoung", 26, [0.7, 1.3], anywhere(0.9), lowGround, 3);

  // Round broadleaf trees through the community, many turning yellow.
  scatter("broadleaf", 70, [0.8, 1.4], inCommunity, lowGround, 2);
  scatter("broadleafWarm", 90, [0.8, 1.4], inCommunity, lowGround, 2);
  scatter("broadleaf", 50, [0.8, 1.4], anywhere(0.8), lowGround, 2);
  scatter("bush", 120, [0.7, 1.5], inCommunity, lowGround, 1);

  // Conifers on the higher ground.
  scatter("conifer", 140, [0.75, 1.45], () => [(random() - 0.5) * TERRAIN.size * 0.96, -random() * half * 0.9], (x, z, height) => height > 7 && offIsland(x, z));
  scatter("conifer", 50, [0.7, 1.3], anywhere(0.96), (x, z, height) => height > 9 && offIsland(x, z));

  // Basalt on the rim.
  scatter("rock", 50, [0.6, 2.2], anywhere(0.96), (_x, _z, height) => height > 14);

  return placements;
}

/** Ground height for a placement, so callers do not reach into the terrain module. */
export function groundHeightFor(placement: Placement): number {
  if (placement.afloat) return LAKE.level + placement.yOffset;
  return terrainHeightAt(placement.x, placement.z) + placement.yOffset;
}
