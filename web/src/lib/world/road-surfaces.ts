import { BufferGeometry, Float32BufferAttribute } from "three";

import { ROAD, ROAD_SURFACE } from "./constants";
import { createCurve } from "./curves";
import { buildCentrelines, clearanceToOtherRoads, markingWeightAt } from "./road-junctions";
import {
  CROSSWALKS,
  DRIVEWAYS,
  ENTRY_ROAD,
  MAIN_ROAD,
  PARKING_LOTS,
  PATHS,
  PLATEAU_EAST,
  PLATEAU_TRACK,
  PLATEAU_WEST,
  PORT_SPUR,
  ROAD_POLYLINES,
  ROAD_WIDTHS,
  SHORE_STREET,
  type ParkingLot,
  type Waypoint,
} from "./road-network";
import { surfaceHeightAt } from "./roads";
import { lakeDistance, surfaceColorAt, terrainHeightAt } from "./terrain";

/**
 * Every road surface in the world, as one geometry for the road material.
 *
 * A street is a carriageway, a kerb that is a real step with a face, and a raised pavement
 * of slabs - or, out of town, a gravel shoulder and white edge lines. Tracks are earth.
 * Each vertex carries where it sits across and along its road and what it is, and the
 * material paints from that. Pavements and markings stop short of every other road's edge,
 * so no kerb stands across a junction and no line runs through one. See design.md D6 of
 * elevate-world-realism.
 */

/** What a road vertex is. Matches the road material's branches. */
export const ROAD_KIND = {
  asphalt: 0,
  pavement: 1,
  kerb: 2,
  earth: 3,
  gravel: 4,
  parking: 5,
  /** Grass: the verge that carries a raised road's edge down to the field. */
  verge: 6,
} as const;

type RoadKind = keyof typeof ROAD_KIND;

/** Lift above the graded ground. Earth sits under asphalt, so a street always wins a junction. */
export const LIFT = {
  track: ROAD.lift + 0.15,
  carriageway: ROAD.lift + 0.3,
} as const;

export const PAVEMENT_TOP = LIFT.carriageway + ROAD_SURFACE.kerbHeight;

interface Sink {
  readonly positions: number[];
  readonly normals: number[];
  readonly frames: number[];
  readonly infos: number[];
  readonly colors: number[];
}

interface Sample {
  readonly x: number;
  readonly z: number;
  readonly along: number;
  readonly perpX: number;
  readonly perpZ: number;
}

/** What a strip's vertices say about themselves, beyond where they are. */
interface Paint {
  readonly kind: RoadKind;
  readonly halfWidth: number;
  readonly marking?: number;
  readonly edgeLines?: number;
  readonly crossing?: number;
}

function pushVertex(sink: Sink, x: number, y: number, z: number, normal: readonly [number, number, number], lateral: number, along: number, paint: Paint): void {
  sink.positions.push(x, y, z);
  sink.normals.push(...normal);
  sink.frames.push(lateral, along, paint.halfWidth);
  sink.infos.push(ROAD_KIND[paint.kind], paint.marking ?? 0, paint.edgeLines ?? 0, paint.crossing ?? 0);
  const ground = surfaceColorAt(x, z, terrainHeightAt(x, z));
  sink.colors.push(ground.r, ground.g, ground.b);
}

/** Samples a road's curve at a fixed spacing, with the perpendicular at each sample. */
function sampleRoad(points: readonly Waypoint[], closed: boolean, step: number): readonly Sample[] {
  const curve = createCurve(points, closed);
  const length = curve.getLength();
  const divisions = Math.max(4, Math.ceil(length / step));
  const spaced = curve.getSpacedPoints(divisions);
  return spaced.map((point, index) => {
    const before = spaced[Math.max(0, index - 1)];
    const after = spaced[Math.min(spaced.length - 1, index + 1)];
    const tangentX = after.x - before.x;
    const tangentZ = after.z - before.z;
    const magnitude = Math.hypot(tangentX, tangentZ) || 1;
    return { x: point.x, z: point.z, along: (index / divisions) * length, perpX: tangentZ / magnitude, perpZ: -tangentX / magnitude };
  });
}

function at(sample: Sample, lateral: number): readonly [number, number] {
  return [sample.x + sample.perpX * lateral, sample.z + sample.perpZ * lateral];
}

interface StripOptions {
  /** Across the road, in metres from the centreline; either order. */
  readonly from: number;
  readonly to: number;
  readonly lift: number;
  /** Subdivisions across, so the strip follows the graded ground. */
  readonly lanes?: number;
  readonly paintAt: (sample: Sample) => Paint;
  /** Leaves a segment out - a pavement stopping at a junction. */
  readonly include?: (sample: Sample) => boolean;
}

