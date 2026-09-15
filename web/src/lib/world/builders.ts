import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  Float32BufferAttribute,
  IcosahedronGeometry,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

import { WORLD_COLORS } from "./constants";
import { createRandom } from "./noise";
import { SURFACE, type SurfaceKey } from "./textures";

/**
 * Procedural geometry primitives for everything standing on the terrain.
 *
 * These are the "models" the neighbourhood layout refers to. They are built in code
 * rather than loaded from files - see design.md D1, revised. Each builder returns a
 * single merged geometry carrying a vertex colour and a surface id per vertex, so one
 * atlas material can draw it, which is what makes instancing possible further up.
 *
 * Every part is built at the origin facing +Z, with Y up and the base at y = 0.
 */

// ---------------------------------------------------------------------------------
// Merge plumbing
// ---------------------------------------------------------------------------------

/** How many world units one atlas tile spans when projected onto a surface. */
const TEXTURE_UNITS_PER_TILE = 2.2;

/** Attaches a flat vertex colour and a surface id to every vertex of a geometry. */
export function paint(geometry: BufferGeometry, hex: string, surface: SurfaceKey = "plain"): BufferGeometry {
  const color = new Color(hex);
  const count = geometry.attributes.position.count;
  const colors = new Float32Array(count * 3);
  const surfaces = new Float32Array(count).fill(SURFACE[surface]);

  for (let index = 0; index < count; index += 1) {
    colors[index * 3] = color.r;
    colors[index * 3 + 1] = color.g;
    colors[index * 3 + 2] = color.b;
  }

  geometry.setAttribute("color", new BufferAttribute(colors, 3));
  geometry.setAttribute("surface", new BufferAttribute(surfaces, 1));
  return geometry;
}

/**
 * Projects UVs onto each triangle from whichever axis it faces most - box mapping.
 *
 * Primitive UVs stretch one tile over a whole face regardless of size; projecting from
 * world units instead gives every wall the same brick size, which is what makes the
 * atlas read as material rather than as decal.
 */
function applyBoxProjectionUVs(geometry: BufferGeometry): void {
  const positions = geometry.attributes.position;
  const uvs = new Float32Array(positions.count * 2);
  const scale = 1 / TEXTURE_UNITS_PER_TILE;

  for (let index = 0; index + 2 < positions.count; index += 3) {
    const ax = positions.getX(index);
    const ay = positions.getY(index);
    const az = positions.getZ(index);
    const bx = positions.getX(index + 1) - ax;
    const by = positions.getY(index + 1) - ay;
    const bz = positions.getZ(index + 1) - az;
    const cx = positions.getX(index + 2) - ax;
    const cy = positions.getY(index + 2) - ay;
    const cz = positions.getZ(index + 2) - az;

    const normalX = Math.abs(by * cz - bz * cy);
    const normalY = Math.abs(bz * cx - bx * cz);
    const normalZ = Math.abs(bx * cy - by * cx);

    for (let vertex = 0; vertex < 3; vertex += 1) {
      const x = positions.getX(index + vertex);
      const y = positions.getY(index + vertex);
      const z = positions.getZ(index + vertex);
      let u: number;
      let v: number;

      if (normalY >= normalX && normalY >= normalZ) {
        u = x;
        v = z;
      } else if (normalX >= normalZ) {
        u = z;
        v = y;
      } else {
        u = x;
        v = y;
      }

      uvs[(index + vertex) * 2] = u * scale;
      uvs[(index + vertex) * 2 + 1] = v * scale;
    }
  }

  geometry.setAttribute("uv", new BufferAttribute(uvs, 2));
}

/**
 * Brings a geometry to the common shape every part must share before merging:
 * non-indexed, with position, normal, uv, color and surface.
 *
 * `mergeGeometries` refuses a mix of indexed and non-indexed parts, and needs the same
 * attribute names throughout.
 */
