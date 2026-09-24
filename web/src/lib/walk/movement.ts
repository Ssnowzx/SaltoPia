import { WALK } from "@/lib/world/constants";

import type { Circle, WalkWorld } from "./walk-world";

/**
 * One frame of walking, resolved against the world's rules. Pure: the world is handed in,
 * so the step is tested without a scene. See design.md D3 of add-walking-character.
 */

export interface Walker {
  readonly x: number;
  readonly z: number;
  /** Which way the body faces, in radians; 0 faces +Z. */
  readonly heading: number;
  /** Metres per second actually covered in the last step. */
  readonly speed: number;
}

export interface WalkInput {
  /** The wanted direction on the ground, in world space; zero to stand still. */
  readonly directionX: number;
  readonly directionZ: number;
  readonly run: boolean;
}

/** The wanted direction from stick or keys, turned into the camera's frame. */
export function directionFromCamera(forward: number, right: number, cameraX: number, cameraZ: number): { x: number; z: number } {
  const length = Math.hypot(cameraX, cameraZ) || 1;
  const fx = cameraX / length;
  const fz = cameraZ / length;
  // The camera's right on the ground is its forward turned a quarter to the right: (-fz, fx).
  const x = fx * forward - fz * right;
  const z = fz * forward + fx * right;
  const magnitude = Math.hypot(x, z);
  return magnitude > 1 ? { x: x / magnitude, z: z / magnitude } : { x, z };
}

function overlaps(x: number, z: number, circles: readonly Circle[]): boolean {
  return circles.some((circle) => Math.hypot(x - circle.x, z - circle.z) < circle.radius + WALK.radius);
}

function isFree(x: number, z: number, world: WalkWorld): boolean {
  return !world.isGroundBlocked(x, z) && !overlaps(x, z, world.obstaclesNear(x, z));
}

/** Pushes a point out of every circle it has sunk into, along each circle's own normal. */
function pushOut(x: number, z: number, circles: readonly Circle[]): { x: number; z: number } {
  let px = x;
  let pz = z;
  for (const circle of circles) {
    const dx = px - circle.x;
    const dz = pz - circle.z;
    const distance = Math.hypot(dx, dz);
    const clear = circle.radius + WALK.radius;
    if (distance >= clear || distance === 0) continue;
    px = circle.x + (dx / distance) * clear;
    pz = circle.z + (dz / distance) * clear;
  }
  return { x: px, z: pz };
}

/**
 * Moves from (x, z) toward (x + dx, z + dz) as far as the world allows: the whole step, or
 * failing that its X or its Z part alone - which is what slides a walker along a bank or a
 * wall instead of stopping it dead.
 */
export function resolveStep(x: number, z: number, dx: number, dz: number, world: WalkWorld): { x: number; z: number } {
  const candidates: ReadonlyArray<readonly [number, number]> = [[x + dx, z + dz], [x + dx, z], [x, z + dz]];
  for (const [cx, cz] of candidates) {
    const pushed = pushOut(cx, cz, world.obstaclesNear(cx, cz));
    if (isFree(pushed.x, pushed.z, world)) return pushed;
  }
  return { x, z };
}

/** Turns an angle toward a target by at most `step`, the short way round. */
function turnToward(angle: number, target: number, step: number): number {
  const difference = Math.atan2(Math.sin(target - angle), Math.cos(target - angle));
  return angle + Math.max(-step, Math.min(step, difference));
}

/** Advances a walker by `delta` seconds. */
export function stepWalker(walker: Walker, input: WalkInput, delta: number, world: WalkWorld): Walker {
  const magnitude = Math.hypot(input.directionX, input.directionZ);
  const wanted = magnitude > 0.05 ? (input.run ? WALK.runSpeed : WALK.walkSpeed) * Math.min(1, magnitude) : 0;
  const ease = 1 - Math.exp(-WALK.acceleration * delta);
  const speed = walker.speed + (wanted - walker.speed) * ease;
  if (magnitude <= 0.05 && speed < 0.05) return { ...walker, speed: 0 };

  const heading = magnitude > 0.05 ? turnToward(walker.heading, Math.atan2(input.directionX, input.directionZ), WALK.turnRate * delta) : walker.heading;
  const moveX = magnitude > 0.05 ? input.directionX / magnitude : Math.sin(heading);
  const moveZ = magnitude > 0.05 ? input.directionZ / magnitude : Math.cos(heading);
  const next = resolveStep(walker.x, walker.z, moveX * speed * delta, moveZ * speed * delta, world);
  const covered = Math.hypot(next.x - walker.x, next.z - walker.z) / Math.max(delta, 1e-4);
  return { x: next.x, z: next.z, heading, speed: Math.min(speed, covered + 0.2) };
}
