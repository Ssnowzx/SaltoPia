import { BufferAttribute, BufferGeometry, Color, ConeGeometry } from "three";

import { WORLD_COLORS, WORLD_SEED } from "./constants";
import { merge } from "./builders";
import { fractalNoise2D } from "./noise";
import { smoothstep, terrainHeightAt } from "./terrain";

/**
 * The serra across the back of the valley.
 *
 * Built as separate peaks standing on the terrain's low ridge, rather than as taller
 * terrain: a ramp in the height function reads as a hazy plateau, and what says
 * "mountains" is a skyline of distinct summits. Each cone is roughened with noise and
 * coloured from basalt at the foot to frost at the top.
 */

interface PeakSpec {
  readonly x: number;
  readonly z: number;
  readonly radius: number;
  readonly height: number;
}

/** The skyline, left to right, plus foothills in front and shoulders on the sides. */
const PEAKS: readonly PeakSpec[] = [
  { x: -122, z: -118, radius: 40, height: 30 },
  { x: -84, z: -132, radius: 46, height: 40 },
  { x: -46, z: -124, radius: 38, height: 32 },
  { x: -6, z: -136, radius: 50, height: 46 },
  { x: 34, z: -126, radius: 42, height: 36 },
  { x: 76, z: -134, radius: 48, height: 42 },
  { x: 116, z: -120, radius: 40, height: 30 },
  // Foothills.
  { x: -102, z: -94, radius: 26, height: 12 },
  { x: -32, z: -102, radius: 28, height: 15 },
  { x: 20, z: -104, radius: 24, height: 12 },
  { x: 64, z: -98, radius: 26, height: 14 },
  { x: 100, z: -100, radius: 24, height: 11 },
  // Shoulders, closing the valley on both sides.
  { x: -140, z: -70, radius: 32, height: 17 },
  { x: -142, z: -22, radius: 28, height: 13 },
  { x: 140, z: -62, radius: 30, height: 16 },
  { x: 142, z: -8, radius: 26, height: 12 },
];

/** Roughens a cone with noise and colours it by height. Duplicate vertices at the apex
 * and seams share a position, so they share a displacement - no tearing. */
function createPeakGeometry(peak: PeakSpec, seed: number): BufferGeometry {
  const geometry = new ConeGeometry(peak.radius, peak.height, 10).toNonIndexed();
  const positions = geometry.attributes.position as BufferAttribute;
  const colors = new Float32Array(positions.count * 3);

  const rockDark = new Color(WORLD_COLORS.rockDark);
  const rock = new Color(WORLD_COLORS.rock);
  const rockLight = new Color(WORLD_COLORS.rockLight);
  const frost = new Color(WORLD_COLORS.frost);

  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index);
    const y = positions.getY(index);
    const z = positions.getZ(index);

    // Cone vertices run from -height/2 to +height/2.
    const normalised = (y + peak.height / 2) / peak.height;

    // Jitter falls off toward the apex so the summit stays a point.
    const jitter = (1 - normalised) * peak.radius * 0.16;
    const noiseX = fractalNoise2D(x * 0.09 + seed, z * 0.09, WORLD_SEED + 41, 2) - 0.5;
    const noiseZ = fractalNoise2D(x * 0.09, z * 0.09 + seed, WORLD_SEED + 43, 2) - 0.5;
    const noiseY = fractalNoise2D(x * 0.13, z * 0.13 + seed, WORLD_SEED + 47, 2) - 0.5;

    positions.setXYZ(index, x + noiseX * jitter, y + noiseY * peak.height * 0.06, z + noiseZ * jitter);

    const color = rockDark.clone().lerp(rock, smoothstep(0.1, 0.45, normalised));
    color.lerp(rockLight, smoothstep(0.45, 0.72, normalised));
    color.lerp(frost, smoothstep(0.74, 0.92, normalised));

    colors[index * 3] = color.r;
    colors[index * 3 + 1] = color.g;
    colors[index * 3 + 2] = color.b;
  }

  positions.needsUpdate = true;
  geometry.setAttribute("color", new BufferAttribute(colors, 3));

  // Stand on the terrain, sunk a little so the foot never shows a gap.
  geometry.translate(peak.x, terrainHeightAt(peak.x, peak.z) + peak.height / 2 - 2.5, peak.z);
  return geometry;
}

/** Every peak, merged into one mesh. */
export function createMountainsGeometry(): BufferGeometry {
  return merge(PEAKS.map((peak, index) => createPeakGeometry(peak, index * 7.3)));
}
