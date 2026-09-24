import { BufferAttribute, BufferGeometry, Color } from "three";

import { LAKE, OUTER_LAND, TERRAIN, WORLD_COLORS, WORLD_SEED } from "./constants";
import { fractalNoise2D } from "./noise";
import { lakeDistance, smoothstep, surfaceColorAt, terrainHeightAt } from "./terrain";

/**
 * The land beyond the map: a coarse ring of forested hills continuing the terrain out to
 * the horizon.
 *
 * The terrain's east edge is nearer the hub camera than the far shore's hills, so no fog
 * curve could hide it without drowning the view, and past it the frame showed a flat
 * plane and domes standing on nothing. The ring starts exactly on the terrain's border -
 * same vertices, same height function - so the two meet without a step, then eases into
 * rolling highland that the air dissolves. See design.md D3 of elevate-world-realism.
 */

const HALF = TERRAIN.size / 2;
/** Samples per side of the terrain's border - the terrain mesh's own vertex spacing. */
const BORDER_SAMPLES = TERRAIN.segments;

/** How far outside the terrain's square a point lies; 0 inside it. */
export function outsideDistance(x: number, z: number): number {
  const dx = Math.max(Math.abs(x) - HALF, 0);
  const dz = Math.max(Math.abs(z) - HALF, 0);
  return Math.hypot(dx, dz);
}

/** The rolling highland the ring settles into, far from the map. */
function highlandHeightAt(x: number, z: number, outside: number): number {
  const rolling = fractalNoise2D(x * OUTER_LAND.hillFrequency, z * OUTER_LAND.hillFrequency, WORLD_SEED + 71, 4);
  const hills = OUTER_LAND.baseHeight + (rolling - 0.35) * OUTER_LAND.hillHeight;
  // The horizon rises a little with distance, so the last ridges stand as silhouettes.
  const rise = smoothstep(OUTER_LAND.riseFrom, OUTER_LAND.riseTo, outside) * OUTER_LAND.riseHeight;
  return Math.max(hills + rise, LAKE.level + OUTER_LAND.shoreClearance);
}

/**
 * Ground height anywhere in the world: the terrain inside the map, the ring beyond it.
 * On the border the two are the same number, which is what keeps the seam closed.
 */
export function landHeightAt(x: number, z: number): number {
  const inner = terrainHeightAt(x, z);
  const outside = outsideDistance(x, z);
  if (outside <= 0) return inner;
  // Past the lake's end the far shore rises quickly, or the reservoir runs to the horizon
  // like a sea. The distance itself blends, so the ground stays continuous.
  const underWater = 1 - smoothstep(LAKE.level - 2, LAKE.level + 2, inner);
  const blend = OUTER_LAND.blendDistance + (OUTER_LAND.lakeBlendDistance - OUTER_LAND.blendDistance) * underWater;
  const weight = smoothstep(0, blend, outside);
  return inner + (highlandHeightAt(x, z, outside) - inner) * weight;
}

/** Woodland from far off: dark canopy, mottled, with the odd paler clearing. */
function canopyColorAt(x: number, z: number): Color {
  const mottle = fractalNoise2D(x * 0.02, z * 0.02, WORLD_SEED + 73, 3);
  const clearing = smoothstep(0.62, 0.72, fractalNoise2D(x * 0.008, z * 0.008, WORLD_SEED + 79, 2));
  const color = new Color(WORLD_COLORS.farCanopy).lerp(new Color(WORLD_COLORS.farCanopyLight), mottle);
  return color.lerp(new Color(WORLD_COLORS.farPasture), clearing * 0.7);
}

/** A point on a square ring of half-size `half`, walking the perimeter by `t` in [0, 4). */
function perimeterPoint(t: number, half: number): readonly [number, number] {
  const side = Math.floor(t) % 4;
  const along = -half + (t - Math.floor(t)) * 2 * half;
  if (side === 0) return [along, -half];
  if (side === 1) return [half, along];
  if (side === 2) return [-along, half];
  return [-half, -along];
}

/** Ring offsets from the border: fine next to it, growing geometrically outward. */
function ringOffsets(): readonly number[] {
  const offsets = [0];
  let step = TERRAIN.size / TERRAIN.segments;
  while (offsets[offsets.length - 1] < OUTER_LAND.reach) {
    offsets.push(offsets[offsets.length - 1] + step);
    step *= OUTER_LAND.ringGrowth;
  }
  return offsets;
}

/** Builds the ring as one geometry with vertex colours and the terrain's `shore` attribute. */
export function createOuterLandGeometry(): BufferGeometry {
  const offsets = ringOffsets();
  const perimeter = BORDER_SAMPLES * 4;
  const positions = new Float32Array(offsets.length * perimeter * 3);
  const colors = new Float32Array(offsets.length * perimeter * 3);
  const shores = new Float32Array(offsets.length * perimeter);

  offsets.forEach((offset, ring) => {
    for (let index = 0; index < perimeter; index += 1) {
      const [x, z] = perimeterPoint(index / BORDER_SAMPLES, HALF + offset);
      const height = landHeightAt(x, z);
      const vertex = ring * perimeter + index;
      positions.set([x, height, z], vertex * 3);

      // On the border the colour is the terrain's own, then it gives way to woodland.
      const border = surfaceColorAt(x, z, height);
      const color = border.lerp(canopyColorAt(x, z), smoothstep(0, OUTER_LAND.colourBlend, offset));
      colors.set([color.r, color.g, color.b], vertex * 3);
      shores[vertex] = Math.max(-20, Math.min(20, lakeDistance(x, z)));
    }
  });

  const indices: number[] = [];
  for (let ring = 0; ring < offsets.length - 1; ring += 1) {
    for (let index = 0; index < perimeter; index += 1) {
      const a = ring * perimeter + index;
      const b = ring * perimeter + ((index + 1) % perimeter);
      const c = (ring + 1) * perimeter + index;
      const d = (ring + 1) * perimeter + ((index + 1) % perimeter);
      // Wound to face up. The perimeter runs clockwise seen from above (east along the
      // north edge first), so (a, b, c) is anticlockwise from above; the other way round the
      // whole ring was back-face culled and the frame showed sky where the land should be.
      indices.push(a, b, c, b, d, c);
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setAttribute("color", new BufferAttribute(colors, 3));
  geometry.setAttribute("shore", new BufferAttribute(shores, 1));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
