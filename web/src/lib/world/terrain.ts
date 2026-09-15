import { BufferAttribute, BufferGeometry, Color, PlaneGeometry } from "three";

import { LAKE, RIVER, TERRAIN, WORLD_COLORS, WORLD_SEED } from "./constants";
import { fractalNoise2D } from "./noise";

/**
 * The shape of the land around the reservoir.
 *
 * `terrainHeightAt` is the single source of ground height. The mesh, every placed
 * building, every road and every map pin sample it, so nothing can end up floating or
 * buried - which is the usual failure when a layout hardcodes Y values against a
 * terrain that later moves.
 */

/** Smoothstep between two edges, clamped. Edges may be reversed. */
export function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

interface Ellipse {
  readonly x: number;
  readonly z: number;
  readonly radiusX: number;
  readonly radiusZ: number;
}

/**
 * Approximate signed distance to a noisy ellipse, negative inside. The shoreline noise
 * is sampled around the angle so it is continuous all the way round.
 */
function ellipseDistance(x: number, z: number, ellipse: Ellipse, wobble: number, seed: number): number {
  const dx = x - ellipse.x;
  const dz = z - ellipse.z;
  const angle = Math.atan2(dz / ellipse.radiusZ, dx / ellipse.radiusX);
  const boundary =
    1 + wobble * (fractalNoise2D(Math.cos(angle) * 2.5 + 7, Math.sin(angle) * 2.5 + 7, WORLD_SEED + seed, 2) - 0.5) * 2;
  const normalised = Math.sqrt((dx * dx) / (ellipse.radiusX * ellipse.radiusX) + (dz * dz) / (ellipse.radiusZ * ellipse.radiusZ));
  return (normalised - boundary) * Math.sqrt(ellipse.radiusX * ellipse.radiusZ);
}

/** Signed distance to the lake, negative on the water. */
export function lakeDistance(x: number, z: number): number {
  const basin = ellipseDistance(x, z, { x: LAKE.centre.x, z: LAKE.centre.z, radiusX: LAKE.radiusX, radiusZ: LAKE.radiusZ }, 0.13, 3);
  const channel = Math.max(Math.abs(x - LAKE.channel.x) - LAKE.channel.halfWidth, Math.abs(z - LAKE.channel.z) - LAKE.channel.halfDepth);
  return Math.min(basin, channel);
}

/** Signed distance to the island, negative on it. */
export function islandDistance(x: number, z: number): number {
  return ellipseDistance(x, z, { x: LAKE.island.x, z: LAKE.island.z, radiusX: LAKE.island.radiusX, radiusZ: LAKE.island.radiusZ }, 0.16, 11);
}

/** Whether a point is on the lake surface (and not on the island). */
export function isOnLake(x: number, z: number): boolean {
  return lakeDistance(x, z) < 0 && islandDistance(x, z) > 0;
}

/** The river's course below the dam, as it leaves the valley to the east. */
export const RIVER_COURSE: ReadonlyArray<readonly [number, number]> = [
  [85, -38],
  [95, -37.5],
  [106, -32],
  [118, -20],
  [132, -6],
  [148, 10],
];

function distanceToSegment(px: number, pz: number, ax: number, az: number, bx: number, bz: number): number {
  const abx = bx - ax;
  const abz = bz - az;
  const lengthSquared = abx * abx + abz * abz || 1;
  const t = Math.min(1, Math.max(0, ((px - ax) * abx + (pz - az) * abz) / lengthSquared));
  return Math.hypot(px - (ax + abx * t), pz - (az + abz * t));
}

/** Distance to the river's centre line below the dam. */
export function riverDistance(x: number, z: number): number {
  let best = Number.POSITIVE_INFINITY;
  for (let index = 0; index < RIVER_COURSE.length - 1; index += 1) {
    const [ax, az] = RIVER_COURSE[index];
    const [bx, bz] = RIVER_COURSE[index + 1];
    best = Math.min(best, distanceToSegment(x, z, ax, az, bx, bz));
  }
  return best;
}

/** Height of the river's surface: lake level on the dam crest, then the drop to river level. */
export function riverSurfaceHeightAt(x: number): number {
  return LAKE.level + (RIVER.level - LAKE.level) * smoothstep(RIVER.fallsStartX, RIVER.fallsEndX, x);
}

/** The hilltop the Mirante da Neblina stands on. */
const MIRANTE_HILL = { x: -80, z: -28, height: 14, radius: 30 } as const;

/** A circle of ground levelled so a building can stand square on it. */
interface FlatPad {
  readonly x: number;
  readonly z: number;
  readonly radius: number;
  readonly falloff: number;
}

/** One pad per landmark and per block of houses. Coordinates match the seeded places. */
const FLAT_PADS: readonly FlatPad[] = [
  { x: 0, z: -2, radius: 16, falloff: 8 },
  { x: -22, z: 0, radius: 9, falloff: 5 },
  { x: -4, z: 18, radius: 14, falloff: 6 },
  { x: -52, z: -2, radius: 11, falloff: 6 },
  { x: -44, z: 34, radius: 13, falloff: 6 },
  { x: 80, z: 68, radius: 14, falloff: 6 },
  { x: 86, z: 22, radius: 9, falloff: 6 },
  { x: 34, z: -4, radius: 12, falloff: 6 },
  { x: -80, z: -28, radius: 7, falloff: 5 },
  { x: 95, z: -27, radius: 8, falloff: 5 },
  { x: 99, z: -47, radius: 6, falloff: 4 },
  { x: 4, z: 34, radius: 26, falloff: 8 },
];

function distance(x0: number, z0: number, x1: number, z1: number): number {
  return Math.hypot(x0 - x1, z0 - z1);
}

