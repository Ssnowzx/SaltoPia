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
import { TERRAIN, WORLD_COLORS, WORLD_SEED } from "./constants";
import {
  SALTO_ORIGIN,
  createBosqueSignGeometry,
  createCathedralGeometry,
  createCtgGeometry,
  createEstacaoGeometry,
  createGalpaoGeometry,
  createMiranteGeometry,
  createPousadaGeometry,
  createPracaGeometry,
  createSaltoGeometry,
  createShopGeometry,
  createVineRowGeometry,
  createVinicolaGeometry,
} from "./landmarks";
import { createRandom } from "./noise";
import { RAIL_LINE, ROAD_POLYLINES, YARDS, type Waypoint } from "./roads";
import { distanceToRiver, riverBankReachAt, terrainHeightAt } from "./terrain";

/**
 * What Serranopolis is made of, as data.
 *
 * This is the file a reviewer opens to see the town's composition - the reason the
 * scene is assembled from a layout at all rather than shipped as one opaque binary.
 * See design.md D1.
 */

/** Every kind of object that can stand on the terrain. */
export type ModelKey =
  | "araucaria"
  | "araucariaB"
  | "araucariaYoung"
  | "conifer"
  | "broadleaf"
  | "bush"
  | "rock"
  | "houseWhitewash"
  | "houseYellow"
  | "houseTimber"
  | "houseMint"
  | "shopBrick"
  | "shopYellow"
  | "shopMint"
  | "shopTimber"
  | "fence"
  | "stoneWall"
  | "lamppost"
  | "vineRow"
  | "praca"
  | "cathedral"
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
  bush: "smooth",
  rock: "flat",
  houseWhitewash: "flat",
  houseYellow: "flat",
  houseTimber: "flat",
  houseMint: "flat",
  shopBrick: "flat",
  shopYellow: "flat",
  shopMint: "flat",
  shopTimber: "flat",
  fence: "flat",
  stoneWall: "flat",
  lamppost: "flat",
  vineRow: "smooth",
  praca: "flat",
  cathedral: "flat",
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
 * Resolves a model key to geometry.
 *
 * This registry is the seam design.md D1 keeps open: swapping a procedural builder for
 * a loaded `.glb` is a change here and nowhere else - not in the layout, not in the
 * scene.
 */
export const MODEL_REGISTRY: Readonly<Record<ModelKey, () => BufferGeometry>> = {
  araucaria: () => createAraucariaGeometry("mature", 15, 3),
  araucariaB: () => createAraucariaGeometry("mature", 13, 11),
  araucariaYoung: () => createAraucariaGeometry("young", 7, 5),
  conifer: () => createConiferGeometry(9),
  broadleaf: () => createBroadleafGeometry(6, 2),
  bush: () => createBushGeometry(1.1),
  rock: () => createRockGeometry(1.7),
  houseWhitewash: () =>
    createBuildingGeometry({ ...HOUSE_BASE, wallColor: WORLD_COLORS.whitewash, roofColor: WORLD_COLORS.tile, wallSurface: "plaster", roofSurface: "tiles" }),
  houseYellow: () =>
    createBuildingGeometry({ ...HOUSE_BASE, wallColor: WORLD_COLORS.paleYellow, roofColor: WORLD_COLORS.slate, wallSurface: "plaster", roofSurface: "slate" }),
  houseTimber: () =>
    createBuildingGeometry({ ...HOUSE_BASE, wallColor: WORLD_COLORS.timber, roofColor: WORLD_COLORS.tileDark, wallSurface: "planks", roofSurface: "tiles" }),
  houseMint: () =>
    createBuildingGeometry({ ...HOUSE_BASE, wallColor: WORLD_COLORS.mint, roofColor: WORLD_COLORS.ember, wallSurface: "plaster", roofSurface: "tiles" }),
  shopBrick: () => createShopGeometry(0),
  shopYellow: () => createShopGeometry(1),
  shopMint: () => createShopGeometry(2),
  shopTimber: () => createShopGeometry(3),
  fence: () => createFenceGeometry(8),
  stoneWall: () => createStoneWallGeometry(9),
  lamppost: () => createLamppostGeometry(),
  vineRow: () => createVineRowGeometry(4.5),
  praca: () => createPracaGeometry(),
  cathedral: () => createCathedralGeometry(),
  galpao: () => createGalpaoGeometry(),
  mirante: () => createMiranteGeometry(),
  vinicola: () => createVinicolaGeometry(),
  ctg: () => createCtgGeometry(),
  estacao: () => createEstacaoGeometry(),
  pousada: () => createPousadaGeometry(),
  bosqueSign: () => createBosqueSignGeometry(),
  salto: () => createSaltoGeometry(),
};

