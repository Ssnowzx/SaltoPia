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
  // The near band. A dome's radius is its reach, so at radius 78 and z-scale 0.8 the
  // centre has to sit past z = -185 to keep its front edge behind the far shore.
  { x: -180, z: -188, radius: 80, height: 13, depth: 0.2 },
  { x: -76, z: -196, radius: 86, height: 15, depth: 0.25 },
  { x: 28, z: -192, radius: 82, height: 14, depth: 0.2 },
  { x: 132, z: -188, radius: 78, height: 13, depth: 0.2 },
  { x: 226, z: -182, radius: 72, height: 11, depth: 0.25 },
  // The middle band.
  { x: -236, z: -250, radius: 94, height: 18, depth: 0.5 },
  { x: -126, z: -262, radius: 100, height: 20, depth: 0.55 },
  { x: -12, z: -268, radius: 102, height: 21, depth: 0.55 },
  { x: 104, z: -262, radius: 96, height: 19, depth: 0.5 },
  { x: 214, z: -252, radius: 88, height: 17, depth: 0.5 },
  // The far band, almost dissolved into the haze.
  { x: -176, z: -330, radius: 112, height: 24, depth: 0.9 },
  { x: -22, z: -342, radius: 120, height: 26, depth: 0.95 },
  { x: 136, z: -332, radius: 110, height: 23, depth: 0.9 },
  // Shoulders, closing the frame on both sides well outside the bay.
  { x: -272, z: -132, radius: 76, height: 15, depth: 0.45 },
  { x: -290, z: -20, radius: 70, height: 13, depth: 0.45 },
  { x: 278, z: -112, radius: 74, height: 14, depth: 0.45 },
  { x: 294, z: 20, radius: 68, height: 12, depth: 0.45 },
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

    // Green almost all the way up, gold only at the crown. Blending from 5% of the
    // height made every dome a tan mound, and a row of tan mounds reads as desert.
    const t = Math.max(0, y);
    // Only the very crown goes gold. The UFO port stands on one of these domes, and
    // at 0.55 its whole plateau read as desert.
    const color = foot.clone().lerp(gold, smoothstep(0.82, 1.0, t));
    // Distance drains the colour toward the haze, which is what gives the band depth.
    color.lerp(haze, hill.depth * 0.55);

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
