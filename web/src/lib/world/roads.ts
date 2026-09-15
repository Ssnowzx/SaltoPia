import { BufferGeometry, CatmullRomCurve3, Color, Float32BufferAttribute, PlaneGeometry, Vector3 } from "three";

import { blob, merge } from "./builders";
import { BRIDGE_DECK_HEIGHT, LAKE, RAIL, RIVER, ROAD, WORLD_COLORS } from "./constants";
import { RIVER_COURSE, lakeDistance, riverDistance, riverSurfaceHeightAt, terrainHeightAt } from "./terrain";
import { SURFACE, type SurfaceKey } from "./textures";

/**
 * Streets, tracks and water - everything that is a ribbon draped over the terrain, plus
 * the lake surface.
 *
 * The network follows the east shore the way the road does in the reference
 * photograph: one road runs the length of the community a little inland, a lower street
 * serves the lakefront resort and its car park, and each landmark has its own driveway
 * ending in a yard. No road passes through a building.
 */

export type Waypoint = readonly [number, number];

/** Whether a point sits on a bridge deck over the river below the dam. */
export function isOnBridge(x: number, z: number): boolean {
  return x > LAKE.dam.x && riverDistance(x, z) < RIVER.halfWidth + 3;
}

export function surfaceHeightAt(x: number, z: number): number {
  const ground = terrainHeightAt(x, z);
  return isOnBridge(x, z) ? Math.max(ground, BRIDGE_DECK_HEIGHT) : ground;
}

// ---------------------------------------------------------------------------------
// The network
// ---------------------------------------------------------------------------------

/** The road along the community, a little inland of the shore. */
export const MAIN_ROAD: readonly Waypoint[] = [
  [48, 150],
  [52, 116],
  [58, 86],
  [66, 56],
  [74, 26],
  [82, -6],
  [86, -38],
  [82, -68],
  [70, -94],
  [52, -112],
];

/** The lakefront street: past the resort, its car park and the square. */
export const SHORE_STREET: readonly Waypoint[] = [
  [52, 116],
  [40, 98],
  [34, 76],
  [40, 52],
  [52, 30],
  [62, 12],
  [66, -8],
  [82, -6],
];

/** The road in from the south-east. */
export const ENTRY_ROAD: readonly Waypoint[] = [
  [48, 150],
  [72, 168],
  [104, 182],
];

export interface Driveway {
  readonly points: readonly Waypoint[];
  readonly width: number;
  readonly surface: "street" | "track";
  readonly yard: Waypoint;
  readonly yardRadius: number;
}

export const DRIVEWAYS: readonly Driveway[] = [
  // The resort on the lakefront.
  { points: [[34, 76], [26, 70]], width: ROAD.drivewayWidth, surface: "street", yard: [24, 66], yardRadius: 5 },
  // The shops.
  { points: [[58, 86], [64, 72]], width: ROAD.drivewayWidth, surface: "street", yard: [64, 68], yardRadius: 4 },
  // Galpao do Fogo de Chao.
  { points: [[74, 26], [88, 32]], width: ROAD.drivewayWidth, surface: "track", yard: [91, 33], yardRadius: 4 },
  // CTG Porteira do Tropeiro.
  { points: [[58, 86], [88, 76], [100, 72]], width: ROAD.drivewayWidth, surface: "track", yard: [102, 71], yardRadius: 3.5 },
  // Estacao Velha.
  { points: [[48, 150], [90, 130], [122, 106]], width: ROAD.drivewayWidth, surface: "street", yard: [124, 102], yardRadius: 4 },
  // Vinicola de Altitude.
  { points: [[86, -38], [104, -28], [114, -22]], width: ROAD.drivewayWidth, surface: "track", yard: [115, -21], yardRadius: 3.5 },
  // The dam and the usina.
  { points: [[82, -68], [100, -82], [114, -92]], width: ROAD.drivewayWidth, surface: "track", yard: [116, -93], yardRadius: 3.5 },
];

/** Paved paths around the square. */
export const PATHS: readonly (readonly Waypoint[])[] = [
  [[54, 16], [62, 12]],
  [[54, -4], [66, -8]],
];

