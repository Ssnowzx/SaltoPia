import { BoxGeometry, type BufferGeometry } from "three";

import { type BuildingSpec, chimneyTopFor, createBuildingGeometry, roofSurfaceHeight } from "./building";
import {
  arch,
  blob,
  box,
  cone,
  createBenchGeometry,
  createCafeTableGeometry,
  createFenceGeometry,
  createGableRoofGeometry,
  createHedgeGeometry,
  createLamppostGeometry,
  createPicnicTableGeometry,
  createStoneWallGeometry,
  createWoodpileGeometry,
  leaningPost,
  merge,
  paint,
  pipe,
  post,
} from "./builders";
import { LAKE, RIVER, WORLD_COLORS } from "./constants";
import { terrainHeightAt } from "./terrain";

/**
 * The points of interest, each composed from the primitives in builders.ts.
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
    parts.push(blob(0.42, WORLD_COLORS.rockLight, x + Math.cos(angle) * radius, y + 0.2, z + Math.sin(angle) * radius, 0.7, 0, "stone"));
  }
  parts.push(post(radius * 0.85, radius * 0.9, 0.1, 10, WORLD_COLORS.stoneDark, x, y, z, "stone"));
  parts.push(post(radius * 0.6, radius * 0.7, 0.14, 10, WORLD_COLORS.emberGlow, x, y + 0.08, z));
  return parts;
}

/** A pipe between two points, for penstocks. */
function pipeBetween(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, radius: number, color: string): BufferGeometry {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const dz = z1 - z0;
  const horizontal = Math.hypot(dx, dz);
  const length = Math.hypot(horizontal, dy);
  const tilt = Math.atan2(horizontal, dy);
  const angle = Math.atan2(-dz, dx);
  return leaningPost(radius, length, color, x0, y0, z0, angle, tilt, "metal");
}

/** A swimming pool with its paved surround and two loungers, centred on (x, z). */
function pool(x: number, z: number, width = 5, depth = 3.2): BufferGeometry[] {
  return [
    box(width + 1.4, 0.16, depth + 1.4, WORLD_COLORS.paving, x, 0.08, z, 0, "paving"),
    box(width, 0.3, depth, WORLD_COLORS.pool, x, 0.14, z, 0, "water"),
    box(0.6, 0.12, 1.6, WORLD_COLORS.whitewash, x - width / 2 - 1.1, 0.32, z - 0.6, 0, "planks"),
    box(0.6, 0.12, 1.6, WORLD_COLORS.whitewash, x - width / 2 - 1.1, 0.32, z + 1.2, 0, "planks"),
  ];
}

/** Solar panels laid on the +X slope of a gable roof. */
function solarPanels(spec: BuildingSpec, count: number): BufferGeometry[] {
  const parts: BufferGeometry[] = [];
  const slope = Math.atan2(spec.roofHeight, spec.width / 2);
  for (let index = 0; index < count; index += 1) {
    const z = -spec.depth * 0.4 + (index * spec.depth * 0.8) / Math.max(1, count - 1);
    const x = spec.width * 0.28;
    const y = roofSurfaceHeight(spec, x) + 0.1;
    const panel = new BoxGeometry(1.5, 0.08, 1.1);
    panel.rotateZ(-slope);
    panel.translate(x, y, z);
    parts.push(paint(panel, "#2b4c6e", "glass"));
  }
  return parts;
}

// ---------------------------------------------------------------------------------
// Praca do Pinhao
// ---------------------------------------------------------------------------------

function bandstand(): BufferGeometry {
  const parts: BufferGeometry[] = [];
  parts.push(post(3.2, 3.4, 0.5, 8, WORLD_COLORS.whitewash, 0, 0, 0, "stone"));
  parts.push(post(3.0, 3.0, 0.08, 8, WORLD_COLORS.paving, 0, 0.5, 0, "paving"));
  for (let index = 0; index < 8; index += 1) {
    const angle = (index / 8) * Math.PI * 2;
    parts.push(post(0.11, 0.11, 2.6, 6, WORLD_COLORS.whitewash, Math.cos(angle) * 2.7, 0.5, Math.sin(angle) * 2.7, "plaster"));
  }
  for (let index = 1; index < 8; index += 1) {
    const mid = ((index + 0.5) / 8) * Math.PI * 2;
    parts.push(box(2.0, 0.5, 0.08, WORLD_COLORS.whitewash, Math.cos(mid) * 2.7, 0.95, Math.sin(mid) * 2.7, -mid + Math.PI / 2, "plaster"));
  }
  parts.push(cone(3.6, 1.5, 8, WORLD_COLORS.coretoGreen, 0, 3.1, 0, "metal"));
  parts.push(post(0.12, 0.12, 0.7, 5, WORLD_COLORS.whitewash, 0, 4.6, 0));
  return merge(parts);
}