function normaliseForMerge(geometry: BufferGeometry): BufferGeometry {
  const flat = geometry.index ? geometry.toNonIndexed() : geometry;

  applyBoxProjectionUVs(flat);

  if (!flat.attributes.normal) {
    flat.computeVertexNormals();
  }

  if (!flat.attributes.surface) {
    const count = flat.attributes.position.count;
    flat.setAttribute("surface", new BufferAttribute(new Float32Array(count).fill(SURFACE.plain), 1));
  }

  if (!flat.attributes.color) {
    const count = flat.attributes.position.count;
    flat.setAttribute("color", new BufferAttribute(new Float32Array(count * 3).fill(1), 3));
  }

  return flat;
}

/** Merges parts into one geometry, failing loudly rather than returning null. */
export function merge(parts: readonly BufferGeometry[]): BufferGeometry {
  const merged = mergeGeometries(parts.map(normaliseForMerge), false);

  if (!merged) {
    throw new Error("Failed to merge geometry parts - do they share the same attributes?");
  }

  merged.computeVertexNormals();
  return merged;
}

// ---------------------------------------------------------------------------------
// Placed primitives - each returns a painted part already positioned
// ---------------------------------------------------------------------------------

/** A box with its centre at (x, y, z), optionally turned about Y. */
export function box(
  width: number,
  height: number,
  depth: number,
  color: string,
  x: number,
  y: number,
  z: number,
  rotationY = 0,
  surface: SurfaceKey = "plain",
): BufferGeometry {
  const geometry = new BoxGeometry(width, height, depth);
  if (rotationY !== 0) geometry.rotateY(rotationY);
  geometry.translate(x, y, z);
  return paint(geometry, color, surface);
}

/** A vertical cylinder standing on (x, y, z). */
export function post(
  radiusTop: number,
  radiusBottom: number,
  height: number,
  segments: number,
  color: string,
  x: number,
  y: number,
  z: number,
  surface: SurfaceKey = "plain",
): BufferGeometry {
  const geometry = new CylinderGeometry(radiusTop, radiusBottom, height, segments);
  geometry.translate(x, y + height / 2, z);
  return paint(geometry, color, surface);
}

/** A cone standing on (x, y, z), apex up. */
export function cone(
  radius: number,
  height: number,
  segments: number,
  color: string,
  x: number,
  y: number,
  z: number,
  surface: SurfaceKey = "plain",
): BufferGeometry {
  const geometry = new ConeGeometry(radius, height, segments);
  geometry.translate(x, y + height / 2, z);
  return paint(geometry, color, surface);
}

/** A tilted cylinder from (x, y, z) leaning in direction `angle` by `tilt` radians. */
export function leaningPost(
  radius: number,
  length: number,
  color: string,
  x: number,
  y: number,
  z: number,
  angle: number,
  tilt: number,
  surface: SurfaceKey = "plain",
): BufferGeometry {
  const geometry = new CylinderGeometry(radius, radius * 1.15, length, 6);
  geometry.translate(0, length / 2, 0);
  geometry.rotateZ(-tilt);
  geometry.rotateY(angle);
  geometry.translate(x, y, z);
  return paint(geometry, color, surface);
}

/** A cylinder lying along Z, centred at (x, y, z) - a pipe, a log, a barrel on its side. */
export function pipe(
  radius: number,
  length: number,
  segments: number,
  color: string,
  x: number,
  y: number,
  z: number,
  rotationY = 0,
  surface: SurfaceKey = "plain",
): BufferGeometry {
  const geometry = new CylinderGeometry(radius, radius, length, segments);
  geometry.rotateX(Math.PI / 2);
  if (rotationY !== 0) geometry.rotateY(rotationY);
  geometry.translate(x, y, z);
  return paint(geometry, color, surface);
}

/** A low-poly blob - the basis for foliage tufts, clouds and smoke. */
export function blob(
  radius: number,
  color: string,
  x: number,
  y: number,
  z: number,
  scaleY = 1,
  detail = 0,
  surface: SurfaceKey = "plain",
): BufferGeometry {
  const geometry = new IcosahedronGeometry(radius, detail);
  geometry.scale(1, scaleY, 1);
  geometry.translate(x, y, z);
  return paint(geometry, color, surface);
}