/** The footbridge below the dam. */
export const FOOTBRIDGE: readonly Waypoint[] = [
  [122, -110],
  [128, -104],
  [134, -98],
];

/** The railway, along the south-east edge past the station. */
export const RAIL_LINE: readonly Waypoint[] = [
  [-40, 196],
  [30, 186],
  [90, 168],
  [126, 146],
  [160, 118],
];

export interface ParkingLot {
  readonly x: number;
  readonly z: number;
  readonly width: number;
  readonly depth: number;
  readonly rotationY: number;
}

/** Car parks: a paved rectangle, with cars placed by the layout. */
export const PARKING_LOTS: readonly ParkingLot[] = [
  { x: 42, z: 72, width: 16, depth: 11, rotationY: -0.35 },
  { x: 70, z: 62, width: 12, depth: 8, rotationY: -0.3 },
  { x: 124, z: 100, width: 10, depth: 7, rotationY: 0.4 },
];

export const ROAD_POLYLINES: ReadonlyArray<{ readonly points: readonly Waypoint[]; readonly closed: boolean; readonly width: number }> = [
  { points: MAIN_ROAD, closed: false, width: ROAD.streetWidth + ROAD.kerbExtra },
  { points: SHORE_STREET, closed: false, width: ROAD.streetWidth + ROAD.kerbExtra },
  { points: ENTRY_ROAD, closed: false, width: ROAD.streetWidth + ROAD.kerbExtra },
  ...DRIVEWAYS.map((driveway) => ({ points: driveway.points, closed: false, width: driveway.width })),
  { points: FOOTBRIDGE, closed: false, width: 2.2 },
  ...PATHS.map((points) => ({ points, closed: false, width: ROAD.pathWidth })),
];

export const YARDS: ReadonlyArray<{ readonly x: number; readonly z: number; readonly radius: number }> = [
  ...DRIVEWAYS.map((driveway) => ({ x: driveway.yard[0], z: driveway.yard[1], radius: driveway.yardRadius })),
  ...PARKING_LOTS.map((lot) => ({ x: lot.x, z: lot.z, radius: Math.max(lot.width, lot.depth) / 2 })),
];

export function createCurve(points: readonly Waypoint[], closed: boolean): CatmullRomCurve3 {
  return new CatmullRomCurve3(
    points.map(([x, z]) => new Vector3(x, 0, z)),
    closed,
    "centripetal",
  );
}

// ---------------------------------------------------------------------------------
// Ribbon geometry
// ---------------------------------------------------------------------------------

interface Sink {
  readonly positions: number[];
  readonly colors: number[];
  readonly surfaces: number[];
  readonly depths: number[];
  readonly foams: number[];
}

function createSink(): Sink {
  return { positions: [], colors: [], surfaces: [], depths: [], foams: [] };
}

interface RibbonOptions {
  readonly width: number | ((x: number, z: number) => number);
  readonly lift: number;
  readonly lateralOffset?: number;
  readonly heightAt?: (x: number, z: number) => number;
  readonly colorAt: (x: number, z: number, lateral: number) => Color;
  readonly surfaceAt: (x: number, z: number) => SurfaceKey;
  readonly foamAt?: (x: number, z: number) => number;
  readonly depth?: number;
  readonly step?: number;
  readonly lanes?: number;
}

function pushVertex(sink: Sink, x: number, y: number, z: number, color: Color, surface: SurfaceKey, depth: number, foam: number): void {
  sink.positions.push(x, y, z);
  sink.colors.push(color.r, color.g, color.b);
  sink.surfaces.push(SURFACE[surface]);
  sink.depths.push(depth);
  sink.foams.push(foam);
}

/**
 * Appends a draped ribbon along a curve. Each quad is wound (left0, right0, left1),
 * (right0, right1, left1), which gives a +Y face normal whichever way the curve runs.
 */
