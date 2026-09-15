import type { BufferGeometry } from "three";

import {
  type BuildingSpec,
  blob,
  box,
  chimneyTopFor,
  cone,
  createBenchGeometry,
  createBuildingGeometry,
  createFenceGeometry,
  createGableRoofGeometry,
  createLamppostGeometry,
  createStoneWallGeometry,
  createWoodpileGeometry,
  leaningPost,
  merge,
  paint,
  post,
} from "./builders";
import { WORLD_COLORS } from "./constants";

/**
 * The eight points of interest, each composed from the primitives in builders.ts.
 *
 * Every composite is authored in its final orientation with its origin at the place's
 * seeded world position, so the layout places them unrotated and the smoke sources
 * below can be given in plain offsets from that origin.
 */

/** Moves a finished part into place within a composite. */
function place(geometry: BufferGeometry, x: number, y: number, z: number, rotationY = 0): BufferGeometry {
  if (rotationY !== 0) geometry.rotateY(rotationY);
  geometry.translate(x, y, z);
  return geometry;
}

/** Rotation that turns a +Z-facing part at (x, z) to face the origin. */
function facingCentre(x: number, z: number): number {
  return Math.atan2(-x, -z);
}

/** A fire pit: a ring of stones around a bed of embers. */
function firePit(x: number, y: number, z: number, radius = 1.6): BufferGeometry[] {
  const parts: BufferGeometry[] = [];

  for (let index = 0; index < 8; index += 1) {
    const angle = (index / 8) * Math.PI * 2;
    parts.push(blob(0.42, WORLD_COLORS.rockLight, x + Math.cos(angle) * radius, y + 0.2, z + Math.sin(angle) * radius, 0.7));
  }

  parts.push(post(radius * 0.85, radius * 0.9, 0.1, 10, WORLD_COLORS.stoneDark, x, y, z));
  parts.push(post(radius * 0.6, radius * 0.7, 0.14, 10, WORLD_COLORS.emberGlow, x, y + 0.08, z));

  return parts;
}

// ---------------------------------------------------------------------------------
// Praca do Pinhao
// ---------------------------------------------------------------------------------

/** The bandstand at the centre of the square - an octagonal roof on posts. */
function bandstand(): BufferGeometry {
  const parts: BufferGeometry[] = [];

  parts.push(post(3.2, 3.4, 0.5, 8, WORLD_COLORS.whitewash, 0, 0, 0));

  for (let index = 0; index < 8; index += 1) {
    const angle = (index / 8) * Math.PI * 2;
    parts.push(post(0.11, 0.11, 2.6, 5, WORLD_COLORS.whitewash, Math.cos(angle) * 2.7, 0.5, Math.sin(angle) * 2.7));
  }

  // Balustrade between the posts, open at the front.
  for (let index = 1; index < 8; index += 1) {
    const a0 = (index / 8) * Math.PI * 2;
    const a1 = ((index + 1) / 8) * Math.PI * 2;
    const mid = (a0 + a1) / 2;
    parts.push(box(2.0, 0.5, 0.08, WORLD_COLORS.whitewash, Math.cos(mid) * 2.7, 0.95, Math.sin(mid) * 2.7, -mid + Math.PI / 2));
  }

  parts.push(cone(3.6, 1.5, 8, WORLD_COLORS.tile, 0, 3.1, 0));
  parts.push(post(0.12, 0.12, 0.7, 5, WORLD_COLORS.tileDark, 0, 4.6, 0));

  return merge(parts);
}

