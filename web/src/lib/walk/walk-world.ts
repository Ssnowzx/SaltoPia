import { LAKE, RIVER, TERRAIN, WALK } from "@/lib/world/constants";
import { landHeightAt } from "@/lib/world/outer-land";
import { FOOTBRIDGE } from "@/lib/world/road-network";
import { bridgeDeckAt, riverDistance } from "@/lib/world/terrain";

import { type HeightField, heightFieldAt } from "./height-field";

/**
 * The rules of where a walker can stand, as data a pure step can be given.
 *
 * Ground is blocked where it is water or off the map; obstacles are circles - buildings and
 * tree trunks - bucketed on a grid so a step only looks at its neighbours. See design.md D3
 * and D4 of add-walking-character.
 */

export interface Circle {
  readonly x: number;
  readonly z: number;
  readonly radius: number;
}

export interface WalkWorld {
  /** The height the feet stand at. */
  readonly heightAt: (x: number, z: number) => number;
  /** Water, or off the map. */
  readonly isGroundBlocked: (x: number, z: number) => boolean;
  /** The obstacles that could touch a walker at this point. */
  readonly obstaclesNear: (x: number, z: number) => readonly Circle[];
}

/**
 * Buckets circles on a square grid by the cells their bounds cover; a query gathers the cell
 * a point is in and the eight round it, each circle once.
 */
export function createObstacleIndex(circles: readonly Circle[], cell: number): (x: number, z: number) => readonly Circle[] {
  const buckets = new Map<string, Circle[]>();
  for (const circle of circles) {
    for (let cx = Math.floor((circle.x - circle.radius) / cell); cx <= Math.floor((circle.x + circle.radius) / cell); cx += 1) {
      for (let cz = Math.floor((circle.z - circle.radius) / cell); cz <= Math.floor((circle.z + circle.radius) / cell); cz += 1) {
        const bucket = buckets.get(`${cx},${cz}`);
        if (bucket) bucket.push(circle);
        else buckets.set(`${cx},${cz}`, [circle]);
      }
    }
  }
  const empty: readonly Circle[] = [];
  return (x, z) => {
    const cx = Math.floor(x / cell);
    const cz = Math.floor(z / cell);
    const near = new Set<Circle>();
    for (let dx = -1; dx <= 1; dx += 1) {
      for (let dz = -1; dz <= 1; dz += 1) {
        for (const circle of buckets.get(`${cx + dx},${cz + dz}`) ?? empty) near.add(circle);
      }
    }
    return near.size ? [...near] : empty;
  };
}

const HALF = TERRAIN.size / 2;

function distanceToFootbridge(x: number, z: number): number {
  let best = Number.POSITIVE_INFINITY;
  for (let index = 0; index < FOOTBRIDGE.length - 1; index += 1) {
    const [ax, az] = FOOTBRIDGE[index];
    const [bx, bz] = FOOTBRIDGE[index + 1];
    const abx = bx - ax;
    const abz = bz - az;
    const t = Math.min(1, Math.max(0, ((x - ax) * abx + (z - az) * abz) / (abx * abx + abz * abz || 1)));
    best = Math.min(best, Math.hypot(x - (ax + abx * t), z - (az + abz * t)));
  }
  return best;
}

/** Water, the river gorge, and everything past the map's edge. The footbridge crosses the gorge. */
export function isGroundBlocked(x: number, z: number): boolean {
  if (Math.abs(x) > HALF - WALK.edgeMargin || Math.abs(z) > HALF - WALK.edgeMargin) return true;
  // The road bridge over the outlet channel carries the plateau track; its deck is ground.
  if (bridgeDeckAt(x, z) > Number.NEGATIVE_INFINITY) return false;
  const onFootbridge = distanceToFootbridge(x, z) < 1.1;
  if (x > LAKE.dam.x - 4 && riverDistance(x, z) < RIVER.halfWidth + 1.5) return !onFootbridge;
  return landHeightAt(x, z) < LAKE.level + WALK.wetMargin;
}

/**
 * The walk world over the real terrain, with the given obstacles and the surfaces stood on
 * above the ground - the square's paving, the pavements, the verges. Without them the feet
 * sank a hand's depth into the square and to the ankle into every pavement.
 */
export function createWalkWorld(obstacles: readonly Circle[], surfaces: HeightField | null = null): WalkWorld {
  return {
    heightAt: surfaces ? (x, z) => Math.max(landHeightAt(x, z), heightFieldAt(surfaces, x, z)) : landHeightAt,
    isGroundBlocked,
    obstaclesNear: createObstacleIndex(obstacles, WALK.obstacleCell),
  };
}
