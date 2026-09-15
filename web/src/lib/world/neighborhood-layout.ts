import type { BufferGeometry } from "three";

import {
  createAraucariaGeometry,
  createBandstandGeometry,
  createBuildingGeometry,
  createConiferGeometry,
  createRockGeometry,
} from "./builders";
import { TERRAIN, WORLD_COLORS, WORLD_SEED } from "./constants";
import { createRandom } from "./noise";
import { terrainHeightAt } from "./terrain";

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
  | "conifer"
  | "rock"
  | "bandstand"
  | "house"
  | "barn"
  | "hall"
  | "station"
  | "winery"
  | "inn"
  | "shelter";

/**
 * Resolves a model key to geometry.
 *
 * This registry is the seam design.md D1 keeps open: swapping a procedural builder for
 * a loaded `.glb` is a change here and nowhere else - not in the layout, not in the
 * scene.
 */
export const MODEL_REGISTRY: Readonly<Record<ModelKey, () => BufferGeometry>> = {
  araucaria: () => createAraucariaGeometry(13, 2.8),
  conifer: () => createConiferGeometry(9),
  rock: () => createRockGeometry(1.7),
  bandstand: () => createBandstandGeometry(),
  house: () =>
    createBuildingGeometry({
      width: 4.4,
      depth: 3.6,
      height: 2.8,
      roofHeight: 1.5,
      wallColor: WORLD_COLORS.whitewash,
      roofColor: WORLD_COLORS.tile,
      chimney: true,
    }),
  barn: () =>
    createBuildingGeometry({
      width: 11,
      depth: 7,
      height: 3.6,
      roofHeight: 2.4,
      wallColor: WORLD_COLORS.timber,
      roofColor: WORLD_COLORS.tile,
      veranda: true,
      chimney: true,
    }),
  hall: () =>
    createBuildingGeometry({
      width: 13,
      depth: 5.4,
      height: 3.2,
      roofHeight: 1.9,
      wallColor: WORLD_COLORS.whitewash,
      roofColor: WORLD_COLORS.tile,
      veranda: true,
    }),
  station: () =>
    createBuildingGeometry({
      width: 10,
      depth: 4.6,
      height: 3.4,
      roofHeight: 1.6,
      wallColor: WORLD_COLORS.whitewash,
      roofColor: WORLD_COLORS.ember,
      veranda: true,
    }),
  winery: () =>
    createBuildingGeometry({
      width: 8.5,
      depth: 6,
      height: 3.8,
      roofHeight: 2.1,
      wallColor: WORLD_COLORS.rockLight,
      roofColor: WORLD_COLORS.tile,
      chimney: true,
    }),
  inn: () =>
    createBuildingGeometry({
      width: 7.5,
      depth: 6,
      height: 4.2,
      roofHeight: 2.6,
      wallColor: WORLD_COLORS.rockLight,
      roofColor: WORLD_COLORS.tile,
      chimney: true,
      veranda: true,
    }),
  shelter: () =>
    createBuildingGeometry({
      width: 4,
      depth: 3,
      height: 2.2,
      roofHeight: 1.1,
      wallColor: WORLD_COLORS.timber,
      roofColor: WORLD_COLORS.tile,
      veranda: true,
    }),
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

/** A circle of ground kept clear of scattered scenery. */
interface Clearing {
  readonly x: number;
  readonly z: number;
  readonly radius: number;
}

/**
 * The buildings that mark the eight points of interest, plus the town around the square.
 *
 * Coordinates match the `world_x` / `world_z` seeded for each place, so a pin and its
 * building agree without either knowing about the other.
 */
export const LANDMARKS: readonly Placement[] = [
  // Praca do Pinhao - the centre.
  { model: "bandstand", x: 0, z: 0, rotationY: 0, scale: 1, yOffset: 0 },
  { model: "house", x: -8.5, z: 4, rotationY: 0.3, scale: 1, yOffset: 0 },
  { model: "house", x: 8, z: 5.5, rotationY: -0.25, scale: 1.1, yOffset: 0 },
  { model: "house", x: -6, z: -7.5, rotationY: 2.9, scale: 0.95, yOffset: 0 },
  { model: "house", x: 7.5, z: -8, rotationY: 3.3, scale: 1.05, yOffset: 0 },
  { model: "house", x: 0.5, z: 12, rotationY: 0.1, scale: 1, yOffset: 0 },

  // Galpao do Fogo de Chao.
  { model: "barn", x: -28, z: 14, rotationY: 0.42, scale: 1, yOffset: 0 },
  { model: "house", x: -36, z: 19, rotationY: 0.5, scale: 0.85, yOffset: 0 },

  // CTG Porteira do Tropeiro.
  { model: "hall", x: -20, z: -18, rotationY: -0.22, scale: 1, yOffset: 0 },

  // Estacao Velha.
  { model: "station", x: 26, z: 10, rotationY: -0.35, scale: 1, yOffset: 0 },
  { model: "house", x: 34, z: 15, rotationY: -0.4, scale: 0.9, yOffset: 0 },

  // Vinicola de Altitude.
  { model: "winery", x: 34, z: -26, rotationY: 0.55, scale: 1, yOffset: 0 },

  // Pousada da Geada.
  { model: "inn", x: 14, z: 30, rotationY: 0.18, scale: 1, yOffset: 0 },

  // Mirante da Neblina - a shelter on the ridge.
  { model: "shelter", x: 2, z: -46, rotationY: 0.05, scale: 1, yOffset: 0 },
];

/** Ground kept clear so landmarks stay legible - required by the world-map spec. */
const CLEARINGS: readonly Clearing[] = [
  { x: 0, z: 0, radius: 17 },
  { x: -28, z: 14, radius: 12 },
  { x: -20, z: -18, radius: 11 },
  { x: 26, z: 10, radius: 12 },
  { x: 34, z: -26, radius: 11 },
  { x: 14, z: 30, radius: 11 },
  { x: 2, z: -46, radius: 9 },
  { x: -38, z: -34, radius: 5 },
];

function isInClearing(x: number, z: number, extra = 0): boolean {
  return CLEARINGS.some((clearing) => {
    const dx = x - clearing.x;
    const dz = z - clearing.z;
    return Math.sqrt(dx * dx + dz * dz) < clearing.radius + extra;
  });
}

/** How far the river runs from a point - scenery keeps out of the water. */
function distanceToRiver(x: number, z: number): number {
  return Math.abs(x - (10 * Math.sin(z * 0.035) + 4));
}

/**
 * Scatters trees and rocks across the valley.
 *
 * Seeded, so the forest is identical on every load: the town has to be demonstrable
 * twice the same way. Araucarias cluster toward the Bosque and thin out over the open
 * campo; conifers mass on the higher ground behind; rocks sit on the exposed ridges.
 *
 * @returns Every scattered placement, ready to be grouped by model for instancing.
 */
export function createScatter(): readonly Placement[] {
  const random = createRandom(WORLD_SEED);
  const placements: Placement[] = [];
  const half = TERRAIN.size / 2;

  const bosqueX = -38;
  const bosqueZ = -34;

  const tryPlace = (
    model: ModelKey,
    minScale: number,
    maxScale: number,
    attempt: () => readonly [number, number],
    accept: (x: number, z: number, height: number) => boolean,
    count: number,
    clearanceExtra = 2,
  ): void => {
    let placed = 0;
    let attempts = 0;

    while (placed < count && attempts < count * 24) {
      attempts += 1;
      const [x, z] = attempt();

      if (Math.abs(x) > half - 8 || Math.abs(z) > half - 8) continue;
      if (isInClearing(x, z, clearanceExtra)) continue;
      if (distanceToRiver(x, z) < 6) continue;

      const height = terrainHeightAt(x, z);
      if (!accept(x, z, height)) continue;

      placements.push({
        model,
        x,
        z,
        rotationY: random() * Math.PI * 2,
        scale: minScale + random() * (maxScale - minScale),
        yOffset: 0,
      });
      placed += 1;
    }
  };

  // The Bosque das Araucarias - a dense stand, which is the point of the place.
  tryPlace(
    "araucaria",
    0.85,
    1.35,
    () => {
      const angle = random() * Math.PI * 2;
      const radius = 5 + random() * 20;
      return [bosqueX + Math.cos(angle) * radius, bosqueZ + Math.sin(angle) * radius];
    },
    (_x, _z, height) => height > 0 && height < 26,
    64,
    0,
  );

  // Araucarias thinning out across the rest of the valley.
  tryPlace(
    "araucaria",
    0.7,
    1.25,
    () => [(random() - 0.5) * TERRAIN.size * 0.92, (random() - 0.5) * TERRAIN.size * 0.92],
    (_x, _z, height) => height > -0.2 && height < 22,
    90,
  );

  // Conifer mass on the higher ground behind the town.
  tryPlace(
    "conifer",
    0.75,
    1.4,
    () => [(random() - 0.5) * TERRAIN.size * 0.95, -random() * half * 0.95],
    (_x, _z, height) => height > 8 && height < 30,
    130,
  );

  // Basalt on the exposed ridges.
  tryPlace(
    "rock",
    0.6,
    2.2,
    () => [(random() - 0.5) * TERRAIN.size * 0.95, (random() - 0.5) * TERRAIN.size * 0.95],
    (_x, _z, height) => height > 14,
    70,
  );

  // A few boulders down by the water, where the river has dropped them.
  tryPlace(
    "rock",
    0.4,
    1.1,
    () => {
      const z = (random() - 0.5) * TERRAIN.size * 0.8;
      const x = 10 * Math.sin(z * 0.035) + 4 + (random() - 0.5) * 16;
      return [x, z];
    },
    (x, z) => distanceToRiver(x, z) > 6.5 && distanceToRiver(x, z) < 13,
    26,
  );

  return placements;
}

/** Ground height for a placement, so callers do not reach into the terrain module. */
export function groundHeightFor(placement: Placement): number {
  return terrainHeightAt(placement.x, placement.z) + placement.yOffset;
}
