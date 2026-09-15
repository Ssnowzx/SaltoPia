import { BufferAttribute, BufferGeometry, Color, IcosahedronGeometry } from "three";

import { WORLD_COLORS, WORLD_SEED } from "./constants";
import { merge } from "./builders";
import { fractalNoise2D } from "./noise";
import { smoothstep, terrainHeightAt } from "./terrain";
import { SURFACE } from "./textures";

/**
 * The low, forested hills around the reservoir.
 *
 * The Serra around Lages is a plateau edge, not a range of peaks: what stands on the
 * horizon is a line of rounded, tree-covered hills going blue in the haze. Each is a
 * flattened sphere roughened with noise and coloured from lit grass at the foot to
 * dark forest on top.
 */

interface HillSpec {
  readonly x: number;
  readonly z: number;
  readonly radius: number;
  readonly height: number;
}

const HILLS: readonly HillSpec[] = [
  { x: -120, z: -118, radius: 54, height: 20 },
  { x: -62, z: -136, radius: 60, height: 23 },
  { x: 10, z: -142, radius: 66, height: 25 },
  { x: 80, z: -134, radius: 58, height: 21 },
  { x: 136, z: -110, radius: 52, height: 18 },
  { x: -30, z: -152, radius: 52, height: 17 },
  { x: -140, z: -62, radius: 46, height: 16 },
  { x: -146, z: -2, radius: 42, height: 14 },
  { x: 146, z: -56, radius: 46, height: 16 },
  { x: 150, z: 4, radius: 42, height: 14 },
  { x: 112, z: -80, radius: 40, height: 13 },
  { x: -100, z: -76, radius: 38, height: 12 },
];

function createHillGeometry(hill: HillSpec, seed: number): BufferGeometry {
  const geometry = new IcosahedronGeometry(1, 3).toNonIndexed();
  const positions = geometry.attributes.position as BufferAttribute;
  const colors = new Float32Array(positions.count * 3);

  const foot = new Color(WORLD_COLORS.grass);
  const forest = new Color(WORLD_COLORS.forest);
  const canopy = new Color(WORLD_COLORS.hilltop);

  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index);
    const y = positions.getY(index);
    const z = positions.getZ(index);

    // Roughen radially so the silhouette stops being a perfect dome.
    const noise = fractalNoise2D(x * 2.1 + seed, z * 2.1 + seed * 0.7, WORLD_SEED + 53, 3) - 0.5;
    const scale = 1 + noise * 0.22;

    positions.setXYZ(index, x * hill.radius * scale, Math.max(y, -0.05) * hill.height * scale, z * hill.radius * 0.88 * scale);

    const t = Math.max(0, y);
    const patch = fractalNoise2D(x * 4 + seed, z * 4, WORLD_SEED + 59, 2);
    const color = foot.clone().lerp(forest, smoothstep(0.1, 0.5, t));
    color.lerp(canopy, smoothstep(0.45, 0.95, t) * (0.5 + patch * 0.5));

    colors[index * 3] = color.r;
    colors[index * 3 + 1] = color.g;
    colors[index * 3 + 2] = color.b;
  }

  positions.needsUpdate = true;
  geometry.setAttribute("color", new BufferAttribute(colors, 3));
  geometry.setAttribute("surface", new BufferAttribute(new Float32Array(positions.count).fill(SURFACE.foliage), 1));

  geometry.translate(hill.x, terrainHeightAt(hill.x, hill.z) - hill.height * 0.12, hill.z);
  return geometry;
}

/** Every hill, merged into one mesh. */
export function createHillsGeometry(): BufferGeometry {
  return merge(HILLS.map((hill, index) => createHillGeometry(hill, index * 3.7)));
}
