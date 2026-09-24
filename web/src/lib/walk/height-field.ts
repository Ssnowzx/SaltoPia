import type { BufferGeometry } from "three";

/**
 * The surfaces a walker stands on over the ground - the square's paving, a pavement, a verge,
 * a car park - as heights at the centres of a square grid, read from the geometry the scene
 * draws rather than worked out again by rule.
 *
 * The feet were first put at the carriageway's height anywhere on a street: on the
 * pavement, a kerb's height higher, they sank to the ankle, and on the verges beside it
 * deeper. Heights are read back by bilinear interpolation between the four nearest cell
 * centres, so a kerb is climbed over half a metre rather than jumped. See design.md of
 * add-living-townsfolk.
 */

export interface HeightField {
  readonly cell: number;
  readonly heights: Map<number, number>;
}

/** Cells are keyed by column and row packed into one number; offsets keep both positive. */
const OFFSET = 32768;
const SPAN = 65536;

function key(column: number, row: number): number {
  return (column + OFFSET) * SPAN + (row + OFFSET);
}

export function createHeightField(cell: number): HeightField {
  return { cell, heights: new Map() };
}

function raiseCell(field: HeightField, column: number, row: number, height: number): void {
  const cellKey = key(column, row);
  const current = field.heights.get(cellKey);
  if (current === undefined || height > current) field.heights.set(cellKey, height);
}

/** Raises the cell a point falls in to at least a height. */
export function raiseAt(field: HeightField, x: number, z: number, height: number): void {
  raiseCell(field, Math.floor(x / field.cell), Math.floor(z / field.cell), height);
}

type Corner = readonly [number, number, number];

/** Every cell centre under a triangle takes the triangle's height there. */
function rasteriseTriangle(field: HeightField, a: Corner, b: Corner, c: Corner): void {
  const denominator = (b[2] - c[2]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[2] - c[2]);
  if (Math.abs(denominator) < 1e-9) return;
  const { cell } = field;
  const fromColumn = Math.ceil(Math.min(a[0], b[0], c[0]) / cell - 0.5);
  const toColumn = Math.floor(Math.max(a[0], b[0], c[0]) / cell - 0.5);
  const fromRow = Math.ceil(Math.min(a[2], b[2], c[2]) / cell - 0.5);
  const toRow = Math.floor(Math.max(a[2], b[2], c[2]) / cell - 0.5);
  for (let column = fromColumn; column <= toColumn; column += 1) {
    const x = (column + 0.5) * cell;
    for (let row = fromRow; row <= toRow; row += 1) {
      const z = (row + 0.5) * cell;
      const wa = ((b[2] - c[2]) * (x - c[0]) + (c[0] - b[0]) * (z - c[2])) / denominator;
      const wb = ((c[2] - a[2]) * (x - c[0]) + (a[0] - c[0]) * (z - c[2])) / denominator;
      const wc = 1 - wa - wb;
      if (wa < -1e-6 || wb < -1e-6 || wc < -1e-6) continue;
      raiseCell(field, column, row, wa * a[1] + wb * b[1] + wc * c[1]);
    }
  }
}

/**
 * Rasterises a geometry's upward faces, in world space. Faces steeper than `minUp` - a
 * kerb's face, a wall - are left out; the surface on top of them is what is stood on.
 */
export function rasteriseTops(field: HeightField, geometry: BufferGeometry, minUp: number): void {
  const position = geometry.getAttribute("position");
  const index = geometry.getIndex();
  const triangles = (index ? index.count : position.count) / 3;
  const corner = (triangle: number, n: number): Corner => {
    const vertex = index ? index.getX(triangle * 3 + n) : triangle * 3 + n;
    return [position.getX(vertex), position.getY(vertex), position.getZ(vertex)];
  };
  for (let triangle = 0; triangle < triangles; triangle += 1) {
    const a = corner(triangle, 0);
    const b = corner(triangle, 1);
    const c = corner(triangle, 2);
    const abx = b[0] - a[0];
    const aby = b[1] - a[1];
    const abz = b[2] - a[2];
    const acx = c[0] - a[0];
    const acy = c[1] - a[1];
    const acz = c[2] - a[2];
    const nx = aby * acz - abz * acy;
    const ny = abz * acx - abx * acz;
    const nz = abx * acy - aby * acx;
    const length = Math.hypot(nx, ny, nz);
    if (length === 0 || Math.abs(ny) / length < minUp) continue;
    rasteriseTriangle(field, a, b, c);
  }
}

/** The surface's height at a point, or -Infinity where there is none. */
export function heightFieldAt(field: HeightField, x: number, z: number): number {
  const { cell, heights } = field;
  const fx = x / cell - 0.5;
  const fz = z / cell - 0.5;
  const column = Math.floor(fx);
  const row = Math.floor(fz);
  const h00 = heights.get(key(column, row));
  const h10 = heights.get(key(column + 1, row));
  const h01 = heights.get(key(column, row + 1));
  const h11 = heights.get(key(column + 1, row + 1));
  if (h00 !== undefined && h10 !== undefined && h01 !== undefined && h11 !== undefined) {
    const tx = fx - column;
    const tz = fz - row;
    return (h00 * (1 - tx) + h10 * tx) * (1 - tz) + (h01 * (1 - tx) + h11 * tx) * tz;
  }
  // At a surface's edge not all four neighbours are on it: the cell the point is in decides.
  return heights.get(key(Math.floor(x / cell), Math.floor(z / cell))) ?? Number.NEGATIVE_INFINITY;
}