/** A half-cylinder shell lying along X - an awning or a barrel vault. */
export function awning(
  width: number,
  radius: number,
  color: string,
  x: number,
  y: number,
  z: number,
  surface: SurfaceKey = "plain",
): BufferGeometry {
  const geometry = new CylinderGeometry(radius, radius, width, 10, 1, true, 0, Math.PI);
  geometry.rotateZ(Math.PI / 2);
  geometry.rotateY(Math.PI / 2);
  geometry.translate(x, y, z);
  return paint(geometry, color, surface);
}

/** A rectangular arch: a box with a half-round top, standing on (x, y, z), facing +Z. */
export function arch(
  width: number,
  height: number,
  depth: number,
  color: string,
  x: number,
  y: number,
  z: number,
  surface: SurfaceKey = "plain",
): BufferGeometry {
  const straight = height - width / 2;
  const body = new BoxGeometry(width, straight, depth);
  body.translate(0, straight / 2, 0);
  const top = new CylinderGeometry(width / 2, width / 2, depth, 12, 1, false, 0, Math.PI);
  top.rotateX(Math.PI / 2);
  top.translate(0, straight, 0);
  const parts = [paint(body, color, surface), paint(top, color, surface)];
  const merged = merge(parts);
  merged.translate(x, y, z);
  return merged;
}

// ---------------------------------------------------------------------------------
// Trees
// ---------------------------------------------------------------------------------

/** Which life stage of araucaria to build. */
export type AraucariaVariant = "mature" | "young";

/**
 * An araucaria - Araucaria angustifolia, the tree of the Serra Catarinense.
 *
 * The mature silhouette is what carries the region: a tall trunk bare for most of its
 * height, then a crown of branches radiating from the top like the spokes of an
 * umbrella, each curving upward and ending in a dense tuft of foliage. It is not a
 * cone. Getting this wrong is what makes a highland scene read as alpine.
 *
 * Young trees are different - a pyramid of tiered whorls - so both are built, and the
 * forest mixes them. See design.md D2.
 */
export function createAraucariaGeometry(
  variant: AraucariaVariant = "mature",
  height = 15,
  seed = 1,
): BufferGeometry {
  const random = createRandom(seed);
  const parts: BufferGeometry[] = [];

  if (variant === "young") {
    const trunkHeight = height * 0.92;
    parts.push(post(0.1, 0.26, trunkHeight, 6, WORLD_COLORS.bark, 0, 0, 0, "bark"));

    for (let tier = 0; tier < 5; tier += 1) {
      const y = height * (0.22 + tier * 0.16);
      const reach = height * (0.3 - tier * 0.05);
      const offset = random() * Math.PI;

      for (let index = 0; index < 6; index += 1) {
        const angle = offset + (index / 6) * Math.PI * 2;
        parts.push(leaningPost(0.05, reach, WORLD_COLORS.bark, 0, y, 0, angle, Math.PI * 0.4, "bark"));

        const tipX = Math.cos(angle) * reach * Math.sin(Math.PI * 0.4);
        const tipZ = -Math.sin(angle) * reach * Math.sin(Math.PI * 0.4);
        const tipY = y + reach * Math.cos(Math.PI * 0.4);
        parts.push(blob(reach * 0.34, WORLD_COLORS.canopy, tipX, tipY, tipZ, 0.55, 1, "foliage"));
      }
    }

    parts.push(cone(0.55, 1.6, 6, WORLD_COLORS.canopyDark, 0, trunkHeight - 0.4, 0, "foliage"));
    return merge(parts);
  }

  const trunkHeight = height * 0.74;
  parts.push(post(0.24, 0.55, trunkHeight, 7, WORLD_COLORS.bark, 0, 0, 0, "bark"));

  const whorls = [
    { y: trunkHeight * 0.86, count: 6, reach: height * 0.3, lift: 0.34, tuft: height * 0.085 },
    { y: trunkHeight, count: 7, reach: height * 0.36, lift: 0.42, tuft: height * 0.1 },
  ];

  for (const whorl of whorls) {
    const offset = random() * Math.PI * 2;

    for (let index = 0; index < whorl.count; index += 1) {
      const angle = offset + (index / whorl.count) * Math.PI * 2 + (random() - 0.5) * 0.25;
      const tilt = Math.PI / 2 - whorl.lift;

      parts.push(leaningPost(0.07, whorl.reach, WORLD_COLORS.bark, 0, whorl.y, 0, angle, tilt, "bark"));

      const horizontal = whorl.reach * Math.sin(tilt);
      const tipX = Math.cos(angle) * horizontal;
      const tipZ = -Math.sin(angle) * horizontal;
      const tipY = whorl.y + whorl.reach * Math.cos(tilt);

      parts.push(blob(whorl.tuft, WORLD_COLORS.canopy, tipX, tipY, tipZ, 0.5, 1, "foliage"));
      parts.push(
        blob(whorl.tuft * 0.62, WORLD_COLORS.canopyDark, tipX, tipY + whorl.tuft * 0.36, tipZ, 0.6, 1, "foliage"),
      );
    }
  }

  parts.push(blob(height * 0.11, WORLD_COLORS.canopy, 0, trunkHeight + height * 0.05, 0, 0.55, 1, "foliage"));

  return merge(parts);
}

