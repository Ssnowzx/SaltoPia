/**
 * Fails when a building overlaps another building or sits on a road, when a house stands
 * beside its twin, when something that belongs on land stands in the water, or when
 * something that belongs on the water - a boat, a pier, a stilt cabin - does not.
 *
 * The layout is assembled from a site table, an authored house list and a spacing pass,
 * and every time the road network or a landmark moves the result can drift. Run it after
 * any change to sites, roads or the house list: `npm run check:layout`.
 *
 * Landmarks may touch their own driveway; houses, shops and chalets may not touch any.
 */
import { LAKE_HOUSE_POOL } from "../src/lib/world/landmarks";
import { HOUSES, LANDMARKS, type ModelKey, type Placement, createScatter, footprintOf, groundHeightFor, roadClearance } from "../src/lib/world/neighborhood-layout";
import { PARKING_LOTS, ROAD_POLYLINES } from "../src/lib/world/road-network";
import { SAILBOAT_CURVE, YACHT_CURVE } from "../src/lib/world/roads";
import { LAKE, RIVER } from "../src/lib/world/constants";
import { landHeightAt } from "../src/lib/world/outer-land";
import { lakeDistance, peninsulaDistance, riverDistance } from "../src/lib/world/terrain";
// Every building, with the keep-out radius the layout itself spaces them by. Kept in step
// with the layout by reading it, not by a second list of names that goes stale.
const BUILT: ReadonlySet<ModelKey> = new Set<ModelKey>([
  ...HOUSES.map((house) => house.model),
  "shopBrick", "shopYellow", "shopMint", "shopTimber", "aFrameShingle", "aFrameSlate", "aFrameTile", "chaletGable", "stiltCabin",
  "pousada", "praca", "galpao", "ctg", "estacao", "vinicola", "chapel", "farmRed", "farmOchre", "farmTimber",
]);
const radius = (p: Placement): number => footprintOf(p) / p.scale;
const R: Record<string, number> = Object.fromEntries([...BUILT].map((model) => [model, radius(LANDMARKS.find((p) => p.model === model) ?? { model, x: 0, z: 0, rotationY: 0, scale: 1, yOffset: 0 })]));
const b = LANDMARKS.filter((p) => BUILT.has(p.model));
let bad = 0;
for (let i = 0; i < b.length; i += 1) for (let j = i + 1; j < b.length; j += 1) {
  const need = (R[b[i].model] * b[i].scale + R[b[j].model] * b[j].scale) * 0.85;
  const d = Math.hypot(b[i].x - b[j].x, b[i].z - b[j].z);
  if (d < need) { bad += 1; console.log(`OVERLAP ${b[i].model}(${b[i].x.toFixed(0)},${b[i].z.toFixed(0)}) x ${b[j].model}(${b[j].x.toFixed(0)},${b[j].z.toFixed(0)}) d=${d.toFixed(1)}<${need.toFixed(1)}`); }
}
const seg = (px: number, pz: number, ax: number, az: number, bx: number, bz: number): number => {
  const abx = bx - ax, abz = bz - az;
  const t = Math.min(1, Math.max(0, ((px - ax) * abx + (pz - az) * abz) / (abx * abx + abz * abz || 1)));
  return Math.hypot(px - (ax + abx * t), pz - (az + abz * t));
};
// Landmarks are excused from the road test: every one of them has a driveway that ends
// at its door, which is the point of a driveway.
const LANDMARK = new Set(["pousada", "praca", "galpao", "ctg", "estacao", "vinicola", "chapel", "farmRed", "farmOchre", "farmTimber"]);
for (const p of b.filter((m) => !LANDMARK.has(m.model))) {
  let best = Infinity;
  for (const line of ROAD_POLYLINES) for (let k = 0; k < line.points.length - 1; k += 1)
    best = Math.min(best, seg(p.x, p.z, line.points[k][0], line.points[k][1], line.points[k + 1][0], line.points[k + 1][1]) - line.width / 2);
  if (best < R[p.model] * p.scale * 0.8) { bad += 1; console.log(`ON ROAD ${p.model}(${p.x.toFixed(0)},${p.z.toFixed(0)}) gap=${best.toFixed(1)} r=${(R[p.model] * p.scale).toFixed(1)}`); }
}
// Car parks must clear every street, or the cars park on the carriageway.
for (const lot of PARKING_LOTS) {
  const reach = Math.hypot(lot.width, lot.depth) / 2;
  let best = Infinity;
  for (const line of ROAD_POLYLINES) for (let k = 0; k < line.points.length - 1; k += 1)
    best = Math.min(best, seg(lot.x, lot.z, line.points[k][0], line.points[k][1], line.points[k + 1][0], line.points[k + 1][1]) - line.width / 2);
  if (best < reach) { bad += 1; console.log(`CAR PARK (${lot.x},${lot.z}) on a road, gap ${best.toFixed(1)} < ${reach.toFixed(1)}`); }
}

