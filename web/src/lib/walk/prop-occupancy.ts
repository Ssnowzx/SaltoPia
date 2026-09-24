import type { BufferGeometry } from "three";

/**
 * What stands in a walker's way inside an open place, and what it can stand on, read from
 * the place's own geometry rather than listed by hand.
 *
 * Every triangle is sampled at a fraction of a cell. A sample at body height marks its cell
 * as occupied - a bench back, a planter, a lamp, a fence rail, a railing post. A large, near
 * horizontal triangle low enough to step onto marks its cell as floor at its own height -
 * the square's paving, the bandstand's boards, the lookout's platform. A list kept by hand
 * missed the square's planters, and a walker went through them up to the waist. See
 * design.md of add-living-townsfolk.
 */

export interface OccupancyOptions {
  /** Cell size, in the geometry's units. */
  readonly cell: number;
  /** Anything between these heights stands in the way. */
  readonly bodyFrom: number;
  readonly bodyTo: number;
  /** Surfaces no higher than this can be stepped onto. */
  readonly stepHeight: number;
  /** Only triangles at least this large count as floor - a bench seat does not. */
  readonly floorMinArea: number;
}

export interface LocalCell {
  readonly x: number;
  readonly z: number;
}

export interface LocalFloor extends LocalCell {
  readonly height: number;
}

export interface Occupancy {
  readonly occupied: readonly LocalCell[];
  readonly floors: readonly LocalFloor[];
}

function key(column: number, row: number): string {
  return `${column},${row}`;
}

/** Rasterises a geometry, in its own frame, into occupied and floor cells. */
export function occupancyOf(geometry: BufferGeometry, options: OccupancyOptions): Occupancy {
  const position = geometry.getAttribute("position");
  const index = geometry.getIndex();
  const triangles = index ? index.count / 3 : position.count / 3;
  const occupied = new Set<string>();
  const floors = new Map<string, number>();
  const cellOf = (value: number): number => Math.floor(value / options.cell);

  for (let triangle = 0; triangle < triangles; triangle += 1) {
    const corner = (n: number): readonly [number, number, number] => {
      const vertex = index ? index.getX(triangle * 3 + n) : triangle * 3 + n;
      return [position.getX(vertex), position.getY(vertex), position.getZ(vertex)];
    };
    const [a, b, c] = [corner(0), corner(1), corner(2)];
    const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const ac = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const nx = ab[1] * ac[2] - ab[2] * ac[1];
    const ny = ab[2] * ac[0] - ab[0] * ac[2];
    const nz = ab[0] * ac[1] - ab[1] * ac[0];
    const doubleArea = Math.hypot(nx, ny, nz);
    if (doubleArea === 0) continue;

    const flat = Math.abs(ny) / doubleArea > 0.95;
    const floorCandidate = flat && doubleArea / 2 >= options.floorMinArea;
    const longest = Math.max(Math.hypot(...ab), Math.hypot(...ac), Math.hypot(b[0] - c[0], b[1] - c[1], b[2] - c[2]));
    const steps = Math.max(1, Math.ceil(longest / (options.cell * 0.5)));

    for (let i = 0; i <= steps; i += 1) {
      for (let j = 0; j <= steps - i; j += 1) {
        const u = i / steps;
        const v = j / steps;
        const x = a[0] + ab[0] * u + ac[0] * v;
        const y = a[1] + ab[1] * u + ac[1] * v;
        const z = a[2] + ab[2] * u + ac[2] * v;
        const cellKey = key(cellOf(x), cellOf(z));
        if (y >= options.bodyFrom && y <= options.bodyTo) occupied.add(cellKey);
        if (floorCandidate && y <= options.stepHeight) floors.set(cellKey, Math.max(floors.get(cellKey) ?? Number.NEGATIVE_INFINITY, y));
      }
    }
  }

  const centre = (cellKey: string): LocalCell => {
    const [column, row] = cellKey.split(",").map(Number);
    return { x: (column + 0.5) * options.cell, z: (row + 0.5) * options.cell };
  };
  return {
    occupied: [...occupied].map(centre),
    floors: [...floors.entries()].filter(([cellKey]) => !occupied.has(cellKey)).map(([cellKey, height]) => ({ ...centre(cellKey), height })),
  };
}
