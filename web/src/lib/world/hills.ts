import { BufferAttribute, BufferGeometry, Color, IcosahedronGeometry } from "three";

import { merge } from "./builders";
import { WORLD_COLORS, WORLD_SEED } from "./constants";
import { fractalNoise2D } from "./noise";
import { smoothstep, terrainHeightAt } from "./terrain";
import { SURFACE } from "./textures";

/**
 * The low golden hills that close the horizon behind the reservoir.
 *
 * In the reference photograph they are a soft, layered band of plateau edges going
 * gold in the late light - not a range of peaks. Each is a flattened dome roughened
 * with noise, coloured from olive at the foot to gold on top, and they overlap in
 * depth so the horizon reads as layers rather than a row.
 */

interface HillSpec {
  readonly x: number;
  readonly z: number;
  readonly radius: number;
  readonly height: number;
  /** 0 nearest, 1 furthest - drives how gold and how hazy it reads. */
  readonly depth: number;
}

const HILLS: readonly HillSpec[] = [
  // The near band. Its front edge has to clear the far shore at z = -120, or the hills
  // stand in front of the chalets instead of behind them.
  { x: -170, z: -212, radius: 76, height: 11, depth: 0.25 },
  { x: -70, z: -220, radius: 82, height: 13, depth: 0.3 },
  { x: 30, z: -218, radius: 78, height: 12, depth: 0.25 },
  { x: 128, z: -212, radius: 74, height: 11, depth: 0.25 },
  { x: 220, z: -204, radius: 68, height: 10, depth: 0.3 },
  // The middle band.
  { x: -230, z: -270, radius: 90, height: 15, depth: 0.6 },
  { x: -120, z: -282, radius: 96, height: 17, depth: 0.65 },
  { x: -10, z: -288, radius: 98, height: 18, depth: 0.65 },
  { x: 100, z: -282, radius: 92, height: 16, depth: 0.6 },
  { x: 208, z: -272, radius: 84, height: 14, depth: 0.6 },
  // The far band, almost dissolved.
  { x: -170, z: -348, radius: 108, height: 20, depth: 0.95 },
  { x: -20, z: -358, radius: 116, height: 22, depth: 1 },
  { x: 132, z: -350, radius: 106, height: 19, depth: 0.95 },
  // Shoulders, closing the frame on both sides well outside the bay.
  { x: -268, z: -140, radius: 72, height: 13, depth: 0.55 },
  { x: -284, z: -30, radius: 66, height: 11, depth: 0.55 },
  { x: 272, z: -120, radius: 70, height: 12, depth: 0.55 },
  { x: 288, z: 10, radius: 64, height: 10, depth: 0.55 },
];

function createHillGeometry(hill: HillSpec, seed: number): BufferGeometry {
  const geometry = new IcosahedronGeometry(1, 3).toNonIndexed();
  const positions = geometry.attributes.position as BufferAttribute;
  const colors = new Float32Array(positions.count * 3);

  const foot = new Color(WORLD_COLORS.forest);
  const gold = new Color(WORLD_COLORS.hilltop);
  const haze = new Color(WORLD_COLORS.hillHaze);

  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index);
    const y = positions.getY(index);
    const z = positions.getZ(index);

    const noise = fractalNoise2D(x * 1.9 + seed, z * 1.9 + seed * 0.7, WORLD_SEED + 53, 3) - 0.5;
    const scale = 1 + noise * 0.2;

    positions.setXYZ(index, x * hill.radius * scale, Math.max(y, -0.05) * hill.height * scale, z * hill.radius * 0.8 * scale);

    const t = Math.max(0, y);
    const color = foot.clone().lerp(gold, smoothstep(0.05, 0.6, t));
    // Distance drains the colour toward the haze, which is what gives the band depth.
    color.lerp(haze, hill.depth * 0.75);

    colors[index * 3] = color.r;
    colors[index * 3 + 1] = color.g;
    colors[index * 3 + 2] = color.b;
  }

  positions.needsUpdate = true;
  geometry.setAttribute("color", new BufferAttribute(colors, 3));
  geometry.setAttribute("surface", new BufferAttribute(new Float32Array(positions.count).fill(SURFACE.foliage), 1));

  geometry.translate(hill.x, terrainHeightAt(hill.x, hill.z) - hill.height * 0.1, hill.z);
  return geometry;
}

/** Every hill, merged into one mesh. */
export function createHillsGeometry(): BufferGeometry {
  return merge(HILLS.map((hill, index) => createHillGeometry(hill, index * 3.7)));
}
