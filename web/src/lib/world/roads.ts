import { BufferGeometry, CatmullRomCurve3, Color, Float32BufferAttribute, Vector3 } from "three";

import { blob, merge } from "./builders";
import { BRIDGE_DECK_HEIGHT, RAIL, ROAD, WATERFALL, WATER_LEVEL, WORLD_COLORS } from "./constants";
import {
  distanceToRiver,
  riverBedHeightAt,
  riverCentreX,
  riverHalfWidthAt,
  terrainHeightAt,
} from "./terrain";
import { SURFACE, type SurfaceKey } from "./textures";

/**
 * Roads, the railway and the river - everything that is a ribbon draped over the
 * terrain.
 *
 * A ribbon is a strip of quads following a curve, each vertex sampling the terrain
 * for its height. That is what keeps roads on the ground when the terrain changes,
 * and what lets a road cross the river on a deck rather than diving into the trench.
 *
 * The network is deliberately simple: one loop around the square, and one driveway
 * per landmark ending in a yard. Every road goes somewhere and stops there.
 */

/** A 2D waypoint, in world XZ. */
export type Waypoint = readonly [number, number];

/** How far from the river's centre a crossing is treated as a bridge. */
function bridgeReachAt(z: number): number {
  return riverHalfWidthAt(z) + 3.5;
}

/**
 * Height of a road or rail surface at a point: the terrain, except over the river,
 * where the deck holds level above the water.
 */
export function surfaceHeightAt(x: number, z: number): number {
  const ground = terrainHeightAt(x, z);
  return distanceToRiver(x, z) < bridgeReachAt(z) ? Math.max(ground, BRIDGE_DECK_HEIGHT) : ground;
}

/** Whether a point sits on a bridge deck rather than on earth. */
export function isOnBridge(x: number, z: number): boolean {
  return distanceToRiver(x, z) < bridgeReachAt(z);
}

// ---------------------------------------------------------------------------------
// The network
// ---------------------------------------------------------------------------------

/** The street around the square - the loop the pickup drives. */
export const LOOP: readonly Waypoint[] = [
  [0, 20],
  [11, 18],
  [18, 10],
  [21, -2],
  [17, -13],
  [9, -19],
  [0, -20.5],
  [-9, -19],
  [-16, -15],
  [-21, -4],
  [-19, 9],
  [-11, 17],
];

/** A road from the loop to one landmark, ending in a yard in front of it. */
export interface Driveway {
  readonly points: readonly Waypoint[];
  readonly width: number;
  readonly yard: Waypoint;
  readonly yardRadius: number;
}

export const DRIVEWAYS: readonly Driveway[] = [
  // Pousada da Geada.
  { points: [[0, 20], [4, 27], [8, 33], [12, 38]], width: ROAD.drivewayWidth, yard: [12, 39], yardRadius: 4.5 },
  // Galpao do Fogo de Chao.
  { points: [[-11, 17], [-19, 22], [-27, 24]], width: ROAD.drivewayWidth, yard: [-27, 25], yardRadius: 4 },
  // Estacao Velha.
  { points: [[18, 10], [24, 20], [27, 30], [26, 38]], width: ROAD.drivewayWidth, yard: [26, 39], yardRadius: 4.5 },
  // Vinicola de Altitude.
  { points: [[17, -13], [24, -18], [30, -21]], width: ROAD.drivewayWidth, yard: [30, -21], yardRadius: 4 },
  // Salto do Rio Caveiras - on from the winery, east of it and down to the usina.
  { points: [[30, -21], [36, -25], [38, -36], [36, -46], [31, -52]], width: ROAD.drivewayWidth, yard: [31, -53], yardRadius: 3.2 },
  // Mirante da Neblina - the climb, west of the cathedral.
  { points: [[-9, -19], [-9, -28], [-4, -37], [1, -41]], width: ROAD.drivewayWidth, yard: [1, -41.5], yardRadius: 3 },
  // Bosque das Araucarias - the trail.
  {
    points: [[-19, 9], [-28, 5], [-36, -6], [-40, -18], [-42, -30], [-43, -36]],
    width: ROAD.trailWidth,
    yard: [-43, -37],
    yardRadius: 3.5,
  },
];

