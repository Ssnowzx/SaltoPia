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
  // Only the backdrop is left here. The near ridge and the band behind it are terrain
  // now (`RIDGE` in terrain.ts), so the chalets and the farms can stand on them.
  // The far band, behind the port and almost dissolved into the haze.
  { x: -176, z: -395, radius: 112, height: 24, depth: 0.9 },
  { x: -22, z: -412, radius: 120, height: 26, depth: 0.95 },
  { x: 136, z: -398, radius: 110, height: 23, depth: 0.9 },
  // Shoulders, closing the frame on both sides well outside the bay.
  // The west pair stand over open water, where no tree can be planted on them, so
  // they are pushed deep into the haze rather than left as bare slopes at the frame edge.
  { x: -334, z: -152, radius: 86, height: 16, depth: 0.9 },
  { x: -352, z: -26, radius: 78, height: 14, depth: 0.9 },
  // No east pair: the east shoulders are terrain now, wooded like the rest. As backdrop
  // meshes their front edges reached inside the map and stood behind the fairground as
  // bare mounds.
];

function createHillGeometry(hill: HillSpec, seed: number): BufferGeometry {
  const geometry = new IcosahedronGeometry(1, 3);
  const positions = geometry.attributes.position as BufferAttribute;
  const colors = new Float32Array(positions.count * 3);

  const foot = new Color(WORLD_COLORS.forest);
  const gold = new Color(WORLD_COLORS.hilltop);
  const haze = new Color(WORLD_COLORS.hillHaze);

  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index);
    const y = positions.getY(index);
    const z = positions.getZ(index);

    // A coxilha's profile - flat crown, firm flank - not a dome. The contour wobble is
    // low-frequency so the outline undulates; fine noise on a silhouette reads as rubble.
    const contour = fractalNoise2D(x * 0.55 + seed, z * 0.55 + seed * 0.7, WORLD_SEED + 53, 2) - 0.5;
    const fine = fractalNoise2D(x * 1.9 + seed, z * 1.9, WORLD_SEED + 54, 2) - 0.5;
    const scale = 1 + contour * 0.28 + fine * 0.06;
    const shaped = Math.pow(Math.max(y, 0), 0.55);

    positions.setXYZ(index, x * hill.radius * scale, Math.max(shaped, -0.05) * hill.height * scale, z * hill.radius * 0.8 * scale);

    // Green almost all the way up, gold only at the crown. Blending from 5% of the
    // height made every dome a tan mound, and a row of tan mounds reads as desert.
    const t = Math.max(0, y);
    // Only the very crown goes gold. The UFO port stands on one of these domes, and
    // at 0.55 its whole plateau read as desert.
    const color = foot.clone().lerp(gold, smoothstep(0.82, 1.0, t));
    // Distance drains the colour toward the haze, which is what gives the band depth.
    color.lerp(haze, hill.depth * 0.6);

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
