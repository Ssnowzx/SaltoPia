import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildCentrelines, clearanceToOtherRoads, markingWeightAt } from "@/lib/world/road-junctions";
import type { Polyline, Waypoint } from "@/lib/world/road-network";

// A straight north-south street, and a side street that ends on it from the east.
const MAIN: readonly Waypoint[] = [[0, -100], [0, 100]];
const SIDE: readonly Waypoint[] = [[40, 0], [0, 0]];
const ROADS: readonly Polyline[] = [
  { points: MAIN, closed: false, width: 8 },
  { points: SIDE, closed: false, width: 6 },
];
const MARGIN = 1;
const FADE = 2;

describe("road junctions", () => {
  it("should zero the main street's markings where the side street joins it", () => {
    // ARRANGE
    const centrelines = buildCentrelines(ROADS);

    // ACT
    const clearance = clearanceToOtherRoads(0, 0, MAIN, centrelines);

    // ASSERT
    assert.equal(markingWeightAt(clearance, MARGIN, FADE), 0);
  });

  it("should keep full markings mid-street, far from any junction", () => {
    // ARRANGE
    const centrelines = buildCentrelines(ROADS);

    // ACT
    const clearance = clearanceToOtherRoads(0, 60, MAIN, centrelines);

    // ASSERT
    assert.equal(markingWeightAt(clearance, MARGIN, FADE), 1);
  });

  it("should not treat a road as a junction with itself", () => {
    // ARRANGE
    const centrelines = buildCentrelines(ROADS);

    // ACT
    const clearance = clearanceToOtherRoads(20, 0, SIDE, centrelines);

    // ASSERT
    // Twenty units along the side street, the main street's edge is sixteen away.
    assert.ok(Math.abs(clearance - 16) < 0.01, `clearance ${clearance}`);
  });

  it("should ease the markings back in over the fade distance", () => {
    // ARRANGE
    const halfway = MARGIN + FADE / 2;

    // ACT
    const weight = markingWeightAt(halfway, MARGIN, FADE);

    // ASSERT
    assert.ok(weight > 0.4 && weight < 0.6);
  });
});