/** Out of town to the east, over the river. */
export const EXIT_ROAD: readonly Waypoint[] = [
  [24, 20],
  [34, 16],
  [46, 12],
  [62, 8],
  [92, 2],
  [124, -4],
];

/** Paved paths: from the square out to the loop, and up to the cathedral door. */
export const SQUARE_PATHS: readonly (readonly Waypoint[])[] = [
  [[0, 10.5], [0, 20]],
  [[10.5, 0], [20.5, 0]],
  [[-10.5, 0], [-20.5, 0]],
  [[0, -10.5], [0, -25]],
];

/** The footbridge below the falls, from the usina side to the lookout deck. */
export const FOOTBRIDGE: readonly Waypoint[] = [
  [34, -56],
  [44, -56.5],
  [54, -56.5],
  [61, -56],
];

/**
 * The railway: an open line across the south of the valley, past the station's
 * platform and over the river on a trestle. It stays south of the loop so the train
 * never runs through the square.
 */
export const RAIL_LINE: readonly Waypoint[] = [
  [-118, 62],
  [-80, 59],
  [-30, 55],
  [0, 53.5],
  [26, 53],
  [52, 52],
  [90, 46],
  [118, 38],
];

/** Every road centre line, for anything that needs to keep clear of them. */
export const ROAD_POLYLINES: ReadonlyArray<{ readonly points: readonly Waypoint[]; readonly closed: boolean }> = [
  { points: LOOP, closed: true },
  ...DRIVEWAYS.map((driveway) => ({ points: driveway.points, closed: false })),
  { points: EXIT_ROAD, closed: false },
  { points: FOOTBRIDGE, closed: false },
  ...SQUARE_PATHS.map((path) => ({ points: path, closed: false })),
];

/** Every yard, for the same reason. */
export const YARDS: ReadonlyArray<{ readonly x: number; readonly z: number; readonly radius: number }> =
  DRIVEWAYS.map((driveway) => ({ x: driveway.yard[0], z: driveway.yard[1], radius: driveway.yardRadius }));

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

/** Accumulates vertices for one textured mesh. */
interface Sink {
  readonly positions: number[];
  readonly colors: number[];
  readonly surfaces: number[];
}

function createSink(): Sink {
  return { positions: [], colors: [], surfaces: [] };
}

interface RibbonOptions {
  /** Width, either fixed or as a function of depth into the valley. */
  readonly width: number | ((z: number) => number);
  /** Lift above the surface. */
  readonly lift: number;
  /** Sideways offset from the curve, positive to the left of travel. */
  readonly lateralOffset?: number;
  /** Height at a point, overriding the draped surface - for water. */
  readonly heightAt?: (x: number, z: number) => number;
  /** Colour at a point; `lateral` runs -1 (left edge) to 1 (right edge). */
  readonly colorAt: (x: number, z: number, lateral: number) => Color;
  /** Surface at a point. */
  readonly surfaceAt: (x: number, z: number) => SurfaceKey;
  /** Spacing between samples along the curve. */
  readonly step?: number;
  /** Subdivisions across the width, for colour bands. */
  readonly lanes?: number;
}

function pushVertex(sink: Sink, x: number, y: number, z: number, color: Color, surface: SurfaceKey): void {
  sink.positions.push(x, y, z);
  sink.colors.push(color.r, color.g, color.b);
  sink.surfaces.push(SURFACE[surface]);
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

  const widthAt = (z: number): number => (typeof options.width === "number" ? options.width : options.width(z));
  const surface = (x: number, z: number): number =>
    options.heightAt ? options.heightAt(x, z) + options.lift : surfaceHeightAt(x, z) + options.lift;

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
    const half0 = widthAt(current.z) / 2;
    const half1 = widthAt(next.z) / 2;

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

      pushVertex(sink, left0[0], surface(left0[0], left0[1]), left0[1], color0, surface0);
      pushVertex(sink, right0[0], surface(right0[0], right0[1]), right0[1], color0, surface0);
      pushVertex(sink, left1[0], surface(left1[0], left1[1]), left1[1], color1, surface1);

      pushVertex(sink, right0[0], surface(right0[0], right0[1]), right0[1], color0, surface0);
      pushVertex(sink, right1[0], surface(right1[0], right1[1]), right1[1], color1, surface1);
      pushVertex(sink, left1[0], surface(left1[0], left1[1]), left1[1], color1, surface1);
    }
  }
}

