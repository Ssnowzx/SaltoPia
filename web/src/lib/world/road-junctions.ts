import { flattenCurve } from "./curves";
import type { Polyline, Waypoint } from "./road-network";

/**
 * Where roads meet.
 *
 * A painted line or a raised pavement that runs on through a junction is drawn across the
 * other road - a centre line striping the crossing, a kerb standing in the middle of the
 * carriageway. Every road therefore asks, at each point along it, how far it is from the
 * edge of any other road, and stops its lines and its pavement short of that edge. Pure,
 * over the network's own data, so it is tested without a scene.
 */

/** A road's centreline as fine segments, with the half-width it is graded to. */
interface Centreline {
  readonly points: readonly Waypoint[];
  readonly halfWidth: number;
  readonly source: readonly Waypoint[];
}

/** How finely centrelines are sampled for the distance test, in world units. */
const CENTRELINE_STEP = 1.5;

function distanceToSegment(px: number, pz: number, a: Waypoint, b: Waypoint): number {
  const abx = b[0] - a[0];
  const abz = b[1] - a[1];
  const lengthSquared = abx * abx + abz * abz || 1;
  const t = Math.min(1, Math.max(0, ((px - a[0]) * abx + (pz - a[1]) * abz) / lengthSquared));
  return Math.hypot(px - (a[0] + abx * t), pz - (a[1] + abz * t));
}

/** Samples every road's drawn curve once, so the queries below stay cheap. */
export function buildCentrelines(roads: readonly Polyline[]): readonly Centreline[] {
  return roads.map((road) => ({
    points: flattenCurve(road.points, road.closed, CENTRELINE_STEP),
    halfWidth: road.width / 2,
    source: road.points,
  }));
}

/**
 * The clear distance from a point to the nearest edge of any road other than `own` -
 * negative when the point lies on that other road.
 *
 * @param own - The waypoints of the road asking, which is left out of the test.
 */
export function clearanceToOtherRoads(
  x: number,
  z: number,
  own: readonly Waypoint[],
  centrelines: readonly Centreline[],
): number {
  let best = Number.POSITIVE_INFINITY;
  for (const line of centrelines) {
    if (line.source === own) continue;
    for (let index = 0; index < line.points.length - 1; index += 1) {
      const d = distanceToSegment(x, z, line.points[index], line.points[index + 1]) - line.halfWidth;
      if (d < best) best = d;
    }
  }
  return best;
}

/**
 * Whether markings may be painted at a point, from 1 (clear of every junction) to 0
 * (inside one), easing over `fade` metres beyond `margin` from the other road's edge.
 */
export function markingWeightAt(clearance: number, margin: number, fade: number): number {
  const t = Math.min(1, Math.max(0, (clearance - margin) / fade));
  return t * t * (3 - 2 * t);
}
