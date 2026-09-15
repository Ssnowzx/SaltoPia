import { BufferAttribute, BufferGeometry, Color, PlaneGeometry } from "three";

import { TERRAIN, WATER_LEVEL, WORLD_COLORS, WORLD_SEED } from "./constants";
import { fractalNoise2D } from "./noise";

/**
 * The shape of the valley Serranopolis sits in.
 *
 * `terrainHeightAt` is the single source of ground height. The mesh, every placed
 * building, every road and every map pin sample it, so nothing can end up floating or
 * buried - which is the usual failure when a layout hardcodes Y values against a
 * terrain that later moves.
 */

/** Smoothstep between two edges, clamped. */
export function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/** Half-width of the river's water surface. */
export const RIVER_HALF_WIDTH = 4.2;

/** Where the river's centre line sits at a given depth into the valley. */
export function riverCentreX(z: number): number {
  return 46 + 4.5 * Math.sin(z * 0.045 + 0.6);
}

/** Horizontal distance from a point to the river's centre line. */
export function distanceToRiver(x: number, z: number): number {
  return Math.abs(x - riverCentreX(z));
}

/** The hilltop the Mirante da Neblina stands on. */
const MIRANTE_HILL = { x: 2, z: -46, height: 13, radius: 24 } as const;

/** A circle of ground levelled so a building can stand square on it. */
interface FlatPad {
  readonly x: number;
  readonly z: number;
  readonly radius: number;
  /** Width of the blend back into the natural terrain. */
  readonly falloff: number;
}

/** One pad per landmark. Coordinates match the places seeded into the database. */
const FLAT_PADS: readonly FlatPad[] = [
  { x: 0, z: 0, radius: 15, falloff: 9 },
  { x: -28, z: 14, radius: 10, falloff: 6 },
  { x: -20, z: -18, radius: 11, falloff: 6 },
  { x: 26, z: 46, radius: 13, falloff: 6 },
  { x: 30, z: -30, radius: 8, falloff: 6 },
  { x: 14, z: 30, radius: 9, falloff: 6 },
  { x: 2, z: -46, radius: 7, falloff: 5 },
];

function distance(x0: number, z0: number, x1: number, z1: number): number {
  return Math.hypot(x0 - x1, z0 - z1);
}

/**
 * Ground height before any levelling.
 *
 * The valley is a bowl: flat where the town sits, rising to a rim, with a low ridge
 * across the back that the mountain peaks stand on. A river trench is carved down the
 * east side, and a single hill carries the lookout.
 */
function naturalHeightAt(x: number, z: number): number {
  const half = TERRAIN.size / 2;
  const radius = Math.sqrt(x * x + z * z) / half;

  // The bowl rim.
  const bowl = smoothstep(0.42, 1.02, radius) * 34;

  // The ridge the peaks sit on. The peaks themselves are separate meshes - a smooth
  // ramp alone reads as a hazy plateau, and the silhouette is what says mountains.
  const ridge = smoothstep(60, 150, -z) * 10;

  // The lookout's hill.
  const hill =
    MIRANTE_HILL.height *
    (1 - smoothstep(4, MIRANTE_HILL.radius, distance(x, z, MIRANTE_HILL.x, MIRANTE_HILL.z)));

  // Rolling ground, damped across the town so roads and buildings sit sensibly.
  const townDamping = 0.35 + 0.65 * smoothstep(28, 72, Math.sqrt(x * x + z * z));
  const rolling = (fractalNoise2D(x * 0.018, z * 0.018, WORLD_SEED) - 0.5) * 7 * townDamping;

  // A softer secondary layer, to break up the regularity of the first.
  const detail = (fractalNoise2D(x * 0.06, z * 0.06, WORLD_SEED + 7, 3) - 0.5) * 1.6;

  // The river trench.
  const trench = smoothstep(RIVER_HALF_WIDTH + 7, 0, distanceToRiver(x, z)) * 5.2;

  return bowl + ridge + hill + rolling + detail - trench;
}

/** Natural height at each pad's centre, so pads level to real ground rather than to zero. */
const PAD_HEIGHTS: ReadonlyMap<FlatPad, number> = new Map(
  FLAT_PADS.map((pad) => [pad, naturalHeightAt(pad.x, pad.z)]),
);

/**
 * Ground height at a world position.
 *
 * @param x - World X.
 * @param z - World Z.
 * @returns Height in world units.
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

/** How exposed a point is - drives the grass/straw/rock blend. */
function surfaceColorAt(x: number, z: number, height: number): Color {
  const grass = new Color(WORLD_COLORS.grass);
  const grassDeep = new Color(WORLD_COLORS.grassDeep);
  const straw = new Color(WORLD_COLORS.straw);
  const rock = new Color(WORLD_COLORS.rock);

  // Patchiness across the fields, so the grass is not one flat sheet.
  const patch = fractalNoise2D(x * 0.045, z * 0.045, WORLD_SEED + 31, 3);
  const base = grassDeep.clone().lerp(grass, patch);

  // Dry straw on the higher, more exposed ground.
  const dryness = smoothstep(16, 32, height);
  base.lerp(straw, dryness * 0.7);

  // Bare basalt on the ridges.
  const exposure = smoothstep(32, 46, height);
  base.lerp(rock, exposure);

  // Damp ground in the river trench.
  const wetness = smoothstep(1.2, WATER_LEVEL, height);
  base.lerp(grassDeep, wetness * 0.6);

  return base;
}

/**
 * Builds the terrain mesh geometry with baked vertex colours.
 *
 * Colours are baked per vertex rather than sampled from a texture: it keeps the payload
 * at zero, and at this art direction the flat-shaded facets are the look, not a
 * compromise.
 *
 * @returns A geometry ready for a vertex-coloured, flat-shaded material.
 */
export function createTerrainGeometry(): BufferGeometry {
  const geometry = new PlaneGeometry(
    TERRAIN.size,
    TERRAIN.size,
    TERRAIN.segments,
    TERRAIN.segments,
  );

  // PlaneGeometry is built in the XY plane; lay it flat so Y becomes height.
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
