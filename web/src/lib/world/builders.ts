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

/**
 * Procedural geometry primitives for everything standing on the terrain.
 *
 * These are the "models" the neighbourhood layout refers to. They are built in code
 * rather than loaded from files - see design.md D1, revised. Each builder returns a
 * single merged, vertex-coloured geometry so one material can draw it, which is what
 * makes instancing possible further up.
 *
 * Every part is built at the origin facing +Z, with Y up and the base at y = 0.
 */

// ---------------------------------------------------------------------------------
// Merge plumbing
// ---------------------------------------------------------------------------------

/** Attaches a flat vertex colour to every vertex of a geometry. */
export function paint(geometry: BufferGeometry, hex: string): BufferGeometry {
  const color = new Color(hex);
  const count = geometry.attributes.position.count;
  const colors = new Float32Array(count * 3);

  for (let index = 0; index < count; index += 1) {
    colors[index * 3] = color.r;
    colors[index * 3 + 1] = color.g;
    colors[index * 3 + 2] = color.b;
  }

  geometry.setAttribute("color", new BufferAttribute(colors, 3));
  return geometry;
}

/**
 * Brings a geometry to the common shape every part must share before merging:
 * non-indexed, with position, normal, uv and color.
 *
 * three's primitives are indexed and carry UVs; hand-built geometry like the gable roof
 * below is neither. `mergeGeometries` refuses the mix - it needs the index attribute
 * present on all parts or on none, and the same attribute names throughout.
 */
function normaliseForMerge(geometry: BufferGeometry): BufferGeometry {
  const flat = geometry.index ? geometry.toNonIndexed() : geometry;

  if (!flat.attributes.uv) {
    const count = flat.attributes.position.count;
    flat.setAttribute("uv", new Float32BufferAttribute(new Float32Array(count * 2), 2));
  }

  if (!flat.attributes.normal) {
    flat.computeVertexNormals();
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
): BufferGeometry {
  const geometry = new BoxGeometry(width, height, depth);
  if (rotationY !== 0) geometry.rotateY(rotationY);
  geometry.translate(x, y, z);
  return paint(geometry, color);
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
): BufferGeometry {
  const geometry = new CylinderGeometry(radiusTop, radiusBottom, height, segments);
  geometry.translate(x, y + height / 2, z);
  return paint(geometry, color);
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
): BufferGeometry {
  const geometry = new ConeGeometry(radius, height, segments);
  geometry.translate(x, y + height / 2, z);
  return paint(geometry, color);
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
): BufferGeometry {
  const geometry = new CylinderGeometry(radius, radius * 1.15, length, 5);
  geometry.translate(0, length / 2, 0);
  geometry.rotateZ(-tilt);
  geometry.rotateY(angle);
  geometry.translate(x, y, z);
  return paint(geometry, color);
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
): BufferGeometry {
  const geometry = new IcosahedronGeometry(radius, detail);
  geometry.scale(1, scaleY, 1);
  geometry.translate(x, y, z);
  return paint(geometry, color);
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
 *
 * @param variant - Life stage.
 * @param height - Total height in world units.
 * @param seed - Varies branch angles so no two trees from one seed match.
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
    parts.push(post(0.1, 0.26, trunkHeight, 6, WORLD_COLORS.bark, 0, 0, 0));

    // Tiered whorls all the way up, each smaller than the last - the pyramid.
    const whorls = 5;
    for (let tier = 0; tier < whorls; tier += 1) {
      const y = height * (0.22 + tier * 0.16);
      const reach = height * (0.3 - tier * 0.05);
      const branches = 6;
      const offset = random() * Math.PI;

      for (let index = 0; index < branches; index += 1) {
        const angle = offset + (index / branches) * Math.PI * 2;
        parts.push(leaningPost(0.05, reach, WORLD_COLORS.bark, 0, y, 0, angle, Math.PI * 0.4));

        const tipX = Math.cos(angle) * reach * Math.sin(Math.PI * 0.4);
        const tipZ = -Math.sin(angle) * reach * Math.sin(Math.PI * 0.4);
        const tipY = y + reach * Math.cos(Math.PI * 0.4);
        parts.push(blob(reach * 0.34, WORLD_COLORS.canopy, tipX, tipY, tipZ, 0.55));
      }
    }

    parts.push(cone(0.55, 1.6, 6, WORLD_COLORS.canopyDark, 0, trunkHeight - 0.4, 0));
    return merge(parts);
  }

  const trunkHeight = height * 0.74;
  parts.push(post(0.24, 0.55, trunkHeight, 7, WORLD_COLORS.bark, 0, 0, 0));

  // Two whorls near the top. Branches leave the trunk a little above horizontal and
  // carry a tuft at the tip; the upper whorl is shorter, which closes the crown into
  // the candelabra shape.
  const whorls = [
    { y: trunkHeight * 0.86, count: 6, reach: height * 0.3, lift: 0.34, tuft: height * 0.085 },
    { y: trunkHeight, count: 7, reach: height * 0.36, lift: 0.42, tuft: height * 0.1 },
  ];

  for (const whorl of whorls) {
    const offset = random() * Math.PI * 2;

    for (let index = 0; index < whorl.count; index += 1) {
      const angle = offset + (index / whorl.count) * Math.PI * 2 + (random() - 0.5) * 0.25;
      const tilt = Math.PI / 2 - whorl.lift;

      parts.push(leaningPost(0.07, whorl.reach, WORLD_COLORS.bark, 0, whorl.y, 0, angle, tilt));

      // Where the branch ends, in the same frame leaningPost uses.
      const horizontal = whorl.reach * Math.sin(tilt);
      const tipX = Math.cos(angle) * horizontal;
      const tipZ = -Math.sin(angle) * horizontal;
      const tipY = whorl.y + whorl.reach * Math.cos(tilt);

      // The tuft: a flattened blob, with a smaller darker one on top so the brush of
      // needles reads as having depth rather than as a single green disc.
      parts.push(blob(whorl.tuft, WORLD_COLORS.canopy, tipX, tipY, tipZ, 0.5));
      parts.push(
        blob(whorl.tuft * 0.62, WORLD_COLORS.canopyDark, tipX, tipY + whorl.tuft * 0.36, tipZ, 0.6),
      );
    }
  }

  // The crown's centre.
  parts.push(blob(height * 0.11, WORLD_COLORS.canopy, 0, trunkHeight + height * 0.05, 0, 0.55));

  return merge(parts);
}

