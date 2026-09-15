import { BufferAttribute, BufferGeometry, Color, PlaneGeometry } from "three";

import { RIVER, TERRAIN, WATER_LEVEL, WORLD_COLORS, WORLD_SEED } from "./constants";
import { fractalNoise2D } from "./noise";

/**
 * The shape of the valley Serranopolis sits in.
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

/** Where the river's centre line sits at a given depth into the valley. */
export function riverCentreX(z: number): number {
  return 50 + 4.5 * Math.sin(z * 0.045 + 0.6);
}

/** Horizontal distance from a point to the river's centre line. */
export function distanceToRiver(x: number, z: number): number {
  return Math.abs(x - riverCentreX(z));
}

/**
 * Half-width of the water surface along the river's course: a stream through town,
 * a wide sheet over the falls, a plunge pool below, a reservoir above, and a lake
 * where it leaves the valley to the south.
 */
export function riverHalfWidthAt(z: number): number {
  const base = RIVER.halfWidth;
  const falls = smoothstep(-60, -66, z) * (1 - smoothstep(-78, -82, z));
  const pool = smoothstep(-50, -60, z) * (1 - smoothstep(-64, -68, z));
  const reservoir = smoothstep(RIVER.reservoir.startZ, RIVER.reservoir.fullZ, z);
  const lake =
    smoothstep(RIVER.lake.startZ, RIVER.lake.fullZ, z) * (1 - smoothstep(RIVER.lake.taperZ, RIVER.lake.endZ, z));

  return Math.max(
    base,
    base + falls * (RIVER.fallsHalfWidth - base),
    base + pool * (RIVER.poolHalfWidth - base),
    base + reservoir * (RIVER.reservoirHalfWidth - base),
    base + lake * (RIVER.lakeHalfWidth - base),
  );
}

/** How much wider than the water the trench blends out into the banks. */
export function riverBankReachAt(z: number): number {
  return riverHalfWidthAt(z) + 7;
}

/**
 * How far the valley floor has stepped up onto the plateau at a given depth: two
 * basalt ledges, which is how the Salto do Rio Caveiras actually falls.
 */
function scarpAt(z: number): number {
  return 7 * smoothstep(-66, -70, z) + 5 * smoothstep(-73.5, -77, z);
}

/** Height of the water surface at a given depth: valley level, rising over the scarp. */
export function riverBedHeightAt(z: number): number {
  return WATER_LEVEL + scarpAt(z);
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
  { x: 0, z: 0, radius: 22, falloff: 8 },
  { x: 0, z: -31, radius: 8, falloff: 5 },
  { x: 28, z: 2, radius: 11, falloff: 5 },
  { x: -28, z: 14, radius: 11, falloff: 6 },
  { x: -20, z: -18, radius: 12, falloff: 6 },
  { x: 26, z: 46, radius: 13, falloff: 6 },
  { x: 30, z: -30, radius: 8, falloff: 6 },
  { x: 14, z: 30, radius: 10, falloff: 6 },
  { x: 2, z: -46, radius: 7, falloff: 5 },
  { x: 28, z: -60, radius: 7, falloff: 4 },
  { x: 64, z: -58, radius: 6, falloff: 4 },
];

function distance(x0: number, z0: number, x1: number, z1: number): number {
  return Math.hypot(x0 - x1, z0 - z1);
}

/**
 * Ground height before any levelling.
 *
 * The valley is a bowl: flat where the town sits, rising to a rim. Across the back the
 * floor steps up onto a plateau under the peaks, and the river comes down that step as
 * the waterfall. A single hill carries the lookout.
 */