/** The square: paving, bandstand, benches, lamps, flower beds and the pinhao brazier. */
export function createPracaGeometry(): BufferGeometry {
  const parts: BufferGeometry[] = [];
  const pavingTop = 0.28;

  parts.push(post(10.6, 10.9, pavingTop, 28, WORLD_COLORS.paving, 0, 0, 0));
  parts.push(place(bandstand(), 0, pavingTop, 0));

  for (let index = 0; index < 6; index += 1) {
    const angle = (index / 6) * Math.PI * 2 + Math.PI / 6;
    const x = Math.cos(angle) * 7.4;
    const z = Math.sin(angle) * 7.4;
    parts.push(place(createBenchGeometry(), x, pavingTop, z, facingCentre(x, z)));
  }

  for (let index = 0; index < 4; index += 1) {
    const angle = (index / 4) * Math.PI * 2 + Math.PI / 4;
    parts.push(place(createLamppostGeometry(), Math.cos(angle) * 9.4, pavingTop, Math.sin(angle) * 9.4));
  }

  for (let index = 0; index < 4; index += 1) {
    const angle = (index / 4) * Math.PI * 2;
    const x = Math.cos(angle) * 5.2;
    const z = Math.sin(angle) * 5.2;
    parts.push(box(2.4, 0.3, 1.2, WORLD_COLORS.stoneDark, x, pavingTop + 0.15, z, -angle));
    parts.push(box(2.2, 0.4, 1.0, WORLD_COLORS.foliageWarm, x, pavingTop + 0.5, z, -angle));
  }

  // The brazier where the pinhao roasts, and its cart.
  parts.push(box(1.5, 0.9, 0.9, WORLD_COLORS.timber, 3.6, pavingTop + 0.45, 5.4));
  parts.push(post(0.55, 0.5, 0.5, 8, WORLD_COLORS.metal, 3.6, pavingTop + 0.9, 5.4));
  parts.push(post(0.45, 0.45, 0.12, 8, WORLD_COLORS.emberGlow, 3.6, pavingTop + 1.4, 5.4));
  parts.push(box(0.1, 0.9, 0.9, WORLD_COLORS.tileDark, 4.4, pavingTop + 0.45, 5.4));
  parts.push(box(0.1, 0.9, 0.9, WORLD_COLORS.tileDark, 2.8, pavingTop + 0.45, 5.4));

  return merge(parts);
}

// ---------------------------------------------------------------------------------
// Galpao do Fogo de Chao
// ---------------------------------------------------------------------------------

/** Where the fire pit sits, relative to the galpao's origin. */
const GALPAO_PIT = { x: -2.6, z: 1.4 } as const;

/** An open-sided barn with the fire pit, the meat on stakes, the table and the woodpile. */
export function createGalpaoGeometry(): BufferGeometry {
  const width = 13;
  const depth = 9;
  const height = 3.9;
  const floorTop = 0.26;
  const parts: BufferGeometry[] = [];

  parts.push(box(width + 1, floorTop, depth + 1, WORLD_COLORS.stone, 0, floorTop / 2, 0));

  for (const x of [-width / 2 + 0.5, 0, width / 2 - 0.5]) {
    for (const z of [-depth / 2 + 0.5, depth / 2 - 0.5]) {
      parts.push(post(0.17, 0.2, height, 6, WORLD_COLORS.timber, x, floorTop, z));
    }
  }

  const roof = createGableRoofGeometry(width * 1.15, depth * 1.15, 2.7);
  roof.translate(0, floorTop + height, 0);
  parts.push(paint(roof, WORLD_COLORS.tile));
  parts.push(box(width * 1.15, 0.22, depth * 1.15, WORLD_COLORS.timberDark, 0, floorTop + height - 0.11, 0));

  // A low back wall and half-height side walls keep the wind off the fire.
  parts.push(box(width, 1.4, 0.3, WORLD_COLORS.timberDark, 0, floorTop + 0.7, -depth / 2 + 0.5));
  parts.push(box(0.3, 1.0, depth * 0.55, WORLD_COLORS.timberDark, -width / 2 + 0.5, floorTop + 0.5, -depth * 0.2));
  parts.push(box(0.3, 1.0, depth * 0.55, WORLD_COLORS.timberDark, width / 2 - 0.5, floorTop + 0.5, -depth * 0.2));

  parts.push(...firePit(GALPAO_PIT.x, floorTop, GALPAO_PIT.z, 1.7));

  // Ribs on iron stakes leaning in over the embers - the fogo de chao itself.
  for (let index = 0; index < 5; index += 1) {
    const angle = (index / 5) * Math.PI * 2 + 0.3;
    const baseX = GALPAO_PIT.x + Math.cos(angle) * 2.1;
    const baseZ = GALPAO_PIT.z - Math.sin(angle) * 2.1;
    const tilt = 0.95;
    const length = 2.8;
    parts.push(leaningPost(0.05, length, WORLD_COLORS.metal, baseX, floorTop, baseZ, angle + Math.PI, tilt));

    const along = length * 0.66;
    const meatX = baseX - Math.cos(angle) * along * Math.sin(tilt);
    const meatZ = baseZ + Math.sin(angle) * along * Math.sin(tilt);
    const meatY = floorTop + along * Math.cos(tilt);
    parts.push(box(0.55, 0.26, 0.95, WORLD_COLORS.tileDark, meatX, meatY, meatZ, -angle));
  }

  // The long table and its benches.
  parts.push(box(4.2, 0.1, 1.2, WORLD_COLORS.timber, 3.2, floorTop + 0.95, -1.2));
  for (const [x, z] of [[1.4, -1.6], [5.0, -1.6], [1.4, -0.8], [5.0, -0.8]] as const) {
    parts.push(post(0.07, 0.07, 0.9, 4, WORLD_COLORS.timberDark, x, floorTop, z));
  }
  parts.push(place(createBenchGeometry(), 3.2, floorTop, -0.3, 0));
  parts.push(place(createBenchGeometry(), 3.2, floorTop, -2.1, Math.PI));

  parts.push(place(createWoodpileGeometry(), 5.4, floorTop, 3.0, Math.PI / 2));
  parts.push(place(createWoodpileGeometry(), -5.6, floorTop, -3.2, 0));

  return merge(parts);
}

