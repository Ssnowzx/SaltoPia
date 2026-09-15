import { BufferGeometry, CatmullRomCurve3, Color, Float32BufferAttribute, PlaneGeometry, Vector3 } from "three";

import { blob, merge } from "./builders";
import { BRIDGE_DECK_HEIGHT, LAKE, RAIL, RIVER, ROAD, WORLD_COLORS } from "./constants";
import {
  RIVER_COURSE,
  islandDistance,
  lakeDistance,
  riverDistance,
  riverSurfaceHeightAt,
  terrainHeightAt,
} from "./terrain";
import { SURFACE, type SurfaceKey } from "./textures";

/**
 * Streets, tracks, water - everything that is a ribbon draped over the terrain, plus
 * the lake surface.
 *
 * The street network is a real one: a main road enters from the south-east corner,
 * loops the community's block with two cross streets, and each landmark has its own
 * driveway ending in a yard or a car park. No road passes through a building; the
 * layout keeps every building clear of every centre line.
 */

/** A 2D waypoint, in world XZ. */
export type Waypoint = readonly [number, number];

/** Whether a point sits on a bridge deck over the river below the dam. */
export function isOnBridge(x: number, z: number): boolean {
  return x > 73 && riverDistance(x, z) < RIVER.halfWidth + 3;
}

/** Height of a road or rail surface: the terrain, except over the river, where a deck holds. */
export function surfaceHeightAt(x: number, z: number): number {
  const ground = terrainHeightAt(x, z);
  return isOnBridge(x, z) ? Math.max(ground, BRIDGE_DECK_HEIGHT) : ground;
}

// ---------------------------------------------------------------------------------
// The network
// ---------------------------------------------------------------------------------

/** The main street: in from the south-east and round the community's block. */
export const MAIN_LOOP: readonly Waypoint[] = [
  [100, 62],
  [78, 50],
  [58, 36],
  [40, 20],
  [22, 14],
  [4, 14],
  [-16, 15],
  [-36, 20],
  [-54, 30],
  [-56, 48],
  [-38, 56],
  [-14, 58],
  [12, 56],
  [36, 56],
  [60, 60],
  [84, 66],
];

/** Cross streets through the block. Both ends sit on the loop. */
export const SIDE_STREETS: readonly (readonly Waypoint[])[] = [
  [[-16, 15], [-15, 36], [-14, 58]],
  [[22, 14], [20, 36], [12, 56]],
];

/** The road that brings the visitor into town. */
export const ENTRY_ROAD: readonly Waypoint[] = [
  [100, 62],
  [116, 66],
  [134, 74],
];

/** A road from the loop to one landmark, ending in a yard in front of it. */
export interface Driveway {
  readonly points: readonly Waypoint[];
  readonly width: number;
  readonly surface: "street" | "track";
  readonly yard: Waypoint;
  readonly yardRadius: number;
}

export const DRIVEWAYS: readonly Driveway[] = [
  // Pousada da Geada, on the lake.
  { points: [[40, 20], [38, 10]], width: ROAD.drivewayWidth, surface: "street", yard: [38, 6], yardRadius: 4.5 },
  // Galpao do Fogo de Chao, on the west shore.
  { points: [[-36, 20], [-46, 12]], width: ROAD.drivewayWidth, surface: "track", yard: [-50, 8], yardRadius: 4 },
  // CTG Porteira do Tropeiro, from the south street to its gate.
  { points: [[-38, 56], [-39, 51]], width: ROAD.drivewayWidth, surface: "track", yard: [-40, 48], yardRadius: 2.8 },
  // Estacao Velha, at the entry.
  { points: [[84, 66], [86, 69]], width: ROAD.drivewayWidth, surface: "street", yard: [86, 71], yardRadius: 3.5 },
  // The collector east: to the winery, then on to the dam and the usina.
  { points: [[58, 36], [70, 26], [80, 26]], width: ROAD.drivewayWidth, surface: "track", yard: [82, 26], yardRadius: 3.5 },
  { points: [[70, 26], [78, 8], [84, -12], [82, -20]], width: ROAD.drivewayWidth, surface: "track", yard: [82, -22], yardRadius: 3.5 },
  // Mirante da Neblina - the trail up the west hill.
  { points: [[-54, 30], [-68, 20], [-78, 4], [-82, -14], [-80, -20]], width: ROAD.trailWidth, surface: "track", yard: [-80, -21], yardRadius: 3 },
];

