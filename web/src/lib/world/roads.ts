import { BufferGeometry, CatmullRomCurve3, Color, Float32BufferAttribute, Vector3 } from "three";

import { BRIDGE_DECK_HEIGHT, RAIL, ROAD, WATER_LEVEL, WORLD_COLORS } from "./constants";
import { merge } from "./builders";
import { RIVER_HALF_WIDTH, distanceToRiver, riverCentreX, terrainHeightAt } from "./terrain";

/**
 * Roads, the railway and the river - everything that is a ribbon draped over the
 * terrain.
 *
 * A ribbon is a strip of quads following a curve, each vertex sampling the terrain
 * for its height. That is what keeps roads on the ground when the terrain changes,
 * and what lets a road cross the river on a deck rather than diving into the trench.
 */

/** A 2D waypoint, in world XZ. */
export type Waypoint = readonly [number, number];

/** How far from the river's centre a crossing is treated as a bridge. */
const BRIDGE_REACH = RIVER_HALF_WIDTH + 3.5;

/**
 * Height of a road or rail surface at a point: the terrain, except over the river,
 * where the deck holds level above the water.
 */
export function surfaceHeightAt(x: number, z: number): number {
  const ground = terrainHeightAt(x, z);
  return distanceToRiver(x, z) < BRIDGE_REACH ? Math.max(ground, BRIDGE_DECK_HEIGHT) : ground;
}

/** Whether a point sits on a bridge deck rather than on earth. */
export function isOnBridge(x: number, z: number): boolean {
  return distanceToRiver(x, z) < BRIDGE_REACH;
}

// ---------------------------------------------------------------------------------
// The network
// ---------------------------------------------------------------------------------

/** The circuit the pickup drives: a loop skirting every landmark. */
export const CIRCUIT: readonly Waypoint[] = [
  [0, 18],
  [14, 20],
  [26, 22],
  [28, 34],
  [18, 44],
  [0, 43],
  [-14, 38],
  [-26, 28],
  [-37, 10],
  [-35, -8],
  [-32, -22],
  [-26, -32],
  [-12, -29],
  [-4, -18],
  [8, -19],
  [17, -10],
  [18, 6],
];

/** Radial connections from the ring road to the circuit and on to the landmarks. */
export const SPOKES: readonly (readonly Waypoint[])[] = [
  // Ring to circuit.
  [[0, ROAD.ringRadius], [0, 18]],
  [[ROAD.ringRadius, 0], [18, 6]],
  [[-ROAD.ringRadius, 0], [-36, 0]],
  [[0, -ROAD.ringRadius], [2, -18.5]],
  // Circuit to landmarks.
  [[26, 22], [26, 38]],
  [[18, 44], [15, 38]],
  [[-26, 28], [-27, 21]],
  [[-32, -22], [-23, -21]],
  // The trail into the araucaria forest.
  [[-26, -32], [-33, -36], [-40, -37]],
  // The climb to the lookout.
  [[8, -19], [4, -30], [2, -40]],
  // Up to the winery.
  [[17, -10], [24, -18], [30, -24]],
  // Out of town, east across the river.
  [[26, 22], [38, 16], [52, 12], [70, 6], [95, 2]],
];

/**
 * The railway: an open line across the south of the valley, past the station's
 * platform and over the river on a trestle. It stays south of the circuit so the
 * train never runs through the square.
 */
export const RAIL_LINE: readonly Waypoint[] = [
  [-130, 64],
  [-80, 59],
  [-30, 55],
  [0, 53.5],
  [26, 53],
  [52, 52],
  [90, 46],
  [130, 36],
];

/** Builds a smooth XZ curve through waypoints. Y is left at zero - callers drape it. */
export function createCurve(points: readonly Waypoint[], closed: boolean): CatmullRomCurve3 {
  return new CatmullRomCurve3(
    points.map(([x, z]) => new Vector3(x, 0, z)),
    closed,
    "centripetal",
  );
}