const UP: readonly [number, number, number] = [0, 1, 0];

/**
 * A flat strip along a road, between two lateral offsets. Quads are wound as the old
 * ribbons were - (high0, low0, high1), (low0, low1, high1) - which faces +Y whichever way
 * the curve runs; the material is two-sided besides.
 */
function appendStrip(samples: readonly Sample[], options: StripOptions, sink: Sink): void {
  const high = Math.max(options.from, options.to);
  const low = Math.min(options.from, options.to);
  const lanes = options.lanes ?? 1;
  const height = (x: number, z: number): number => surfaceHeightAt(x, z) + options.lift;

  for (let index = 0; index < samples.length - 1; index += 1) {
    const s0 = samples[index];
    const s1 = samples[index + 1];
    if (options.include && !(options.include(s0) && options.include(s1))) continue;
    const paint0 = options.paintAt(s0);
    const paint1 = options.paintAt(s1);

    for (let lane = 0; lane < lanes; lane += 1) {
      const a = high - ((high - low) * lane) / lanes;
      const b = high - ((high - low) * (lane + 1)) / lanes;
      const quad: ReadonlyArray<readonly [Sample, number, Paint]> = [
        [s0, a, paint0], [s0, b, paint0], [s1, a, paint1],
        [s0, b, paint0], [s1, b, paint1], [s1, a, paint1],
      ];
      for (const [sample, lateral, paint] of quad) {
        const [x, z] = at(sample, lateral);
        pushVertex(sink, x, height(x, z), z, UP, lateral, sample.along, paint);
      }
    }
  }
}

/** A vertical face along a road at one lateral offset - a kerb, or a pavement's outer edge. */
function appendFace(
  samples: readonly Sample[],
  lateral: number,
  bottomLift: number,
  topLift: number,
  facing: 1 | -1,
  paint: Paint,
  include: (sample: Sample) => boolean,
  sink: Sink,
): void {
  for (let index = 0; index < samples.length - 1; index += 1) {
    const s0 = samples[index];
    const s1 = samples[index + 1];
    if (!(include(s0) && include(s1))) continue;
    const [x0, z0] = at(s0, lateral);
    const [x1, z1] = at(s1, lateral);
    const ground0 = surfaceHeightAt(x0, z0);
    const ground1 = surfaceHeightAt(x1, z1);
    const normal: readonly [number, number, number] = [s0.perpX * facing, 0, s0.perpZ * facing];
    const corners: ReadonlyArray<readonly [number, number, number, Sample]> = [
      [x0, ground0 + bottomLift, z0, s0], [x0, ground0 + topLift, z0, s0], [x1, ground1 + bottomLift, z1, s1],
      [x0, ground0 + topLift, z0, s0], [x1, ground1 + topLift, z1, s1], [x1, ground1 + bottomLift, z1, s1],
    ];
    for (const [x, y, z, sample] of corners) pushVertex(sink, x, y, z, normal, lateral, sample.along, paint);
  }
}

/**
 * A grass verge from a road's raised edge down to the field beside it. Every road surface
 * floats a little over the graded ground so the ground never shows through it, and without
 * a verge that float stood as a pale wall along every pavement.
 */
function appendVerge(
  samples: readonly Sample[],
  side: 1 | -1,
  from: number,
  fromLift: number,
  include: (sample: Sample) => boolean,
  sink: Sink,
): void {
  const to = from + ROAD_SURFACE.vergeWidth;
  for (let index = 0; index < samples.length - 1; index += 1) {
    const s0 = samples[index];
    const s1 = samples[index + 1];
    if (!(include(s0) && include(s1))) continue;
    const paint: Paint = { kind: "verge", halfWidth: to };
    const corners: ReadonlyArray<readonly [Sample, number, number]> = [
      [s0, from, fromLift], [s0, to, ROAD_SURFACE.vergeFoot], [s1, from, fromLift],
      [s0, to, ROAD_SURFACE.vergeFoot], [s1, to, ROAD_SURFACE.vergeFoot], [s1, from, fromLift],
    ];
    for (const [sample, lateral, lift] of corners) {
      const [x, z] = at(sample, side * lateral);
      pushVertex(sink, x, surfaceHeightAt(x, z) + lift, z, UP, side * lateral, sample.along, paint);
    }
  }
}