/** The lakeside square: paving, bandstand, benches, lamps, hedges, the cafe and the brazier. */
export function createPracaGeometry(): BufferGeometry {
  const parts: BufferGeometry[] = [];
  const pavingTop = 0.28;

  parts.push(post(10.6, 10.9, pavingTop, 32, WORLD_COLORS.paving, 0, 0, 0, "paving"));
  parts.push(post(10.9, 11.0, 0.12, 32, WORLD_COLORS.stoneDark, 0, 0, 0, "stone"));
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

  // Hedges on the lake side only. The two on the east side stood across the shore street
  // once it was widened to two lanes and a pavement - one lay over the zebra crossing.
  for (const index of [1, 2]) {
    const angle = (index / 4) * Math.PI * 2 + Math.PI / 4;
    const radius = 11.6;
    const directionX = -Math.sin(angle);
    const directionZ = Math.cos(angle);
    parts.push(place(createHedgeGeometry(4.4, 0.85), Math.cos(angle) * radius - directionX * 2.2, 0, Math.sin(angle) * radius - directionZ * 2.2, -angle - Math.PI / 2));
  }

  for (let index = 0; index < 4; index += 1) {
    const angle = (index / 4) * Math.PI * 2;
    const x = Math.cos(angle) * 5.2;
    const z = Math.sin(angle) * 5.2;
    parts.push(box(2.4, 0.3, 1.2, WORLD_COLORS.stoneDark, x, pavingTop + 0.15, z, -angle, "stone"));
    parts.push(box(2.2, 0.4, 1.0, WORLD_COLORS.foliageWarm, x, pavingTop + 0.5, z, -angle, "foliage"));
  }

  for (const [x, z, color] of [[-6.2, 5.6, WORLD_COLORS.wine], [-4.2, 7.4, WORLD_COLORS.coretoGreen], [-7.6, 8.0, WORLD_COLORS.lantern]] as const) {
    parts.push(place(createCafeTableGeometry(color), x, pavingTop, z));
  }

  parts.push(box(1.5, 0.9, 0.9, WORLD_COLORS.timber, 3.6, pavingTop + 0.45, 5.4, 0, "planks"));
  parts.push(post(0.55, 0.5, 0.5, 8, WORLD_COLORS.metal, 3.6, pavingTop + 0.9, 5.4, "metal"));
  parts.push(post(0.45, 0.45, 0.12, 8, WORLD_COLORS.emberGlow, 3.6, pavingTop + 1.4, 5.4));
  parts.push(box(0.1, 0.9, 0.9, WORLD_COLORS.tileDark, 4.4, pavingTop + 0.45, 5.4, 0, "metal"));
  parts.push(box(0.1, 0.9, 0.9, WORLD_COLORS.tileDark, 2.8, pavingTop + 0.45, 5.4, 0, "metal"));

  return merge(parts);
}

// ---------------------------------------------------------------------------------
// Capela
// ---------------------------------------------------------------------------------

/** The chapel beside the square, with tower, spire, buttresses, rose window and clock. */
export function createChapelGeometry(): BufferGeometry {
  const width = 7;
  const depth = 10;
  const height = 5.4;
  const frontZ = depth / 2;
  const parts: BufferGeometry[] = [];

  parts.push(box(width, height, depth, WORLD_COLORS.whitewash, 0, height / 2, 0, 0, "plaster"));
  parts.push(box(width + 0.2, 0.4, depth + 0.2, WORLD_COLORS.stoneDark, 0, 0.2, 0, 0, "stone"));
  parts.push(box(width + 0.24, 0.2, depth + 0.24, WORLD_COLORS.whitewash, 0, height - 0.1, 0, 0, "plaster"));

  const roof = createGableRoofGeometry(width * 1.1, depth * 1.08, 2.3);
  roof.translate(0, height, 0);
  parts.push(paint(roof, WORLD_COLORS.slate, "slate"));
  parts.push(box(0.3, 0.2, depth * 1.1, WORLD_COLORS.stoneDark, 0, height + 2.3, 0, 0, "stone"));

  for (const side of [-1, 1]) {
    for (let index = 0; index < 3; index += 1) {
      const z = -depth / 2 + 1.6 + index * 3.2;
      parts.push(box(0.5, height * 0.78, 1.0, WORLD_COLORS.whitewash, side * (width / 2 + 0.25), height * 0.39, z, 0, "plaster"));
    }
    for (let index = 0; index < 2; index += 1) {
      const z = -depth / 2 + 3.2 + index * 3.2;
      const window = arch(0.9, 2.6, 0.12, WORLD_COLORS.frostBlue, 0, 0, 0, "glass");
      window.rotateY((side * Math.PI) / 2);
      window.translate(side * (width / 2 + 0.02), 1.9, z);
      parts.push(window);
    }
  }

  const towerX = -width / 2 + 1.5;
  const towerZ = frontZ - 1.5;
  const towerHeight = 11;
  parts.push(box(3.0, towerHeight, 3.0, WORLD_COLORS.whitewash, towerX, towerHeight / 2, towerZ, 0, "plaster"));
  parts.push(box(3.3, 0.3, 3.3, WORLD_COLORS.stoneDark, towerX, towerHeight - 0.15, towerZ, 0, "stone"));
  parts.push(cone(2.0, 4.0, 8, WORLD_COLORS.slate, towerX, towerHeight, towerZ, "slate"));
  parts.push(box(0.12, 1.4, 0.12, WORLD_COLORS.metal, towerX, towerHeight + 4.6, towerZ, 0, "metal"));
  parts.push(box(0.8, 0.12, 0.12, WORLD_COLORS.metal, towerX, towerHeight + 4.9, towerZ, 0, "metal"));
  for (const side of [0, 1, 2, 3]) {
    const opening = arch(0.8, 1.9, 0.12, WORLD_COLORS.tileDark, 0, towerHeight - 3.2, 1.52);
    opening.rotateY((side * Math.PI) / 2);
    opening.translate(towerX, 0, towerZ);
    parts.push(opening);
  }
  parts.push(pipe(0.75, 0.12, 24, WORLD_COLORS.whitewash, towerX, towerHeight - 5.4, towerZ + 1.53));
  parts.push(box(0.08, 0.5, 0.06, WORLD_COLORS.metal, towerX, towerHeight - 5.2, towerZ + 1.6, 0, "metal"));
  parts.push(box(0.42, 0.08, 0.06, WORLD_COLORS.metal, towerX + 0.16, towerHeight - 5.4, towerZ + 1.6, 0, "metal"));

  parts.push(arch(1.7, 3.2, 0.14, WORLD_COLORS.timberDark, 1.0, 0, frontZ + 0.02, "planks"));
  parts.push(arch(2.1, 3.5, 0.08, WORLD_COLORS.stoneDark, 1.0, 0, frontZ - 0.02, "stone"));
  parts.push(pipe(0.95, 0.14, 24, WORLD_COLORS.frostBlue, 1.0, 4.4, frontZ + 0.02, 0, "glass"));
  parts.push(pipe(1.12, 0.1, 24, WORLD_COLORS.stoneDark, 1.0, 4.4, frontZ - 0.02, 0, "stone"));
  parts.push(box(width * 0.7, 0.2, 1.6, WORLD_COLORS.stone, 1.0, 0.1, frontZ + 0.8, 0, "stone"));
  parts.push(box(width * 0.6, 0.2, 1.0, WORLD_COLORS.stone, 1.0, 0.3, frontZ + 0.5, 0, "stone"));

  return merge(parts);
}