// ---------------------------------------------------------------------------------
// Mirante da Neblina
// ---------------------------------------------------------------------------------

/** A stone lookout platform with a timber rail on the valley side, facing north. */
export function createMiranteGeometry(): BufferGeometry {
  const parts: BufferGeometry[] = [];
  const top = 0.66;

  parts.push(box(8, 0.6, 6, WORLD_COLORS.stoneDark, 0, 0.3, 0));
  parts.push(box(7.6, 0.12, 5.6, WORLD_COLORS.stone, 0, top - 0.06, 0));

  const railX = [-3.6, -1.8, 0, 1.8, 3.6];
  for (const x of railX) {
    parts.push(post(0.08, 0.1, 1.1, 4, WORLD_COLORS.timberDark, x, top, -2.7));
  }
  parts.push(box(7.6, 0.1, 0.1, WORLD_COLORS.timber, 0, top + 1.05, -2.7));
  parts.push(box(7.6, 0.08, 0.08, WORLD_COLORS.timber, 0, top + 0.6, -2.7));

  for (const side of [-1, 1]) {
    for (const z of [-2.7, -1.2, 0.3]) {
      parts.push(post(0.08, 0.1, 1.1, 4, WORLD_COLORS.timberDark, side * 3.6, top, z));
    }
    parts.push(box(0.1, 0.1, 3.2, WORLD_COLORS.timber, side * 3.6, top + 1.05, -1.2));
  }

  parts.push(place(createBenchGeometry(), 1.4, top, 1.6, Math.PI));

  // The trail sign.
  parts.push(post(0.07, 0.09, 1.9, 4, WORLD_COLORS.timberDark, -2.8, top, 1.9));
  parts.push(box(1.2, 0.5, 0.06, WORLD_COLORS.whitewash, -2.8, top + 2.1, 1.9));

  // The flag.
  parts.push(post(0.06, 0.08, 4.4, 5, WORLD_COLORS.metal, 3.2, top, 2.3));
  parts.push(box(1.3, 0.75, 0.05, WORLD_COLORS.ember, 3.2 + 0.68, top + 4.0, 2.3));

  return merge(parts);
}

// ---------------------------------------------------------------------------------
// Vinicola de Altitude
// ---------------------------------------------------------------------------------

const WINERY_SPEC: BuildingSpec = {
  width: 8.5,
  depth: 6,
  height: 3.8,
  roofHeight: 2.1,
  wallColor: WORLD_COLORS.rockLight,
  roofColor: WORLD_COLORS.tile,
  chimney: true,
  windows: true,
};