/** A flat disc: a yard at a driveway's end. `lateral` is the distance from the centre. */
function appendDisc(x: number, z: number, radius: number, lift: number, kind: RoadKind, sink: Sink): void {
  const segments = 24;
  const rings = Math.max(1, Math.ceil(radius / 2));
  const paint: Paint = { kind, halfWidth: radius };
  const point = (ring: number, index: number): readonly [number, number, number] => {
    const angle = (index / segments) * Math.PI * 2;
    const r = (ring / rings) * radius;
    return [x + Math.cos(angle) * r, z + Math.sin(angle) * r, r];
  };
  const push = ([px, pz, r]: readonly [number, number, number], index: number): void =>
    pushVertex(sink, px, surfaceHeightAt(px, pz) + lift, pz, UP, r, (index / segments) * Math.PI * 2 * radius, paint);

  for (let ring = 0; ring < rings; ring += 1) {
    for (let index = 0; index < segments; index += 1) {
      push(point(ring, index), index);
      push(point(ring + 1, index + 1), index + 1);
      push(point(ring + 1, index), index);
      if (ring > 0) {
        push(point(ring, index), index);
        push(point(ring, index + 1), index + 1);
        push(point(ring + 1, index + 1), index + 1);
      }
    }
  }
}

/** A car park: asphalt with bays painted across it, in the lot's own frame. */
function appendParking(lot: ParkingLot, sink: Sink): void {
  const cos = Math.cos(lot.rotationY);
  const sin = Math.sin(lot.rotationY);
  const cells = 6;
  const paint: Paint = { kind: "parking", halfWidth: lot.depth / 2 };
  for (let i = 0; i < cells; i += 1) {
    for (let j = 0; j < cells; j += 1) {
      const u0 = -lot.width / 2 + (i / cells) * lot.width;
      const u1 = -lot.width / 2 + ((i + 1) / cells) * lot.width;
      const v0 = -lot.depth / 2 + (j / cells) * lot.depth;
      const v1 = -lot.depth / 2 + ((j + 1) / cells) * lot.depth;
      for (const [u, v] of [[u0, v0], [u0, v1], [u1, v0], [u1, v0], [u0, v1], [u1, v1]] as const) {
        const px = lot.x + u * cos + v * sin;
        const pz = lot.z - u * sin + v * cos;
        pushVertex(sink, px, surfaceHeightAt(px, pz) + LIFT.track, pz, UP, v, u + lot.width / 2, paint);
      }
    }
  }
}

const CENTRELINES = buildCentrelines(ROAD_POLYLINES);

/** Whether a street sample lies in town, where streets have kerbs and pavements. */
function inTown(street: readonly Waypoint[], sample: Sample): boolean {
  if (street === SHORE_STREET) return true;
  if (street === MAIN_ROAD) return sample.z > ROAD_SURFACE.townNorth && sample.z < ROAD_SURFACE.townSouth;
  return false;
}

function crossingAt(street: readonly Waypoint[], sample: Sample): number {
  return CROSSWALKS.some((crosswalk) => crosswalk.road === street && Math.hypot(sample.x - crosswalk.at[0], sample.z - crosswalk.at[1]) < ROAD_SURFACE.crosswalkHalfLength)
    ? 1
    : 0;
}

