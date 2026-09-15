import { BufferAttribute, BufferGeometry, Color, PlaneGeometry } from "three";

import { LAKE, TERRAIN, WORLD_COLORS, WORLD_SEED } from "./constants";
import { CHALET_SITES, SITES } from "./sites";
import { fractalNoise2D } from "./noise";

/**
 * The shape of the land around the Caveiras reservoir.
 *
 * The composition follows the reference photograph: the bay fills the left of the frame
 * and runs toward the viewer, the community sits on the east shore to the right, a
 * wooded peninsula with stilt cabins juts in from the left, and a row of chalets lines
 * the far shore under low golden hills.
 *
 * `terrainHeightAt` is the single source of ground height. The mesh, every placed
 * building, every road and every map pin sample it, so nothing can end up floating or
 * buried.
 */

/** Smoothstep between two edges, clamped. Edges may be reversed. */
export function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/** Smoothly interpolates a curve given as control points, sorted by their key. */
function alongCurve(points: ReadonlyArray<readonly [number, number]>, key: number): number {
  if (key <= points[0][0]) return points[0][1];
  const last = points[points.length - 1];
  if (key >= last[0]) return last[1];

  for (let index = 0; index < points.length - 1; index += 1) {
    const [k0, v0] = points[index];
    const [k1, v1] = points[index + 1];
    if (key <= k1) return v0 + (v1 - v0) * smoothstep(k0, k1, key);
  }
  return last[1];
}

/**
 * The bay's east shore: where the water ends and the community begins, as a function of
 * depth into the scene. Water lies west of this line.
 */
const EAST_SHORE: ReadonlyArray<readonly [number, number]> = [
  [-118, -14],
  [-96, 6],
  [-74, 30],
  [-52, 44],
  [-30, 52],
  [-8, 48],
  [16, 38],
  [44, 28],
  [78, 20],
  [120, 14],
];

/** The far shore, where the chalets stand. Water lies south of this line. */
const FAR_SHORE: ReadonlyArray<readonly [number, number]> = [
  [-150, -132],
  [-90, -126],
  [-40, -120],
  [10, -118],
  [60, -122],
  [120, -130],
];

export function eastShoreXAt(z: number): number {
  const base = alongCurve(EAST_SHORE, z);
  return base + (fractalNoise2D(z * 0.05, 11, WORLD_SEED + 3, 2) - 0.5) * 9;
}

export function farShoreZAt(x: number): number {
  const base = alongCurve(FAR_SHORE, x);
  return base + (fractalNoise2D(x * 0.04, 23, WORLD_SEED + 5, 2) - 0.5) * 8;
}

function distanceToSegment(px: number, pz: number, ax: number, az: number, bx: number, bz: number): number {
  const abx = bx - ax;
  const abz = bz - az;
  const lengthSquared = abx * abx + abz * abz || 1;
  const t = Math.min(1, Math.max(0, ((px - ax) * abx + (pz - az) * abz) / lengthSquared));
  return Math.hypot(px - (ax + abx * t), pz - (az + abz * t));
}

/**
 * The channel that carries the reservoir east to its own dam.
 *
 * The dam stands at x = 112 and the bay ends around x = 0, so the falls, the powerhouse
 * and the footbridge sat on a green hillside with no water behind them - the namesake of
 * the whole place, dry. The outlet is a narrow arm, not a widening of the bay: opening
 * the east shore instead would have flooded the road and half the community.
 */
const OUTLET: ReadonlyArray<readonly [number, number]> = [
  [-10, -112],
  [30, -112],
  [70, -111],
  [112, -107],
];

const OUTLET_HALF_WIDTH = 9;

/** The wooded peninsula that juts into the bay from the west. */
const PENINSULA = { x: -104, z: -52, radiusX: 74, radiusZ: 26 } as const;

/** Signed distance to the peninsula, negative on it. */
export function peninsulaDistance(x: number, z: number): number {
  const dx = x - PENINSULA.x;
  const dz = z - PENINSULA.z;
  const angle = Math.atan2(dz / PENINSULA.radiusZ, dx / PENINSULA.radiusX);
  const wobble = 1 + 0.14 * (fractalNoise2D(Math.cos(angle) * 2.5 + 7, Math.sin(angle) * 2.5 + 7, WORLD_SEED + 13, 2) - 0.5) * 2;
  const normalised = Math.sqrt(
    (dx * dx) / (PENINSULA.radiusX * PENINSULA.radiusX) + (dz * dz) / (PENINSULA.radiusZ * PENINSULA.radiusZ),
  );
  return (normalised - wobble) * Math.sqrt(PENINSULA.radiusX * PENINSULA.radiusZ);
}

/**
 * Signed distance to open water, negative on the lake.
 *
 * The bay is the intersection of two half-spaces - west of the east shore, south of the
 * far shore - with the peninsula cut back out of it.
 */
