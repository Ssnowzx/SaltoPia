import { BoxGeometry, BufferGeometry, Float32BufferAttribute } from "three";

import { awning, box, merge, paint, post } from "./builders";
import { BUILDING, WORLD_COLORS } from "./constants";
import type { SurfaceKey } from "./textures";

/**
 * Buildings: walls, a roof that overhangs them, and the openings in them.
 *
 * Built at the origin facing +Z, base at y = 0, like every builder. The roof is two real
 * slabs with thickness, reaching past the walls at the eaves and the gables, or a hipped
 * roof with a fascia; the triangle under a gable is wall, in the wall's own material - it
 * used to be roof tile, which is how the whole town read as boxes wearing tents. Openings
 * are built in the wall's own frame and moved onto it (founding design D13). See design.md
 * D7 of elevate-world-realism.
 */

/** How a building is put together. */
export interface BuildingSpec {
  readonly width: number;
  readonly depth: number;
  /** Height of one storey. */
  readonly height: number;
  /** Ridge height above the wall top. */
  readonly roofHeight: number;
  readonly wallColor: string;
  readonly roofColor: string;
  readonly wallSurface?: SurfaceKey;
  readonly roofSurface?: SurfaceKey;
  readonly stories?: number;
  /** Gable (the default) or hipped - four slopes, no gable walls. */
  readonly roofStyle?: "gable" | "hip";
  /** Frames, fascia, cornice and corner boards. Defaults to whitewash. */
  readonly trim?: string;
  /** Painted shutters either side of each window. */
  readonly shutters?: string;
  /** A small canopy on posts over the front door. */
  readonly porch?: boolean;
  /** Adds a chimney. Serra houses have them because the lareira is the point. */
  readonly chimney?: boolean;
  /** Adds a covered veranda along the front (+Z) - the deep varanda of a galpao. */
  readonly veranda?: boolean;
  /** Adds framed, glazed windows and a door on the front. */
  readonly windows?: boolean;
  /** Adds a shop awning over the ground-floor front. */
  readonly awning?: string;
  /** Adds a balcony along the upper floor. */
  readonly balcony?: boolean;
  /** Adds a blank signboard above the ground floor. */
  readonly sign?: boolean;
}

function wallTopOf(spec: BuildingSpec): number {
  return spec.height * (spec.stories ?? 1);
}

/** Where a building's chimney top ends up, so smoke can be attached to it. */
export function chimneyTopFor(spec: BuildingSpec): readonly [number, number, number] {
  return [spec.width * 0.28, wallTopOf(spec) + spec.roofHeight * 1.5, spec.depth * 0.18];
}

/** Height of a gable roof's upper surface above the ground at a distance `x` from the ridge. */
export function roofSurfaceHeight(spec: BuildingSpec, x: number): number {
  return wallTopOf(spec) + spec.roofHeight * (1 - Math.abs(x) / (spec.width / 2));
}

/** A triangle from three points, wound as given; normals come from the merge. */
function triangle(points: ReadonlyArray<readonly [number, number, number]>, color: string, surface: SurfaceKey): BufferGeometry {
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(points.flat(), 3));
  return paint(geometry, color, surface);
}

// ---------------------------------------------------------------------------------
// Roofs
// ---------------------------------------------------------------------------------

/**
 * A gable roof: two slabs meeting at a ridge along Z, the gable triangles under them in
 * wall material, a ridge cap and fascia boards along the eaves.
 */