function appendStreet(street: readonly Waypoint[], sink: Sink): void {
  const samples = sampleRoad(street, false, ROAD_SURFACE.step);
  const halfWidth = ROAD_WIDTHS.streetWidth / 2;
  const pavement = ROAD_WIDTHS.kerbExtra / 2;
  const clearanceAt = (x: number, z: number): number => clearanceToOtherRoads(x, z, street, CENTRELINES);

  appendStrip(
    samples,
    {
      from: -halfWidth,
      to: halfWidth,
      lift: LIFT.carriageway,
      lanes: 4,
      paintAt: (sample) => ({
        kind: "asphalt",
        halfWidth,
        marking: markingWeightAt(clearanceAt(sample.x, sample.z), ROAD_SURFACE.junctionMargin, ROAD_SURFACE.junctionFade),
        edgeLines: inTown(street, sample) ? 0 : 1,
        crossing: crossingAt(street, sample),
      }),
    },
    sink,
  );

  for (const side of [-1, 1] as const) {
    const kerb = side * halfWidth;
    const outer = side * (halfWidth + pavement);
    // Kerbs and pavements stop where another road's edge begins - a driveway, a junction.
    const kerbed = (sample: Sample): boolean => {
      if (!inTown(street, sample)) return false;
      const [x, z] = at(sample, side * (halfWidth + pavement / 2));
      return clearanceAt(x, z) > ROAD_SURFACE.pavementClearance;
    };
    // Along the water there is no pavement: the kerb gives straight onto the grass bank.
    const paved = (sample: Sample): boolean => {
      if (!kerbed(sample)) return false;
      const [x, z] = at(sample, side * (halfWidth + pavement / 2));
      return lakeDistance(x, z) > ROAD_SURFACE.waterfrontClearance;
    };
    const bank = (sample: Sample): boolean => kerbed(sample) && !paved(sample);
    const rural = (sample: Sample): boolean => !inTown(street, sample);

    appendFace(samples, kerb, LIFT.carriageway - 0.05, PAVEMENT_TOP, side === 1 ? -1 : 1, { kind: "kerb", halfWidth }, kerbed, sink);
    appendStrip(samples, { from: kerb, to: outer, lift: PAVEMENT_TOP, include: paved, paintAt: () => ({ kind: "pavement", halfWidth: pavement }) }, sink);
    appendVerge(samples, side, halfWidth + pavement, PAVEMENT_TOP, paved, sink);
    appendVerge(samples, side, halfWidth, PAVEMENT_TOP, bank, sink);
    // Out of town, a gravel shoulder under the carriageway's edge, fading into the grass.
    appendStrip(
      samples,
      { from: side * (halfWidth - 0.4), to: side * (halfWidth + ROAD_SURFACE.shoulder), lift: LIFT.track, include: rural, paintAt: () => ({ kind: "gravel", halfWidth: halfWidth + ROAD_SURFACE.shoulder }) },
      sink,
    );
    appendVerge(samples, side, halfWidth + ROAD_SURFACE.shoulder, LIFT.track, rural, sink);
  }
}

function appendTrack(points: readonly Waypoint[], width: number, kind: RoadKind, lift: number, sink: Sink): void {
  const samples = sampleRoad(points, false, ROAD_SURFACE.step);
  const halfWidth = width / 2;
  appendStrip(samples, { from: -halfWidth, to: halfWidth, lift, lanes: 2, paintAt: () => ({ kind, halfWidth }) }, sink);
}

/** Every street, track, driveway, yard, path and car park, as one geometry. */
export function createRoadSurfaceGeometry(): BufferGeometry {
  const sink: Sink = { positions: [], normals: [], frames: [], infos: [], colors: [] };

  for (const street of [MAIN_ROAD, SHORE_STREET, ENTRY_ROAD]) appendStreet(street, sink);
  for (const track of [PLATEAU_TRACK, PLATEAU_WEST, PLATEAU_EAST, PORT_SPUR]) appendTrack(track, ROAD_WIDTHS.trackWidth, "earth", LIFT.track, sink);

  for (const driveway of DRIVEWAYS) {
    const paved = driveway.surface === "street";
    appendTrack(driveway.points, driveway.width, paved ? "asphalt" : "earth", paved ? LIFT.carriageway : LIFT.track, sink);
    // Yards sit at the track's level whatever they are paved with: at the carriageway's
    // they came up through the square's own paving in dark patches.
    appendDisc(driveway.yard[0], driveway.yard[1], driveway.yardRadius, LIFT.track, paved ? "asphalt" : "gravel", sink);
  }
  // Paths sit below the carriageway: at its height they fought the street for depth
  // where they meet it, in a sawtooth of paving and tarmac.
  for (const path of PATHS) appendTrack(path, ROAD_WIDTHS.pathWidth, "pavement", LIFT.track, sink);
  for (const lot of PARKING_LOTS) appendParking(lot, sink);

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(sink.positions, 3));
  geometry.setAttribute("normal", new Float32BufferAttribute(sink.normals, 3));
  geometry.setAttribute("roadFrame", new Float32BufferAttribute(sink.frames, 3));
  geometry.setAttribute("roadInfo", new Float32BufferAttribute(sink.infos, 4));
  geometry.setAttribute("color", new Float32BufferAttribute(sink.colors, 3));
  geometry.computeBoundingSphere();
  return geometry;
}

let shared: BufferGeometry | null = null;

/**
 * The road geometry, built once and shared: the scene draws it and walk mode reads the
 * pavement's height from it. Building it asks the graded ground its height at every vertex
 * and takes seconds, too long to do twice.
 */
export function roadSurfaceGeometry(): BufferGeometry {
  shared ??= createRoadSurfaceGeometry();
  return shared;
}

/** The height a vehicle's wheels stand at on a road - the carriageway's own surface. */
export function carriagewayHeightAt(x: number, z: number): number {
  return surfaceHeightAt(x, z) + LIFT.carriageway;
}
