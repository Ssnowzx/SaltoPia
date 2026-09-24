import { TOWNSFOLK } from "@/lib/world/constants";

import type { Point } from "./pathfinding";
import type { Circle, WalkWorld } from "./walk-world";

/**
 * Where the townsfolk and the visitor are this frame, shared between their frame loops.
 * Module state, like a clock: it changes every frame and nothing React renders reads it.
 * See design.md D3 of add-living-townsfolk.
 */

const people = new Map<string, { x: number; z: number; radius: number }>();
let visitor: Point | null = null;

/** Records a townsperson's position this frame. */
export function placeInCrowd(id: string, x: number, z: number): void {
  const person = people.get(id);
  if (person) {
    person.x = x;
    person.z = z;
  } else {
    people.set(id, { x, z, radius: TOWNSFOLK.radius });
  }
}

export function leaveCrowd(id: string): void {
  people.delete(id);
}

/** The townsfolk close enough to a point to touch a walker there. */
export function crowdNear(x: number, z: number, reach: number): readonly Circle[] {
  const near: Circle[] = [];
  for (const person of people.values()) {
    if (Math.abs(person.x - x) < reach && Math.abs(person.z - z) < reach) near.push({ x: person.x, z: person.z, radius: person.radius });
  }
  return near;
}

/** Where the visitor's character stands, or null when nobody is walking. */
export function setVisitor(point: Point | null): void {
  visitor = point;
}

export function visitorPosition(): Point | null {
  return visitor;
}

/** How near a townsperson must be to be looked at for a collision. */
const CROWD_REACH = 3;

/** The walk world with the townsfolk in it: a walker stops against them as against a post. */
export function withCrowd(world: WalkWorld): WalkWorld {
  return {
    ...world,
    obstaclesNear: (x, z) => {
      const near = crowdNear(x, z, CROWD_REACH);
      return near.length ? [...world.obstaclesNear(x, z), ...near] : world.obstaclesNear(x, z);
    },
  };
}