/** A generic conifer, for the forest mass behind the town. */
export function createConiferGeometry(height = 9): BufferGeometry {
  const trunkHeight = height * 0.22;
  const parts = [post(0.16, 0.24, trunkHeight, 5, WORLD_COLORS.bark, 0, 0, 0, "bark")];

  for (let tier = 0; tier < 3; tier += 1) {
    const tierHeight = height * (0.42 - tier * 0.07);
    const radius = height * (0.23 - tier * 0.055);
    parts.push(
      cone(radius, tierHeight, 8, WORLD_COLORS.conifer, 0, trunkHeight + height * (0.16 + tier * 0.21) - tierHeight / 2, 0, "foliage"),
    );
  }

  return merge(parts);
}

/** A broadleaf native tree - a rounded, softly shaded crown on a short trunk. */
export function createBroadleafGeometry(height = 6, seed = 1): BufferGeometry {
  const random = createRandom(seed);
  const trunkHeight = height * 0.42;
  const crown = random() > 0.6 ? WORLD_COLORS.foliageWarm : WORLD_COLORS.foliage;
  const parts = [post(0.16, 0.3, trunkHeight, 6, WORLD_COLORS.bark, 0, 0, 0, "bark")];

  const radius = height * 0.36;
  parts.push(blob(radius, crown, 0, trunkHeight + radius * 0.8, 0, 0.9, 2, "foliage"));
  parts.push(blob(radius * 0.7, crown, radius * 0.5, trunkHeight + radius * 0.6, radius * 0.2, 0.9, 2, "foliage"));
  parts.push(blob(radius * 0.65, crown, -radius * 0.45, trunkHeight + radius * 0.9, -radius * 0.3, 0.9, 2, "foliage"));

  return merge(parts);
}

/** A low bush. */
export function createBushGeometry(radius = 1.1): BufferGeometry {
  return merge([
    blob(radius, WORLD_COLORS.foliage, 0, radius * 0.55, 0, 0.7, 1, "foliage"),
    blob(radius * 0.7, WORLD_COLORS.foliageWarm, radius * 0.6, radius * 0.45, radius * 0.2, 0.7, 1, "foliage"),
  ]);
}

/** A trimmed hedge along +X from the origin. */
export function createHedgeGeometry(length = 4, height = 0.9): BufferGeometry {
  return merge([box(length, height, 0.7, WORLD_COLORS.foliage, length / 2, height / 2, 0, 0, "foliage")]);
}

// ---------------------------------------------------------------------------------
// Ground props
// ---------------------------------------------------------------------------------

/** A basalt outcrop. */
export function createRockGeometry(radius = 1.6): BufferGeometry {
  const rock = new IcosahedronGeometry(radius, 0);
  rock.scale(1, 0.62, 0.86);
  rock.translate(0, radius * 0.3, 0);
  return merge([paint(rock, WORLD_COLORS.rockLight, "stone")]);
}

