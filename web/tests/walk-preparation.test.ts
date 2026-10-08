import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { type IdleScheduler, runWhenIdle, sliceBudget, sliceClock } from "@/lib/idle-work";
import { isWalkable, prepareWalkGrid, walkGrid } from "@/lib/walk/navigator";
import { GRID_CELLS_PER_CHECK, buildWalkGrid, createWalkGridBuilder } from "@/lib/walk/pathfinding";
import { TERRAIN, WALK } from "@/lib/world/constants";

/** An idle scheduler driven by hand: each `step` runs the one waiting callback. */
function manualScheduler(remaining = 8): IdleScheduler & { readonly step: () => boolean; readonly cancelled: () => number } {
  let waiting: ((remaining: () => number) => void) | null = null;
  let cancels = 0;
  return {
    schedule: (callback) => {
      waiting = callback;
      return 1;
    },
    cancel: () => {
      cancels += 1;
      waiting = null;
    },
    step: () => {
      const callback = waiting;
      waiting = null;
      callback?.(() => remaining);
      return callback !== null;
    },
    cancelled: () => cancels,
  };
}

/** A checkerboard of thirds: walkable except where the cell's coordinates sum to a multiple of 3. */
function pattern(x: number, z: number): boolean {
  return (Math.floor(x) + Math.floor(z)) % 3 !== 0;
}

/** A clock that says stop at its first look, so every slice is as small as it can be. */
const STOP_AT_ONCE = (): boolean => false;

describe("walk grid built in slices", () => {
  it("should build the same grid in slices as at once", () => {
    // ARRANGE
    const whole = buildWalkGrid(-20, -20, 40, 1, pattern);
    const builder = createWalkGridBuilder(-20, -20, 40, 1, pattern);

    // ACT
    let slices = 1;
    while (!builder.fill(STOP_AT_ONCE)) slices += 1;

    // ASSERT
    assert.ok(slices > 1, `built in ${slices} slices`);
    assert.deepEqual(builder.grid.walkable, whole.walkable);
  });

  it("should stop a slice at its first look at the clock", () => {
    // ARRANGE
    let sampled = 0;
    const builder = createWalkGridBuilder(-20, -20, 40, 1, (x, z) => {
      sampled += 1;
      return pattern(x, z);
    });

    // ACT
    const finished = builder.fill(STOP_AT_ONCE);

    // ASSERT
    assert.equal(finished, false);
    assert.equal(sampled, GRID_CELLS_PER_CHECK);
  });

  it("should resume where the last slice stopped, sampling each cell once", () => {
    // ARRANGE
    let sampled = 0;
    const builder = createWalkGridBuilder(-20, -20, 40, 1, (x, z) => {
      sampled += 1;
      return pattern(x, z);
    });

    // ACT
    while (!builder.fill(STOP_AT_ONCE));

    // ASSERT
    assert.equal(sampled, builder.grid.columns * builder.grid.rows);
  });
});

describe("idle work", () => {
  it("should run sliced work across idle moments, then report it done once", () => {
    // ARRANGE - work that needs three slices.
    const scheduler = manualScheduler();
    let slices = 0;
    let done = 0;
    runWhenIdle(
      () => {
        slices += 1;
        return slices === 3;
      },
      () => {
        done += 1;
      },
      scheduler,
    );

    // ACT
    while (scheduler.step());

    // ASSERT
    assert.equal(slices, 3);
    assert.equal(done, 1);
  });

  it("should run nothing more once cancelled, and never report it done", () => {
    // ARRANGE
    const scheduler = manualScheduler();
    let slices = 0;
    let done = 0;
    const cancel = runWhenIdle(
      () => {
        slices += 1;
        return false;
      },
      () => {
        done += 1;
      },
      scheduler,
    );
    scheduler.step();

    // ACT
    cancel();
    const ranAfter = scheduler.step();

    // ASSERT
    assert.equal(slices, 1);
    assert.equal(ranAfter, false);
    assert.equal(done, 0);
    assert.equal(scheduler.cancelled(), 1);
  });

  it("should keep a slice inside the frame, however long the idle moment", () => {
    // ARRANGE
    const generous = 50;
    const none = 0;

    // ACT
    const long = sliceBudget(generous);
    const short = sliceBudget(none);

    // ASSERT
    assert.ok(long <= 12, `a long idle moment gives a ${long} ms slice`);
    assert.ok(short >= 4, `no idle time still gives a ${short} ms slice`);
  });

  it("should say stop once a slice has used its budget", () => {
    // ARRANGE
    let time = 100;
    const clock = sliceClock(8, () => time);

    // ACT
    const early = clock();
    time = 108;
    const late = clock();

    // ASSERT
    assert.equal(early, true);
    assert.equal(late, false);
  });
});

describe("route grid warmed in slices", () => {
  it("should finish the route grid when a route is wanted before its slices are done", () => {
    // ARRANGE - every open place read, the world built, and a few batches of the grid.
    let slices = 0;
    while (slices < 20 && !prepareWalkGrid(STOP_AT_ONCE)) slices += 1;
    const expected = buildWalkGrid(-TERRAIN.size / 2, -TERRAIN.size / 2, TERRAIN.size, WALK.gridCell, isWalkable);

    // ACT
    const grid = walkGrid();

    // ASSERT
    assert.equal(slices, 20);
    assert.deepEqual(grid.walkable, expected.walkable);
  });
});