function gableRoofParts(spec: BuildingSpec): BufferGeometry[] {
  const wallTop = wallTopOf(spec);
  const halfWidth = spec.width / 2;
  const pitch = Math.atan2(spec.roofHeight, halfWidth);
  const cos = Math.cos(pitch);
  const sin = Math.sin(pitch);
  const slopeLength = (halfWidth + BUILDING.eave) / cos;
  const length = spec.depth + 2 * BUILDING.gableOverhang;
  const thickness = BUILDING.roofThickness;
  const trim = spec.trim ?? WORLD_COLORS.whitewash;
  const parts: BufferGeometry[] = [];

  for (const side of [-1, 1] as const) {
    const slab = new BoxGeometry(slopeLength, thickness, length);
    slab.rotateZ(-side * pitch);
    // The slab's top face runs from the ridge down past the wall's edge; its centre sits
    // half a thickness below that face, along the slab's own normal.
    const centreX = side * (slopeLength / 2) * cos - side * sin * (thickness / 2);
    const centreY = wallTop + spec.roofHeight - (slopeLength / 2) * sin - cos * (thickness / 2);
    slab.translate(centreX, centreY, 0);
    parts.push(paint(slab, spec.roofColor, spec.roofSurface ?? "tiles"));

    const eaveY = wallTop - BUILDING.eave * Math.tan(pitch);
    parts.push(box(0.07, 0.26, length + 0.04, trim, side * (halfWidth + BUILDING.eave + 0.02), eaveY - 0.12, 0, 0, "planks"));
  }

  parts.push(box(0.34, 0.2, length, WORLD_COLORS.tileDark, 0, wallTop + spec.roofHeight + 0.04, 0, 0, spec.roofSurface ?? "tiles"));

  // The gables, a hair under the slabs so the two never share a plane.
  const apex = wallTop + spec.roofHeight - thickness / cos - BUILDING.gableClearance;
  for (const face of [-1, 1] as const) {
    const z = (face * spec.depth) / 2;
    const left: readonly [number, number, number] = [-halfWidth, wallTop, z];
    const right: readonly [number, number, number] = [halfWidth, wallTop, z];
    const top: readonly [number, number, number] = [0, apex, z];
    parts.push(triangle(face === 1 ? [left, right, top] : [right, left, top], spec.wallColor, spec.wallSurface ?? "plaster"));
  }

  return parts;
}

/**
 * A hipped roof - four slopes at one pitch, the ridge along the longer side - with its
 * soffit and a fascia band round the eaves.
 */
function hipRoofParts(spec: BuildingSpec): BufferGeometry[] {
  const wallTop = wallTopOf(spec);
  const alongX = spec.width >= spec.depth;
  const long = (alongX ? spec.width : spec.depth) / 2 + BUILDING.eave;
  const short = (alongX ? spec.depth : spec.width) / 2 + BUILDING.eave;
  const slope = spec.roofHeight / ((alongX ? spec.depth : spec.width) / 2);
  const eaveY = wallTop - BUILDING.eave * slope;
  const ridgeY = eaveY + short * slope;
  const ridge = Math.max(0, long - short);
  const surface = spec.roofSurface ?? "tiles";

  // Written for a ridge along X, then turned when the building is deeper than it is wide.
  const a: readonly [number, number, number] = [-long, eaveY, -short];
  const b: readonly [number, number, number] = [long, eaveY, -short];
  const c: readonly [number, number, number] = [long, eaveY, short];
  const d: readonly [number, number, number] = [-long, eaveY, short];
  const r1: readonly [number, number, number] = [-ridge, ridgeY, 0];
  const r2: readonly [number, number, number] = [ridge, ridgeY, 0];

  const faces = [
    triangle([d, c, r2, d, r2, r1], spec.roofColor, surface),
    triangle([b, a, r1, b, r1, r2], spec.roofColor, surface),
    triangle([c, b, r2], spec.roofColor, surface),
    triangle([a, d, r1], spec.roofColor, surface),
    triangle([a, b, c, a, c, d], spec.roofColor, surface),
  ];
  if (!alongX) faces.forEach((face) => face.rotateY(Math.PI / 2));

  const trim = spec.trim ?? WORLD_COLORS.whitewash;
  const outerX = spec.width / 2 + BUILDING.eave;
  const outerZ = spec.depth / 2 + BUILDING.eave;
  return [
    ...faces,
    box(outerX * 2 + 0.08, 0.24, 0.07, trim, 0, eaveY - 0.1, outerZ, 0, "planks"),
    box(outerX * 2 + 0.08, 0.24, 0.07, trim, 0, eaveY - 0.1, -outerZ, 0, "planks"),
    box(0.07, 0.24, outerZ * 2, trim, outerX, eaveY - 0.1, 0, 0, "planks"),
    box(0.07, 0.24, outerZ * 2, trim, -outerX, eaveY - 0.1, 0, 0, "planks"),
  ];
}

