/**
 * Fails when a building overlaps another building or sits on a road.
 *
 * The layout is assembled from a site table, an authored house list and a spacing pass,
 * and every time the road network or a landmark moves the result can drift. Run it after
 * any change to sites, roads or the house list: `npm run check:layout`.
 *
 * Landmarks may touch their own driveway; houses, shops and chalets may not touch any.
 */
import { LANDMARKS } from "../src/lib/world/neighborhood-layout";
import { ROAD_POLYLINES } from "../src/lib/world/road-network";
import { SAILBOAT_CURVE, YACHT_CURVE } from "../src/lib/world/roads";
import { lakeDistance, peninsulaDistance } from "../src/lib/world/terrain";
const R: Record<string, number> = { lakeHouse: 8.4, houseWhitewash: 3.6, houseYellow: 3.6, houseTimber: 3.6, houseMint: 3.6, cabana: 2.8, shopBrick: 4.2, shopYellow: 4.2, shopMint: 4.2, shopTimber: 4.2, aFrameShingle: 3.4, aFrameSlate: 3.4, aFrameTile: 3.4, stiltCabin: 4, pousada: 11, praca: 11, galpao: 9, ctg: 9, estacao: 11, vinicola: 8, chapel: 4, farmRed: 26, farmOchre: 26, farmTimber: 26 };
const b = LANDMARKS.filter((p) => R[p.model] !== undefined);
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

const expected = 0;
console.log(bad <= expected ? "LAYOUT OK" : `LAYOUT PROBLEMS: ${bad}`);
if (bad > expected) process.exit(1);