/** One object placed on the terrain. Y always comes from the terrain, never from here. */
export interface Placement {
  readonly model: ModelKey;
  readonly x: number;
  readonly z: number;
  /** Rotation about Y, in radians. */
  readonly rotationY: number;
  readonly scale: number;
  /** Lift above the sampled ground, for objects that sit on a deck or plinth. */
  readonly yOffset: number;
}

function placed(model: ModelKey, x: number, z: number, rotationY = 0, scale = 1): Placement {
  return { model, x, z, rotationY, scale, yOffset: 0 };
}

/**
 * The landmarks and the town around the square.
 *
 * Landmark coordinates match the `world_x` / `world_z` seeded for each place, so a pin
 * and its building agree without either knowing about the other.
 */
export const LANDMARKS: readonly Placement[] = [
  placed("praca", 0, 0),
  placed("cathedral", 0, -31),
  placed("galpao", -28, 14),
  placed("ctg", -20, -18),
  // Turned to face the rails, which run along its south side.
  placed("estacao", 26, 46, Math.PI),
  placed("vinicola", 30, -30),
  placed("pousada", 14, 30),
  placed("mirante", 2, -46),
  placed("bosqueSign", -46, -38, 0.6),
  placed("salto", SALTO_ORIGIN.x, SALTO_ORIGIN.z),

  // The row of shops facing the street, east of the square.
  placed("shopBrick", 28, 9, -Math.PI / 2),
  placed("shopYellow", 28, 2.5, -Math.PI / 2),
  placed("shopMint", 28, -4, -Math.PI / 2),

  // Houses outside the loop, off the driveways, no two neighbours alike.
  placed("houseWhitewash", -29, -2, 0.2),
  placed("shopTimber", -30, -12, Math.PI / 2, 0.85),
  placed("houseTimber", 33, 30, -0.4),
  placed("houseMint", 40, 36, 0.3, 0.95),
  placed("houseYellow", -30, 40, 2.9),
  placed("houseWhitewash", -38, 30, 3.2, 0.9),
  placed("houseMint", 2, 46, 3.1),
  placed("houseTimber", -14, 44, 2.8, 1.05),
  placed("houseYellow", 44, 22, -0.6, 0.9),

  // The vineyard, on the slope west of the winery.
  ...[15.5, 20.5].flatMap((x) =>
    [-25, -27.5, -30, -32.5, -35, -37.5].map((z) => placed("vineRow", x, z)),
  ),

  // Lamps between the square's paving and the street, and along the street.
  ...Array.from({ length: 8 }, (_, index) => {
    const angle = (index / 8) * Math.PI * 2 + Math.PI / 8;
    return placed("lamppost", Math.cos(angle) * 14.5, Math.sin(angle) * 14.5);
  }),
  placed("lamppost", 24, 12),
  placed("lamppost", 24, -1),
  placed("lamppost", -4, -24),
  placed("lamppost", 4, -24),

  // Fences and taipas across the campo.
  placed("fence", -20, 50),
  placed("fence", 8, 60),
  placed("fence", -46, -48, 0.4),
  placed("stoneWall", -52, -6, 0.3),
  placed("stoneWall", -54, -18, 0.1),
  placed("stoneWall", -10, 60, 0.2),
  placed("stoneWall", 66, -40, 0.3),

  // Boulders in and around the plunge pool and along the ledges.
  placed("rock", 40, -64, 0.4, 2.2),
  placed("rock", 60, -66, 1.2, 2.4),
  placed("rock", 38, -72, 2.1, 2.6),
  placed("rock", 62, -73, 0.7, 3.0),
  placed("rock", 64, -69, 1.6, 1.8),
  placed("rock", 36, -78, 0.2, 2.0),
  placed("rock", 63, -80, 0.9, 2.2),
];

/** A circle of ground kept clear of scattered scenery. */
interface Clearing {
  readonly x: number;
  readonly z: number;
  readonly radius: number;
}

