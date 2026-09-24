import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { groveDensityAt } from "@/lib/world/groves";

function sampleMap(): number[] {
  const values: number[] = [];
  for (let x = -300; x <= 300; x += 10) {
    for (let z = -300; z <= 300; z += 10) values.push(groveDensityAt(x, z));
  }
  return values;
}

describe("grove field", () => {
  it("should give the same density at the same point every time", () => {
    // ARRANGE
    const point = { x: 123.4, z: -56.7 };

    // ACT
    const first = groveDensityAt(point.x, point.z);
    const second = groveDensityAt(point.x, point.z);

    // ASSERT
    assert.equal(first, second);
  });

  it("should stay inside the unit interval", () => {
    // ARRANGE / ACT
    const values = sampleMap();

    // ASSERT
    assert.ok(values.every((value) => value >= 0 && value <= 1));
  });

  it("should leave a real share of the map open and a real share wooded", () => {
    // ARRANGE
    const values = sampleMap();

    // ACT
    const open = values.filter((value) => value < 0.1).length / values.length;
    const wooded = values.filter((value) => value > 0.9).length / values.length;

    // ASSERT
    assert.ok(open > 0.2, `open share ${open.toFixed(2)}`);
    assert.ok(wooded > 0.15, `wooded share ${wooded.toFixed(2)}`);
  });
});