// The boats: each loop stays on open water and off the island, the loops never come
// within a boat length of each other, and no mooring sits on a loop.
const BOAT_CLEARANCE = 12;
const yachtPoints = YACHT_CURVE.getSpacedPoints(240);
const sailPoints = SAILBOAT_CURVE.getSpacedPoints(240);
for (const [name, points] of [["yacht", yachtPoints], ["sailboat", sailPoints]] as const) {
  for (const point of points) {
    if (lakeDistance(point.x, point.z) > -5) { bad += 1; console.log(`${name} AGROUND at (${point.x.toFixed(0)},${point.z.toFixed(0)})`); break; }
    if (peninsulaDistance(point.x, point.z) < 6) { bad += 1; console.log(`${name} ON ISLAND at (${point.x.toFixed(0)},${point.z.toFixed(0)})`); break; }
  }
}
let closest = Infinity;
for (const a of yachtPoints) for (const b of sailPoints) closest = Math.min(closest, Math.hypot(a.x - b.x, a.z - b.z));
if (closest < BOAT_CLEARANCE) { bad += 1; console.log(`LOOPS CROSS: closest approach ${closest.toFixed(1)}`); }
for (const p of LANDMARKS.filter((m) => m.afloat)) {
  for (const [name, points] of [["yacht", yachtPoints], ["sailboat", sailPoints]] as const) {
    const d = Math.min(...points.map((q) => Math.hypot(q.x - p.x, q.z - p.z)));
    if (d < BOAT_CLEARANCE) { bad += 1; console.log(`MOORING ${p.model}(${p.x},${p.z}) on the ${name} loop, ${d.toFixed(1)} away`); }
  }
}
console.log(`boat loops: closest approach ${closest.toFixed(1)}`);

// No house stands beside its twin: the nearest dwelling to every dwelling is of another
// design - world-appearance spec, "Buildings read as built".
for (const house of HOUSES) {
  let nearest: Placement | null = null;
  for (const other of HOUSES) {
    if (other === house) continue;
    if (!nearest || Math.hypot(other.x - house.x, other.z - house.z) < Math.hypot(nearest.x - house.x, nearest.z - house.z)) nearest = other;
  }
  if (nearest && nearest.model === house.model) { bad += 1; console.log(`TWIN ${house.model}(${house.x.toFixed(0)},${house.z.toFixed(0)}) beside the same at (${nearest.x.toFixed(0)},${nearest.z.toFixed(0)})`); }
}

// Nothing that belongs on land stands in the water - world-appearance spec, "Nothing
// stands where it cannot". Piers and stilt cabins stand in it on purpose; boats float.
const WATERBORNE = new Set<ModelKey>(["pier", "stiltCabin", "restaurant", "rock", "salto"]);
/** How far above the water the ground must stand to count as dry. */
const WET_MARGIN = 0.3;
/** Below the dam the river runs in a gorge far under the lake's level; there it is the
 * river's own channel that is wet, not everything under the lake's surface height. */
