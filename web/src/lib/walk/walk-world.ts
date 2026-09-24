import { LAKE, RIVER, TERRAIN, WALK } from "@/lib/world/constants";
import { FOOTBRIDGE } from "@/lib/world/road-network";
import { buildCentrelines, clearanceToOtherRoads } from "@/lib/world/road-junctions";
import { LIFT } from "@/lib/world/road-surfaces";
import { ROAD_POLYLINES } from "@/lib/world/road-network";
import { surfaceHeightAt } from "@/lib/world/roads";
import { landHeightAt } from "@/lib/world/outer-land";
import { bridgeDeckAt, riverDistance } from "@/lib/world/terrain";

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

/** Raised floors keyed by a half-metre cell, for a lookup per step. */
export function createFloorIndex(floors: ReadonlyArray<{ readonly x: number; readonly z: number; readonly height: number }>, cell: number): (x: number, z: number) => number {
  const heights = new Map<string, number>();
  for (const floor of floors) {
    const cellKey = `${Math.floor(floor.x / cell)},${Math.floor(floor.z / cell)}`;
    heights.set(cellKey, Math.max(heights.get(cellKey) ?? Number.NEGATIVE_INFINITY, floor.height));
  }
  return (x, z) => heights.get(`${Math.floor(x / cell)},${Math.floor(z / cell)}`) ?? Number.NEGATIVE_INFINITY;
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

const CENTRELINES = buildCentrelines(ROAD_POLYLINES);
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

/**
 * The height the feet stand at: the ground, or the road surface where there is one - the
 * roads float over the graded ground, and without their lift the feet sank into every street.
 */
export function walkHeightAt(x: number, z: number): number {
  const ground = landHeightAt(x, z);
  if (clearanceToOtherRoads(x, z, [], CENTRELINES) < 0) return Math.max(ground, surfaceHeightAt(x, z) + LIFT.carriageway);
  return ground;
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

/** Half a metre: the cell the open places' floors are read at. */
const FLOOR_CELL = 0.5;

/**
 * The walk world over the real terrain, with the given obstacles and raised floors. A
 * walker on the square stands on its paving, not on the ground under it - the feet sank
 * a hand's depth into it before.
 */
export function createWalkWorld(obstacles: readonly Circle[], floors: ReadonlyArray<{ readonly x: number; readonly z: number; readonly height: number }> = []): WalkWorld {
  const floorAt = createFloorIndex(floors, FLOOR_CELL);
  return {
    heightAt: (x, z) => Math.max(walkHeightAt(x, z), floorAt(x, z)),
    isGroundBlocked,
    obstaclesNear: createObstacleIndex(obstacles, WALK.obstacleCell),
  };
}