/** The ring road around the square, as waypoints. */
function ringWaypoints(radius: number, count = 14): readonly Waypoint[] {
  return Array.from({ length: count }, (_, index) => {
    const angle = (index / count) * Math.PI * 2;
    return [Math.cos(angle) * radius, Math.sin(angle) * radius] as const;
  });
}

// ---------------------------------------------------------------------------------
// Ribbon geometry
// ---------------------------------------------------------------------------------

interface RibbonOptions {
  readonly width: number;
  /** Lift above the surface. */
  readonly lift: number;
  /** Sideways offset from the curve, positive to the left of travel. */
  readonly lateralOffset?: number;
  /** Fixed height instead of draping, for water. */
  readonly fixedHeight?: number;
  /** Colour at a point. */
  readonly colorAt: (x: number, z: number) => Color;
  /** Spacing between samples along the curve. */
  readonly step?: number;
}

/**
 * Appends a draped ribbon along a curve.
 *
 * The perpendicular is `up x tangent`, and each quad is wound (left0, right0, left1),
 * (right0, right1, left1). With that pairing the face normal is +Y for any direction
 * of travel, so nothing is back-face culled whichever way a road is drawn.
 */
function appendRibbon(
  curve: CatmullRomCurve3,
  options: RibbonOptions,
  positions: number[],
  colors: number[],
): void {
  const length = curve.getLength();
  const divisions = Math.max(4, Math.ceil(length / (options.step ?? 1.1)));
  const samples = curve.getSpacedPoints(divisions);
  const halfWidth = options.width / 2;
  const offset = options.lateralOffset ?? 0;

  const surface = (x: number, z: number): number =>
    options.fixedHeight ?? surfaceHeightAt(x, z) + options.lift;

  const pushVertex = (x: number, z: number, color: Color): void => {
    positions.push(x, surface(x, z), z);
    colors.push(color.r, color.g, color.b);
  };

  for (let index = 0; index < samples.length - 1; index += 1) {
    const current = samples[index];
    const next = samples[index + 1];
    const tangentX = next.x - current.x;
    const tangentZ = next.z - current.z;
    const magnitude = Math.hypot(tangentX, tangentZ) || 1;
    const perpX = tangentZ / magnitude;
    const perpZ = -tangentX / magnitude;

    const centreX0 = current.x + perpX * offset;
    const centreZ0 = current.z + perpZ * offset;
    const centreX1 = next.x + perpX * offset;
    const centreZ1 = next.z + perpZ * offset;

    const color0 = options.colorAt(centreX0, centreZ0);
    const color1 = options.colorAt(centreX1, centreZ1);

    const left0: readonly [number, number] = [centreX0 + perpX * halfWidth, centreZ0 + perpZ * halfWidth];
    const right0: readonly [number, number] = [centreX0 - perpX * halfWidth, centreZ0 - perpZ * halfWidth];
    const left1: readonly [number, number] = [centreX1 + perpX * halfWidth, centreZ1 + perpZ * halfWidth];
    const right1: readonly [number, number] = [centreX1 - perpX * halfWidth, centreZ1 - perpZ * halfWidth];

    pushVertex(left0[0], left0[1], color0);
    pushVertex(right0[0], right0[1], color0);
    pushVertex(left1[0], left1[1], color1);

    pushVertex(right0[0], right0[1], color0);
    pushVertex(right1[0], right1[1], color1);
    pushVertex(left1[0], left1[1], color1);
  }
}

/** Appends short cross-ties along a curve - the sleepers under the rails. */
function appendSleepers(
  curve: CatmullRomCurve3,
  spacing: number,
  width: number,
  lift: number,
  color: Color,
  positions: number[],
  colors: number[],
): void {
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

    const back = { left: corner(-1, 1), right: corner(-1, -1) };
    const front = { left: corner(1, 1), right: corner(1, -1) };

    for (const vertex of [back.left, back.right, front.left, back.right, front.right, front.left]) {
      positions.push(...vertex);
      colors.push(color.r, color.g, color.b);
    }
  }
}

