import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { DWELLING_KEYS, assignDwellingDesigns } from "@/lib/world/dwellings";
import { createRandom } from "@/lib/world/noise";

function scatteredSites(count: number, seed: number): Array<{ x: number; z: number }> {
  const random = createRandom(seed);
  return Array.from({ length: count }, () => ({ x: random() * 200, z: random() * 200 }));
}

function nearestOf(points: ReadonlyArray<{ x: number; z: number }>, index: number): number {
  let best = -1;
  let bestDistance = Number.POSITIVE_INFINITY;
  points.forEach((point, other) => {
    if (other === index) return;
    const d = Math.hypot(point.x - points[index].x, point.z - points[index].z);
    if (d < bestDistance) {
      bestDistance = d;
      best = other;
    }
  });
  return best;
}

describe("dwelling designs", () => {
  it("should never give a dwelling the same design as its nearest dwelling", () => {
    // ARRANGE
    const sites = scatteredSites(40, 3);
    const fixed = [{ x: 100, z: 100, design: "lakeHouse" }];

    // ACT
    const designs = assignDwellingDesigns(sites, DWELLING_KEYS, fixed, 11, 28);
    const all = [...fixed, ...sites];
    const designOf = [...fixed.map((f) => f.design), ...designs];

    // ASSERT
    all.forEach((_, index) => {
      assert.notEqual(designOf[index], designOf[nearestOf(all, index)], `dwelling ${index}`);
    });
  });

  it("should choose the same designs for the same seed", () => {
    // ARRANGE
    const sites = scatteredSites(12, 5);

    // ACT
    const first = assignDwellingDesigns(sites, DWELLING_KEYS, [], 7, 28);
    const second = assignDwellingDesigns(sites, DWELLING_KEYS, [], 7, 28);

    // ASSERT
    assert.deepEqual(first, second);
  });

  it("should use more than half of the designs across a street of houses", () => {
    // ARRANGE
    const street = Array.from({ length: 12 }, (_, index) => ({ x: index * 12, z: 0 }));

    // ACT
    const designs = assignDwellingDesigns(street, DWELLING_KEYS, [], 9, 28);

    // ASSERT
    assert.ok(new Set(designs).size > DWELLING_KEYS.length / 2);
  });
});
