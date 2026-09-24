import { BufferGeometry, CatmullRomCurve3, Color, Float32BufferAttribute, PlaneGeometry } from "three";

import { blob, merge } from "./builders";
import { BRIDGE_DECK_HEIGHT, LAKE, RIVER, ROAD, WORLD_COLORS } from "./constants";
import { createCurve } from "./curves";
import { BRIDGES, ENTRY_ROAD, FOOTBRIDGE, MAIN_ROAD, PLATEAU_TRACK, PORT_SPUR, type Waypoint } from "./road-network";
import { landHeightAt } from "./outer-land";
import { RIVER_COURSE, bridgeDeckAt, riverDistance, riverSurfaceHeightAt, terrainHeightAt } from "./terrain";
import { SURFACE, type SurfaceKey } from "./textures";

/**
 * The ribbons that are not road surfaces - the bridges, the river and the lake - and the
 * routes the traffic and the boats follow.
 *
 * The network itself is data in road-network.ts and its surfaces are built by
 * road-surfaces.ts. The terrain is graded to the network before anything here runs: under
 * every ribbon the ground is already flat across the road's width and at the road's level,
 * so a ribbon needs only a hair of lift.
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
 * Appends a draped ribbon along a curve.
 *
 * Each sample gets one perpendicular, from the tangent through it, and the quads either
 * side of a sample share its two edge vertices exactly. Built segment by segment, with
 * each quad squared to its own chord, consecutive quads met at an angle on every bend:
 * a wedge of gap on the outside, a wedge of overlap on the inside, and through the gaps
 * the pale shoulder showed as a ladder of rungs down every curve.
 *
 * Each quad is wound (left0, right0, left1), (right0, right1, left1), which gives a +Y
 * face normal whichever way the curve runs.
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

  // The perpendicular at each sample, from the tangent through it.
  const perps = samples.map((sample, index) => {
    const before = samples[Math.max(0, index - 1)];
    const after = samples[Math.min(samples.length - 1, index + 1)];
    const tangentX = after.x - before.x;
    const tangentZ = after.z - before.z;
    const magnitude = Math.hypot(tangentX, tangentZ) || 1;
    return [tangentZ / magnitude, -tangentX / magnitude] as const;
  });

  const edge = (index: number, lateral: number): readonly [number, number] => {
    const sample = samples[index];
    const [perpX, perpZ] = perps[index];
    const half = widthAt(sample.x, sample.z) / 2;
    return [sample.x + perpX * (offset + half * -lateral), sample.z + perpZ * (offset + half * -lateral)];
  };

  for (let index = 0; index < samples.length - 1; index += 1) {
    const centre0 = samples[index];
    const centre1 = samples[index + 1];

    for (let lane = 0; lane < lanes; lane += 1) {
      const a = -1 + (2 * lane) / lanes;
      const b = -1 + (2 * (lane + 1)) / lanes;

      const left0 = edge(index, a);
      const right0 = edge(index, b);
      const left1 = edge(index + 1, a);
      const right1 = edge(index + 1, b);

      const mid = (a + b) / 2;
      const color0 = options.colorAt(centre0.x, centre0.z, mid);
      const color1 = options.colorAt(centre1.x, centre1.z, mid);
      const surface0 = options.surfaceAt(centre0.x, centre0.z);
      const surface1 = options.surfaceAt(centre1.x, centre1.z);
      const foam0 = foamAt(centre0.x, centre0.z);
      const foam1 = foamAt(centre1.x, centre1.z);

      pushVertex(sink, left0[0], surface(left0[0], left0[1]), left0[1], color0, surface0, depth, foam0);
      pushVertex(sink, right0[0], surface(right0[0], right0[1]), right0[1], color0, surface0, depth, foam0);
      pushVertex(sink, left1[0], surface(left1[0], left1[1]), left1[1], color1, surface1, depth, foam1);
      pushVertex(sink, right0[0], surface(right0[0], right0[1]), right0[1], color0, surface0, depth, foam0);
      pushVertex(sink, right1[0], surface(right1[0], right1[1]), right1[1], color1, surface1, depth, foam1);
      pushVertex(sink, left1[0], surface(left1[0], left1[1]), left1[1], color1, surface1, depth, foam1);
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

/**
 * Drawing order, as lift above the graded ground.
 *
 * The steps are 0.15 apart. At 0.06 the shoulder and the carriageway sat within the
 * depth buffer's precision of each other at the hub's distance, and which one won was
 * decided quad by quad - a ladder of pale rungs down every curve, on the demo machine
 * and in headless Chromium alike. A quarter of a unit is still invisible as a step.
 */
