/**
 * Routes on a walkability grid: A* over eight neighbours, then pulled taut by line of sight
 * so the walker goes in straight lines rather than up a staircase of cells. Pure, over a
 * grid it is handed. See design.md D6 of add-walking-character.
 */

export interface Point {
  readonly x: number;
  readonly z: number;
}

export interface WalkGrid {
  readonly cell: number;
  readonly originX: number;
  readonly originZ: number;
  readonly columns: number;
  readonly rows: number;
  /** 1 where a walker can stand. */
  readonly walkable: Uint8Array;
}

/** Samples `isWalkable` at the centre of every cell of a square region. */
export function buildWalkGrid(minX: number, minZ: number, size: number, cell: number, isWalkable: (x: number, z: number) => boolean): WalkGrid {
  const columns = Math.ceil(size / cell);
  const rows = columns;
  const walkable = new Uint8Array(columns * rows);
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      walkable[row * columns + column] = isWalkable(minX + (column + 0.5) * cell, minZ + (row + 0.5) * cell) ? 1 : 0;
    }
  }
  return { cell, originX: minX, originZ: minZ, columns, rows, walkable };
}

function cellOf(grid: WalkGrid, point: Point): readonly [number, number] {
  return [Math.floor((point.x - grid.originX) / grid.cell), Math.floor((point.z - grid.originZ) / grid.cell)];
}

function centreOf(grid: WalkGrid, column: number, row: number): Point {
  return { x: grid.originX + (column + 0.5) * grid.cell, z: grid.originZ + (row + 0.5) * grid.cell };
}

function isOpen(grid: WalkGrid, column: number, row: number): boolean {
  return column >= 0 && row >= 0 && column < grid.columns && row < grid.rows && grid.walkable[row * grid.columns + column] === 1;
}

/** The nearest walkable cell to a point, searching outward ring by ring. */
export function nearestOpenCell(grid: WalkGrid, point: Point, maxRings = 40): readonly [number, number] | null {
  const [column, row] = cellOf(grid, point);
  for (let ring = 0; ring <= maxRings; ring += 1) {
    let best: readonly [number, number] | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (let dc = -ring; dc <= ring; dc += 1) {
      for (let dr = -ring; dr <= ring; dr += 1) {
        if (Math.max(Math.abs(dc), Math.abs(dr)) !== ring || !isOpen(grid, column + dc, row + dr)) continue;
        const centre = centreOf(grid, column + dc, row + dr);
        const distance = Math.hypot(centre.x - point.x, centre.z - point.z);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = [column + dc, row + dr];
        }
      }
    }
    if (best) return best;
  }
  return null;
}

/** Whether a straight line between two cells crosses only walkable cells. */
function hasLineOfSight(grid: WalkGrid, from: readonly [number, number], to: readonly [number, number]): boolean {
  const steps = Math.max(Math.abs(to[0] - from[0]), Math.abs(to[1] - from[1])) * 2;
  for (let step = 1; step < steps; step += 1) {
    const t = step / steps;
    if (!isOpen(grid, Math.round(from[0] + (to[0] - from[0]) * t), Math.round(from[1] + (to[1] - from[1]) * t))) return false;
  }
  return true;
}

/** A binary min-heap of cell indices by score. */
function createHeap(score: Float64Array): { push: (index: number) => void; pop: () => number; size: () => number } {
  const items: number[] = [];
  const up = (position: number): void => {
    let p = position;
    while (p > 0) {
      const parent = (p - 1) >> 1;
      if (score[items[parent]] <= score[items[p]]) break;
      [items[parent], items[p]] = [items[p], items[parent]];
      p = parent;
    }
  };
  const down = (position: number): void => {
    let p = position;
    for (;;) {
      const left = p * 2 + 1;
      const right = left + 1;
      let smallest = p;
      if (left < items.length && score[items[left]] < score[items[smallest]]) smallest = left;
      if (right < items.length && score[items[right]] < score[items[smallest]]) smallest = right;
      if (smallest === p) return;
      [items[smallest], items[p]] = [items[p], items[smallest]];
      p = smallest;
    }
  };
  return {
    push: (index) => {
      items.push(index);
      up(items.length - 1);
    },
    pop: () => {
      const top = items[0];
      const last = items.pop();
      if (items.length > 0 && last !== undefined) {
        items[0] = last;
        down(0);
      }
      return top;
    },
    size: () => items.length,
  };
}

const NEIGHBOURS: ReadonlyArray<readonly [number, number, number]> = [
  [1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1],
  [1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2],
];

function aStar(grid: WalkGrid, start: readonly [number, number], goal: readonly [number, number]): number[] | null {
  const total = grid.columns * grid.rows;
  const cost = new Float64Array(total).fill(Number.POSITIVE_INFINITY);
  const score = new Float64Array(total).fill(Number.POSITIVE_INFINITY);
  const came = new Int32Array(total).fill(-1);
  const closed = new Uint8Array(total);
  const startIndex = start[1] * grid.columns + start[0];
  const goalIndex = goal[1] * grid.columns + goal[0];
  const heuristic = (index: number): number => Math.hypot((index % grid.columns) - goal[0], Math.floor(index / grid.columns) - goal[1]);
  const heap = createHeap(score);
  cost[startIndex] = 0;
  score[startIndex] = heuristic(startIndex);
  heap.push(startIndex);

  while (heap.size() > 0) {
    const current = heap.pop();
    if (current === goalIndex) break;
    if (closed[current]) continue;
    closed[current] = 1;
    const column = current % grid.columns;
    const row = Math.floor(current / grid.columns);
    for (const [dc, dr, step] of NEIGHBOURS) {
      const nc = column + dc;
      const nr = row + dr;
      // A diagonal may not cut the corner of a blocked cell.
      if (!isOpen(grid, nc, nr) || (dc !== 0 && dr !== 0 && (!isOpen(grid, column + dc, row) || !isOpen(grid, column, row + dr)))) continue;
      const next = nr * grid.columns + nc;
      const tentative = cost[current] + step;
      if (tentative >= cost[next]) continue;
      cost[next] = tentative;
      score[next] = tentative + heuristic(next);
      came[next] = current;
      heap.push(next);
    }
  }
  if (came[goalIndex] === -1 && goalIndex !== startIndex) return null;
  const path: number[] = [goalIndex];
  while (path[0] !== startIndex) path.unshift(came[path[0]]);
  return path;
}

/**
 * A route from `from` to `to` as waypoints, the last one the walkable point nearest `to`;
 * null when no route exists.
 */
export function findPath(grid: WalkGrid, from: Point, to: Point): Point[] | null {
  const start = nearestOpenCell(grid, from);
  const goal = nearestOpenCell(grid, to);
  if (!start || !goal) return null;
  const cells = aStar(grid, start, goal);
  if (!cells) return null;
  const asPair = (index: number): readonly [number, number] => [index % grid.columns, Math.floor(index / grid.columns)];

  // String pulling: from each kept cell, skip ahead to the furthest cell still in sight.
  const kept: Array<readonly [number, number]> = [asPair(cells[0])];
  let anchor = 0;
  while (anchor < cells.length - 1) {
    let reach = cells.length - 1;
    while (reach > anchor + 1 && !hasLineOfSight(grid, asPair(cells[anchor]), asPair(cells[reach]))) reach -= 1;
    kept.push(asPair(cells[reach]));
    anchor = reach;
  }
  return kept.slice(1).map(([column, row]) => centreOf(grid, column, row));
}