/** The stone winery, its barrels and the arbour at the door. */
export function createVinicolaGeometry(): BufferGeometry {
  const parts: BufferGeometry[] = [createBuildingGeometry(WINERY_SPEC)];

  for (let index = 0; index < 3; index += 1) {
    const barrel = post(0.45, 0.45, 0.95, 8, WORLD_COLORS.timberDark, 0, 0, 0);
    barrel.rotateZ(Math.PI / 2);
    barrel.translate(5.6, 0.45, 0.6 + index * 1.05);
    parts.push(barrel);
    parts.push(box(0.98, 0.08, 0.92, WORLD_COLORS.metal, 5.6, 0.45, 0.6 + index * 1.05));
  }

  // The arbour over the door, hung with vine.
  for (const x of [-1.5, 1.5]) {
    parts.push(post(0.1, 0.12, 2.6, 4, WORLD_COLORS.vinePost, x, 0, 4.6));
  }
  parts.push(box(3.4, 0.12, 0.12, WORLD_COLORS.vinePost, 0, 2.6, 4.6));
  parts.push(blob(0.7, WORLD_COLORS.vine, -1.1, 2.75, 4.6, 0.55));
  parts.push(blob(0.7, WORLD_COLORS.vine, 1.1, 2.75, 4.6, 0.55));

  parts.push(post(0.07, 0.09, 1.7, 4, WORLD_COLORS.timberDark, -5.2, 0, 3.4));
  parts.push(box(1.3, 0.55, 0.06, WORLD_COLORS.whitewash, -5.2, 1.85, 3.4));

  return merge(parts);
}

/** A short row of vines on posts, along +X from the origin. Rows are kept short so
 * each can sit flat on its own patch of a slope. */
export function createVineRowGeometry(length = 4.5): BufferGeometry {
  const parts: BufferGeometry[] = [];

  for (const x of [0, length / 2, length]) {
    parts.push(post(0.07, 0.09, 1.5, 4, WORLD_COLORS.vinePost, x, 0, 0));
  }
  parts.push(box(length, 0.04, 0.04, WORLD_COLORS.metal, length / 2, 1.4, 0));
  parts.push(box(length, 0.85, 0.5, WORLD_COLORS.vine, length / 2, 0.95, 0));

  for (let x = 0.5; x < length; x += 1.1) {
    parts.push(blob(0.4, WORLD_COLORS.vine, x, 1.35, (x % 2.2 > 1.1 ? 0.12 : -0.12), 0.7));
  }

  return merge(parts);
}

// ---------------------------------------------------------------------------------
// CTG Porteira do Tropeiro
// ---------------------------------------------------------------------------------

const CTG_HALL_SPEC: BuildingSpec = {
  width: 13,
  depth: 5.4,
  height: 3.2,
  roofHeight: 1.9,
  wallColor: WORLD_COLORS.whitewash,
  roofColor: WORLD_COLORS.tile,
  veranda: true,
  windows: true,
};

/** Where the CTG's fire sits, relative to its origin. */
const CTG_PIT = { x: -5.2, z: 6.2 } as const;

/** The long hall, the porteira with its lantern, the fence, the hitching post and the fire. */
export function createCtgGeometry(): BufferGeometry {
  const parts: BufferGeometry[] = [createBuildingGeometry(CTG_HALL_SPEC)];

  // The porteira - the gate the place is named for.
  const gateZ = 9.4;
  for (const x of [-1.7, 1.7]) {
    parts.push(post(0.2, 0.24, 4.2, 6, WORLD_COLORS.timberDark, x, 0, gateZ));
  }
  parts.push(box(4.2, 0.36, 0.36, WORLD_COLORS.timberDark, 0, 4.1, gateZ));
  parts.push(box(0.05, 0.5, 0.05, WORLD_COLORS.metal, 0, 3.65, gateZ));
  parts.push(box(0.42, 0.52, 0.42, WORLD_COLORS.lantern, 0, 3.2, gateZ));
  parts.push(cone(0.36, 0.22, 4, WORLD_COLORS.metal, 0, 3.46, gateZ));

  // Fence running out from both gate posts.
  parts.push(place(createFenceGeometry(7), 1.7, 0, gateZ));
  parts.push(place(createFenceGeometry(7), -8.7, 0, gateZ));

  // Hitching post.
  parts.push(post(0.09, 0.11, 1.2, 4, WORLD_COLORS.timberDark, 4.6, 0, 5.2));
  parts.push(post(0.09, 0.11, 1.2, 4, WORLD_COLORS.timberDark, 6.4, 0, 5.2));
  parts.push(box(2.0, 0.1, 0.1, WORLD_COLORS.timber, 5.5, 1.15, 5.2));

  // The fire with the kettle on its tripod.
  parts.push(...firePit(CTG_PIT.x, 0, CTG_PIT.z, 1.2));
  for (let index = 0; index < 3; index += 1) {
    const angle = (index / 3) * Math.PI * 2;
    parts.push(
      leaningPost(0.05, 2.4, WORLD_COLORS.metal, CTG_PIT.x + Math.cos(angle) * 1.0, 0, CTG_PIT.z - Math.sin(angle) * 1.0, angle + Math.PI, 0.42),
    );
  }
  parts.push(blob(0.36, WORLD_COLORS.metal, CTG_PIT.x, 1.15, CTG_PIT.z, 0.9));

  // A taipa - the tropeiros' dry stone wall - along the back of the yard.
  parts.push(place(createStoneWallGeometry(11), -5.5, 0, -5.4));

  return merge(parts);
}

