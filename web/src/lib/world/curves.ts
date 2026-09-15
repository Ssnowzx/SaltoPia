import { CatmullRomCurve3, Vector3 } from "three";

import type { Waypoint } from "./road-network";

/**
 * The one curve every road is built from.
 *
 * The terrain grades the ground along the same curve the ribbon is drawn on. Grading
 * along the straight chords between waypoints instead left the ribbon off its graded
 * strip on every bend, which is where the grass came through its edges.
 */
export function createCurve(points: readonly Waypoint[], closed: boolean): CatmullRomCurve3 {
  return new CatmullRomCurve3(
    points.map(([x, z]) => new Vector3(x, 0, z)),
    closed,
    "centripetal",
  );
}

/** The curve as a fine polyline, one point every `step` units of arc length. */
export function flattenCurve(points: readonly Waypoint[], closed: boolean, step: number): readonly Waypoint[] {
  const curve = createCurve(points, closed);
  const divisions = Math.max(2, Math.ceil(curve.getLength() / step));
  return curve.getSpacedPoints(divisions).map((point) => [point.x, point.z] as const);
}
