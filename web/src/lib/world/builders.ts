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

/**
 * Procedural geometry for everything standing on the terrain.
 *
 * These are the "models" the neighbourhood layout refers to. They are built in code
 * rather than loaded from files - see design.md D1, revised. Each builder returns a
 * single merged, vertex-coloured geometry so one material can draw it, which is what
 * makes instancing possible further up.
 */

/** Attaches a flat vertex colour to every vertex of a geometry. */
function paint(geometry: BufferGeometry, hex: string): BufferGeometry {
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
function merge(parts: readonly BufferGeometry[]): BufferGeometry {
  const merged = mergeGeometries(parts.map(normaliseForMerge), false);

  if (!merged) {
    throw new Error("Failed to merge geometry parts - do they share the same attributes?");
  }

  merged.computeVertexNormals();
  return merged;
}

/**
 * An araucaria - the signature tree of the Serra Catarinense.
 *
 * The silhouette is what carries the region: a long bare trunk, then a crown that is
 * wider than it is tall, built from layered umbrella tiers rather than the conical mass
 * of a generic conifer. Getting this wrong is what makes a highland scene read as
 * alpine. See design.md D2.
 *
 * @param height - Total height in world units.
 * @param crownRadius - Radius of the widest crown tier.
 */
export function createAraucariaGeometry(height = 12, crownRadius = 2.7): BufferGeometry {
  const trunkHeight = height * 0.78;

  const trunk = new CylinderGeometry(0.16, 0.38, trunkHeight, 6);
  trunk.translate(0, trunkHeight / 2, 0);

  // Apex-down cones read as umbrellas. Three tiers, widest in the middle, so the crown
  // flares out and then closes - the candelabra shape.
  const tierSpecs = [
    { radius: crownRadius * 0.82, thickness: 1.0, y: trunkHeight * 0.97 },
    { radius: crownRadius, thickness: 0.9, y: trunkHeight * 1.06 },
    { radius: crownRadius * 0.64, thickness: 0.8, y: trunkHeight * 1.15 },
  ];

  const tiers = tierSpecs.map((tier) => {
    const cone = new ConeGeometry(tier.radius, tier.thickness, 7);
    cone.rotateX(Math.PI);
    cone.translate(0, tier.y, 0);
    return paint(cone, WORLD_COLORS.canopy);
  });

  return merge([paint(trunk, WORLD_COLORS.bark), ...tiers]);
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
  const trunk = new CylinderGeometry(0.16, 0.24, trunkHeight, 5);
  trunk.translate(0, trunkHeight / 2, 0);

  const tiers = [0, 1, 2].map((index) => {
    const tierHeight = height * (0.42 - index * 0.07);
    const radius = height * (0.23 - index * 0.055);
    const cone = new ConeGeometry(radius, tierHeight, 7);
    cone.translate(0, trunkHeight + height * (0.16 + index * 0.21), 0);
    return paint(cone, WORLD_COLORS.conifer);
  });

  return merge([paint(trunk, WORLD_COLORS.bark), ...tiers]);
}

/** Builds a gable roof as an explicit prism. Winding is authored so normals face out. */
function createGableRoofGeometry(width: number, depth: number, height: number): BufferGeometry {
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
  /** Adds a covered veranda along the front - the deep varanda of a galpao. */
  readonly veranda?: boolean;
}

/**
 * A building: walls, gable roof, and optionally a chimney and a front veranda.
 *
 * @param spec - Dimensions and colours.
 */
export function createBuildingGeometry(spec: BuildingSpec): BufferGeometry {
  const parts: BufferGeometry[] = [];

  const walls = new BoxGeometry(spec.width, spec.height, spec.depth);
  walls.translate(0, spec.height / 2, 0);
  parts.push(paint(walls, spec.wallColor));

  // Eaves overhang slightly, which is what stops the roof reading as a lid on a box.
  const roof = createGableRoofGeometry(
    spec.width * 1.12,
    spec.depth * 1.12,
    spec.roofHeight,
  );
  roof.translate(0, spec.height, 0);
  parts.push(paint(roof, spec.roofColor));

  if (spec.chimney === true) {
    const chimney = new BoxGeometry(spec.width * 0.14, spec.roofHeight * 1.5, spec.width * 0.14);
    chimney.translate(
      spec.width * 0.28,
      spec.height + spec.roofHeight * 0.75,
      spec.depth * 0.18,
    );
    parts.push(paint(chimney, WORLD_COLORS.tile));
  }

  if (spec.veranda === true) {
    const deckDepth = spec.depth * 0.42;
    const deck = new BoxGeometry(spec.width * 1.04, 0.22, deckDepth);
    deck.translate(0, 0.11, spec.depth / 2 + deckDepth / 2);
    parts.push(paint(deck, WORLD_COLORS.timber));

    const roofY = spec.height * 0.86;
    const postCount = 4;
    for (let index = 0; index < postCount; index += 1) {
      const post = new CylinderGeometry(0.1, 0.1, roofY, 5);
      post.translate(
        -spec.width * 0.44 + (index * spec.width * 0.88) / (postCount - 1),
        roofY / 2,
        spec.depth / 2 + deckDepth * 0.85,
      );
      parts.push(paint(post, WORLD_COLORS.timber));
    }

    const awning = new BoxGeometry(spec.width * 1.08, 0.16, deckDepth * 1.1);
    awning.translate(0, roofY, spec.depth / 2 + deckDepth / 2);
    parts.push(paint(awning, spec.roofColor));
  }

  return merge(parts);
}

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
 * The bandstand at the centre of the square - an octagonal roof on posts.
 * It is the one landmark the camera opens on, so it is built rather than reused.
 */
export function createBandstandGeometry(): BufferGeometry {
  const parts: BufferGeometry[] = [];

  const base = new CylinderGeometry(3.2, 3.4, 0.5, 8);
  base.translate(0, 0.25, 0);
  parts.push(paint(base, WORLD_COLORS.whitewash));

  const postCount = 8;
  for (let index = 0; index < postCount; index += 1) {
    const angle = (index / postCount) * Math.PI * 2;
    const post = new CylinderGeometry(0.11, 0.11, 2.6, 5);
    post.translate(Math.cos(angle) * 2.7, 1.8, Math.sin(angle) * 2.7);
    parts.push(paint(post, WORLD_COLORS.whitewash));
  }

  const roof = new ConeGeometry(3.6, 1.5, 8);
  roof.translate(0, 3.85, 0);
  parts.push(paint(roof, WORLD_COLORS.tile));

  return merge(parts);
}