function appendRibbon(curve: CatmullRomCurve3, options: RibbonOptions, sink: Sink): void {
  const length = curve.getLength();
  const divisions = Math.max(4, Math.ceil(length / (options.step ?? 1.2)));
  const samples = curve.getSpacedPoints(divisions);
  const offset = options.lateralOffset ?? 0;
  const lanes = options.lanes ?? 1;
  const depth = options.depth ?? 0;

  const widthAt = (x: number, z: number): number => (typeof options.width === "number" ? options.width : options.width(x, z));
  const surface = (x: number, z: number): number =>
    options.heightAt ? options.heightAt(x, z) + options.lift : surfaceHeightAt(x, z) + options.lift;
  const foamAt = options.foamAt ?? (() => 0);

  for (let index = 0; index < samples.length - 1; index += 1) {
    const current = samples[index];
    const next = samples[index + 1];
    const tangentX = next.x - current.x;
    const tangentZ = next.z - current.z;
    const magnitude = Math.hypot(tangentX, tangentZ) || 1;
    const perpX = tangentZ / magnitude;
    const perpZ = -tangentX / magnitude;

    const centre0 = [current.x + perpX * offset, current.z + perpZ * offset] as const;
    const centre1 = [next.x + perpX * offset, next.z + perpZ * offset] as const;
    const half0 = widthAt(current.x, current.z) / 2;
    const half1 = widthAt(next.x, next.z) / 2;

    for (let lane = 0; lane < lanes; lane += 1) {
      const a = -1 + (2 * lane) / lanes;
      const b = -1 + (2 * (lane + 1)) / lanes;

      const left0 = [centre0[0] + perpX * half0 * -a, centre0[1] + perpZ * half0 * -a] as const;
      const right0 = [centre0[0] + perpX * half0 * -b, centre0[1] + perpZ * half0 * -b] as const;
      const left1 = [centre1[0] + perpX * half1 * -a, centre1[1] + perpZ * half1 * -a] as const;
      const right1 = [centre1[0] + perpX * half1 * -b, centre1[1] + perpZ * half1 * -b] as const;

      const mid = (a + b) / 2;
      const color0 = options.colorAt(centre0[0], centre0[1], mid);
      const color1 = options.colorAt(centre1[0], centre1[1], mid);
      const surface0 = options.surfaceAt(centre0[0], centre0[1]);
      const surface1 = options.surfaceAt(centre1[0], centre1[1]);
      const foam0 = foamAt(centre0[0], centre0[1]);
      const foam1 = foamAt(centre1[0], centre1[1]);

      pushVertex(sink, left0[0], surface(left0[0], left0[1]), left0[1], color0, surface0, depth, foam0);
      pushVertex(sink, right0[0], surface(right0[0], right0[1]), right0[1], color0, surface0, depth, foam0);
      pushVertex(sink, left1[0], surface(left1[0], left1[1]), left1[1], color1, surface1, depth, foam1);

      pushVertex(sink, right0[0], surface(right0[0], right0[1]), right0[1], color0, surface0, depth, foam0);
      pushVertex(sink, right1[0], surface(right1[0], right1[1]), right1[1], color1, surface1, depth, foam1);
      pushVertex(sink, left1[0], surface(left1[0], left1[1]), left1[1], color1, surface1, depth, foam1);
    }
  }
}

function appendDisc(x: number, z: number, radius: number, lift: number, color: Color, surface: SurfaceKey, sink: Sink): void {
  const segments = 20;
  const centreY = surfaceHeightAt(x, z) + lift;

  for (let index = 0; index < segments; index += 1) {
    const a0 = (index / segments) * Math.PI * 2;
    const a1 = ((index + 1) / segments) * Math.PI * 2;
    const x0 = x + Math.cos(a0) * radius;
    const z0 = z + Math.sin(a0) * radius;
    const x1 = x + Math.cos(a1) * radius;
    const z1 = z + Math.sin(a1) * radius;

    pushVertex(sink, x, centreY, z, color, surface, 0, 0);
    pushVertex(sink, x1, surfaceHeightAt(x1, z1) + lift, z1, color, surface, 0, 0);
    pushVertex(sink, x0, surfaceHeightAt(x0, z0) + lift, z0, color, surface, 0, 0);
  }
}