/**
 * A generic conifer, for the forest mass behind the town.
 *
 * Deliberately a different silhouette from the araucaria - stacked cones, apex up - so
 * that the araucarias stay legible as a distinct species rather than blending into a
 * uniform green.
 *
 * @param height - Total height in world units.
 */
export function createConiferGeometry(height = 9): BufferGeometry {
  const trunkHeight = height * 0.22;
  const parts = [post(0.16, 0.24, trunkHeight, 5, WORLD_COLORS.bark, 0, 0, 0)];

  for (let tier = 0; tier < 3; tier += 1) {
    const tierHeight = height * (0.42 - tier * 0.07);
    const radius = height * (0.23 - tier * 0.055);
    parts.push(
      cone(radius, tierHeight, 7, WORLD_COLORS.conifer, 0, trunkHeight + height * (0.16 + tier * 0.21) - tierHeight / 2, 0),
    );
  }

  return merge(parts);
}

/**
 * A broadleaf native tree - a rounded crown on a short trunk. The Serra is not only
 * araucaria; the campo is dotted with these, and their round mass gives the araucaria
 * silhouettes something to read against.
 *
 * @param height - Total height in world units.
 * @param seed - Varies the crown.
 */
export function createBroadleafGeometry(height = 6, seed = 1): BufferGeometry {
  const random = createRandom(seed);
  const trunkHeight = height * 0.42;
  const crown = random() > 0.6 ? WORLD_COLORS.foliageWarm : WORLD_COLORS.foliage;
  const parts = [post(0.16, 0.3, trunkHeight, 6, WORLD_COLORS.bark, 0, 0, 0)];

  const radius = height * 0.36;
  parts.push(blob(radius, crown, 0, trunkHeight + radius * 0.8, 0, 0.9, 1));
  parts.push(blob(radius * 0.7, crown, radius * 0.5, trunkHeight + radius * 0.6, radius * 0.2, 0.9, 1));
  parts.push(blob(radius * 0.65, crown, -radius * 0.45, trunkHeight + radius * 0.9, -radius * 0.3, 0.9, 1));

  return merge(parts);
}

/** A low bush. */
export function createBushGeometry(radius = 1.1): BufferGeometry {
  return merge([
    blob(radius, WORLD_COLORS.foliage, 0, radius * 0.55, 0, 0.7),
    blob(radius * 0.7, WORLD_COLORS.foliageWarm, radius * 0.6, radius * 0.45, radius * 0.2, 0.7),
  ]);
}