export function lakeDistance(x: number, z: number): number {
  const east = x - eastShoreXAt(z);
  const far = farShoreZAt(x) - z;
  const bay = Math.max(east, far, -peninsulaDistance(x, z));

  let outlet = Number.POSITIVE_INFINITY;
  for (let index = 0; index < OUTLET.length - 1; index += 1) {
    const [ax, az] = OUTLET[index];
    const [bx, bz] = OUTLET[index + 1];
    outlet = Math.min(outlet, distanceToSegment(x, z, ax, az, bx, bz));
  }

  return Math.min(bay, outlet - OUTLET_HALF_WIDTH);
}

/** Kept for callers that ask about the peninsula by its older name. */
export const islandDistance = peninsulaDistance;

/** Whether a point is on open water. */
export function isOnLake(x: number, z: number): boolean {
  return lakeDistance(x, z) < 0;
}

/** The river leaving the reservoir at its north-east corner, below the dam. */
export const RIVER_COURSE: ReadonlyArray<readonly [number, number]> = [
  [108, -104],
  [124, -98],
  [140, -86],
  [156, -68],
];

export function riverDistance(x: number, z: number): number {
  let best = Number.POSITIVE_INFINITY;
  for (let index = 0; index < RIVER_COURSE.length - 1; index += 1) {
    const [ax, az] = RIVER_COURSE[index];
    const [bx, bz] = RIVER_COURSE[index + 1];
    best = Math.min(best, distanceToSegment(x, z, ax, az, bx, bz));
  }
  return best;
}

/** Height of the river's surface: lake level at the dam, then the drop. */
export function riverSurfaceHeightAt(x: number): number {
  return LAKE.level + (LAKE.riverLevel - LAKE.level) * smoothstep(LAKE.dam.x, LAKE.dam.x + 7, x);
}

/**
 * The ridge behind the far shore, as ground rather than backdrop.
 *
 * The chalet village stands on it. It was a row of separate dome meshes sitting on the
 * terrain, and anything placed inside one ended up buried: a flat pad levels the ground
 * under a dome but not the dome itself.
 */
interface Ridge {
  readonly x: number;
  readonly z: number;
  readonly radiusX: number;
  readonly radiusZ: number;
  readonly height: number;
}

const RIDGE: readonly Ridge[] = [
  { x: -238, z: -178, radiusX: 90, radiusZ: 44, height: 13 },
  { x: -150, z: -176, radiusX: 86, radiusZ: 44, height: 14 },
  { x: -56, z: -186, radiusX: 80, radiusZ: 46, height: 17 },
  { x: 40, z: -180, radiusX: 78, radiusZ: 44, height: 15 },
  { x: 132, z: -186, radiusX: 84, radiusZ: 46, height: 16 },
  { x: 226, z: -178, radiusX: 80, radiusZ: 42, height: 13 },
];

function ridgeHeightAt(x: number, z: number): number {
  let highest = 0;
  for (const bump of RIDGE) {
    const dx = (x - bump.x) / bump.radiusX;
    const dz = (z - bump.z) / bump.radiusZ;
    const reach = Math.sqrt(dx * dx + dz * dz);
    highest = Math.max(highest, bump.height * (1 - smoothstep(0.15, 1, reach)));
  }
  return highest;
}

/** The hill the lookout stands on, west of the peninsula. */
const MIRANTE_HILL = { x: -132, z: -96, height: 20, radius: 40 } as const;

interface FlatPad {
  readonly x: number;
  readonly z: number;
  readonly radius: number;
  readonly falloff: number;
}

/**
 * One pad per landmark and per block, so buildings stand square.
 *
 * The landmark pads come straight from `SITES`: hand-copying them is what left buildings
 * standing beside their own flat ground every time a place moved.
 */
const FLAT_PADS: readonly FlatPad[] = [
  ...SITES.map((site) => ({ x: site.x, z: site.z, radius: site.pad, falloff: Math.max(6, site.pad * 0.5) })),
  // The usina below the dam.
  { x: 128, z: -112, radius: 8, falloff: 5 },
  // The lakefront houses and cabanas, which stand on the drop down to the water.
  { x: 44, z: 40, radius: 11, falloff: 7 },
  { x: 70, z: -14, radius: 11, falloff: 7 },
  { x: 30, z: 86, radius: 11, falloff: 7 },
  { x: 34, z: 60, radius: 7, falloff: 5 },
  { x: 54, z: -10, radius: 7, falloff: 5 },
  { x: 22, z: 124, radius: 7, falloff: 5 },
  // Car parks. Without their own ground the cars stood on a slope, and a flat-bottomed
  // car on a slope floats at one end.
  { x: 38, z: 104, radius: 13, falloff: 7 },
  { x: 64, z: 40, radius: 10, falloff: 6 },
  { x: 144, z: 106, radius: 9, falloff: 6 },
  // The chalets on the ridge, each on its own shelf so it does not tip down the slope.
  ...CHALET_SITES.map(([x, z]) => ({ x, z, radius: 6, falloff: 4 })),
  // The UFO port's approach, which has to be dead flat.
  { x: 22, z: -246, radius: 24, falloff: 14 },
];

