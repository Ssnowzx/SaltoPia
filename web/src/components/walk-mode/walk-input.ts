import type { Point } from "@/lib/walk/pathfinding";

/**
 * Input shared between the interface and the scene: the touch joystick writes it, the frame
 * loop reads it. A plain mutable object, not React state - it changes every frame a finger
 * moves.
 */
export interface StickInput {
  forward: number;
  right: number;
  run: boolean;
}

export function createStickInput(): StickInput {
  return { forward: 0, right: 0, run: false };
}

/** The keys walk mode listens to, for drei's KeyboardControls. */
export const WALK_KEYS = [
  { name: "forward", keys: ["ArrowUp", "KeyW"] },
  { name: "backward", keys: ["ArrowDown", "KeyS"] },
  { name: "left", keys: ["ArrowLeft", "KeyA"] },
  { name: "right", keys: ["ArrowRight", "KeyD"] },
  { name: "run", keys: ["ShiftLeft", "ShiftRight"] },
] as const;

export type WalkKey = (typeof WALK_KEYS)[number]["name"];

/** A point to walk to, with a serial so the same point asked twice is a new request. */
export interface RouteRequest {
  readonly target: Point;
  readonly serial: number;
}

/** Turns a pointer position, in normalised device coordinates, into a point on the ground. */
export type GroundPicker = (ndcX: number, ndcY: number) => Point | null;
