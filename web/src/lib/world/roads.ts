import { BufferGeometry, CatmullRomCurve3, Color, Float32BufferAttribute, PlaneGeometry } from "three";

import { blob, merge } from "./builders";
import { BRIDGE_DECK_HEIGHT, LAKE, RIVER, ROAD, WORLD_COLORS } from "./constants";
import { createCurve } from "./curves";
import {
  BRIDGES,
  DRIVEWAYS,
  ENTRY_ROAD,
  FOOTBRIDGE,
  MAIN_ROAD,
  PARKING_LOTS,
  PATHS,
  PLATEAU_EAST,
  PLATEAU_TRACK,
  PLATEAU_WEST,
  PORT_SPUR,
  ROAD_WIDTHS,
  SHORE_STREET,
  type ParkingLot,
} from "./road-network";
import { RIVER_COURSE, bridgeDeckAt, lakeDistance, riverDistance, riverSurfaceHeightAt, terrainHeightAt } from "./terrain";
import { SURFACE, type SurfaceKey } from "./textures";

/**
 * Streets, tracks and water - everything that is a ribbon laid on the ground, plus the
 * lake surface.
 *
 * The network itself is data in road-network.ts, and the terrain is graded to it
 * before anything here runs: under every ribbon the ground is already flat across the
 * road's width and at the road's level, so a ribbon needs only a hair of lift. Drawing
 * order does the rest - every shoulder first, then every track and yard, then every
 * carriageway, then the lines - so a junction is a carriageway crossing a carriageway,
 * not one road's pavement painted across another's.
 */

/** Whether a point sits on the footbridge deck over the river below the dam. */
export function isOnBridge(x: number, z: number): boolean {
  return x > LAKE.dam.x && riverDistance(x, z) < RIVER.halfWidth + 3;
}