/** A run of post-and-rail fence along +X, starting at the origin. */
export function createFenceGeometry(length = 8): BufferGeometry {
  const parts: BufferGeometry[] = [];
  const posts = Math.max(2, Math.round(length / 2) + 1);

  for (let index = 0; index < posts; index += 1) {
    parts.push(post(0.09, 0.11, 1.25, 4, WORLD_COLORS.timberDark, (index * length) / (posts - 1), 0, 0, "planks"));
  }

  parts.push(box(length, 0.1, 0.08, WORLD_COLORS.timber, length / 2, 1.05, 0, 0, "planks"));
  parts.push(box(length, 0.1, 0.08, WORLD_COLORS.timber, length / 2, 0.6, 0, 0, "planks"));

  return merge(parts);
}

/** A taipa - the dry stone wall of the Coxilha Rica. Along +X from the origin. */
export function createStoneWallGeometry(length = 8): BufferGeometry {
  const parts: BufferGeometry[] = [];
  const random = createRandom(Math.round(length * 7));

  let x = 0;
  while (x < length) {
    const blockLength = 1.2 + random() * 0.9;
    const blockHeight = 0.8 + random() * 0.25;
    const color = random() > 0.5 ? WORLD_COLORS.stone : WORLD_COLORS.stoneDark;
    parts.push(box(Math.min(blockLength, length - x), blockHeight, 0.7, color, x + blockLength / 2, blockHeight / 2, 0, 0, "stone"));
    x += blockLength * 0.92;
  }

  return merge(parts);
}

/** A lamp post with a lit lantern head. */
export function createLamppostGeometry(): BufferGeometry {
  return merge([
    post(0.07, 0.1, 3.4, 6, WORLD_COLORS.metal, 0, 0, 0, "metal"),
    box(0.3, 0.06, 0.3, WORLD_COLORS.metal, 0, 3.42, 0, 0, "metal"),
    box(0.34, 0.42, 0.34, WORLD_COLORS.lantern, 0, 3.66, 0, 0, "glass"),
    cone(0.32, 0.26, 4, WORLD_COLORS.metal, 0, 3.86, 0, "metal"),
  ]);
}

/** A timber bench facing +Z. */
export function createBenchGeometry(): BufferGeometry {
  return merge([
    box(1.8, 0.08, 0.5, WORLD_COLORS.timber, 0, 0.5, 0, 0, "planks"),
    box(1.8, 0.4, 0.08, WORLD_COLORS.timber, 0, 0.78, -0.24, 0, "planks"),
    box(0.1, 0.5, 0.45, WORLD_COLORS.timberDark, -0.75, 0.25, 0, 0, "metal"),
    box(0.1, 0.5, 0.45, WORLD_COLORS.timberDark, 0.75, 0.25, 0, 0, "metal"),
  ]);
}

/** A cafe table with an umbrella. */
export function createCafeTableGeometry(umbrellaColor: string): BufferGeometry {
  return merge([
    post(0.55, 0.55, 0.06, 10, WORLD_COLORS.timber, 0, 0.72, 0, "planks"),
    post(0.05, 0.07, 0.72, 6, WORLD_COLORS.metal, 0, 0, 0, "metal"),
    post(0.03, 0.03, 2.3, 5, WORLD_COLORS.metal, 0, 0.78, 0, "metal"),
    cone(1.15, 0.5, 8, umbrellaColor, 0, 2.6, 0),
    box(0.4, 0.04, 0.4, WORLD_COLORS.timberDark, 0.85, 0.46, 0, 0, "planks"),
    box(0.4, 0.04, 0.4, WORLD_COLORS.timberDark, -0.85, 0.46, 0, 0, "planks"),
  ]);
}

/** A picnic table with benches either side, along +X. */
export function createPicnicTableGeometry(): BufferGeometry {
  return merge([
    box(2.0, 0.08, 0.8, WORLD_COLORS.timber, 0, 0.76, 0, 0, "planks"),
    box(2.0, 0.06, 0.34, WORLD_COLORS.timber, 0, 0.46, 0.75, 0, "planks"),
    box(2.0, 0.06, 0.34, WORLD_COLORS.timber, 0, 0.46, -0.75, 0, "planks"),
    box(0.08, 0.76, 1.6, WORLD_COLORS.timberDark, -0.8, 0.38, 0, 0, "planks"),
    box(0.08, 0.76, 1.6, WORLD_COLORS.timberDark, 0.8, 0.38, 0, 0, "planks"),
  ]);
}