// ---------------------------------------------------------------------------------
// Casario and lakeside houses
// ---------------------------------------------------------------------------------

/** One of the two-storey shops facing the street. */
export function createShopGeometry(variant: 0 | 1 | 2 | 3): BufferGeometry {
  const specs: readonly BuildingSpec[] = [
    { width: 6, depth: 5, height: 3.2, roofHeight: 1.5, wallColor: "#c26a4c", roofColor: WORLD_COLORS.slate, wallSurface: "brick", roofSurface: "slate", stories: 2, windows: true, awning: WORLD_COLORS.coretoGreen, balcony: true, sign: true },
    { width: 6, depth: 5, height: 3.2, roofHeight: 1.6, wallColor: WORLD_COLORS.paleYellow, roofColor: WORLD_COLORS.tile, wallSurface: "plaster", roofSurface: "tiles", stories: 2, windows: true, awning: WORLD_COLORS.ember, sign: true, chimney: true },
    { width: 6, depth: 5, height: 3.2, roofHeight: 1.5, wallColor: WORLD_COLORS.mint, roofColor: WORLD_COLORS.slate, wallSurface: "plaster", roofSurface: "slate", stories: 2, windows: true, awning: WORLD_COLORS.lantern, balcony: true, sign: true },
    { width: 6, depth: 5, height: 3.2, roofHeight: 1.7, wallColor: WORLD_COLORS.timber, roofColor: WORLD_COLORS.tileDark, wallSurface: "planks", roofSurface: "tiles", stories: 2, windows: true, awning: WORLD_COLORS.whitewash, sign: true },
  ];
  return createBuildingGeometry(specs[variant]);
}

const LAKE_HOUSE_SPEC: BuildingSpec = {
  width: 9,
  depth: 6.5,
  height: 3.2,
  roofHeight: 1.6,
  wallColor: WORLD_COLORS.terracotta,
  roofColor: WORLD_COLORS.slateDark,
  wallSurface: "plaster",
  roofSurface: "slate",
  stories: 2,
  windows: true,
  balcony: true,
  chimney: true,
};

/** A big lakeside house, orange render and a dark roof, with its pool. */
export function createLakeHouseGeometry(): BufferGeometry {
  return merge([createBuildingGeometry(LAKE_HOUSE_SPEC), ...pool(8.6, 1.0), ...solarPanels(LAKE_HOUSE_SPEC, 3)]);
}

// ---------------------------------------------------------------------------------
// Galpao do Fogo de Chao
// ---------------------------------------------------------------------------------

const GALPAO_PIT = { x: -2.6, z: 1.4 } as const;

