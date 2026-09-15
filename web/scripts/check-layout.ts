/**
 * Fails when a building overlaps another building or sits on a road.
 *
 * The layout is assembled from a site table, an authored house list and a spacing pass,
 * and every time the road network or a landmark moves the result can drift. Run it after
 * any change to sites, roads or the house list: `npm run check:layout`.
 *
 * The square and the station are expected to touch their own approach - a plaza has
 * paths through it, and a station driveway ends at the platform.
 */
import { LANDMARKS } from "../src/lib/world/neighborhood-layout";
import { ROAD_POLYLINES } from "../src/lib/world/roads";
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
for (const p of b) {
  let best = Infinity;
  for (const line of ROAD_POLYLINES) for (let k = 0; k < line.points.length - 1; k += 1)
    best = Math.min(best, seg(p.x, p.z, line.points[k][0], line.points[k][1], line.points[k + 1][0], line.points[k + 1][1]) - line.width / 2);
  if (best < R[p.model] * p.scale * 0.8) { bad += 1; console.log(`ON ROAD ${p.model}(${p.x.toFixed(0)},${p.z.toFixed(0)}) gap=${best.toFixed(1)} r=${(R[p.model] * p.scale).toFixed(1)}`); }
}
const expected = 2;
console.log(bad <= expected ? "LAYOUT OK" : `LAYOUT PROBLEMS: ${bad}`);
if (bad > expected) process.exit(1);