/** Appends a flat disc draped on the terrain - a yard at the end of a driveway. */
function appendDisc(x: number, z: number, radius: number, lift: number, color: Color, surface: SurfaceKey, sink: Sink): void {
  const segments = 18;
  const centreY = surfaceHeightAt(x, z) + lift;

  for (let index = 0; index < segments; index += 1) {
    const a0 = (index / segments) * Math.PI * 2;
    const a1 = ((index + 1) / segments) * Math.PI * 2;
    const x0 = x + Math.cos(a0) * radius;
    const z0 = z + Math.sin(a0) * radius;
    const x1 = x + Math.cos(a1) * radius;
    const z1 = z + Math.sin(a1) * radius;

    pushVertex(sink, x, centreY, z, color, surface);
    pushVertex(sink, x1, surfaceHeightAt(x1, z1) + lift, z1, color, surface);
    pushVertex(sink, x0, surfaceHeightAt(x0, z0) + lift, z0, color, surface);
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
      pushVertex(sink, x, y, z, color, "planks");
    }
  }
}

/** Turns a sink into geometry with planar UVs, so the atlas repeats in world units. */
function toGeometry(sink: Sink, unitsPerTile: number): BufferGeometry {
  const geometry = new BufferGeometry();
  const uvs = new Float32Array((sink.positions.length / 3) * 2);
  for (let index = 0; index < sink.positions.length / 3; index += 1) {
    uvs[index * 2] = sink.positions[index * 3] / unitsPerTile;
    uvs[index * 2 + 1] = sink.positions[index * 3 + 2] / unitsPerTile;
  }
  geometry.setAttribute("position", new Float32BufferAttribute(sink.positions, 3));
  geometry.setAttribute("color", new Float32BufferAttribute(sink.colors, 3));
  geometry.setAttribute("surface", new Float32BufferAttribute(sink.surfaces, 1));
  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();
  return geometry;
}

const ROAD_COLOR = new Color(WORLD_COLORS.road);
const DECK_COLOR = new Color(WORLD_COLORS.timber);
const PAVING_COLOR = new Color(WORLD_COLORS.paving);

function roadColorAt(x: number, z: number): Color {
  return isOnBridge(x, z) ? DECK_COLOR : ROAD_COLOR;
}

function roadSurfaceAt(x: number, z: number): SurfaceKey {
  return isOnBridge(x, z) ? "planks" : "dirt";
}

/** Every road, path, footbridge and yard, as one geometry. */
export function createRoadGeometry(): BufferGeometry {
  const sink = createSink();

  appendRibbon(createCurve(LOOP, true), { width: ROAD.width, lift: ROAD.lift, colorAt: roadColorAt, surfaceAt: roadSurfaceAt }, sink);

  for (const driveway of DRIVEWAYS) {
    appendRibbon(
      createCurve(driveway.points, false),
      { width: driveway.width, lift: ROAD.lift + 0.03, colorAt: roadColorAt, surfaceAt: roadSurfaceAt },
      sink,
    );
    appendDisc(driveway.yard[0], driveway.yard[1], driveway.yardRadius, ROAD.lift + 0.02, ROAD_COLOR, "dirt", sink);
  }

  appendRibbon(createCurve(EXIT_ROAD, false), { width: ROAD.width, lift: ROAD.lift + 0.03, colorAt: roadColorAt, surfaceAt: roadSurfaceAt }, sink);

  for (const path of SQUARE_PATHS) {
    appendRibbon(
      createCurve(path, false),
      { width: ROAD.pathWidth, lift: ROAD.lift + 0.05, colorAt: () => PAVING_COLOR, surfaceAt: () => "paving" },
      sink,
    );
  }

  appendRibbon(
    createCurve(FOOTBRIDGE, false),
    { width: 2.2, lift: ROAD.lift + 0.06, colorAt: () => DECK_COLOR, surfaceAt: () => "planks", heightAt: (x, z) => Math.max(terrainHeightAt(x, z), BRIDGE_DECK_HEIGHT + 0.4) },
    sink,
  );

  return toGeometry(sink, 2.2);
}