// ---------------------------------------------------------------------------------
// Estacao Velha
// ---------------------------------------------------------------------------------

const STATION_SPEC: BuildingSpec = {
  width: 10,
  depth: 4.6,
  height: 3.4,
  roofHeight: 1.6,
  wallColor: WORLD_COLORS.whitewash,
  roofColor: WORLD_COLORS.ember,
  veranda: true,
  windows: true,
};

/** The station, platform, canopy, signal, water tower and the market on the platform.
 * The rails pass to the north (-Z); everything faces them. */
export function createEstacaoGeometry(): BufferGeometry {
  const parts: BufferGeometry[] = [];
  const platformTop = 0.5;

  parts.push(box(22, platformTop, 3.2, WORLD_COLORS.stone, 0, platformTop / 2, -4.2));
  parts.push(box(22.2, 0.12, 0.3, WORLD_COLORS.stoneDark, 0, platformTop - 0.06, -5.7));

  parts.push(place(createBuildingGeometry(STATION_SPEC), 0, platformTop, 0, Math.PI));

  // Canopy over the platform.
  for (let index = 0; index < 6; index += 1) {
    parts.push(post(0.1, 0.1, 3.2, 5, WORLD_COLORS.timberDark, -9.5 + index * 3.8, platformTop, -5.2));
  }
  parts.push(box(21.5, 0.14, 3.6, WORLD_COLORS.tileDark, 0, platformTop + 3.25, -4.3));

  // Signal post.
  parts.push(post(0.08, 0.1, 4.6, 5, WORLD_COLORS.metal, 12.4, 0, -6.4));
  parts.push(box(1.4, 0.26, 0.08, WORLD_COLORS.ember, 13.0, 4.3, -6.4));
  parts.push(box(0.3, 0.3, 0.08, WORLD_COLORS.whitewash, 13.6, 4.3, -6.4));

  // Water tower.
  for (const [x, z] of [[-13.4, -3.6], [-12.2, -3.6], [-13.4, -4.8], [-12.2, -4.8]] as const) {
    parts.push(post(0.09, 0.11, 3.2, 4, WORLD_COLORS.timberDark, x, 0, z));
  }
  parts.push(post(1.1, 1.05, 2.2, 10, WORLD_COLORS.timberDark, -12.8, 3.2, -4.2));
  parts.push(cone(1.25, 0.6, 10, WORLD_COLORS.tileDark, -12.8, 5.4, -4.2));

  // The market: crates, a stall and a bench on the platform.
  for (const [x, z, size] of [[-6.4, -3.6, 0.7], [-5.6, -3.6, 0.7], [-6.0, -3.6, 0.7]] as const) {
    parts.push(box(size, size, size, WORLD_COLORS.timber, x, platformTop + size / 2 + (x === -6.0 ? size : 0), z));
  }
  parts.push(box(2.2, 0.08, 0.9, WORLD_COLORS.timber, 6.2, platformTop + 0.95, -3.4));
  parts.push(post(0.06, 0.06, 0.9, 4, WORLD_COLORS.timberDark, 5.3, platformTop, -3.4));
  parts.push(post(0.06, 0.06, 0.9, 4, WORLD_COLORS.timberDark, 7.1, platformTop, -3.4));
  parts.push(box(2.4, 0.06, 1.2, WORLD_COLORS.ember, 6.2, platformTop + 2.2, -3.4));
  parts.push(post(0.05, 0.05, 2.2, 4, WORLD_COLORS.timberDark, 5.1, platformTop, -2.9));
  parts.push(post(0.05, 0.05, 2.2, 4, WORLD_COLORS.timberDark, 7.3, platformTop, -2.9));
  parts.push(place(createBenchGeometry(), -2.2, platformTop, -3.2, Math.PI));
  parts.push(place(createLamppostGeometry(), 9.6, platformTop, -3.0));

  return merge(parts);
}