/**
 * Ground height before any levelling.
 *
 * Gentle ground around the reservoir, rising to low hills at the back and sides, with a
 * hill under the lookout to the west. The lake basin and island are cut and raised out
 * of that; the river below the dam is trenched.
 */
function naturalHeightAt(x: number, z: number): number {
  const half = TERRAIN.size / 2;
  const radius = Math.sqrt(x * x + z * z) / half;

  // The rim rises to the north and sides only; the south stays low and open.
  const rim = smoothstep(0.5, 1.02, radius) * 16 * (1 - smoothstep(20, 80, z));

  const hill =
    MIRANTE_HILL.height *
    (1 - smoothstep(4, MIRANTE_HILL.radius, distance(x, z, MIRANTE_HILL.x, MIRANTE_HILL.z)));

  const rolling = (fractalNoise2D(x * 0.016, z * 0.016, WORLD_SEED) - 0.5) * 5;
  const detail = (fractalNoise2D(x * 0.06, z * 0.06, WORLD_SEED + 7, 3) - 0.5) * 1.4;

  let ground = 2.8 + rim + hill + rolling + detail;

  // The lake basin: flat floor, gentle shore.
  const lake = lakeDistance(x, z);
  ground += (LAKE.floor - ground) * smoothstep(7, -2.5, lake);

  // The island rises back out of it.
  const island = islandDistance(x, z);
  const islandTop = LAKE.level + LAKE.island.height + rolling * 0.3;
  ground += (islandTop - ground) * smoothstep(2.5, -4, island);

  // The river below the dam.
  const river = riverDistance(x, z);
  const riverFloor = riverSurfaceHeightAt(x) - (RIVER.level - RIVER.floor);
  const riverTrench = smoothstep(RIVER.halfWidth + 6, RIVER.halfWidth * 0.9, river) * smoothstep(86, 90, x);
  ground += (riverFloor - ground) * riverTrench;

  return ground;
}

const PAD_HEIGHTS: ReadonlyMap<FlatPad, number> = new Map(
  FLAT_PADS.map((pad) => [pad, naturalHeightAt(pad.x, pad.z)]),
);

/**
 * Ground height at a world position.
 */
export function terrainHeightAt(x: number, z: number): number {
  let height = naturalHeightAt(x, z);

  for (const pad of FLAT_PADS) {
    const d = distance(x, z, pad.x, pad.z);
    if (d >= pad.radius + pad.falloff) continue;

    const padHeight = PAD_HEIGHTS.get(pad) ?? height;
    const weight = 1 - smoothstep(pad.radius, pad.radius + pad.falloff, d);
    height += (padHeight - height) * weight;
  }

  return height;
}

/** Steepness of the ground at a point - drives where bare rock shows through. */
function slopeAt(x: number, z: number): number {
  const step = 0.9;
  const dx = terrainHeightAt(x + step, z) - terrainHeightAt(x - step, z);
  const dz = terrainHeightAt(x, z + step) - terrainHeightAt(x, z - step);
  return Math.hypot(dx, dz) / (2 * step);
}

/** The grass/straw/sand/rock blend at a point. */
function surfaceColorAt(x: number, z: number, height: number): Color {
  const grass = new Color(WORLD_COLORS.grass);
  const grassDeep = new Color(WORLD_COLORS.grassDeep);
  const straw = new Color(WORLD_COLORS.straw);
  const sand = new Color(WORLD_COLORS.sand);
  const rock = new Color(WORLD_COLORS.rock);
  const rockDark = new Color(WORLD_COLORS.rockDark);
  const lakeBed = new Color("#6b8a7a");

  const patch = fractalNoise2D(x * 0.045, z * 0.045, WORLD_SEED + 31, 3);
  const base = grassDeep.clone().lerp(grass, patch);

  base.lerp(straw, smoothstep(18, 30, height) * 0.5);
  base.lerp(rock, smoothstep(26, 40, height));
  base.lerp(rockDark, smoothstep(0.8, 1.6, slopeAt(x, z)) * 0.85);

  // Sand along the shore, lake bed below the water.
  const lake = lakeDistance(x, z);
  const island = islandDistance(x, z);
  const shore = Math.min(Math.abs(lake), Math.abs(island));
  base.lerp(sand, (1 - smoothstep(0.5, 5, shore)) * 0.85);
  base.lerp(lakeBed, smoothstep(LAKE.level + 0.2, LAKE.floor, height));

  const river = riverDistance(x, z);
  base.lerp(sand, (1 - smoothstep(RIVER.halfWidth + 1, RIVER.halfWidth + 5, river)) * smoothstep(86, 90, x) * 0.7);

  return base;
}

/**
 * Builds the terrain mesh geometry with baked vertex colours. A repeating grass texture
 * is multiplied over it by the material.
 */
export function createTerrainGeometry(): BufferGeometry {
  const geometry = new PlaneGeometry(TERRAIN.size, TERRAIN.size, TERRAIN.segments, TERRAIN.segments);
  geometry.rotateX(-Math.PI / 2);

  const positions = geometry.attributes.position as BufferAttribute;
  const colors = new Float32Array(positions.count * 3);

  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index);
    const z = positions.getZ(index);
    const height = terrainHeightAt(x, z);

    positions.setY(index, height);

    const color = surfaceColorAt(x, z, height);
    colors[index * 3] = color.r;
    colors[index * 3 + 1] = color.g;
    colors[index * 3 + 2] = color.b;
  }

  positions.needsUpdate = true;
  geometry.setAttribute("color", new BufferAttribute(colors, 3));
  geometry.computeVertexNormals();

  return geometry;
}