function appendRectangle(lot: ParkingLot, lift: number, color: Color, surface: SurfaceKey, sink: Sink): void {
  const cos = Math.cos(lot.rotationY);
  const sin = Math.sin(lot.rotationY);
  const corner = (u: number, v: number): readonly [number, number] => [lot.x + u * cos + v * sin, lot.z - u * sin + v * cos];
  const cells = 5;

  for (let i = 0; i < cells; i += 1) {
    for (let j = 0; j < cells; j += 1) {
      const u0 = -lot.width / 2 + (i / cells) * lot.width;
      const u1 = -lot.width / 2 + ((i + 1) / cells) * lot.width;
      const v0 = -lot.depth / 2 + (j / cells) * lot.depth;
      const v1 = -lot.depth / 2 + ((j + 1) / cells) * lot.depth;
      const a = corner(u0, v0);
      const b = corner(u1, v0);
      const c = corner(u1, v1);
      const d = corner(u0, v1);
      for (const [px, pz] of [a, b, d, b, c, d]) {
        pushVertex(sink, px, surfaceHeightAt(px, pz) + lift, pz, color, surface, 0, 0);
      }
    }
  }
}

function appendSleepers(curve: CatmullRomCurve3, spacing: number, width: number, lift: number, color: Color, sink: Sink): void {
  const length = curve.getLength();
  const count = Math.floor(length / spacing);

  for (let index = 0; index < count; index += 1) {
    const t = (index + 0.5) / count;
    const point = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t);
    const perpX = tangent.z;
    const perpZ = -tangent.x;

    const corner = (sideAlong: number, sideAcross: number): readonly [number, number, number] => {
      const x = point.x + tangent.x * sideAlong * 0.24 + perpX * sideAcross * (width / 2);
      const z = point.z + tangent.z * sideAlong * 0.24 + perpZ * sideAcross * (width / 2);
      return [x, surfaceHeightAt(x, z) + lift, z];
    };

    const backLeft = corner(-1, 1);
    const backRight = corner(-1, -1);
    const frontLeft = corner(1, 1);
    const frontRight = corner(1, -1);

    for (const [x, y, z] of [backLeft, backRight, frontLeft, backRight, frontRight, frontLeft]) {
      pushVertex(sink, x, y, z, color, "planks", 0, 0);
    }
  }
}

function toGeometry(sink: Sink, unitsPerTile: number): BufferGeometry {
  const geometry = new BufferGeometry();
  const count = sink.positions.length / 3;
  const uvs = new Float32Array(count * 2);
  for (let index = 0; index < count; index += 1) {
    uvs[index * 2] = sink.positions[index * 3] / unitsPerTile;
    uvs[index * 2 + 1] = sink.positions[index * 3 + 2] / unitsPerTile;
  }
  geometry.setAttribute("position", new Float32BufferAttribute(sink.positions, 3));
  geometry.setAttribute("color", new Float32BufferAttribute(sink.colors, 3));
  geometry.setAttribute("surface", new Float32BufferAttribute(sink.surfaces, 1));
  geometry.setAttribute("depth", new Float32BufferAttribute(sink.depths, 1));
  geometry.setAttribute("foam", new Float32BufferAttribute(sink.foams, 1));
  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();
  return geometry;
}

const STREET = new Color(WORLD_COLORS.street);
const KERB = new Color(WORLD_COLORS.kerb);
const TRACK = new Color(WORLD_COLORS.road);
const DECK = new Color(WORLD_COLORS.timber);
const PAVING = new Color(WORLD_COLORS.paving);

/** A street: a pavement strip underneath, the stone setts on top. */
function appendStreet(points: readonly Waypoint[], lift: number, sink: Sink): void {
  const curve = createCurve(points, false);
  appendRibbon(curve, { width: ROAD.streetWidth + ROAD.kerbExtra, lift, colorAt: () => KERB, surfaceAt: () => "paving" }, sink);
  appendRibbon(curve, { width: ROAD.streetWidth, lift: lift + 0.03, colorAt: () => STREET, surfaceAt: () => "stone" }, sink);
}