/** Paved paths: from the square to the street and to the chapel door. */
export const PATHS: readonly (readonly Waypoint[])[] = [
  [[0, 8], [0, 14]],
  [[-11, -2], [-15, -1]],
];

/** The footbridge below the dam, from the usina bank to the lookout deck. */
export const FOOTBRIDGE: readonly Waypoint[] = [
  [86, -33],
  [86, -40.5],
  [86, -47],
];

/** The railway, along the south edge past the station's platform. */
export const RAIL_LINE: readonly Waypoint[] = [
  [-118, 86],
  [-60, 84],
  [0, 83],
  [60, 83],
  [88, 83],
  [118, 80],
];

/** Car parks: a paved rectangle, with cars placed by the layout. */
export interface ParkingLot {
  readonly x: number;
  readonly z: number;
  readonly width: number;
  readonly depth: number;
  readonly rotationY: number;
}

export const PARKING_LOTS: readonly ParkingLot[] = [
  { x: 42, z: 8, width: 12, depth: 8, rotationY: 0 },
  { x: 16, z: 22, width: 11, depth: 7, rotationY: 0 },
  { x: 86, z: 72, width: 9, depth: 6, rotationY: 0 },
];

/** Every road centre line, for anything that needs to keep clear of them. */
export const ROAD_POLYLINES: ReadonlyArray<{ readonly points: readonly Waypoint[]; readonly closed: boolean; readonly width: number }> = [
  { points: MAIN_LOOP, closed: true, width: ROAD.streetWidth + ROAD.kerbExtra },
  ...SIDE_STREETS.map((points) => ({ points, closed: false, width: ROAD.streetWidth + ROAD.kerbExtra })),
  { points: ENTRY_ROAD, closed: false, width: ROAD.streetWidth + ROAD.kerbExtra },
  ...DRIVEWAYS.map((driveway) => ({ points: driveway.points, closed: false, width: driveway.width })),
  { points: FOOTBRIDGE, closed: false, width: 2.2 },
  ...PATHS.map((points) => ({ points, closed: false, width: ROAD.pathWidth })),
];

/** Every yard, for the same reason. */
export const YARDS: ReadonlyArray<{ readonly x: number; readonly z: number; readonly radius: number }> = [
  ...DRIVEWAYS.map((driveway) => ({ x: driveway.yard[0], z: driveway.yard[1], radius: driveway.yardRadius })),
  ...PARKING_LOTS.map((lot) => ({ x: lot.x, z: lot.z, radius: Math.max(lot.width, lot.depth) / 2 })),
];

/** Builds a smooth XZ curve through waypoints. Y is left at zero - callers drape it. */
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

/** Accumulates vertices for one mesh. */
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
  /** Colour at a point; `lateral` runs -1 (left edge) to 1 (right edge). */
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
 * Appends a draped ribbon along a curve.
 *
 * The perpendicular is `up x tangent`, and each quad is wound (left0, right0, left1),
 * (right0, right1, left1). With that pairing the face normal is +Y for any direction
 * of travel, so nothing is back-face culled whichever way a road is drawn.
 */