// ---------------------------------------------------------------------------------
// Openings, built in the wall's own frame: centred on x = 0, facing +Z, wall face at z = 0
// ---------------------------------------------------------------------------------

function windowParts(spec: BuildingSpec, width: number, height: number, sillY: number): BufferGeometry[] {
  const frame = spec.trim ?? WORLD_COLORS.whitewash;
  const parts = [
    // Glass, recessed well behind the wall face. Coplanar with the wall, the two fought
    // for the depth buffer and every window in the town blinked (founding design D15).
    box(width, height, 0.1, WORLD_COLORS.glass, 0, sillY + height / 2, -0.14, 0, "glass"),
    box(width + 0.16, 0.08, 0.14, frame, 0, sillY + height + 0.04, 0.02, 0, "planks"),
    box(width + 0.26, 0.1, 0.22, frame, 0, sillY - 0.05, 0.05, 0, "plaster"),
    box(0.08, height, 0.14, frame, -width / 2 - 0.04, sillY + height / 2, 0.02, 0, "planks"),
    box(0.08, height, 0.14, frame, width / 2 + 0.04, sillY + height / 2, 0.02, 0, "planks"),
    box(width, 0.05, 0.1, frame, 0, sillY + height * 0.62, -0.06, 0, "planks"),
    box(0.05, height, 0.1, frame, 0, sillY + height / 2, -0.06, 0, "planks"),
  ];
  if (spec.shutters !== undefined) {
    const leaf = width * 0.5;
    for (const side of [-1, 1]) {
      parts.push(box(leaf, height + 0.06, 0.06, spec.shutters, side * (width / 2 + 0.1 + leaf / 2), sillY + height / 2, 0.06, 0, "planks"));
    }
  }
  return parts;
}

function doorParts(spec: BuildingSpec, width: number, height: number): BufferGeometry[] {
  const frame = spec.trim ?? WORLD_COLORS.whitewash;
  const parts = [
    box(width, height, 0.1, WORLD_COLORS.timberDark, 0, height / 2, -0.14, 0, "planks"),
    box(width + 0.2, 0.1, 0.16, frame, 0, height + 0.05, 0.02, 0, "planks"),
    box(0.1, height, 0.16, frame, -width / 2 - 0.05, height / 2, 0.02, 0, "planks"),
    box(0.1, height, 0.16, frame, width / 2 + 0.05, height / 2, 0.02, 0, "planks"),
    box(width + 0.9, 0.16, 0.9, WORLD_COLORS.stone, 0, 0.08, 0.45, 0, "stone"),
  ];
  if (spec.porch === true) {
    const canopy = new BoxGeometry(width + 1.2, 0.1, 1.3);
    canopy.rotateX(0.18);
    canopy.translate(0, height + 0.45, 0.62);
    parts.push(paint(canopy, spec.roofColor, spec.roofSurface ?? "tiles"));
    for (const side of [-1, 1]) {
      parts.push(post(0.06, 0.06, height + 0.35, 5, frame, side * (width / 2 + 0.45), 0.16, 1.15, "planks"));
    }
  }
  return parts;
}

type Wall = "front" | "back" | "left" | "right";

