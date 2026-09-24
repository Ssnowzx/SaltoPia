import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createRandom, fractalNoise2D } from "@/lib/world/noise";

describe("noise", () => {
  it("should return the same sequence for the same seed", () => {
    // ARRANGE
    const first = createRandom(42);
    const second = createRandom(42);

    // ACT
    const a = [first(), first(), first()];
    const b = [second(), second(), second()];

    // ASSERT
    assert.deepEqual(a, b);
  });

  it("should keep fractal noise inside the unit interval", () => {
    // ARRANGE
    const samples: number[] = [];

    // ACT
    for (let x = -50; x <= 50; x += 7) {
      for (let z = -50; z <= 50; z += 7) samples.push(fractalNoise2D(x * 0.13, z * 0.13, 5));
    }

    // ASSERT
    assert.ok(samples.every((value) => value >= 0 && value < 1));
  });
});