/** Ballast, sleepers and two rails. */
export function createRailGeometry(): BufferGeometry {
  const curve = createCurve(RAIL_LINE, false);
  const sink = createSink();
  const ballast = new Color(WORLD_COLORS.ballast);
  const trestle = new Color(WORLD_COLORS.timberDark);
  const rail = new Color(WORLD_COLORS.rail);

  appendRibbon(
    curve,
    {
      width: RAIL.bedWidth,
      lift: RAIL.lift,
      colorAt: (x, z) => (isOnBridge(x, z) ? trestle : ballast),
      surfaceAt: (x, z) => (isOnBridge(x, z) ? "planks" : "dirt"),
    },
    sink,
  );

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

/** Whether a depth along the river is on the falling water. */
function isOnFalls(z: number): boolean {
  return z < WATERFALL.footZ + 1.2 && z > WATERFALL.lipZ - 0.8;
}

/** The river: deep water, lighter shallows either side, and white sheets on the falls. */
export function createRiverGeometry(): BufferGeometry {
  const spine: Waypoint[] = [];
  for (let z = -150; z <= 150; z += 3) {
    spine.push([riverCentreX(z), z]);
  }
  const curve = createCurve(spine, false);

  const water = new Color(WORLD_COLORS.water);
  const deep = new Color("#4f9cad");
  const edge = new Color(WORLD_COLORS.waterEdge);
  const foam = new Color(WORLD_COLORS.foam);
  const sheet = new Color("#8fc7d6");

  const sink = createSink();

  // Shallows: a wider, lighter ribbon just below the surface.
  appendRibbon(
    curve,
    {
      width: (z) => (riverHalfWidthAt(z) + 1.6) * 2,
      lift: -0.05,
      heightAt: (_x, z) => riverBedHeightAt(z),
      colorAt: (_x, z) => (isOnFalls(z) ? foam : edge),
      surfaceAt: () => "water",
      step: 1.5,
    },
    sink,
  );

  // The surface: deeper in the middle, and on the falls split into white sheets with
  // darker seams between them, which is how water actually comes over a ledge.
  appendRibbon(
    curve,
    {
      width: (z) => riverHalfWidthAt(z) * 2,
      lift: 0,
      heightAt: (_x, z) => riverBedHeightAt(z),
      colorAt: (_x, z, lateral) => {
        if (isOnFalls(z)) {
          const band = Math.abs(Math.sin(lateral * 9 + z * 0.4));
          return band > 0.55 ? foam : sheet;
        }
        const centre = 1 - Math.abs(lateral);
        return water.clone().lerp(deep, centre * 0.7);
      },
      surfaceAt: () => "water",
      step: 1.5,
      lanes: 10,
    },
    sink,
  );

  return toGeometry(sink, 3);
}

/** Spray and churn at the foot of the falls. */
export function createWaterfallFoamGeometry(): BufferGeometry {
  const parts: BufferGeometry[] = [];
  const footZ = WATERFALL.footZ;
  const centreX = riverCentreX(footZ);

  const puffs: ReadonlyArray<readonly [number, number, number]> = [
    [-8.5, 0.5, 1.2],
    [-5.5, 0.7, 0.6],
    [-2.5, 0.6, 1.6],
    [0.5, 0.75, 0.5],
    [3.5, 0.6, 1.4],
    [6.5, 0.7, 0.8],
    [9.0, 0.5, 1.8],
    [-6.5, 0.4, 3.6],
    [-1.5, 0.45, 4.2],
    [4.0, 0.4, 3.8],
    [8.0, 0.35, 4.4],
  ];

  for (const [dx, radius, dz] of puffs) {
    parts.push(blob(radius * 2.2, WORLD_COLORS.foam, centreX + dx, WATER_LEVEL + 0.25, footZ + dz, 0.32, 1, "foliage"));
  }

  return merge(parts);
}

/** The curve the pickup follows. */
export const CAR_CURVE: CatmullRomCurve3 = createCurve(LOOP, true);

/** The curve the train follows. */
export const TRAIN_CURVE: CatmullRomCurve3 = createCurve(RAIL_LINE, false);