// ---------------------------------------------------------------------------------
// Ground props
// ---------------------------------------------------------------------------------

/**
 * A basalt outcrop. An icosahedron squashed unevenly reads as rock immediately, and
 * costs 20 triangles.
 *
 * @param radius - Rough size in world units.
 */
export function createRockGeometry(radius = 1.6): BufferGeometry {
  const rock = new IcosahedronGeometry(radius, 0);
  rock.scale(1, 0.62, 0.86);
  rock.translate(0, radius * 0.3, 0);
  return merge([paint(rock, WORLD_COLORS.rockLight)]);
}

/**
 * A run of post-and-rail fence along +X, starting at the origin.
 *
 * @param length - Run length in world units.
 */
export function createFenceGeometry(length = 8): BufferGeometry {
  const parts: BufferGeometry[] = [];
  const spacing = 2;
  const posts = Math.max(2, Math.round(length / spacing) + 1);

  for (let index = 0; index < posts; index += 1) {
    parts.push(post(0.09, 0.11, 1.25, 4, WORLD_COLORS.timberDark, (index * length) / (posts - 1), 0, 0));
  }

  parts.push(box(length, 0.1, 0.08, WORLD_COLORS.timber, length / 2, 1.05, 0));
  parts.push(box(length, 0.1, 0.08, WORLD_COLORS.timber, length / 2, 0.6, 0));

  return merge(parts);
}

/**
 * A taipa - the dry stone wall of the Coxilha Rica, built by the tropeiros to pen
 * cattle across the campos. Along +X, starting at the origin.
 *
 * @param length - Run length in world units.
 */
export function createStoneWallGeometry(length = 8): BufferGeometry {
  const parts: BufferGeometry[] = [];
  const random = createRandom(Math.round(length * 7));

  // Coursed as short overlapping blocks so the top reads as laid stone, not a slab.
  let x = 0;
  while (x < length) {
    const blockLength = 1.2 + random() * 0.9;
    const blockHeight = 0.8 + random() * 0.25;
    const color = random() > 0.5 ? WORLD_COLORS.stone : WORLD_COLORS.stoneDark;
    parts.push(box(Math.min(blockLength, length - x), blockHeight, 0.7, color, x + blockLength / 2, blockHeight / 2, 0));
    x += blockLength * 0.92;
  }

  return merge(parts);
}

/** A lamp post with a lit lantern head. */
export function createLamppostGeometry(): BufferGeometry {
  return merge([
    post(0.07, 0.1, 3.4, 5, WORLD_COLORS.metal, 0, 0, 0),
    box(0.3, 0.06, 0.3, WORLD_COLORS.metal, 0, 3.42, 0),
    box(0.34, 0.42, 0.34, WORLD_COLORS.lantern, 0, 3.66, 0),
    cone(0.32, 0.26, 4, WORLD_COLORS.metal, 0, 3.86, 0),
  ]);
}

/** A timber bench facing +Z. */
export function createBenchGeometry(): BufferGeometry {
  return merge([
    box(1.8, 0.08, 0.5, WORLD_COLORS.timber, 0, 0.5, 0),
    box(1.8, 0.4, 0.08, WORLD_COLORS.timber, 0, 0.78, -0.24),
    box(0.1, 0.5, 0.45, WORLD_COLORS.timberDark, -0.75, 0.25, 0),
    box(0.1, 0.5, 0.45, WORLD_COLORS.timberDark, 0.75, 0.25, 0),
  ]);
}

