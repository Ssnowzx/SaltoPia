import {
  BufferAttribute,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  PlaneGeometry,
} from "three";

import { TERRAIN, WORLD_COLORS, WORLD_SEED, WATER_LEVEL } from "./constants";
import { fractalNoise2D } from "./noise";

/**
 * The shape of the valley Serranopolis sits in.
 *
 * `terrainHeightAt` is the single source of ground height. The mesh, every placed
 * building and every map pin sample it, so nothing can end up floating or buried -
 * which is the usual failure when a layout hardcodes Y values against a terrain that
 * later moves.
 */

/** Smoothstep between two edges, clamped. */
function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/** Where the river's centre line sits at a given depth into the valley. */
function riverCentreX(z: number): number {
  return 10 * Math.sin(z * 0.035) + 4;
}

/**
 * Ground height at a world position.
 *
 * The valley is a bowl: flat where the town sits, rising to a rim, with a ridge of
 * basalt across the back (negative Z) that the lookout stands on. A river trench is
 * carved through the middle.
 *
 * @param x - World X.
 * @param z - World Z.
 * @returns Height in world units.
 */
export function terrainHeightAt(x: number, z: number): number {
  const half = TERRAIN.size / 2;
  const radius = Math.sqrt(x * x + z * z) / half;

  // The bowl rim. The town centre stays flat; the ground climbs past a third out.
  const bowl = smoothstep(0.42, 1.02, radius) * 52;

  // The basalt ridge across the back of the valley.
  // The ridge is a ramp with peaks on it. A smooth ramp alone reads as a hazy plateau,
  // not as a serra - the silhouette is what says mountains, so the noise is squared to
  // make the high points sharp and leave the saddles between them low.
  const ridgeFactor = smoothstep(58, 140, -z);
  const peakNoise = fractalNoise2D(x * 0.028, z * 0.02, WORLD_SEED + 13, 3);
  const ridge = ridgeFactor * (14 + peakNoise * peakNoise * 54);

  // Rolling ground. Low frequency so it reads as hills, not as noise.
  const rolling = (fractalNoise2D(x * 0.018, z * 0.018, WORLD_SEED) - 0.5) * 7;

  // A softer secondary layer, to break up the regularity of the first.
  const detail = (fractalNoise2D(x * 0.06, z * 0.06, WORLD_SEED + 7, 3) - 0.5) * 1.8;

  // The river trench.
  const distanceToRiver = Math.abs(x - riverCentreX(z));
  const trench = smoothstep(12, 0, distanceToRiver) * 5.2;

  return bowl + ridge + rolling + detail - trench;
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
  const dryness = smoothstep(15, 30, height);
  base.lerp(straw, dryness * 0.7);

  // Bare basalt on the ridges.
  const exposure = smoothstep(30, 44, height);
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

/**
 * The river, as a ribbon of quads following its centre line.
 *
 * A flat slab the size of the terrain was the first attempt, and it reads as a sea the
 * moment the camera drops toward the horizon - the slab shows wherever the ground is
 * below it, including outside the valley. A ribbon only exists where the river does.
 */
export function createRiverGeometry(): BufferGeometry {
  const half = TERRAIN.size / 2;
  const steps = 160;
  const halfWidth = 6.5;
  const positions: number[] = [];

  for (let step = 0; step < steps; step += 1) {
    const z0 = -half + (step / steps) * TERRAIN.size;
    const z1 = -half + ((step + 1) / steps) * TERRAIN.size;
    const x0 = riverCentreX(z0);
    const x1 = riverCentreX(z1);

    // Two triangles per segment, wound so the surface faces up.
    positions.push(x0 - halfWidth, 0, z0, x0 + halfWidth, 0, z0, x1 + halfWidth, 0, z1);
    positions.push(x0 - halfWidth, 0, z0, x1 + halfWidth, 0, z1, x1 - halfWidth, 0, z1);
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
}