function distance(x0: number, z0: number, x1: number, z1: number): number {
  return Math.hypot(x0 - x1, z0 - z1);
}

/** Ground height before any levelling. */
function naturalHeightAt(x: number, z: number): number {
  // The east shore climbs gently away from the water; the far side rises into hills.
  // A gentle rise inland, not a hillside. At 20 units over 90 the community stood on a
  // slope no building or road could line up with.
  const inland = x - eastShoreXAt(z);
  const eastRise = smoothstep(0, 140, inland) * 9 + smoothstep(150, 260, inland) * 5;
  const farRise = smoothstep(0, 70, farShoreZAt(x) - z + 0) * 0;
  const beyondFar = smoothstep(0, 60, farShoreZAt(x) - z) * 0;
  const northRise = smoothstep(-122, -175, z) * 15;
  // The planalto the UFO port stands on, out past the hill band at the end of the map.
  const plateauRise = smoothstep(-205, -272, z) * 17;

  const hill =
    MIRANTE_HILL.height *
    (1 - smoothstep(6, MIRANTE_HILL.radius, distance(x, z, MIRANTE_HILL.x, MIRANTE_HILL.z)));

  // The noise is damped where the town is. Levelling it with a bench instead left a
  // scarp all the way round the bench's edge, which is worse than the slope was.
  const townness =
    smoothstep(-4, 18, inland) * (1 - smoothstep(118, 190, inland)) * smoothstep(-96, -60, z);
  const rolling = (fractalNoise2D(x * 0.014, z * 0.014, WORLD_SEED) - 0.5) * 6 * (1 - townness * 0.78);
  const detail = (fractalNoise2D(x * 0.055, z * 0.055, WORLD_SEED + 7, 3) - 0.5) * 1.5;

  let ground =
    LAKE.level + 1.6 + eastRise + farRise + beyondFar + northRise + plateauRise + ridgeHeightAt(x, z) + hill + rolling + detail;

  // The peninsula is low and wooded.
  const peninsula = peninsulaDistance(x, z);
  if (peninsula < 6) {
    const top = LAKE.level + 2.6 + rolling * 0.4;
    ground += (top - ground) * smoothstep(6, -6, peninsula);
  }

  // The basin: the floor drops away from the shore.
  const lake = lakeDistance(x, z);
  ground += (LAKE.floor - ground) * smoothstep(8, -6, lake);

  // The river below the dam.
  const river = riverDistance(x, z);
  const riverFloor = riverSurfaceHeightAt(x) - 2.6;
  ground += (riverFloor - ground) * smoothstep(LAKE.riverHalfWidth + 6, LAKE.riverHalfWidth * 0.9, river) * smoothstep(LAKE.dam.x - 2, LAKE.dam.x + 3, x);

  return ground;
}

const PAD_HEIGHTS: ReadonlyMap<FlatPad, number> = new Map(FLAT_PADS.map((pad) => [pad, naturalHeightAt(pad.x, pad.z)]));

/** Ground height at a world position. */
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

/** The grass/straw/sand/rock blend at a point. */
function surfaceColorAt(x: number, z: number, height: number): Color {
  const grass = new Color(WORLD_COLORS.grass);
  const grassDeep = new Color(WORLD_COLORS.grassDeep);
  const straw = new Color(WORLD_COLORS.straw);
  const sand = new Color(WORLD_COLORS.sand);
  const hillGold = new Color(WORLD_COLORS.hilltop);
  const lakeBed = new Color("#5f8f86");

  const patch = fractalNoise2D(x * 0.04, z * 0.04, WORLD_SEED + 31, 3);
  const base = grassDeep.clone().lerp(grass, patch);

  // The far ground goes golden only well beyond the chalets. Starting the blend at
  // z = -105 - in front of the far shore at z = -120 - turned the land right behind
  // them into desert, which is what it looked like.
  base.lerp(hillGold, smoothstep(-300, -430, z) * 0.45);
  base.lerp(straw, smoothstep(18, 36, height) * 0.38);

  // Sand along the shore, lake bed below the water.
  const shore = Math.abs(lakeDistance(x, z));
  base.lerp(sand, (1 - smoothstep(0.5, 2.6, shore)) * 0.8);
  base.lerp(lakeBed, smoothstep(LAKE.level + 0.2, LAKE.floor, height));

  return base;
}

/** Builds the terrain mesh geometry with baked vertex colours. */
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
