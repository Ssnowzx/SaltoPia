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
import { createRandom, valueNoise2D } from "./noise";
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

/**
 * A tilted cylinder from (x, y, z) leaning in direction `angle` by `tilt` radians. Open-ended,
 * it is a tube whose ends must be hidden - in a trunk, in a tuft.
 */
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
  sides = 6,
  openEnded = false,
): BufferGeometry {
  const geometry = new CylinderGeometry(radius, radius * 1.15, length, sides, 1, openEnded);
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
// Foliage shaping
// ---------------------------------------------------------------------------------

/**
 * Roughens a blob by pushing each vertex along its direction from the blob's centre by a
 * noise of its own position. The noise reads the position, so the copies of a vertex
 * that adjacent faces share move together and the surface stays closed.
 */
function roughen(geometry: BufferGeometry, centre: readonly [number, number, number], amount: number, seed: number): BufferGeometry {
  const positions = geometry.attributes.position;
  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index) - centre[0];
    const y = positions.getY(index) - centre[1];
    const z = positions.getZ(index) - centre[2];
    const n = valueNoise2D(x * 2.1 + z * 1.3 + seed, y * 2.3 - z * 0.7, seed) - 0.5;
    const push = 1 + n * amount;
    positions.setXYZ(index, centre[0] + x * push, centre[1] + y * push, centre[2] + z * push);
  }
  positions.needsUpdate = true;
  return geometry;
}

/** A foliage clump: a blob, roughened so its outline is not a polyhedron's. */
function clump(radius: number, color: string, x: number, y: number, z: number, scaleY: number, seed: number, detail = 1): BufferGeometry {
  return roughen(blob(radius, color, x, y, z, scaleY, detail, "foliage"), [x, y, z], 0.34, seed);
}

/**
 * Bends every foliage normal toward pointing away from the crown's centre, so a crown of
 * many clumps shades as one soft mass - lit side, shadow side, a terminator between -
 * rather than as a heap of separately lit balls.
 */
export function bendFoliageNormals(geometry: BufferGeometry, centre: readonly [number, number, number], amount: number): BufferGeometry {
  const positions = geometry.attributes.position;
  const normals = geometry.attributes.normal;
  const surfaces = geometry.attributes.surface;
  for (let index = 0; index < positions.count; index += 1) {
    if (surfaces.getX(index) !== SURFACE.foliage) continue;
    const ox = positions.getX(index) - centre[0];
    const oy = (positions.getY(index) - centre[1]) * 1.4;
    const oz = positions.getZ(index) - centre[2];
    const length = Math.hypot(ox, oy, oz) || 1;
    const nx = normals.getX(index) * (1 - amount) + (ox / length) * amount;
    const ny = normals.getY(index) * (1 - amount) + (oy / length) * amount;
    const nz = normals.getZ(index) * (1 - amount) + (oz / length) * amount;
    const n = Math.hypot(nx, ny, nz) || 1;
    normals.setXYZ(index, nx / n, ny / n, nz / n);
  }
  normals.needsUpdate = true;
  return geometry;
}

// ---------------------------------------------------------------------------------
// Trees
// ---------------------------------------------------------------------------------

/** Which life stage of araucaria to build. */
export type AraucariaVariant = "mature" | "young";

/**
 * How finely a tree is built. A distant tree is drawn simple: coarser tufts and thinner-sided
 * branches open at their hidden ends, every part where the full tree has it - design.md D3
 * of speed-up-the-hub.
 */
export type TreeDetail = "full" | "simple";

/**
 * A tuft of 20 faces shows less of its sphere than one of 80 - a mean silhouette radius of
 * 0.916 against 0.976 - so a simple tuft is built that much larger to look the same size.
 */
const SIMPLE_TUFT_SCALE = 0.976 / 0.916;

const TREE_TESSELLATION: Readonly<Record<TreeDetail, { readonly tuft: number; readonly tuftScale: number; readonly branchSides: number; readonly openBranches: boolean }>> = {
  full: { tuft: 1, tuftScale: 1, branchSides: 6, openBranches: false },
  simple: { tuft: 0, tuftScale: SIMPLE_TUFT_SCALE, branchSides: 4, openBranches: true },
};

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
export function createAraucariaGeometry(variant: AraucariaVariant = "mature", height = 15, seed = 1, detail: TreeDetail = "full"): BufferGeometry {
  return variant === "young" ? youngAraucaria(height, seed) : matureAraucaria(height, seed, detail);
}

