import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { prepareWalkWorld, walkWorld } from "@/lib/walk/navigator";
import { continueOpenGroundReading, startOpenGroundReading, worldObstacles } from "@/lib/walk/obstacles";
import type { Circle } from "@/lib/walk/walk-world";

/** A clock that says stop at its first look, so every slice is as small as it can be. */
const STOP_AT_ONCE = (): boolean => false;

function key(circle: Circle): string {
  return `${circle.x},${circle.z},${circle.radius}`;
}

describe("walk world prepared in slices", () => {
  it("should read the open places in slices exactly as at once", () => {
    // ARRANGE
    const whole = startOpenGroundReading();
    continueOpenGroundReading(whole, () => true);
    const sliced = startOpenGroundReading();

    // ACT
    let slices = 1;
    while (!continueOpenGroundReading(sliced, STOP_AT_ONCE)) slices += 1;

    // ASSERT
    assert.ok(slices > 1, `read in ${slices} slices`);
    assert.deepEqual(sliced, whole);
  });

  it("should finish the walk world when it is wanted before its slices are done", () => {
    // ARRANGE - one slice in: a single open place read.
    const readyAfterOneSlice = prepareWalkWorld(STOP_AT_ONCE);
    const whole = startOpenGroundReading();
    continueOpenGroundReading(whole, () => true);

    // ACT
    walkWorld();
    const obstacles = new Set(worldObstacles().map(key));

    // ASSERT
    assert.equal(readyAfterOneSlice, false);
    assert.deepEqual(
      whole.circles.filter((circle) => !obstacles.has(key(circle))),
      [],
    );
  });
});