/** Every street, driveway, path, car park, footbridge and yard, as one geometry. */
export function createRoadGeometry(): BufferGeometry {
  const sink = createSink();

  appendStreet(MAIN_ROAD, ROAD.lift, sink);
  appendStreet(SHORE_STREET, ROAD.lift + 0.02, sink);
  appendStreet(ENTRY_ROAD, ROAD.lift + 0.02, sink);

  for (const driveway of DRIVEWAYS) {
    const street = driveway.surface === "street";
    appendRibbon(
      createCurve(driveway.points, false),
      { width: driveway.width, lift: ROAD.lift + 0.05, colorAt: () => (street ? STREET : TRACK), surfaceAt: () => (street ? "stone" : "dirt") },
      sink,
    );
    appendDisc(driveway.yard[0], driveway.yard[1], driveway.yardRadius, ROAD.lift + 0.04, street ? STREET : TRACK, street ? "stone" : "dirt", sink);
  }

  for (const lot of PARKING_LOTS) {
    appendRectangle(lot, ROAD.lift + 0.06, KERB, "paving", sink);
  }

  for (const path of PATHS) {
    appendRibbon(createCurve(path, false), { width: ROAD.pathWidth, lift: ROAD.lift + 0.07, colorAt: () => PAVING, surfaceAt: () => "paving" }, sink);
  }

  appendRibbon(
    createCurve(FOOTBRIDGE, false),
    {
      width: 2.2,
      lift: ROAD.lift + 0.06,
      colorAt: () => DECK,
      surfaceAt: () => "planks",
      heightAt: (x, z) => Math.max(terrainHeightAt(x, z), BRIDGE_DECK_HEIGHT + 0.6),
    },
    sink,
  );

  return toGeometry(sink, 2.2);
}

/** Lawns around the houses, as discs of mown grass. */
export function createLawnGeometry(lawns: ReadonlyArray<{ readonly x: number; readonly z: number; readonly radius: number }>): BufferGeometry {
  const sink = createSink();
  const lawn = new Color(WORLD_COLORS.lawn);
  for (const disc of lawns) {
    appendDisc(disc.x, disc.z, disc.radius, ROAD.lift * 0.6, lawn, "grass", sink);
  }
  return toGeometry(sink, 2.2);
}

/** Ballast, sleepers and two rails. */
export function createRailGeometry(): BufferGeometry {
  const curve = createCurve(RAIL_LINE, false);
  const sink = createSink();
  const ballast = new Color(WORLD_COLORS.ballast);
  const trestle = new Color(WORLD_COLORS.timberDark);
  const rail = new Color(WORLD_COLORS.rail);

  appendRibbon(curve, { width: RAIL.bedWidth, lift: RAIL.lift, colorAt: () => ballast, surfaceAt: () => "dirt" }, sink);
  appendSleepers(curve, RAIL.sleeperSpacing, RAIL.gauge + 0.9, RAIL.lift + 0.08, trestle, sink);
  for (const side of [-1, 1]) {
    appendRibbon(
      curve,
      { width: RAIL.railWidth, lift: RAIL.lift + 0.2, lateralOffset: (side * RAIL.gauge) / 2, colorAt: () => rail, surfaceAt: () => "metal" },
      sink,
    );
  }

  return toGeometry(sink, 2.2);
}

// ---------------------------------------------------------------------------------
// Water
// ---------------------------------------------------------------------------------

/**
 * The lake surface: a grid over the bay at water level, trimmed to the shoreline with
 * a margin that tucks under the beach. `depth` deepens away from the shore so the
 * material can shade the open water darker.
 */