/** Moves an opening from the wall-local frame onto one of a box's four walls. */
function onWall(parts: readonly BufferGeometry[], wall: Wall, along: number, spec: BuildingSpec): BufferGeometry[] {
  const placement: Readonly<Record<Wall, { rotation: number; x: number; z: number; alongX: boolean }>> = {
    front: { rotation: 0, x: 0, z: spec.depth / 2, alongX: true },
    back: { rotation: Math.PI, x: 0, z: -spec.depth / 2, alongX: true },
    right: { rotation: Math.PI / 2, x: spec.width / 2, z: 0, alongX: false },
    left: { rotation: -Math.PI / 2, x: -spec.width / 2, z: 0, alongX: false },
  };
  const { rotation, x, z, alongX } = placement[wall];
  for (const part of parts) {
    if (rotation !== 0) part.rotateY(rotation);
    part.translate(alongX ? x + along : x, 0, alongX ? z : z + along);
  }
  return [...parts];
}

/** Evenly spaced offsets along a wall of `length`. */
function spacing(length: number, count: number): number[] {
  return Array.from({ length: count }, (_, index) => -length / 2 + (length / (count + 1)) * (index + 1));
}

function openingParts(spec: BuildingSpec): BufferGeometry[] {
  const parts: BufferGeometry[] = [];
  const stories = spec.stories ?? 1;
  const windowWidth = Math.min(1.0, spec.width * 0.17);
  const windowHeight = Math.min(1.25, spec.height * 0.42);
  const across = Math.max(2, Math.floor(spec.width / BUILDING.windowPitch));
  // An odd count on the front, so the door stands in the middle of the ground floor.
  const front = across % 2 === 0 ? across + 1 : across;
  const along = Math.max(1, Math.floor(spec.depth / (BUILDING.windowPitch + 0.3)));

  for (let storey = 0; storey < stories; storey += 1) {
    const sill = storey * spec.height + spec.height * 0.38;
    spacing(spec.width, front).forEach((offset, index) => {
      const isDoor = storey === 0 && index === (front - 1) / 2;
      parts.push(...onWall(isDoor ? doorParts(spec, windowWidth * 1.05, spec.height * 0.7) : windowParts(spec, windowWidth, windowHeight, sill), "front", offset, spec));
    });
    for (const offset of spacing(spec.width, across)) parts.push(...onWall(windowParts(spec, windowWidth, windowHeight, sill), "back", offset, spec));
    for (const wall of ["left", "right"] as const) {
      for (const offset of spacing(spec.depth, along)) parts.push(...onWall(windowParts(spec, windowWidth, windowHeight, sill), wall, offset, spec));
    }
  }
  return parts;
}

// ---------------------------------------------------------------------------------
// Extras
// ---------------------------------------------------------------------------------

function chimneyParts(spec: BuildingSpec): BufferGeometry[] {
  const [x, top, z] = chimneyTopFor(spec);
  const height = top - wallTopOf(spec) + 0.4;
  const size = Math.max(0.55, spec.width * 0.12);
  return [
    box(size, height, size, WORLD_COLORS.tileDark, x, top - height / 2, z, 0, "brick"),
    box(size + 0.14, 0.12, size + 0.14, WORLD_COLORS.stoneDark, x, top, z, 0, "stone"),
  ];
}

/** Boards up the corners of a timber house, painted with the trim. */
function cornerBoardParts(spec: BuildingSpec): BufferGeometry[] {
  const wallTop = wallTopOf(spec);
  const trim = spec.trim ?? WORLD_COLORS.whitewash;
  return [-1, 1].flatMap((sx) =>
    [-1, 1].map((sz) => box(0.18, wallTop, 0.18, trim, (sx * spec.width) / 2, wallTop / 2, (sz * spec.depth) / 2, 0, "planks")),
  );
}