/** A stack of split firewood. */
export function createWoodpileGeometry(): BufferGeometry {
  const parts: BufferGeometry[] = [];
  const rows = [4, 3, 2];

  rows.forEach((count, row) => {
    for (let index = 0; index < count; index += 1) {
      parts.push(
        pipe(0.22, 1.4, 6, row % 2 === 0 ? WORLD_COLORS.timberDark : WORLD_COLORS.timber, (index - (count - 1) / 2) * 0.48, 0.22 + row * 0.4, 0, 0, "bark"),
      );
    }
  });

  return merge(parts);
}

// ---------------------------------------------------------------------------------
// Buildings
// ---------------------------------------------------------------------------------

/** Builds a gable roof as an explicit prism. Winding is authored so normals face out. */
export function createGableRoofGeometry(width: number, depth: number, height: number): BufferGeometry {
  const halfWidth = width / 2;
  const halfDepth = depth / 2;
  const vertices: number[] = [];

  const push = (...points: ReadonlyArray<readonly [number, number, number]>): void => {
    for (const [x, y, z] of points) {
      vertices.push(x, y, z);
    }
  };

  push([-halfWidth, 0, -halfDepth], [0, height, -halfDepth], [halfWidth, 0, -halfDepth]);
  push([-halfWidth, 0, halfDepth], [halfWidth, 0, halfDepth], [0, height, halfDepth]);
  push([-halfWidth, 0, -halfDepth], [-halfWidth, 0, halfDepth], [0, height, halfDepth]);
  push([-halfWidth, 0, -halfDepth], [0, height, halfDepth], [0, height, -halfDepth]);
  push([halfWidth, 0, -halfDepth], [0, height, -halfDepth], [0, height, halfDepth]);
  push([halfWidth, 0, -halfDepth], [0, height, halfDepth], [halfWidth, 0, halfDepth]);

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3));
  geometry.computeVertexNormals();
  return geometry;
}

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

/** Where a building's chimney top ends up, so smoke can be attached to it. */
export function chimneyTopFor(spec: BuildingSpec): readonly [number, number, number] {
  const wallTop = spec.height * (spec.stories ?? 1);
  return [spec.width * 0.28, wallTop + spec.roofHeight * 1.5, spec.depth * 0.18];
}

/**
 * An opening in a wall, built in the wall's own frame: centred on x = 0, facing +Z,
 * with the wall's outer face at z = 0. The caller rotates and translates it onto
 * whichever wall it belongs to.
 *
 * Building openings in wall-local coordinates is what stops the placement arithmetic
 * from compounding: an earlier version built them at the front wall's z and then
 * rotated, which left every side window floating half the building's depth out in
 * mid-air.
 */
function windowParts(width: number, height: number, sillY: number): BufferGeometry[] {
  const frame = WORLD_COLORS.timberDark;
  return [
    // Glass, recessed behind the wall face.
    box(width, height, 0.1, WORLD_COLORS.frostBlue, 0, sillY + height / 2, -0.05, 0, "glass"),
    // Lintel, sill and jambs, proud of it.
    box(width + 0.16, 0.08, 0.14, frame, 0, sillY + height + 0.04, 0.02, 0, "planks"),
    box(width + 0.22, 0.1, 0.2, WORLD_COLORS.whitewash, 0, sillY - 0.05, 0.04, 0, "plaster"),
    box(0.08, height, 0.14, frame, -width / 2 - 0.04, sillY + height / 2, 0.02, 0, "planks"),
    box(0.08, height, 0.14, frame, width / 2 + 0.04, sillY + height / 2, 0.02, 0, "planks"),
    // Glazing bar.
    box(0.05, height, 0.12, frame, 0, sillY + height / 2, 0.03, 0, "planks"),
  ];
}