function naturalHeightAt(x: number, z: number): number {
  const half = TERRAIN.size / 2;
  const radius = Math.sqrt(x * x + z * z) / half;

  // The bowl rises to the north and the sides only. The south stays low and open, so
  // nothing climbs into the foreground between the camera and the town - the reference
  // keeps water in front for the same reason.
  const bowl = smoothstep(0.45, 1.02, radius) * 30 * (1 - smoothstep(10, 70, z));
  const ridge = smoothstep(60, 150, -z) * 6;
  const hill =
    MIRANTE_HILL.height *
    (1 - smoothstep(4, MIRANTE_HILL.radius, distance(x, z, MIRANTE_HILL.x, MIRANTE_HILL.z)));

  const townDamping = 0.35 + 0.65 * smoothstep(28, 72, Math.sqrt(x * x + z * z));
  const rolling = (fractalNoise2D(x * 0.018, z * 0.018, WORLD_SEED) - 0.5) * 7 * townDamping;
  const detail = (fractalNoise2D(x * 0.06, z * 0.06, WORLD_SEED + 7, 3) - 0.5) * 1.6;

  const ground = bowl + ridge + hill + rolling + detail + scarpAt(z);

  // The river trench: the floor is pulled down to below the water surface and blends
  // back to natural ground at the banks. Anchoring it to the water rather than
  // subtracting a fixed depth is what keeps the river visible on the plateau.
  // Flat across the whole water surface, sloping only in the bank zone beyond it -
  // otherwise a wide lake shows water only in a strip down its middle.
  const halfWidth = riverHalfWidthAt(z);
  const wideness = smoothstep(RIVER.halfWidth, RIVER.lakeHalfWidth, halfWidth);
  const bedFloor = riverBedHeightAt(z) - (3.2 + wideness * 1.8);
  const trench = smoothstep(riverBankReachAt(z), halfWidth * 0.92, distanceToRiver(x, z));
  return ground + (bedFloor - ground) * trench;
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

/** Steepness of the ground at a point - drives where bare rock shows through. */
function slopeAt(x: number, z: number): number {
  const step = 0.9;
  const dx = terrainHeightAt(x + step, z) - terrainHeightAt(x - step, z);
  const dz = terrainHeightAt(x, z + step) - terrainHeightAt(x, z - step);
  return Math.hypot(dx, dz) / (2 * step);
}

/** How exposed a point is - drives the grass/straw/rock blend. */
function surfaceColorAt(x: number, z: number, height: number): Color {
  const grass = new Color(WORLD_COLORS.grass);
  const grassDeep = new Color(WORLD_COLORS.grassDeep);
  const straw = new Color(WORLD_COLORS.straw);
  const rock = new Color(WORLD_COLORS.rock);
  const rockDark = new Color(WORLD_COLORS.rockDark);
  const sand = new Color("#d9c89c");

  const patch = fractalNoise2D(x * 0.045, z * 0.045, WORLD_SEED + 31, 3);
  const base = grassDeep.clone().lerp(grass, patch);

  const dryness = smoothstep(30, 48, height);
  base.lerp(straw, dryness * 0.6);

  const exposure = smoothstep(38, 52, height);
  base.lerp(rock, exposure);
  base.lerp(rockDark, smoothstep(0.75, 1.5, slopeAt(x, z)) * 0.85);

  // Sandy banks where the water widens, damp ground elsewhere along it.
  const bed = riverBedHeightAt(z);
  const shore = smoothstep(riverBankReachAt(z), riverHalfWidthAt(z) + 1, distanceToRiver(x, z));
  const wideness = smoothstep(RIVER.halfWidth + 1, RIVER.lakeHalfWidth, riverHalfWidthAt(z));
  base.lerp(sand, shore * wideness * 0.85);
  base.lerp(grassDeep, smoothstep(bed + 3.4, bed, height) * 0.5 * (1 - wideness));

  return base;
}

/**
 * Builds the terrain mesh geometry with baked vertex colours.
 *
 * Colours are baked per vertex rather than sampled from a texture: it keeps the payload
 * at zero, and at this art direction the flat-shaded facets are the look, not a
 * compromise. A repeating grass texture is multiplied over it by the material.
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
