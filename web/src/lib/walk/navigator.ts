import { runWhenIdle } from "@/lib/idle-work";
import { TERRAIN, WALK } from "@/lib/world/constants";

import { readOpenGround, worldObstacles, worldSurfaces } from "./obstacles";
import { type Point, type WalkGrid, type WalkGridBuilder, createWalkGridBuilder, findPath } from "./pathfinding";
import { type WalkWorld, createWalkWorld } from "./walk-world";

/**
 * The walk world and its route grid, built once and shared. Both are slow to build - the
 * open places' props are read from their geometry, and the grid's 310 by 310 cells each ask
 * the terrain whether they are dry - so both are prepared in slices in idle moments, and
 * whoever needs one before it is ready finishes it there and then. See design.md D2 of
 * speed-up-the-hub.
 */

let world: WalkWorld | null = null;
let grid: WalkGrid | null = null;
let gridBuilder: WalkGridBuilder | null = null;
let gridWarming = false;

export function walkWorld(): WalkWorld {
  world ??= createWalkWorld(worldObstacles(), worldSurfaces());
  return world;
}

/**
 * Prepares the walk world a slice at a time: the open places one by one, then the rest at
 * once, which takes a few milliseconds. True once the world is ready.
 */
export function prepareWalkWorld(hasTime: () => boolean): boolean {
  if (world) return true;
  if (!readOpenGround(hasTime)) return false;
  walkWorld();
  return true;
}

/** Dry, on the map, and clear of every obstacle by a walker's radius. */
export function isWalkable(x: number, z: number): boolean {
  const current = walkWorld();
  if (current.isGroundBlocked(x, z)) return false;
  return current.obstaclesNear(x, z).every((circle) => Math.hypot(x - circle.x, z - circle.z) > circle.radius + WALK.radius);
}

function gridBuilderFor(): WalkGridBuilder {
  gridBuilder ??= createWalkGridBuilder(-TERRAIN.size / 2, -TERRAIN.size / 2, TERRAIN.size, WALK.gridCell, isWalkable);
  return gridBuilder;
}

/**
 * Prepares the route grid a slice at a time, after the walk world it samples. Every call
 * moves the work on: a slice that finishes the world leaves the grid to the next. True once
 * the grid is ready.
 */
export function prepareWalkGrid(hasTime: () => boolean): boolean {
  if (grid) return true;
  if (!world && (!prepareWalkWorld(hasTime) || !hasTime())) return false;
  const builder = gridBuilderFor();
  if (!builder.fill(hasTime)) return false;
  grid = builder.grid;
  return true;
}

export function walkGrid(): WalkGrid {
  if (grid) return grid;
  const builder = gridBuilderFor();
  builder.fill(() => true);
  grid = builder.grid;
  return grid;
}

/** Builds the grid in idle moments once walk mode opens, so the first route is instant. */
export function warmWalkGrid(): void {
  if (grid || gridWarming) return;
  gridWarming = true;
  runWhenIdle(prepareWalkGrid);
}

export function routeBetween(from: Point, to: Point): Point[] | null {
  return findPath(walkGrid(), from, to);
}

/** The walkable point nearest (x, z), searched outward in rings of a metre. */
export function standingPointNear(x: number, z: number): Point {
  for (let ring = 0; ring < 40; ring += 1) {
    const steps = Math.max(1, ring * 8);
    for (let step = 0; step < steps; step += 1) {
      const angle = (step / steps) * Math.PI * 2;
      const px = x + Math.cos(angle) * ring;
      const pz = z + Math.sin(angle) * ring;
      if (isWalkable(px, pz)) return { x: px, z: pz };
    }
  }
  return { x, z };
}