// ---------------------------------------------------------------------------------
// Pousada da Geada
// ---------------------------------------------------------------------------------

const INN_SPEC: BuildingSpec = {
  width: 7.5,
  depth: 6,
  height: 4.2,
  roofHeight: 2.6,
  wallColor: WORLD_COLORS.rockLight,
  roofColor: WORLD_COLORS.tile,
  chimney: true,
  veranda: true,
  windows: true,
};

/** The stone inn, its well, the woodpile, a taipa and a fence. */
export function createPousadaGeometry(): BufferGeometry {
  const parts: BufferGeometry[] = [createBuildingGeometry(INN_SPEC)];

  // The well.
  parts.push(post(0.9, 0.95, 1.0, 8, WORLD_COLORS.stone, 5.6, 0, 3.2));
  parts.push(post(0.07, 0.07, 2.0, 4, WORLD_COLORS.timberDark, 4.8, 1.0, 3.2));
  parts.push(post(0.07, 0.07, 2.0, 4, WORLD_COLORS.timberDark, 6.4, 1.0, 3.2));
  parts.push(cone(1.25, 0.7, 4, WORLD_COLORS.tile, 5.6, 3.0, 3.2));
  parts.push(box(1.7, 0.06, 0.06, WORLD_COLORS.timberDark, 5.6, 2.6, 3.2));

  parts.push(place(createWoodpileGeometry(), -5.4, 0, 3.4, 0));

  parts.push(place(createStoneWallGeometry(9), -7.5, 0, 7.2));
  parts.push(place(createStoneWallGeometry(8), 7.5, 0, 7.2, Math.PI / 2));
  parts.push(place(createFenceGeometry(8), -8, 0, -5.8));

  parts.push(place(createBenchGeometry(), -3.2, 0, 5.4, 0));

  return merge(parts);
}

// ---------------------------------------------------------------------------------
// Bosque das Araucarias
// ---------------------------------------------------------------------------------

/** The trailhead: a sign and a few fallen pinhao cones. */
export function createBosqueSignGeometry(): BufferGeometry {
  return merge([
    post(0.08, 0.1, 2.1, 4, WORLD_COLORS.timberDark, 0, 0, 0),
    box(1.4, 0.6, 0.07, WORLD_COLORS.whitewash, 0, 2.2, 0),
    box(0.9, 0.35, 0.07, WORLD_COLORS.whitewash, 0.1, 1.55, 0.02, 0.08),
    blob(0.28, WORLD_COLORS.timber, 0.9, 0.2, 0.6, 1.2),
    blob(0.24, WORLD_COLORS.timber, -0.7, 0.18, 0.4, 1.2),
  ]);
}

// ---------------------------------------------------------------------------------
// Smoke
// ---------------------------------------------------------------------------------

/** A point smoke rises from, as an offset from a landmark's origin. */
export interface SmokeSource {
  /** Landmark origin in world XZ. */
  readonly x: number;
  readonly z: number;
  /** Height of the source above the ground at the origin. */
  readonly heightAboveGround: number;
  /** Relative volume - a fire pit smokes more than a chimney. */
  readonly intensity: number;
}

const [innChimneyX, innChimneyTop, innChimneyZ] = chimneyTopFor(INN_SPEC);
const [wineryChimneyX, wineryChimneyTop, wineryChimneyZ] = chimneyTopFor(WINERY_SPEC);

/** Every chimney and fire in the neighbourhood. Coordinates match the seeded places. */
export const SMOKE_SOURCES: readonly SmokeSource[] = [
  { x: 14 + innChimneyX, z: 30 + innChimneyZ, heightAboveGround: innChimneyTop, intensity: 0.8 },
  { x: 30 + wineryChimneyX, z: -30 + wineryChimneyZ, heightAboveGround: wineryChimneyTop, intensity: 0.6 },
  { x: -28 + GALPAO_PIT.x, z: 14 + GALPAO_PIT.z, heightAboveGround: 0.9, intensity: 1.3 },
  { x: -20 + CTG_PIT.x, z: -18 + CTG_PIT.z, heightAboveGround: 0.8, intensity: 0.9 },
];