/** The level a ribbon sits at: the graded ground, or a bridge deck where there is one. */
export function surfaceHeightAt(x: number, z: number): number {
  const ground = terrainHeightAt(x, z);
  const deck = Math.max(bridgeDeckAt(x, z), isOnBridge(x, z) ? BRIDGE_DECK_HEIGHT : Number.NEGATIVE_INFINITY);
  return Math.max(ground, deck);
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

/**
 * Turns a sink into geometry.
 *
 * `upright` replaces the computed normals with a constant +Y. Roads lie on the ground,
 * and per-face normals on a ribbon that follows even a gentle slope give every quad a
 * slightly different shade - a corrugated banding down the length of every street.
 */
function toGeometry(sink: Sink, unitsPerTile: number, upright = false): BufferGeometry {
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

  if (upright) {
    const normals = new Float32Array(count * 3);
    for (let index = 0; index < count; index += 1) normals[index * 3 + 1] = 1;
    geometry.setAttribute("normal", new Float32BufferAttribute(normals, 3));
  } else {
    geometry.computeVertexNormals();
  }

  return geometry;
}

/** Drawing order, as lift above the graded ground. */
const LAYER = {
  shoulder: ROAD.lift,
  track: ROAD.lift + 0.03,
  carriageway: ROAD.lift + 0.06,
  line: ROAD.lift + 0.09,
} as const;

/** How high the bridge parapets stand above the deck. */
const BRIDGE_PARAPET_HEIGHT = 0.9;

const STREET = new Color(WORLD_COLORS.street);
const KERB = new Color(WORLD_COLORS.kerb);
const TRACK = new Color(WORLD_COLORS.road);
const DECK = new Color(WORLD_COLORS.timber);
const PAVING = new Color(WORLD_COLORS.paving);
const LINE = new Color(WORLD_COLORS.roadLine);

/** The broken white line down the middle of a carriageway. */
function appendCentreLine(curve: CatmullRomCurve3, lift: number, sink: Sink): void {
  const length = curve.getLength();
  const dashes = Math.max(1, Math.floor(length / ROAD.centreLineSpacing));
  for (let index = 0; index < dashes; index += 1) {
    const from = (index + 0.32) / dashes;
    const to = (index + 0.68) / dashes;
    const start = curve.getPointAt(from);
    const end = curve.getPointAt(to);
    appendRibbon(
      createCurve([[start.x, start.z], [end.x, end.z]], false),
      { width: ROAD.centreLineWidth, lift, colorAt: () => LINE, surfaceAt: () => "plain", step: 1.4 },
      sink,
    );
  }
}

/** Parapets either side of a road bridge, standing on the deck. */
function appendBridgeParapets(sink: Sink): void {
  const parapet = new Color(WORLD_COLORS.stone);
  for (const bridge of BRIDGES) {
    const curve = createCurve([bridge.from, bridge.to], false);
    for (const side of [-1, 1]) {
      appendRibbon(
        curve,
        {
          width: 0.5,
          lift: BRIDGE_PARAPET_HEIGHT,
          lateralOffset: side * (bridge.halfWidth - 0.25),
          heightAt: () => bridge.deck,
          colorAt: () => parapet,
          surfaceAt: () => "stone",
          step: 2,
        },
        sink,
      );
    }
    // The deck slab, a little wider than the track that rides it.
    appendRibbon(
      curve,
      { width: bridge.halfWidth * 2, lift: -0.02, heightAt: () => bridge.deck, colorAt: () => parapet, surfaceAt: () => "stone", step: 2 },
      sink,
    );
  }
}

/** Every street, driveway, path, car park, footbridge and yard, as one geometry. */
export function createRoadGeometry(): BufferGeometry {
  const sink = createSink();
  const streets = [MAIN_ROAD, SHORE_STREET, ENTRY_ROAD].map((points) => createCurve(points, false));
  const tracks = [PLATEAU_TRACK, PLATEAU_WEST, PLATEAU_EAST, PORT_SPUR].map((points) => createCurve(points, false));
  const streetWidth = ROAD_WIDTHS.streetWidth;
  const shoulderWidth = streetWidth + ROAD_WIDTHS.kerbExtra;

  // Layer 1: the pale shoulders of every street.
  for (const curve of streets) {
    appendRibbon(curve, { width: shoulderWidth, lift: LAYER.shoulder, colorAt: () => KERB, surfaceAt: () => "plain" }, sink);
  }

  // Layer 2: unpaved tracks, driveways, yards and car parks. Below the carriageways, so
  // where a driveway meets a street the street wins.
  for (const curve of tracks) {
    appendRibbon(curve, { width: ROAD_WIDTHS.trackWidth, lift: LAYER.track, colorAt: () => TRACK, surfaceAt: () => "dirt" }, sink);
  }
  for (const driveway of DRIVEWAYS) {
    const street = driveway.surface === "street";
    appendRibbon(
      createCurve(driveway.points, false),
      { width: driveway.width, lift: street ? LAYER.carriageway : LAYER.track, colorAt: () => (street ? STREET : TRACK), surfaceAt: () => (street ? "plain" : "dirt") },
      sink,
    );
    appendDisc(driveway.yard[0], driveway.yard[1], driveway.yardRadius, LAYER.track, street ? STREET : TRACK, street ? "plain" : "dirt", sink);
  }
  for (const lot of PARKING_LOTS) {
    appendRectangle(lot, LAYER.track, KERB, "plain", sink);
  }

  // Layer 3: the carriageways, then their lines.
  for (const curve of streets) {
    appendRibbon(curve, { width: streetWidth, lift: LAYER.carriageway, colorAt: () => STREET, surfaceAt: () => "plain" }, sink);
  }
  for (const curve of streets) {
    appendCentreLine(curve, LAYER.line, sink);
  }

  for (const path of PATHS) {
    appendRibbon(createCurve(path, false), { width: ROAD_WIDTHS.pathWidth, lift: LAYER.line, colorAt: () => PAVING, surfaceAt: () => "paving" }, sink);
  }

  appendBridgeParapets(sink);
  appendRibbon(
    createCurve(FOOTBRIDGE, false),
    {
      width: 2.2,
      lift: LAYER.line,
      colorAt: () => DECK,
      surfaceAt: () => "planks",
      heightAt: (x, z) => Math.max(terrainHeightAt(x, z), BRIDGE_DECK_HEIGHT + 0.6),
    },
    sink,
  );

  // One tile for the whole network. The atlas lookup wraps with fract(), and the mip
  // level the GPU picks from the derivative blows up at every wrap - a dark seam across
  // the carriageway every couple of metres. Paved surfaces are flat colour anyway.
  return toGeometry(sink, 4000, true);
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
  const columns = 200;
  const rows = 200;

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
      // Full colour a boat-length from the shore. Over 22 units the shallows read as a
      // wide pale shelf along every bank.
      depths.push(Math.min(1, Math.max(0, -distances[vertex] / 8)));
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

/**
 * The yacht keeps to the south-east basin, off the square and the resort.
 *
 * The two loops share no water: the sailboat rounds the peninsula while the yacht stays
 * south of it, and neither passes a mooring. They used to cross, and the sailboat's old
 * loop ran straight through the island. `npm run check:layout` measures both.
 */
export const YACHT_CURVE: CatmullRomCurve3 = createCurve(
  [[10, 60], [-20, 74], [-50, 50], [-40, 20], [0, 10], [24, 30]],
  true,
);

/** The sailboat rounds the peninsula: up the north strait and back along its south shore. */
export const SAILBOAT_CURVE: CatmullRomCurve3 = createCurve(
  [[-30, -100], [-90, -106], [-150, -100], [-192, -70], [-200, -30], [-176, -6], [-150, 4], [-100, -2], [-56, -6], [-10, -28], [-8, -70]],
  true,
);