function youngAraucaria(height: number, seed: number): BufferGeometry {
  const random = createRandom(seed);
  const trunkHeight = height * 0.92;
  const parts: BufferGeometry[] = [post(0.1, 0.26, trunkHeight, 6, WORLD_COLORS.bark, 0, 0, 0, "bark")];

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

interface Whorl {
  readonly y: number;
  readonly count: number;
  readonly reach: number;
}

/** Everything one branch of a mature whorl is built from. */
interface BranchSpec {
  readonly height: number;
  readonly girth: number;
  readonly crownTop: number;
  readonly seed: number;
  readonly whorl: Whorl;
  readonly whorlIndex: number;
  readonly index: number;
  readonly offset: number;
  readonly random: () => number;
  readonly detail: TreeDetail;
}

/** One branch: a nearly level run, a rise to the crown's top, and a dense dark tuft. */
function araucariaBranch(spec: BranchSpec): BufferGeometry[] {
  const { height, girth, crownTop, whorl, whorlIndex, index, random } = spec;
  const { tuft: tuftDetail, tuftScale, branchSides, openBranches } = TREE_TESSELLATION[spec.detail];
  const angle = spec.offset + (index / whorl.count) * Math.PI * 2 + (random() - 0.5) * 0.3;
  const outward = whorl.reach * (0.9 + random() * 0.2);
  // The first run is nearly level; the second turns up to reach the crown's top.
  const run = outward * 0.66;
  const elbowY = whorl.y + run * 0.18;
  const elbowX = Math.cos(angle) * run;
  const elbowZ = -Math.sin(angle) * run;
  const rise = Math.max(0.2, crownTop - elbowY - height * 0.04);
  const reachOut = outward - run;
  const tuft = height * (0.075 + whorlIndex * 0.004) * (0.9 + random() * 0.25);
  const tuftColor = index % 2 === 0 ? WORLD_COLORS.canopy : WORLD_COLORS.canopyDark;
  return [
    leaningPost(0.06 * girth, Math.hypot(run, run * 0.18), WORLD_COLORS.bark, 0, whorl.y, 0, angle, Math.PI / 2 - 0.18, "bark", branchSides, openBranches),
    leaningPost(0.045 * girth, Math.hypot(reachOut, rise), WORLD_COLORS.bark, elbowX, elbowY, elbowZ, angle, Math.atan2(reachOut, rise), "bark", branchSides, openBranches),
    clump(tuft * tuftScale, tuftColor, Math.cos(angle) * outward, crownTop - tuft * 0.2, -Math.sin(angle) * outward, 0.62, spec.seed * 31 + index + whorlIndex * 7, tuftDetail),
  ];
}

/**
 * Mature: a straight trunk bare to three quarters of the height, then whorls of branches
 * that run out almost level and turn up at the ends, each ending in a dense dark tuft.
 * The tips of every whorl end near one height, which is what makes the crown the flat,
 * shallow cup of a candelabra rather than a ball on a stick.
 */
function matureAraucaria(height: number, seed: number, detail: TreeDetail): BufferGeometry {
  const random = createRandom(seed);
  const girth = height / 12;
  const trunkHeight = height * 0.74;
  const parts: BufferGeometry[] = [post(0.2 * girth, 0.46 * girth, trunkHeight + height * 0.04, 7, WORLD_COLORS.bark, 0, 0, 0, "bark")];

  const crownTop = trunkHeight + height * 0.16;
  const whorls: readonly Whorl[] = [
    { y: trunkHeight - height * 0.1, count: 8, reach: height * 0.36 },
    { y: trunkHeight - height * 0.03, count: 7, reach: height * 0.3 },
    { y: trunkHeight + height * 0.03, count: 5, reach: height * 0.18 },
  ];

  whorls.forEach((whorl, whorlIndex) => {
    const offset = random() * Math.PI * 2;
    for (let index = 0; index < whorl.count; index += 1) {
      parts.push(...araucariaBranch({ height, girth, crownTop, seed, whorl, whorlIndex, index, offset, random, detail }));
    }
  });
  const { tuft: tuftDetail, tuftScale } = TREE_TESSELLATION[detail];
  parts.push(clump(height * 0.08 * tuftScale, WORLD_COLORS.canopyDark, 0, crownTop, 0, 0.6, seed * 13, tuftDetail));

  return bendFoliageNormals(merge(parts), [0, crownTop - height * 0.05, 0], 0.55);
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

/**
 * A broadleaf native tree: a crown built from overlapping roughened clumps round a
 * short trunk, its normals bent outward so it shades as one mass.
 */
export function createBroadleafGeometry(height = 6, seed = 1, detail: TreeDetail = "full"): BufferGeometry {
  const random = createRandom(seed);
  const { tuft: tuftDetail, tuftScale } = TREE_TESSELLATION[detail];
  const trunkHeight = height * 0.4;
  const warm = random() > 0.6;
  const radius = height * 0.34;
  const centre: readonly [number, number, number] = [0, trunkHeight + radius * 0.85, 0];
  const parts = [post(0.14, 0.28, trunkHeight + radius * 0.5, 6, WORLD_COLORS.bark, 0, 0, 0, "bark")];

  const clumps = 7;
  for (let index = 0; index < clumps; index += 1) {
    const angle = (index / clumps) * Math.PI * 2 + random() * 0.6;
    const lift = (random() - 0.35) * radius * 0.7;
    const spread = radius * (0.35 + random() * 0.3);
    const color = index % 3 === 0 ? WORLD_COLORS.foliageDark : warm ? WORLD_COLORS.foliageWarm : WORLD_COLORS.foliage;
    parts.push(clump(radius * (0.5 + random() * 0.22) * tuftScale, color, Math.cos(angle) * spread, centre[1] + lift, Math.sin(angle) * spread, 0.82, seed * 17 + index, tuftDetail));
  }
  parts.push(clump(radius * 0.62 * tuftScale, warm ? WORLD_COLORS.foliageWarm : WORLD_COLORS.foliage, 0, centre[1] + radius * 0.4, 0, 0.8, seed * 5, tuftDetail));

  return bendFoliageNormals(merge(parts), centre, 0.7);
}

/** A low bush: a couple of clumps, shaded as one. */
export function createBushGeometry(radius = 1.1): BufferGeometry {
  const merged = merge([
    clump(radius, WORLD_COLORS.foliage, 0, radius * 0.55, 0, 0.7, 3),
    clump(radius * 0.7, WORLD_COLORS.foliageWarm, radius * 0.6, radius * 0.45, radius * 0.2, 0.7, 7),
    clump(radius * 0.6, WORLD_COLORS.foliageDark, -radius * 0.5, radius * 0.4, -radius * 0.3, 0.7, 11),
  ]);
  return bendFoliageNormals(merged, [0, radius * 0.3, 0], 0.6);
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