/** A door in the wall's own frame, same convention as `windowParts`. */
function doorParts(width: number, height: number): BufferGeometry[] {
  return [
    box(width, height, 0.1, WORLD_COLORS.timberDark, 0, height / 2, -0.05, 0, "planks"),
    box(width + 0.18, 0.09, 0.14, WORLD_COLORS.timber, 0, height + 0.04, 0.02, 0, "planks"),
    box(0.09, height, 0.14, WORLD_COLORS.timber, -width / 2 - 0.045, height / 2, 0.02, 0, "planks"),
    box(0.09, height, 0.14, WORLD_COLORS.timber, width / 2 + 0.045, height / 2, 0.02, 0, "planks"),
    box(width + 0.5, 0.14, 0.5, WORLD_COLORS.stone, 0, 0.07, 0.3, 0, "stone"),
  ];
}

/** Which wall an opening sits on. */
type Wall = "front" | "back" | "left" | "right";

/**
 * Moves an opening from the wall-local frame onto one of a box's four walls.
 *
 * @param parts - Geometry from `windowParts` or `doorParts`.
 * @param wall - Which wall to place it on.
 * @param along - Position along that wall, from its centre.
 * @param width - The building's width (its X extent).
 * @param depth - The building's depth (its Z extent).
 */
function onWall(
  parts: readonly BufferGeometry[],
  wall: Wall,
  along: number,
  width: number,
  depth: number,
): BufferGeometry[] {
  // rotateY maps +Z to the wall's outward normal; the offset is half the extent the
  // wall faces along, so the opening lands exactly on the face and nowhere else.
  const placement: Readonly<Record<Wall, { rotation: number; x: number; z: number; alongX: boolean }>> = {
    front: { rotation: 0, x: 0, z: depth / 2, alongX: true },
    back: { rotation: Math.PI, x: 0, z: -depth / 2, alongX: true },
    right: { rotation: Math.PI / 2, x: width / 2, z: 0, alongX: false },
    left: { rotation: -Math.PI / 2, x: -width / 2, z: 0, alongX: false },
  };

  const { rotation, x, z, alongX } = placement[wall];

  for (const part of parts) {
    if (rotation !== 0) part.rotateY(rotation);
    part.translate(alongX ? x + along : x, 0, alongX ? z : z + along);
  }

  return [...parts];
}

/**
 * A building: walls, gable roof, and optionally storeys, framed windows, a door, a
 * chimney, a veranda, an awning, a balcony and a signboard.
 */