function toGeometry(positions: number[], colors: number[]): BufferGeometry {
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

/** Earth everywhere, planks over the river. */
function roadColorAt(x: number, z: number): Color {
  return new Color(isOnBridge(x, z) ? WORLD_COLORS.timber : WORLD_COLORS.road);
}

/** Every road, as one geometry. */
export function createRoadGeometry(): BufferGeometry {
  const positions: number[] = [];
  const colors: number[] = [];

  const roads: ReadonlyArray<{ points: readonly Waypoint[]; closed: boolean; lift: number }> = [
    { points: CIRCUIT, closed: true, lift: ROAD.lift },
    { points: ringWaypoints(ROAD.ringRadius), closed: true, lift: ROAD.lift + 0.02 },
    ...SPOKES.map((points) => ({ points, closed: false, lift: ROAD.lift + 0.04 })),
  ];

  for (const road of roads) {
    appendRibbon(
      createCurve(road.points, road.closed),
      { width: ROAD.width, lift: road.lift, colorAt: roadColorAt },
      positions,
      colors,
    );
  }

  return toGeometry(positions, colors);
}

/** Ballast, sleepers and two rails. */
export function createRailGeometry(): BufferGeometry {
  const curve = createCurve(RAIL_LINE, false);
  const positions: number[] = [];
  const colors: number[] = [];

  appendRibbon(
    curve,
    {
      width: RAIL.bedWidth,
      lift: RAIL.lift,
      colorAt: (x, z) => new Color(isOnBridge(x, z) ? WORLD_COLORS.timberDark : WORLD_COLORS.ballast),
    },
    positions,
    colors,
  );

  appendSleepers(curve, RAIL.sleeperSpacing, RAIL.gauge + 0.9, RAIL.lift + 0.08, new Color(WORLD_COLORS.timberDark), positions, colors);

  for (const side of [-1, 1]) {
    appendRibbon(
      curve,
      {
        width: RAIL.railWidth,
        lift: RAIL.lift + 0.2,
        lateralOffset: (side * RAIL.gauge) / 2,
        colorAt: () => new Color(WORLD_COLORS.rail),
      },
      positions,
      colors,
    );
  }

  return toGeometry(positions, colors);
}

/** The river: a strip of deep water with lighter shallows either side. */
export function createRiverGeometry(): BufferGeometry {
  const half = 150;
  const spine: Waypoint[] = [];
  for (let z = -half; z <= half; z += 6) {
    spine.push([riverCentreX(z), z]);
  }
  const curve = createCurve(spine, false);

  const shallows: number[] = [];
  const shallowColors: number[] = [];
  appendRibbon(
    curve,
    {
      width: (RIVER_HALF_WIDTH + 1.6) * 2,
      lift: 0,
      fixedHeight: WATER_LEVEL - 0.04,
      colorAt: () => new Color(WORLD_COLORS.waterEdge),
      step: 2,
    },
    shallows,
    shallowColors,
  );

  const deep: number[] = [];
  const deepColors: number[] = [];
  appendRibbon(
    curve,
    {
      width: RIVER_HALF_WIDTH * 2,
      lift: 0,
      fixedHeight: WATER_LEVEL,
      colorAt: () => new Color(WORLD_COLORS.water),
      step: 2,
    },
    deep,
    deepColors,
  );

  return merge([toGeometry(shallows, shallowColors), toGeometry(deep, deepColors)]);
}

/** The curve the pickup follows. */
export const CAR_CURVE: CatmullRomCurve3 = createCurve(CIRCUIT, true);

/** The curve the train follows. */
export const TRAIN_CURVE: CatmullRomCurve3 = createCurve(RAIL_LINE, false);