function appendRibbon(curve: CatmullRomCurve3, options: RibbonOptions, sink: Sink): void {
  const length = curve.getLength();
  const divisions = Math.max(4, Math.ceil(length / (options.step ?? 1.1)));
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

/** Appends a flat disc draped on the terrain. */
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

/** Appends a flat rectangle draped on the terrain, turned about Y. */
function appendRectangle(lot: ParkingLot, lift: number, color: Color, surface: SurfaceKey, sink: Sink): void {
  const cos = Math.cos(lot.rotationY);
  const sin = Math.sin(lot.rotationY);
  const corner = (u: number, v: number): readonly [number, number] => [
    lot.x + u * cos + v * sin,
    lot.z - u * sin + v * cos,
  ];
  const cells = 4;
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

/** Appends short cross-ties along a curve - the sleepers under the rails. */
function appendSleepers(curve: CatmullRomCurve3, spacing: number, width: number, lift: number, color: Color, sink: Sink): void {
  const length = curve.getLength();
  const count = Math.floor(length / spacing);

  for (let index = 0; index < count; index += 1) {
    const t = (index + 0.5) / count;
    const point = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t);
    const perpX = tangent.z;
    const perpZ = -tangent.x;
    const along = 0.24;
    const across = width / 2;

    const corner = (sideAlong: number, sideAcross: number): readonly [number, number, number] => {
      const x = point.x + tangent.x * sideAlong * along + perpX * sideAcross * across;
      const z = point.z + tangent.z * sideAlong * along + perpZ * sideAcross * across;
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

/** Turns a sink into geometry with planar UVs, so the atlas repeats in world units. */
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
function appendStreet(points: readonly Waypoint[], closed: boolean, lift: number, sink: Sink): void {
  const curve = createCurve(points, closed);
  appendRibbon(curve, { width: ROAD.streetWidth + ROAD.kerbExtra, lift, colorAt: () => KERB, surfaceAt: () => "paving" }, sink);
  appendRibbon(curve, { width: ROAD.streetWidth, lift: lift + 0.03, colorAt: () => STREET, surfaceAt: () => "stone" }, sink);
}

/** Every street, driveway, path, car park, footbridge and yard, as one geometry. */
export function createRoadGeometry(): BufferGeometry {
  const sink = createSink();

  appendStreet(MAIN_LOOP, true, ROAD.lift, sink);
  for (const street of SIDE_STREETS) appendStreet(street, false, ROAD.lift + 0.02, sink);
  appendStreet(ENTRY_ROAD, false, ROAD.lift + 0.02, sink);

  for (const driveway of DRIVEWAYS) {
    const street = driveway.surface === "street";
    appendRibbon(
      createCurve(driveway.points, false),
      {
        width: driveway.width,
        lift: ROAD.lift + 0.05,
        colorAt: () => (street ? STREET : TRACK),
        surfaceAt: () => (street ? "stone" : "dirt"),
      },
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
 * The lake surface: a grid over the basin at water level, trimmed to the shoreline
 * with a margin that tucks under the beach. `depth` deepens away from the shore so the
 * material can shade the middle darker.
 */
export function createLakeSurfaceGeometry(): BufferGeometry {
  const minX = LAKE.centre.x - LAKE.radiusX - 20;
  const maxX = LAKE.channel.x + LAKE.channel.halfWidth + 4;
  const minZ = LAKE.centre.z - LAKE.radiusZ - 14;
  const maxZ = LAKE.centre.z + LAKE.radiusZ + 14;
  const columns = 90;
  const rows = 60;

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
    // Keep any triangle that touches the water; the rest of it hides under the beach.
    if (corners.every((vertex) => distances[vertex] > 5)) continue;

    for (const vertex of corners) {
      const x = source.getX(vertex);
      const z = source.getZ(vertex);
      positions.push(x, LAKE.level, z);
      colors.push(1, 1, 1);
      const shoreDepth = Math.min(1, Math.max(0, -distances[vertex] / 14));
      const islandDepth = Math.min(1, Math.max(0, islandDistance(x, z) / 10));
      depths.push(Math.min(shoreDepth, islandDepth));
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

/** Whether a point along the river is on the falling water or the churn below it. */
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
  const centreZ = RIVER_COURSE[1][1];
  const puffs: ReadonlyArray<readonly [number, number, number]> = [
    [82.5, 0.55, -3.6],
    [83.5, 0.7, -1.2],
    [84.5, 0.6, 1.4],
    [83.0, 0.5, 3.4],
    [86.5, 0.45, -2.4],
    [87.0, 0.4, 1.0],
    [89.0, 0.35, -0.6],
  ];
  for (const [x, radius, dz] of puffs) {
    parts.push(blob(radius * 2.2, WORLD_COLORS.foam, x, RIVER.level + 0.3, centreZ + dz, 0.32, 1, "foliage"));
  }
  return merge(parts);
}

// ---------------------------------------------------------------------------------
// Vehicle routes
// ---------------------------------------------------------------------------------

/** The curve the pickup follows. */
export const CAR_CURVE: CatmullRomCurve3 = createCurve(MAIN_LOOP, true);

/** The curve the train follows. */
export const TRAIN_CURVE: CatmullRomCurve3 = createCurve(RAIL_LINE, false);

/** The yacht circles the island. */
export const YACHT_CURVE: CatmullRomCurve3 = createCurve(
  [[6, -22], [-22, -30], [-32, -54], [-10, -74], [26, -74], [44, -54], [30, -30]],
  true,
);

/** The sailboat tacks about the west basin. */
export const SAILBOAT_CURVE: CatmullRomCurve3 = createCurve(
  [[-18, -28], [-42, -38], [-44, -60], [-20, -70], [-12, -50]],
  true,
);