const GORGE_REACH = 30;
// The ground's height says whether a point is wet: the lake's half-spaces run on past the
// map's edge, and the lookout's hill rises out of them. The river gorge below the dam is
// left out - its boulders stand in the current on purpose.
const inGorge = (x: number, z: number): boolean => x > LAKE.dam.x - 4 && riverDistance(x, z) < GORGE_REACH;
const inWater = (x: number, z: number): boolean =>
  inGorge(x, z) ? riverDistance(x, z) < RIVER.halfWidth + 0.5 : landHeightAt(x, z) < LAKE.level + WET_MARGIN;
for (const p of [...LANDMARKS, ...createScatter()]) {
  if (p.afloat || WATERBORNE.has(p.model)) continue;
  if (inWater(p.x, p.z)) { bad += 1; console.log(`IN THE WATER ${p.model}(${p.x.toFixed(1)},${p.z.toFixed(1)}) ground ${landHeightAt(p.x, p.z).toFixed(1)}`); }
}

// And the other way round: boats float on water, piers run from the bank out over it with
// their deck above it, and stilt cabins keep their floor dry.
/** Deck heights above each model's base, and the pier's length - props.ts. */
const PIER = { deck: 0.9, length: 10 };
const STILT_DECK = 1.7;
for (const p of LANDMARKS.filter((m) => m.afloat)) {
  if (landHeightAt(p.x, p.z) > LAKE.level - WET_MARGIN) { bad += 1; console.log(`AFLOAT ON LAND ${p.model}(${p.x},${p.z})`); }
}
for (const p of LANDMARKS.filter((m) => m.model === "pier")) {
  const farX = p.x + Math.sin(p.rotationY) * PIER.length * p.scale;
  const farZ = p.z + Math.cos(p.rotationY) * PIER.length * p.scale;
  const deck = groundHeightFor(p) + PIER.deck * p.scale;
  if (landHeightAt(p.x, p.z) < LAKE.level) { bad += 1; console.log(`PIER STARTS IN THE WATER at (${p.x},${p.z})`); }
  if (!inWater(farX, farZ)) { bad += 1; console.log(`PIER ENDS ON LAND at (${farX.toFixed(1)},${farZ.toFixed(1)})`); }
  if (deck < LAKE.level + WET_MARGIN) { bad += 1; console.log(`PIER DECK UNDER WATER at (${p.x},${p.z})`); }
}
for (const p of LANDMARKS.filter((m) => m.model === "stiltCabin")) {
  if (groundHeightFor(p) + STILT_DECK * p.scale < LAKE.level + 1) { bad += 1; console.log(`STILT CABIN FLOODED at (${p.x},${p.z})`); }
}

// A lake house's pool reaches past the house; it must still be clear of every road.
for (const p of LANDMARKS.filter((m) => m.model === "lakeHouse")) {
  const { x, z, halfWidth, halfDepth } = LAKE_HOUSE_POOL;
  const cos = Math.cos(p.rotationY);
  const sin = Math.sin(p.rotationY);
  for (const [cx, cz] of [[x - halfWidth, z - halfDepth], [x + halfWidth, z - halfDepth], [x - halfWidth, z + halfDepth], [x + halfWidth, z + halfDepth]]) {
    const wx = p.x + (cx * cos + cz * sin) * p.scale;
    const wz = p.z + (-cx * sin + cz * cos) * p.scale;
    if (roadClearance(wx, wz) < 0) { bad += 1; console.log(`POOL ON A ROAD beside lakeHouse(${p.x.toFixed(0)},${p.z.toFixed(0)}) at (${wx.toFixed(1)},${wz.toFixed(1)})`); break; }
  }
}

const expected = 0;
console.log(bad <= expected ? "LAYOUT OK" : `LAYOUT PROBLEMS: ${bad}`);
if (bad > expected) process.exit(1);
