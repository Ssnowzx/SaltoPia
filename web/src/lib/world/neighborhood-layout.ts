import type { BufferGeometry } from "three";

import {
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
import { ROAD, TERRAIN, WORLD_COLORS, WORLD_SEED } from "./constants";
import {
  createBosqueSignGeometry,
  createCtgGeometry,
  createEstacaoGeometry,
  createGalpaoGeometry,
  createMiranteGeometry,
  createPousadaGeometry,
  createPracaGeometry,
  createVineRowGeometry,
  createVinicolaGeometry,
} from "./landmarks";
import { createRandom } from "./noise";
import { CIRCUIT, RAIL_LINE, SPOKES, type Waypoint } from "./roads";
import { distanceToRiver, terrainHeightAt } from "./terrain";

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
  | "house"
  | "fence"
  | "stoneWall"
  | "lamppost"
  | "vineRow"
  | "praca"
  | "galpao"
  | "mirante"
  | "vinicola"
  | "ctg"
  | "estacao"
  | "pousada"
  | "bosqueSign";

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
  house: () =>
    createBuildingGeometry({
      width: 4.6,
      depth: 3.8,
      height: 2.9,
      roofHeight: 1.6,
      wallColor: WORLD_COLORS.whitewash,
      roofColor: WORLD_COLORS.tile,
      chimney: true,
      windows: true,
    }),
  fence: () => createFenceGeometry(8),
  stoneWall: () => createStoneWallGeometry(9),
  lamppost: () => createLamppostGeometry(),
  vineRow: () => createVineRowGeometry(4.5),
  praca: () => createPracaGeometry(),
  galpao: () => createGalpaoGeometry(),
  mirante: () => createMiranteGeometry(),
  vinicola: () => createVinicolaGeometry(),
  ctg: () => createCtgGeometry(),
  estacao: () => createEstacaoGeometry(),
  pousada: () => createPousadaGeometry(),
  bosqueSign: () => createBosqueSignGeometry(),
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
  placed("galpao", -28, 14),
  placed("ctg", -20, -18),
  // Turned to face the rails, which run along its south side.
  placed("estacao", 26, 46, Math.PI),
  placed("vinicola", 30, -30),
  placed("pousada", 14, 30),
  placed("mirante", 2, -46),
  placed("bosqueSign", -41, -39, 0.6),

  // Houses just outside the circuit road.
  placed("house", -19, 5.5, 0.2),
  placed("house", -25, -5.5, 0.5, 0.95),
  placed("house", -17, 13, -0.3, 1.05),
  placed("house", 23, -3, 0.1),
  placed("house", 36, 26, -0.4, 0.95),
  placed("house", 40, 34, 0.3),
  placed("house", -30, 46, 2.9),
  placed("house", -38, 36, 3.2, 0.9),

  // The vineyard, on the slope west of the winery.
  ...[15.5, 20.5].flatMap((x) =>
    [-25, -27.5, -30, -32.5, -35, -37.5].map((z) => placed("vineRow", x, z)),
  ),

  // Lamps around the square, outside the ring road.
  ...Array.from({ length: 8 }, (_, index) => {
    const angle = (index / 8) * Math.PI * 2 + Math.PI / 8;
    return placed("lamppost", Math.cos(angle) * (ROAD.ringRadius + 3), Math.sin(angle) * (ROAD.ringRadius + 3));
  }),

  // Fences and taipas across the campo.
  placed("fence", -14, 46.5),
  placed("fence", 4, 47),
  placed("fence", 30, 37, 0.5),
  placed("stoneWall", -44, -12, 0.3),
  placed("stoneWall", -48, -24, 0.1),
  placed("stoneWall", -30, 4),
  placed("stoneWall", 40, 40, -0.4),
];

/** A circle of ground kept clear of scattered scenery. */
interface Clearing {
  readonly x: number;
  readonly z: number;
  readonly radius: number;
}