/** A stack of split firewood. */
export function createWoodpileGeometry(): BufferGeometry {
  const parts: BufferGeometry[] = [];
  const rows = [4, 3, 2];

  rows.forEach((count, row) => {
    for (let index = 0; index < count; index += 1) {
      const log = new CylinderGeometry(0.22, 0.22, 1.4, 5);
      log.rotateX(Math.PI / 2);
      log.translate((index - (count - 1) / 2) * 0.48, 0.22 + row * 0.4, 0);
      parts.push(paint(log, row % 2 === 0 ? WORLD_COLORS.timberDark : WORLD_COLORS.timber));
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

  // Front gable, normal -Z.
  push([-halfWidth, 0, -halfDepth], [0, height, -halfDepth], [halfWidth, 0, -halfDepth]);
  // Back gable, normal +Z.
  push([-halfWidth, 0, halfDepth], [halfWidth, 0, halfDepth], [0, height, halfDepth]);

  // Left slope, normal -X/+Y.
  push([-halfWidth, 0, -halfDepth], [-halfWidth, 0, halfDepth], [0, height, halfDepth]);
  push([-halfWidth, 0, -halfDepth], [0, height, halfDepth], [0, height, -halfDepth]);

  // Right slope, normal +X/+Y.
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
  readonly height: number;
  /** Ridge height above the wall top. */
  readonly roofHeight: number;
  readonly wallColor: string;
  readonly roofColor: string;
  /** Adds a chimney. Serra houses have them because the lareira is the point. */
  readonly chimney?: boolean;
  /** Adds a covered veranda along the front (+Z) - the deep varanda of a galpao. */
  readonly veranda?: boolean;
  /** Adds shuttered windows and a door on the front. */
  readonly windows?: boolean;
}

/** Where a building's chimney top ends up, so smoke can be attached to it. */
export function chimneyTopFor(spec: BuildingSpec): readonly [number, number, number] {
  return [spec.width * 0.28, spec.height + spec.roofHeight * 1.5, spec.depth * 0.18];
}

/**
 * A building: walls, gable roof, and optionally a chimney, windows and a front veranda.
 *
 * @param spec - Dimensions and colours.
 */
export function createBuildingGeometry(spec: BuildingSpec): BufferGeometry {
  const parts: BufferGeometry[] = [];

  parts.push(box(spec.width, spec.height, spec.depth, spec.wallColor, 0, spec.height / 2, 0));

  // Eaves overhang slightly, which is what stops the roof reading as a lid on a box.
  const roof = createGableRoofGeometry(spec.width * 1.12, spec.depth * 1.12, spec.roofHeight);
  roof.translate(0, spec.height, 0);
  parts.push(paint(roof, spec.roofColor));

  if (spec.chimney === true) {
    const [chimneyX, chimneyTop, chimneyZ] = chimneyTopFor(spec);
    const chimneyHeight = spec.roofHeight * 1.5;
    parts.push(
      box(spec.width * 0.14, chimneyHeight, spec.width * 0.14, WORLD_COLORS.tileDark, chimneyX, chimneyTop - chimneyHeight / 2, chimneyZ),
    );
  }

  if (spec.windows === true) {
    const sill = spec.height * 0.45;
    const size = Math.min(0.9, spec.height * 0.3);
    const frontZ = spec.depth / 2 + 0.03;
    const count = Math.max(2, Math.floor(spec.width / 2.6));

    for (let index = 0; index < count; index += 1) {
      const x = -spec.width / 2 + (spec.width / (count + 1)) * (index + 1);
      // The middle opening on an odd count is the door.
      if (count % 2 === 1 && index === (count - 1) / 2) {
        parts.push(box(size * 0.9, spec.height * 0.62, 0.06, WORLD_COLORS.timberDark, x, spec.height * 0.31, frontZ));
      } else {
        parts.push(box(size, size, 0.06, WORLD_COLORS.timberDark, x, sill + size / 2, frontZ));
        parts.push(box(size * 0.4, size * 0.9, 0.05, WORLD_COLORS.tile, x - size * 0.62, sill + size / 2, frontZ + 0.01));
        parts.push(box(size * 0.4, size * 0.9, 0.05, WORLD_COLORS.tile, x + size * 0.62, sill + size / 2, frontZ + 0.01));
      }
    }
  }

  if (spec.veranda === true) {
    const deckDepth = spec.depth * 0.42;
    parts.push(box(spec.width * 1.04, 0.22, deckDepth, WORLD_COLORS.timber, 0, 0.11, spec.depth / 2 + deckDepth / 2));

    const roofY = spec.height * 0.86;
    const postCount = 4;
    for (let index = 0; index < postCount; index += 1) {
      parts.push(
        post(0.1, 0.1, roofY, 5, WORLD_COLORS.timber, -spec.width * 0.44 + (index * spec.width * 0.88) / (postCount - 1), 0, spec.depth / 2 + deckDepth * 0.85),
      );
    }

    parts.push(box(spec.width * 1.08, 0.16, deckDepth * 1.1, spec.roofColor, 0, roofY, spec.depth / 2 + deckDepth / 2));
  }

  return merge(parts);
}