function verandaParts(spec: BuildingSpec): BufferGeometry[] {
  const deckDepth = spec.depth * 0.42;
  const roofY = spec.height * 0.86;
  const parts = [box(spec.width * 1.04, 0.22, deckDepth, WORLD_COLORS.timber, 0, 0.11, spec.depth / 2 + deckDepth / 2, 0, "planks")];
  for (let index = 0; index < 4; index += 1) {
    parts.push(post(0.1, 0.1, roofY, 6, WORLD_COLORS.timber, -spec.width * 0.44 + (index * spec.width * 0.88) / 3, 0, spec.depth / 2 + deckDepth * 0.85, "planks"));
  }
  parts.push(box(spec.width * 1.08, 0.16, deckDepth * 1.1, spec.roofColor, 0, roofY, spec.depth / 2 + deckDepth / 2, 0, spec.roofSurface ?? "tiles"));
  parts.push(box(spec.width * 1.04, 0.08, 0.08, WORLD_COLORS.timber, 0, 0.95, spec.depth / 2 + deckDepth * 0.85, 0, "planks"));
  return parts;
}

function balconyParts(spec: BuildingSpec): BufferGeometry[] {
  const floorY = spec.height;
  const reach = 0.9;
  const frontZ = spec.depth / 2 + 0.03;
  const parts = [box(spec.width * 0.8, 0.14, reach, WORLD_COLORS.stone, 0, floorY, frontZ + reach / 2, 0, "stone")];
  const rails = Math.floor((spec.width * 0.8) / 0.4);
  for (let index = 0; index <= rails; index += 1) {
    parts.push(post(0.03, 0.03, 0.9, 4, WORLD_COLORS.metal, -spec.width * 0.4 + (index * spec.width * 0.8) / rails, floorY + 0.07, frontZ + reach - 0.08, "metal"));
  }
  parts.push(box(spec.width * 0.8, 0.06, 0.06, WORLD_COLORS.metal, 0, floorY + 0.97, frontZ + reach - 0.08, 0, "metal"));
  return parts;
}

function shopfrontParts(spec: BuildingSpec): BufferGeometry[] {
  const frontZ = spec.depth / 2 + 0.03;
  const parts: BufferGeometry[] = [];
  if (spec.awning !== undefined) parts.push(awning(spec.width * 0.86, 0.9, spec.awning, 0, spec.height * 0.82, frontZ + 0.42));
  if (spec.sign === true) {
    parts.push(box(spec.width * 0.7, 0.5, 0.1, WORLD_COLORS.whitewash, 0, spec.height * 0.98, frontZ + 0.05));
    parts.push(box(spec.width * 0.72, 0.06, 0.14, WORLD_COLORS.timberDark, 0, spec.height * 0.98 + 0.27, frontZ + 0.05, 0, "planks"));
  }
  return parts;
}

/** A building, from its spec. */
export function createBuildingGeometry(spec: BuildingSpec): BufferGeometry {
  const wallTop = wallTopOf(spec);
  const wallSurface = spec.wallSurface ?? "plaster";
  const trim = spec.trim ?? WORLD_COLORS.whitewash;
  const parts: BufferGeometry[] = [
    box(spec.width, wallTop, spec.depth, spec.wallColor, 0, wallTop / 2, 0, 0, wallSurface),
    // A plinth and a cornice bracket the wall, which is what stops it reading as a box.
    box(spec.width + 0.16, 0.4, spec.depth + 0.16, WORLD_COLORS.stoneDark, 0, 0.2, 0, 0, "stone"),
    box(spec.width + 0.12, 0.16, spec.depth + 0.12, trim, 0, wallTop - 0.08, 0, 0, "plaster"),
    ...(spec.roofStyle === "hip" ? hipRoofParts(spec) : gableRoofParts(spec)),
  ];

  if (wallSurface === "planks") parts.push(...cornerBoardParts(spec));
  if (spec.chimney === true) parts.push(...chimneyParts(spec));
  if (spec.windows === true) parts.push(...openingParts(spec));
  if (spec.balcony === true && (spec.stories ?? 1) > 1) parts.push(...balconyParts(spec));
  if (spec.veranda === true) parts.push(...verandaParts(spec));
  parts.push(...shopfrontParts(spec));

  return merge(parts);
}