/** Ground kept clear so landmarks stay legible - required by the world-map spec. */
const CLEARINGS: readonly Clearing[] = [
  { x: 0, z: 0, radius: 23 },
  { x: 0, z: -31, radius: 10 },
  { x: 28, z: 2, radius: 10 },
  { x: -28, z: 14, radius: 13 },
  { x: -20, z: -18, radius: 14 },
  { x: 26, z: 46, radius: 16 },
  { x: 30, z: -30, radius: 11 },
  { x: 18, z: -31, radius: 10 },
  { x: 14, z: 30, radius: 12 },
  { x: 2, z: -46, radius: 8 },
  { x: -46, z: -38, radius: 3 },
  { x: SALTO_ORIGIN.x, z: SALTO_ORIGIN.z, radius: 9 },
  { x: 19, z: -61, radius: 5 },
  { x: 64, z: -58, radius: 6 },
  { x: 66, z: -52, radius: 6 },
  ...LANDMARKS.filter((placement) => placement.model.startsWith("house") || placement.model.startsWith("shop")).map(
    (building) => ({ x: building.x, z: building.z, radius: 5 }),
  ),
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
  if (ROAD_POLYLINES.some((road) => distanceToPolyline(x, z, road.points, road.closed) < 4.6)) return true;
  if (YARDS.some((yard) => Math.hypot(x - yard.x, z - yard.z) < yard.radius + 2)) return true;
  if (distanceToPolyline(x, z, RAIL_LINE, false) < 3.8) return true;
  return distanceToRiver(x, z) < riverBankReachAt(z) + 1;
}

/**
 * Scatters trees, bushes and rocks across the valley.
 *
 * Seeded, so the forest is identical on every load: the town has to be demonstrable
 * twice the same way. Araucarias stand alone across the open campo - the classic
 * image of the Serra - and mass into the Bosque; conifers hold the higher ground
 * behind; broadleaf trees and bushes soften the town; rocks sit on the exposed ridges.
 */
export function createScatter(): readonly Placement[] {
  const random = createRandom(WORLD_SEED);
  const placements: Placement[] = [];
  const half = TERRAIN.size / 2;

  const bosque = { x: -42, z: -38 } as const;

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

  const anywhere = (extent = 0.94): (() => readonly [number, number]) => () => [
    (random() - 0.5) * TERRAIN.size * extent,
    (random() - 0.5) * TERRAIN.size * extent,
  ];

  const aroundBosque = (): readonly [number, number] => {
    const angle = random() * Math.PI * 2;
    const radius = 4 + random() * 22;
    return [bosque.x + Math.cos(angle) * radius, bosque.z + Math.sin(angle) * radius];
  };

  const aroundSalto = (): readonly [number, number] => [
    40 + random() * 40,
    -44 - random() * 22,
  ];

  const lowGround = (_x: number, _z: number, height: number): boolean => height > -0.5 && height < 18;
  const highGround = (_x: number, _z: number, height: number): boolean => height > 9 && height < 46;

  scatter("araucaria", 34, [0.9, 1.3], aroundBosque, lowGround, 0);
  scatter("araucariaB", 26, [0.9, 1.3], aroundBosque, lowGround, 0);
  scatter("araucariaYoung", 18, [0.8, 1.4], aroundBosque, lowGround, 0);

  scatter("araucaria", 42, [0.8, 1.25], anywhere(0.9), lowGround, 3);
  scatter("araucariaB", 36, [0.8, 1.25], anywhere(0.9), lowGround, 3);
  scatter("araucariaYoung", 30, [0.7, 1.3], anywhere(0.9), lowGround, 3);

  // Araucarias around the falls, the way the real Salto is ringed by them.
  scatter("araucaria", 14, [0.9, 1.3], aroundSalto, (_x, _z, height) => height > -1 && height < 30, 1);
  scatter("araucariaYoung", 10, [0.8, 1.3], aroundSalto, (_x, _z, height) => height > -1 && height < 30, 1);

  scatter("conifer", 150, [0.75, 1.45], () => [(random() - 0.5) * TERRAIN.size * 0.96, -random() * half * 0.9], highGround);
  scatter("conifer", 60, [0.7, 1.3], anywhere(0.96), (_x, _z, height) => height > 14 && height < 42);

  scatter("broadleaf", 55, [0.8, 1.4], anywhere(0.7), lowGround, 2);
  scatter("bush", 90, [0.7, 1.5], anywhere(0.6), lowGround, 1);

  scatter("rock", 60, [0.6, 2.2], anywhere(0.96), (_x, _z, height) => height > 18);
  scatter(
    "rock",
    24,
    [0.4, 1.1],
    () => {
      const z = (random() - 0.5) * TERRAIN.size * 0.8;
      return [50 + 4.5 * Math.sin(z * 0.045 + 0.6) + (random() - 0.5) * 30, z];
    },
    (x, z) => distanceToRiver(x, z) > riverBankReachAt(z) + 1 && distanceToRiver(x, z) < riverBankReachAt(z) + 6,
    0,
  );

  return placements;
}

/** Ground height for a placement, so callers do not reach into the terrain module. */
export function groundHeightFor(placement: Placement): number {
  return terrainHeightAt(placement.x, placement.z) + placement.yOffset;
}