export function createGalpaoGeometry(): BufferGeometry {
  const width = 13;
  const depth = 9;
  const height = 3.9;
  const floorTop = 0.26;
  const parts: BufferGeometry[] = [];

  parts.push(box(width + 1, floorTop, depth + 1, WORLD_COLORS.stone, 0, floorTop / 2, 0, 0, "stone"));
  for (const x of [-width / 2 + 0.5, 0, width / 2 - 0.5]) {
    for (const z of [-depth / 2 + 0.5, depth / 2 - 0.5]) {
      parts.push(post(0.17, 0.2, height, 6, WORLD_COLORS.timber, x, floorTop, z, "planks"));
    }
  }
  const roof = createGableRoofGeometry(width * 1.15, depth * 1.15, 2.7);
  roof.translate(0, floorTop + height, 0);
  parts.push(paint(roof, WORLD_COLORS.slate, "slate"));
  parts.push(box(width * 1.15, 0.22, depth * 1.15, WORLD_COLORS.timberDark, 0, floorTop + height - 0.11, 0, 0, "planks"));
  parts.push(box(0.3, 0.2, depth * 1.17, WORLD_COLORS.tileDark, 0, floorTop + height + 2.7, 0, 0, "metal"));
  parts.push(box(width, 1.4, 0.3, WORLD_COLORS.timberDark, 0, floorTop + 0.7, -depth / 2 + 0.5, 0, "planks"));
  parts.push(box(0.3, 1.0, depth * 0.55, WORLD_COLORS.timberDark, -width / 2 + 0.5, floorTop + 0.5, -depth * 0.2, 0, "planks"));
  parts.push(box(0.3, 1.0, depth * 0.55, WORLD_COLORS.timberDark, width / 2 - 0.5, floorTop + 0.5, -depth * 0.2, 0, "planks"));
  parts.push(...firePit(GALPAO_PIT.x, floorTop, GALPAO_PIT.z, 1.7));
  for (let index = 0; index < 5; index += 1) {
    const angle = (index / 5) * Math.PI * 2 + 0.3;
    const baseX = GALPAO_PIT.x + Math.cos(angle) * 2.1;
    const baseZ = GALPAO_PIT.z - Math.sin(angle) * 2.1;
    const tilt = 0.95;
    const length = 2.8;
    parts.push(leaningPost(0.05, length, WORLD_COLORS.metal, baseX, floorTop, baseZ, angle + Math.PI, tilt, "metal"));
    const along = length * 0.66;
    parts.push(box(0.55, 0.26, 0.95, WORLD_COLORS.tileDark, baseX - Math.cos(angle) * along * Math.sin(tilt), floorTop + along * Math.cos(tilt), baseZ + Math.sin(angle) * along * Math.sin(tilt), -angle));
  }
  parts.push(box(4.2, 0.1, 1.2, WORLD_COLORS.timber, 3.2, floorTop + 0.95, -1.2, 0, "planks"));
  for (const [x, z] of [[1.4, -1.6], [5.0, -1.6], [1.4, -0.8], [5.0, -0.8]] as const) {
    parts.push(post(0.07, 0.07, 0.9, 4, WORLD_COLORS.timberDark, x, floorTop, z, "planks"));
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

export function createMiranteGeometry(): BufferGeometry {
  const parts: BufferGeometry[] = [];
  const top = 0.66;
  parts.push(box(8, 0.6, 6, WORLD_COLORS.stoneDark, 0, 0.3, 0, 0, "stone"));
  parts.push(box(7.6, 0.12, 5.6, WORLD_COLORS.stone, 0, top - 0.06, 0, 0, "paving"));
  for (const x of [-3.6, -1.8, 0, 1.8, 3.6]) {
    parts.push(post(0.08, 0.1, 1.1, 4, WORLD_COLORS.timberDark, x, top, -2.7, "planks"));
  }
  parts.push(box(7.6, 0.1, 0.1, WORLD_COLORS.timber, 0, top + 1.05, -2.7, 0, "planks"));
  parts.push(box(7.6, 0.08, 0.08, WORLD_COLORS.timber, 0, top + 0.6, -2.7, 0, "planks"));
  for (const side of [-1, 1]) {
    for (const z of [-2.7, -1.2, 0.3]) {
      parts.push(post(0.08, 0.1, 1.1, 4, WORLD_COLORS.timberDark, side * 3.6, top, z, "planks"));
    }
    parts.push(box(0.1, 0.1, 3.2, WORLD_COLORS.timber, side * 3.6, top + 1.05, -1.2, 0, "planks"));
  }
  parts.push(place(createBenchGeometry(), 1.4, top, 1.6, Math.PI));
  parts.push(post(0.07, 0.09, 1.9, 4, WORLD_COLORS.timberDark, -2.8, top, 1.9, "planks"));
  parts.push(box(1.2, 0.5, 0.06, WORLD_COLORS.whitewash, -2.8, top + 2.1, 1.9, 0, "planks"));
  parts.push(post(0.06, 0.08, 4.4, 5, WORLD_COLORS.metal, 3.2, top, 2.3, "metal"));
  parts.push(box(1.3, 0.75, 0.05, WORLD_COLORS.wine, 3.2 + 0.68, top + 4.0, 2.3));
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
  roofColor: WORLD_COLORS.wine,
  wallSurface: "stone",
  roofSurface: "slate",
  chimney: true,
  windows: true,
};

export function createVinicolaGeometry(): BufferGeometry {
  const parts: BufferGeometry[] = [createBuildingGeometry(WINERY_SPEC)];
  for (let index = 0; index < 3; index += 1) {
    parts.push(pipe(0.45, 0.95, 10, WORLD_COLORS.timberDark, 5.6, 0.45, 0.6 + index * 1.05, Math.PI / 2, "planks"));
    parts.push(box(0.98, 0.08, 0.92, WORLD_COLORS.metal, 5.6, 0.45, 0.6 + index * 1.05, 0, "metal"));
  }
  for (const x of [-1.5, 1.5]) {
    parts.push(post(0.1, 0.12, 2.6, 4, WORLD_COLORS.vinePost, x, 0, 4.6, "planks"));
  }
  parts.push(box(3.4, 0.12, 0.12, WORLD_COLORS.vinePost, 0, 2.6, 4.6, 0, "planks"));
  parts.push(blob(0.7, WORLD_COLORS.vine, -1.1, 2.75, 4.6, 0.55, 1, "foliage"));
  parts.push(blob(0.7, WORLD_COLORS.vine, 1.1, 2.75, 4.6, 0.55, 1, "foliage"));
  parts.push(post(0.07, 0.09, 1.7, 4, WORLD_COLORS.timberDark, -5.2, 0, 3.4, "planks"));
  parts.push(box(1.3, 0.55, 0.06, WORLD_COLORS.whitewash, -5.2, 1.85, 3.4, 0, "planks"));
  return merge(parts);
}

export function createVineRowGeometry(length = 4.5): BufferGeometry {
  const parts: BufferGeometry[] = [];
  for (const x of [0, length / 2, length]) {
    parts.push(post(0.07, 0.09, 1.5, 4, WORLD_COLORS.vinePost, x, 0, 0, "planks"));
  }
  parts.push(box(length, 0.04, 0.04, WORLD_COLORS.metal, length / 2, 1.4, 0, 0, "metal"));
  parts.push(box(length, 0.85, 0.5, WORLD_COLORS.vine, length / 2, 0.95, 0, 0, "foliage"));
  for (let x = 0.5; x < length; x += 1.1) {
    parts.push(blob(0.4, WORLD_COLORS.vine, x, 1.35, x % 2.2 > 1.1 ? 0.12 : -0.12, 0.7, 1, "foliage"));
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
  roofColor: WORLD_COLORS.frostBlue,
  wallSurface: "plaster",
  roofSurface: "tiles",
  veranda: true,
  windows: true,
};

const CTG_PIT = { x: -5.2, z: 6.2 } as const;

export function createCtgGeometry(): BufferGeometry {
  const parts: BufferGeometry[] = [createBuildingGeometry(CTG_HALL_SPEC)];
  const gateZ = 9.4;
  for (const x of [-1.7, 1.7]) {
    parts.push(post(0.2, 0.24, 4.2, 6, WORLD_COLORS.timberDark, x, 0, gateZ, "planks"));
  }
  parts.push(box(4.2, 0.36, 0.36, WORLD_COLORS.timberDark, 0, 4.1, gateZ, 0, "planks"));
  parts.push(box(0.05, 0.5, 0.05, WORLD_COLORS.metal, 0, 3.65, gateZ, 0, "metal"));
  parts.push(box(0.42, 0.52, 0.42, WORLD_COLORS.lantern, 0, 3.2, gateZ, 0, "glass"));
  parts.push(cone(0.36, 0.22, 4, WORLD_COLORS.metal, 0, 3.46, gateZ, "metal"));
  parts.push(place(createFenceGeometry(7), 1.7, 0, gateZ));
  parts.push(place(createFenceGeometry(7), -8.7, 0, gateZ));
  parts.push(post(0.09, 0.11, 1.2, 4, WORLD_COLORS.timberDark, 4.6, 0, 5.2, "planks"));
  parts.push(post(0.09, 0.11, 1.2, 4, WORLD_COLORS.timberDark, 6.4, 0, 5.2, "planks"));
  parts.push(box(2.0, 0.1, 0.1, WORLD_COLORS.timber, 5.5, 1.15, 5.2, 0, "planks"));
  parts.push(...firePit(CTG_PIT.x, 0, CTG_PIT.z, 1.2));
  for (let index = 0; index < 3; index += 1) {
    const angle = (index / 3) * Math.PI * 2;
    parts.push(leaningPost(0.05, 2.4, WORLD_COLORS.metal, CTG_PIT.x + Math.cos(angle) * 1.0, 0, CTG_PIT.z - Math.sin(angle) * 1.0, angle + Math.PI, 0.42, "metal"));
  }
  parts.push(blob(0.36, WORLD_COLORS.metal, CTG_PIT.x, 1.15, CTG_PIT.z, 0.9, 0, "metal"));
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
  wallColor: WORLD_COLORS.paleYellow,
  roofColor: WORLD_COLORS.tile,
  wallSurface: "plaster",
  roofSurface: "tiles",
  veranda: true,
  windows: true,
};

export function createEstacaoGeometry(): BufferGeometry {
  const parts: BufferGeometry[] = [];
  const platformTop = 0.5;
  parts.push(box(22, platformTop, 3.2, WORLD_COLORS.stone, 0, platformTop / 2, -4.2, 0, "paving"));
  parts.push(box(22.2, 0.12, 0.3, WORLD_COLORS.stoneDark, 0, platformTop - 0.06, -5.7, 0, "stone"));
  parts.push(place(createBuildingGeometry(STATION_SPEC), 0, platformTop, 0, Math.PI));
  for (let index = 0; index < 6; index += 1) {
    parts.push(post(0.1, 0.1, 3.2, 6, WORLD_COLORS.timberDark, -9.5 + index * 3.8, platformTop, -5.2, "metal"));
  }
  parts.push(box(21.5, 0.14, 3.6, WORLD_COLORS.tileDark, 0, platformTop + 3.25, -4.3, 0, "metal"));
  parts.push(post(0.08, 0.1, 4.6, 5, WORLD_COLORS.metal, 12.4, 0, -6.4, "metal"));
  parts.push(box(1.4, 0.26, 0.08, WORLD_COLORS.ember, 13.0, 4.3, -6.4));
  parts.push(box(0.3, 0.3, 0.08, WORLD_COLORS.whitewash, 13.6, 4.3, -6.4));
  for (const [x, z] of [[-13.4, -3.6], [-12.2, -3.6], [-13.4, -4.8], [-12.2, -4.8]] as const) {
    parts.push(post(0.09, 0.11, 3.2, 4, WORLD_COLORS.timberDark, x, 0, z, "planks"));
  }
  parts.push(post(1.1, 1.05, 2.2, 10, WORLD_COLORS.timberDark, -12.8, 3.2, -4.2, "planks"));
  parts.push(cone(1.25, 0.6, 10, WORLD_COLORS.tileDark, -12.8, 5.4, -4.2, "metal"));
  for (const [x, z, size] of [[-6.4, -3.6, 0.7], [-5.6, -3.6, 0.7], [-6.0, -3.6, 0.7]] as const) {
    parts.push(box(size, size, size, WORLD_COLORS.timber, x, platformTop + size / 2 + (x === -6.0 ? size : 0), z, 0, "planks"));
  }
  parts.push(box(2.2, 0.08, 0.9, WORLD_COLORS.timber, 6.2, platformTop + 0.95, -3.4, 0, "planks"));
  parts.push(post(0.06, 0.06, 0.9, 4, WORLD_COLORS.timberDark, 5.3, platformTop, -3.4, "planks"));
  parts.push(post(0.06, 0.06, 0.9, 4, WORLD_COLORS.timberDark, 7.1, platformTop, -3.4, "planks"));
  parts.push(box(2.4, 0.06, 1.2, WORLD_COLORS.ember, 6.2, platformTop + 2.2, -3.4));
  parts.push(post(0.05, 0.05, 2.2, 4, WORLD_COLORS.timberDark, 5.1, platformTop, -2.9, "planks"));
  parts.push(post(0.05, 0.05, 2.2, 4, WORLD_COLORS.timberDark, 7.3, platformTop, -2.9, "planks"));
  parts.push(place(createBenchGeometry(), -2.2, platformTop, -3.2, Math.PI));
  parts.push(place(createLamppostGeometry(), 9.6, platformTop, -3.0));
  return merge(parts);
}

// ---------------------------------------------------------------------------------
// Pousada da Geada
// ---------------------------------------------------------------------------------

const INN_SPEC: BuildingSpec = {
  width: 10,
  depth: 6.5,
  height: 3.4,
  roofHeight: 1.8,
  wallColor: WORLD_COLORS.terracotta,
  roofColor: WORLD_COLORS.slateDark,
  wallSurface: "plaster",
  roofSurface: "slate",
  stories: 2,
  chimney: true,
  veranda: true,
  windows: true,
  balcony: true,
};

/** The lakeside inn: two storeys, a pool, solar panels, the well and a lawn bench. */
export function createPousadaGeometry(): BufferGeometry {
  const parts: BufferGeometry[] = [createBuildingGeometry(INN_SPEC)];
  parts.push(...pool(9.5, -1.0, 5.6, 3.4));
  parts.push(...solarPanels(INN_SPEC, 4));
  parts.push(post(0.9, 0.95, 1.0, 8, WORLD_COLORS.stone, -8.4, 0, 3.2, "stone"));
  parts.push(post(0.07, 0.07, 2.0, 4, WORLD_COLORS.timberDark, -9.2, 1.0, 3.2, "planks"));
  parts.push(post(0.07, 0.07, 2.0, 4, WORLD_COLORS.timberDark, -7.6, 1.0, 3.2, "planks"));
  parts.push(cone(1.25, 0.7, 4, WORLD_COLORS.tile, -8.4, 3.0, 3.2, "tiles"));
  parts.push(place(createWoodpileGeometry(), -8.6, 0, -2.4, 0));
  parts.push(place(createBenchGeometry(), -3.6, 0, 6.2, 0));
  parts.push(place(createFenceGeometry(8), 3, 0, 7.4));
  return merge(parts);
}

// ---------------------------------------------------------------------------------
// Bosque das Araucarias
// ---------------------------------------------------------------------------------

export function createBosqueSignGeometry(): BufferGeometry {
  return merge([
    post(0.08, 0.1, 2.1, 4, WORLD_COLORS.timberDark, 0, 0, 0, "planks"),
    box(1.4, 0.6, 0.07, WORLD_COLORS.whitewash, 0, 2.2, 0, 0, "planks"),
    box(0.9, 0.35, 0.07, WORLD_COLORS.whitewash, 0.1, 1.55, 0.02, 0.08, "planks"),
    blob(0.28, WORLD_COLORS.timber, 0.9, 0.2, 0.6, 1.2, 0, "bark"),
    blob(0.24, WORLD_COLORS.timber, -0.7, 0.18, 0.4, 1.2, 0, "bark"),
  ]);
}

// ---------------------------------------------------------------------------------
// Salto do Rio Caveiras - the dam, the falls and the usina
// ---------------------------------------------------------------------------------

/** The composite's origin: the usina's yard, on the south bank below the dam. */
export const SALTO_ORIGIN = { x: 118, z: -96 } as const;

const USINA_SPEC: BuildingSpec = {
  width: 8,
  depth: 6,
  height: 3.6,
  roofHeight: 1.9,
  wallColor: "#b8664a",
  roofColor: WORLD_COLORS.tile,
  wallSurface: "brick",
  roofSurface: "tiles",
  stories: 2,
  windows: false,
};

/** The dam's crest, where the water spills. */
const DAM = { x: LAKE.dam.x, z: LAKE.dam.z, spillwayHalfDepth: 5, abutmentDepth: 4 } as const;

/**
 * The dam across the channel with its spillway and abutments, the penstock down to the
 * brick powerhouse, the transformer yard, the lookout deck on the far bank with the
 * footbridge railings, and picnic tables under the trees.
 */
export function createSaltoGeometry(): BufferGeometry {
  const originY = terrainHeightAt(SALTO_ORIGIN.x, SALTO_ORIGIN.z);
  const local = (x: number, z: number): readonly [number, number, number] => [
    x - SALTO_ORIGIN.x,
    terrainHeightAt(x, z) - originY,
    z - SALTO_ORIGIN.z,
  ];
  const parts: BufferGeometry[] = [];

  // The usina, facing the yard.
  const [usinaX, usinaY, usinaZ] = local(118, -90);
  parts.push(place(createBuildingGeometry(USINA_SPEC), usinaX, usinaY, usinaZ));
  for (let index = 0; index < 3; index += 1) {
    const x = usinaX - 2.6 + index * 2.6;
    parts.push(arch(1.1, 4.6, 0.14, WORLD_COLORS.frostBlue, x, usinaY + 1.0, usinaZ + 3.04, "glass"));
    parts.push(arch(1.4, 4.9, 0.08, WORLD_COLORS.stoneDark, x, usinaY + 0.85, usinaZ + 3.0, "stone"));
  }
  parts.push(box(5.2, 0.7, 0.1, WORLD_COLORS.whitewash, usinaX, usinaY + 6.5, usinaZ + 3.06));

  // The dam: a wall the height of the drop, low in the middle where the water spills.
  const wallBottom = RIVER.floor - 1 - originY;
  const spillTop = LAKE.level - 0.2 - originY;
  const abutmentTop = LAKE.level + 1.0 - originY;
  const [damX, , damZ] = local(DAM.x, DAM.z);
  parts.push(box(3.4, spillTop - wallBottom, DAM.spillwayHalfDepth * 2, WORLD_COLORS.stoneDark, damX, (spillTop + wallBottom) / 2, damZ, 0, "stone"));
  for (const side of [-1, 1]) {
    const z = damZ + side * (DAM.spillwayHalfDepth + DAM.abutmentDepth / 2);
    parts.push(box(3.4, abutmentTop - wallBottom, DAM.abutmentDepth, WORLD_COLORS.stone, damX, (abutmentTop + wallBottom) / 2, z, 0, "stone"));
    parts.push(box(3.8, 0.3, DAM.abutmentDepth + 0.3, WORLD_COLORS.stoneDark, damX, abutmentTop + 0.15, z, 0, "stone"));
  }

  // The penstock from the south abutment down to the powerhouse.
  const penstockTopZ = damZ + DAM.spillwayHalfDepth + DAM.abutmentDepth / 2;
  parts.push(box(1.8, 1.4, 1.8, WORLD_COLORS.stoneDark, damX, abutmentTop + 1.0, penstockTopZ, 0, "stone"));
  parts.push(pipeBetween(usinaX - 3.2, usinaY + 3.4, usinaZ - 2.2, damX, abutmentTop + 1.4, penstockTopZ, 0.5, WORLD_COLORS.metal));
  parts.push(box(1.2, 1.2, 1.2, WORLD_COLORS.metal, usinaX - 3.2, usinaY + 3.0, usinaZ - 2.2, 0, "metal"));

  // The transformer yard.
  const [yardX, yardY, yardZ] = local(110, -86);
  parts.push(place(createFenceGeometry(6), yardX - 3, yardY, yardZ - 3));
  parts.push(place(createFenceGeometry(6), yardX - 3, yardY, yardZ + 3));
  for (const dx of [-1.5, 0, 1.5]) {
    parts.push(box(0.9, 1.6, 0.9, WORLD_COLORS.metal, yardX + dx, yardY + 0.8, yardZ, 0, "metal"));
    parts.push(post(0.06, 0.06, 2.6, 4, WORLD_COLORS.metal, yardX + dx, yardY, yardZ + 0.6, "metal"));
  }

  // The lookout deck on the north bank, railed toward the falls.
  const [deckX, deckY, deckZ] = local(134, -98);
  parts.push(box(7, 0.4, 5, WORLD_COLORS.timber, deckX, deckY + 0.5, deckZ, 0, "planks"));
  for (const [dx, dz] of [[-3.2, -2.2], [3.2, -2.2], [-3.2, 2.2], [3.2, 2.2]] as const) {
    parts.push(post(0.14, 0.16, 0.7, 5, WORLD_COLORS.timberDark, deckX + dx, deckY, deckZ + dz, "planks"));
  }
  for (const dx of [-3.4, -2.2, -1.0, 0.2, 1.4, 2.6, 3.4]) {
    parts.push(post(0.08, 0.1, 1.1, 4, WORLD_COLORS.timberDark, deckX + dx, deckY + 0.7, deckZ + 2.4, "planks"));
  }
  parts.push(box(7.0, 0.1, 0.1, WORLD_COLORS.timber, deckX, deckY + 1.75, deckZ + 2.4, 0, "planks"));
  parts.push(box(7.0, 0.08, 0.08, WORLD_COLORS.timber, deckX, deckY + 1.3, deckZ + 2.4, 0, "planks"));
  parts.push(place(createBenchGeometry(), deckX - 1.4, deckY + 0.7, deckZ - 0.2, 0));
  parts.push(post(0.07, 0.09, 1.9, 4, WORLD_COLORS.timberDark, deckX + 3.0, deckY, deckZ - 3.2, "planks"));
  parts.push(box(1.4, 0.6, 0.06, WORLD_COLORS.whitewash, deckX + 3.0, deckY + 2.1, deckZ - 3.2, 0, "planks"));

  // Picnic tables.
  for (const [x, z, rotation] of [[138, -104, 0.3], [132, -106, -0.4], [142, -94, 1.2]] as const) {
    const [px, py, pz] = local(x, z);
    parts.push(place(createPicnicTableGeometry(), px, py, pz, rotation));
  }

  // Railings along the footbridge.
  const deckHeight = (z: number): number => Math.max(terrainHeightAt(128, z), 1.5 + 0.6) - originY;
  for (const side of [-1, 1]) {
    for (let z = -110; z <= -96; z += 2.3) {
      const [bx, , bz] = local(128, z);
      parts.push(post(0.06, 0.07, 1.0, 4, WORLD_COLORS.timberDark, bx + side * 1.0, deckHeight(z) + 0.22, bz, "planks"));
    }
    const [railX, , railZ] = local(128, -103);
    parts.push(box(0.08, 0.08, 14.4, WORLD_COLORS.timber, railX + side * 1.0, deckHeight(-103) + 1.16, railZ, 0, "planks"));
  }

  return merge(parts);
}

// ---------------------------------------------------------------------------------
// Smoke and spray
// ---------------------------------------------------------------------------------

export interface SmokeSource {
  readonly x: number;
  readonly z: number;
  readonly heightAboveGround: number;
  readonly intensity: number;
}

const [innChimneyX, innChimneyTop, innChimneyZ] = chimneyTopFor(INN_SPEC);
const [wineryChimneyX, wineryChimneyTop, wineryChimneyZ] = chimneyTopFor(WINERY_SPEC);

/** Every chimney and fire in the neighbourhood, plus the spray at the foot of the falls. */
export const SMOKE_SOURCES: readonly SmokeSource[] = [
  { x: 32 + innChimneyX, z: 62 + innChimneyZ, heightAboveGround: innChimneyTop, intensity: 0.8 },
  { x: 116 + wineryChimneyX, z: -18 + wineryChimneyZ, heightAboveGround: wineryChimneyTop, intensity: 0.6 },
  { x: 92 + GALPAO_PIT.x, z: 30 + GALPAO_PIT.z, heightAboveGround: 0.9, intensity: 1.3 },
  { x: 104 + CTG_PIT.x, z: 66 + CTG_PIT.z, heightAboveGround: 0.8, intensity: 0.9 },
  { x: 121, z: -100, heightAboveGround: RIVER.level + 1.4 - terrainHeightAt(121, -100), intensity: 1.5 },
  { x: 124, z: -97, heightAboveGround: RIVER.level + 1.4 - terrainHeightAt(124, -97), intensity: 1.3 },
];
