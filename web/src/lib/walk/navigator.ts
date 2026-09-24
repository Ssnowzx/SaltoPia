import { TERRAIN, WALK } from "@/lib/world/constants";

import { worldFloors, worldObstacles } from "./obstacles";
import { type Point, type WalkGrid, buildWalkGrid, findPath } from "./pathfinding";
import { type WalkWorld, createWalkWorld } from "./walk-world";

/**
 * The walk world and its route grid, built once and shared. The grid - 310 by 310 cells, each
 * asking the terrain whether it is dry - is the slow part, so it waits until a route is first
 * wanted, or until the browser is idle after walk mode opens.
 */

let world: WalkWorld | null = null;
let grid: WalkGrid | null = null;

export function walkWorld(): WalkWorld {
  world ??= createWalkWorld(worldObstacles(), worldFloors());
  return world;
}

function isWalkable(x: number, z: number): boolean {
  const current = walkWorld();
  if (current.isGroundBlocked(x, z)) return false;
  return current.obstaclesNear(x, z).every((circle) => Math.hypot(x - circle.x, z - circle.z) > circle.radius + WALK.radius);
}

export function walkGrid(): WalkGrid {
  grid ??= buildWalkGrid(-TERRAIN.size / 2, -TERRAIN.size / 2, TERRAIN.size, WALK.gridCell, isWalkable);
  return grid;
}

/** Builds the grid when the browser has a moment, so the first route is instant. */
export function warmWalkGrid(): void {
  if (grid) return;
  // Safari has no requestIdleCallback; a short timeout does the same job there.
  const idle: (callback: () => void) => void =
    typeof window.requestIdleCallback === "function" ? (callback) => window.requestIdleCallback(callback) : (callback) => globalThis.setTimeout(callback, 400);
  idle(() => walkGrid());
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