/** Ground kept clear so landmarks stay legible - required by the world-map spec. */
const CLEARINGS: readonly Clearing[] = [
  { x: 0, z: 0, radius: 19 },
  { x: -28, z: 14, radius: 12 },
  { x: -20, z: -18, radius: 13 },
  { x: 26, z: 46, radius: 15 },
  { x: 30, z: -30, radius: 10 },
  { x: 18, z: -31, radius: 9 },
  { x: 14, z: 30, radius: 12 },
  { x: 2, z: -46, radius: 8 },
  { x: -41, z: -39, radius: 3 },
  ...LANDMARKS.filter((placement) => placement.model === "house").map((house) => ({
    x: house.x,
    z: house.z,
    radius: 4.5,
  })),
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

/** Scenery keeps off the roads, the rails and the water. */
function isOnInfrastructure(x: number, z: number): boolean {
  if (Math.abs(Math.hypot(x, z) - ROAD.ringRadius) < 4.5) return true;
  if (distanceToPolyline(x, z, CIRCUIT, true) < 4.6) return true;
  if (SPOKES.some((spoke) => distanceToPolyline(x, z, spoke, false) < 4.4)) return true;
  if (distanceToPolyline(x, z, RAIL_LINE, false) < 3.8) return true;
  return distanceToRiver(x, z) < 8;
}

/**
 * Scatters trees, bushes and rocks across the valley.
 *
 * Seeded, so the forest is identical on every load: the town has to be demonstrable
 * twice the same way. Araucarias stand alone across the open campo - the classic
 * image of the Serra - and mass into the Bosque; conifers hold the higher ground
 * behind; broadleaf trees and bushes soften the town; rocks sit on the exposed ridges.
 *
 * @returns Every scattered placement, ready to be grouped by model for instancing.
 */
export function createScatter(): readonly Placement[] {
  const random = createRandom(WORLD_SEED);
  const placements: Placement[] = [];
  const half = TERRAIN.size / 2;

  const bosque = { x: -40, z: -36 } as const;

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

  const lowGround = (_x: number, _z: number, height: number): boolean => height > -0.5 && height < 18;
  const highGround = (_x: number, _z: number, height: number): boolean => height > 9 && height < 44;

  // The Bosque das Araucarias - a dense stand of mature trees.
  scatter("araucaria", 34, [0.9, 1.3], aroundBosque, lowGround, 0);
  scatter("araucariaB", 26, [0.9, 1.3], aroundBosque, lowGround, 0);
  scatter("araucariaYoung", 18, [0.8, 1.4], aroundBosque, lowGround, 0);

  // Lone araucarias across the campo, thinning with distance from the town.
  scatter("araucaria", 42, [0.8, 1.25], anywhere(0.9), lowGround, 3);
  scatter("araucariaB", 36, [0.8, 1.25], anywhere(0.9), lowGround, 3);
  scatter("araucariaYoung", 30, [0.7, 1.3], anywhere(0.9), lowGround, 3);

  // Conifer mass on the high ground behind and beside the town.
  scatter("conifer", 150, [0.75, 1.45], () => [(random() - 0.5) * TERRAIN.size * 0.96, -random() * half * 0.9], highGround);
  scatter("conifer", 60, [0.7, 1.3], anywhere(0.96), (_x, _z, height) => height > 14 && height < 40);

  // Broadleaf trees and bushes around the town.
  scatter("broadleaf", 55, [0.8, 1.4], anywhere(0.7), lowGround, 2);
  scatter("bush", 90, [0.7, 1.5], anywhere(0.6), lowGround, 1);

  // Basalt on the ridges and along the river.
  scatter("rock", 60, [0.6, 2.2], anywhere(0.96), (_x, _z, height) => height > 16);
  scatter(
    "rock",
    24,
    [0.4, 1.1],
    () => {
      const z = (random() - 0.5) * TERRAIN.size * 0.8;
      return [46 + 4.5 * Math.sin(z * 0.045 + 0.6) + (random() - 0.5) * 24, z];
    },
    (x, z) => distanceToRiver(x, z) > 8 && distanceToRiver(x, z) < 13,
    0,
  );

  return placements;
}

/** Ground height for a placement, so callers do not reach into the terrain module. */
export function groundHeightFor(placement: Placement): number {
  return terrainHeightAt(placement.x, placement.z) + placement.yOffset;
}