export function createLakeSurfaceGeometry(): BufferGeometry {
  const { minX, maxX, minZ, maxZ } = LAKE.bounds;
  const columns = 150;
  const rows = 110;

  const grid = new PlaneGeometry(maxX - minX, maxZ - minZ, columns, rows);
  grid.rotateX(-Math.PI / 2);
  grid.translate((minX + maxX) / 2, LAKE.level, (minZ + maxZ) / 2);

  const source = grid.attributes.position;
  const index = grid.index;
  if (!index) throw new Error("PlaneGeometry is expected to be indexed.");

  const distances = new Float32Array(source.count);
  for (let vertex = 0; vertex < source.count; vertex += 1) {
    distances[vertex] = lakeDistance(source.getX(vertex), source.getZ(vertex));
  }

  const positions: number[] = [];
  const colors: number[] = [];
  const depths: number[] = [];
  const foams: number[] = [];
  const uvs: number[] = [];

  for (let tri = 0; tri < index.count; tri += 3) {
    const corners = [index.getX(tri), index.getX(tri + 1), index.getX(tri + 2)];
    // Keep any triangle that touches water; the rest of it hides under the beach.
    if (corners.every((vertex) => distances[vertex] > 6)) continue;

    for (const vertex of corners) {
      const x = source.getX(vertex);
      const z = source.getZ(vertex);
      positions.push(x, LAKE.level, z);
      colors.push(1, 1, 1);
      depths.push(Math.min(1, Math.max(0, -distances[vertex] / 22)));
      foams.push(0);
      uvs.push(x / 3, z / 3);
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  geometry.setAttribute("depth", new Float32BufferAttribute(depths, 1));
  geometry.setAttribute("foam", new Float32BufferAttribute(foams, 1));
  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();
  return geometry;
}

function foamAt(x: number): number {
  if (x < RIVER.fallsStartX - 0.5) return 0;
  if (x < RIVER.fallsEndX + 1.5) return 1;
  return Math.max(0, 1 - (x - RIVER.fallsEndX - 1.5) / 6);
}

/** The river below the dam: the chute off the crest, the churn, then the run east. */
export function createRiverGeometry(): BufferGeometry {
  const curve = createCurve(RIVER_COURSE, false);
  const sink = createSink();
  const white = new Color(WORLD_COLORS.foam);
  const sheet = new Color("#bfe3ea");

  appendRibbon(
    curve,
    {
      width: (x) => RIVER.halfWidth * 2 * (x < RIVER.fallsEndX ? 1.35 : 1),
      lift: 0,
      heightAt: (x) => riverSurfaceHeightAt(x),
      colorAt: (x, _z, lateral) => {
        const band = Math.abs(Math.sin(lateral * 8 + x * 0.6));
        return x < RIVER.fallsEndX + 1 && band < 0.45 ? sheet : white;
      },
      surfaceAt: () => "water",
      foamAt,
      depth: 0.8,
      step: 1.2,
      lanes: 8,
    },
    sink,
  );

  return toGeometry(sink, 3);
}

/** Spray and churn at the foot of the falls. */
export function createWaterfallFoamGeometry(): BufferGeometry {
  const parts: BufferGeometry[] = [];
  const baseZ = RIVER_COURSE[1][1];
  const puffs: ReadonlyArray<readonly [number, number, number]> = [
    [119, 0.55, -3.6],
    [120, 0.7, -1.2],
    [121, 0.6, 1.4],
    [122, 0.5, 3.4],
    [124, 0.45, -2.4],
    [126, 0.4, 1.0],
    [128, 0.35, -0.6],
  ];
  for (const [x, radius, dz] of puffs) {
    parts.push(blob(radius * 2.2, WORLD_COLORS.foam, x, RIVER.level + 0.3, baseZ + dz, 0.32, 1, "foliage"));
  }
  return merge(parts);
}

// ---------------------------------------------------------------------------------
// Vehicle routes
// ---------------------------------------------------------------------------------

/** The curve the pickup follows: the main road, out and back. */
export const CAR_CURVE: CatmullRomCurve3 = createCurve(MAIN_ROAD, false);

/** The curve the train follows. */
export const TRAIN_CURVE: CatmullRomCurve3 = createCurve(RAIL_LINE, false);

/** The yacht runs the length of the bay. */
export const YACHT_CURVE: CatmullRomCurve3 = createCurve(
  [[-10, 40], [-40, 10], [-60, -30], [-40, -80], [10, -100], [50, -70], [30, -20], [10, 20]],
  true,
);

/** The sailboat tacks about the open water. */
export const SAILBOAT_CURVE: CatmullRomCurve3 = createCurve(
  [[-30, 30], [-80, 0], [-110, -70], [-60, -100], [-10, -60], [-20, -10]],
  true,
);