const LAYER = {
  shoulder: ROAD.lift,
  track: ROAD.lift + 0.15,
  carriageway: ROAD.lift + 0.3,
  line: ROAD.lift + 0.45,
} as const;

/** How high the bridge parapets stand above the deck. */
const BRIDGE_PARAPET_HEIGHT = 0.9;

const DECK = new Color(WORLD_COLORS.timber);

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

/**
 * The built parts of the network: the road bridge's parapets and deck, and the footbridge
 * below the dam. The road surfaces themselves are drawn by road-surfaces.ts with the road
 * material; these are stone and timber, and take the world atlas like any building.
 */
export function createRoadStructureGeometry(): BufferGeometry {
  const sink = createSink();

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
  // the surface every couple of metres.
  return toGeometry(sink, 4000, true);
}

// ---------------------------------------------------------------------------------
// Water
// ---------------------------------------------------------------------------------

/** How far above the water a triangle of the surface grid may reach and still be kept. */
const WATER_SURFACE_MARGIN = 1.5;
/** The depth of water at which its colour is fully the open lake's. */
const WATER_FULL_DEPTH = 2.4;

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

  // Depth is measured from the ground, not from the shoreline curve: the ground dips under
  // the water several metres inland of the curve, and measured from the curve the whole
  // strip between read as shallows - a wide brown band round every shore.
  const depthsAt = new Float32Array(source.count);
  for (let vertex = 0; vertex < source.count; vertex += 1) {
    depthsAt[vertex] = LAKE.level - landHeightAt(source.getX(vertex), source.getZ(vertex));
  }

  const positions: number[] = [];
  const colors: number[] = [];
  const depths: number[] = [];
  const foams: number[] = [];
  const uvs: number[] = [];

  for (let tri = 0; tri < index.count; tri += 3) {
    const corners = [index.getX(tri), index.getX(tri + 1), index.getX(tri + 2)];
    // Keep any triangle that reaches the water; the rest of it hides under the bank.
    if (corners.every((vertex) => depthsAt[vertex] < -WATER_SURFACE_MARGIN)) continue;

    for (const vertex of corners) {
      const x = source.getX(vertex);
      const z = source.getZ(vertex);
      positions.push(x, LAKE.level, z);
      colors.push(1, 1, 1);
      depths.push(Math.min(1, Math.max(0, depthsAt[vertex] / WATER_FULL_DEPTH)));
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

/**
 * The road the traffic runs: in from the south-east, the length of the community, over
 * the channel bridge and up the plateau to the Ovni Porto's gate.
 *
 * One continuous route, because a vehicle can only follow one. It used to be the main
 * road alone, and reaching the north end the car jumped back to the south end in front
 * of the visitor; it shuttles now - see `Vehicles`.
 */
export const CAR_ROUTE: readonly Waypoint[] = [
  ...[...ENTRY_ROAD].reverse().slice(0, -1),
  ...MAIN_ROAD,
  ...PLATEAU_TRACK.slice(1),
  ...PORT_SPUR.slice(1),
];

export const CAR_CURVE: CatmullRomCurve3 = createCurve(CAR_ROUTE, false);

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