export function createBuildingGeometry(spec: BuildingSpec): BufferGeometry {
  const parts: BufferGeometry[] = [];
  const stories = spec.stories ?? 1;
  const wallTop = spec.height * stories;
  const wallSurface = spec.wallSurface ?? "plaster";
  const roofSurface = spec.roofSurface ?? "tiles";
  const frontZ = spec.depth / 2 + 0.03;

  parts.push(box(spec.width, wallTop, spec.depth, spec.wallColor, 0, wallTop / 2, 0, 0, wallSurface));

  // A plinth and a cornice bracket the wall, which is what stops it reading as a box.
  parts.push(box(spec.width + 0.16, 0.35, spec.depth + 0.16, WORLD_COLORS.stoneDark, 0, 0.175, 0, 0, "stone"));
  parts.push(box(spec.width + 0.2, 0.18, spec.depth + 0.2, spec.wallColor, 0, wallTop - 0.09, 0, 0, wallSurface));

  const roof = createGableRoofGeometry(spec.width * 1.12, spec.depth * 1.12, spec.roofHeight);
  roof.translate(0, wallTop, 0);
  parts.push(paint(roof, spec.roofColor, roofSurface));
  parts.push(box(0.26, 0.18, spec.depth * 1.14, WORLD_COLORS.tileDark, 0, wallTop + spec.roofHeight, 0, 0, roofSurface));

  if (spec.chimney === true) {
    const [chimneyX, chimneyTop, chimneyZ] = chimneyTopFor(spec);
    const chimneyHeight = spec.roofHeight * 1.5;
    parts.push(box(spec.width * 0.14, chimneyHeight, spec.width * 0.14, WORLD_COLORS.tileDark, chimneyX, chimneyTop - chimneyHeight / 2, chimneyZ, 0, "brick"));
    parts.push(box(spec.width * 0.18, 0.12, spec.width * 0.18, WORLD_COLORS.stoneDark, chimneyX, chimneyTop, chimneyZ, 0, "stone"));
  }

  if (spec.windows === true) {
    const windowWidth = Math.min(0.95, spec.width * 0.18);
    const windowHeight = Math.min(1.15, spec.height * 0.4);
    const across = Math.max(2, Math.floor(spec.width / 2.4));
    const along = Math.max(1, Math.floor(spec.depth / 2.6));

    for (let storey = 0; storey < stories; storey += 1) {
      const sill = storey * spec.height + spec.height * 0.42;

      // Front: evenly spaced openings, the middle one a door on the ground floor.
      for (let index = 0; index < across; index += 1) {
        const offset = -spec.width / 2 + (spec.width / (across + 1)) * (index + 1);
        const isDoor = storey === 0 && across % 2 === 1 && index === (across - 1) / 2;
        parts.push(
          ...onWall(
            isDoor ? doorParts(windowWidth * 0.95, spec.height * 0.68) : windowParts(windowWidth, windowHeight, sill),
            "front",
            offset,
            spec.width,
            spec.depth,
          ),
        );
      }

      // Back: windows only.
      for (let index = 0; index < across; index += 1) {
        const offset = -spec.width / 2 + (spec.width / (across + 1)) * (index + 1);
        parts.push(...onWall(windowParts(windowWidth, windowHeight, sill), "back", offset, spec.width, spec.depth));
      }

      // Both side walls, spaced along the depth.
      for (const wall of ["left", "right"] as const) {
        for (let index = 0; index < along; index += 1) {
          const offset = -spec.depth / 2 + (spec.depth / (along + 1)) * (index + 1);
          parts.push(...onWall(windowParts(windowWidth, windowHeight, sill), wall, offset, spec.width, spec.depth));
        }
      }
    }
  }

  if (spec.awning !== undefined) {
    parts.push(awning(spec.width * 0.86, 0.9, spec.awning, 0, spec.height * 0.82, frontZ + 0.42));
  }

  if (spec.sign === true) {
    parts.push(box(spec.width * 0.7, 0.5, 0.1, WORLD_COLORS.whitewash, 0, spec.height * 0.98, frontZ + 0.05));
    parts.push(box(spec.width * 0.72, 0.06, 0.14, WORLD_COLORS.timberDark, 0, spec.height * 0.98 + 0.27, frontZ + 0.05, 0, "planks"));
  }

  if (spec.balcony === true && stories > 1) {
    const floorY = spec.height;
    const reach = 0.9;
    parts.push(box(spec.width * 0.8, 0.14, reach, WORLD_COLORS.stone, 0, floorY, frontZ + reach / 2, 0, "stone"));
    const railCount = Math.floor((spec.width * 0.8) / 0.4);
    for (let index = 0; index <= railCount; index += 1) {
      const x = -spec.width * 0.4 + (index * spec.width * 0.8) / railCount;
      parts.push(post(0.03, 0.03, 0.9, 4, WORLD_COLORS.metal, x, floorY + 0.07, frontZ + reach - 0.08, "metal"));
    }
    parts.push(box(spec.width * 0.8, 0.06, 0.06, WORLD_COLORS.metal, 0, floorY + 0.97, frontZ + reach - 0.08, 0, "metal"));
  }

  if (spec.veranda === true) {
    const deckDepth = spec.depth * 0.42;
    parts.push(box(spec.width * 1.04, 0.22, deckDepth, WORLD_COLORS.timber, 0, 0.11, spec.depth / 2 + deckDepth / 2, 0, "planks"));

    const roofY = spec.height * 0.86;
    for (let index = 0; index < 4; index += 1) {
      parts.push(
        post(0.1, 0.1, roofY, 6, WORLD_COLORS.timber, -spec.width * 0.44 + (index * spec.width * 0.88) / 3, 0, spec.depth / 2 + deckDepth * 0.85, "planks"),
      );
    }

    parts.push(box(spec.width * 1.08, 0.16, deckDepth * 1.1, spec.roofColor, 0, roofY, spec.depth / 2 + deckDepth / 2, 0, roofSurface));
    parts.push(box(spec.width * 1.04, 0.08, 0.08, WORLD_COLORS.timber, 0, 0.95, spec.depth / 2 + deckDepth * 0.85, 0, "planks"));
  }

  return merge(parts);
}
