import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { BoxGeometry, PlaneGeometry } from "three";

import { walkWorld } from "@/lib/walk/navigator";
import { WALK } from "@/lib/world/constants";
import { occupancyOf } from "@/lib/walk/prop-occupancy";
import { landHeightAt } from "@/lib/world/outer-land";
import { siteAt } from "@/lib/world/sites";

const OPTIONS = { cell: 0.5, bodyFrom: 0.62, bodyTo: 1.7, stepHeight: 0.7, floorMinArea: 1 } as const;

/** Whether a walker - who has a body of its own - could stand at a point. */
function blocked(x: number, z: number): boolean {
  const world = walkWorld();
  return world.isGroundBlocked(x, z) || world.obstaclesNear(x, z).some((circle) => Math.hypot(x - circle.x, z - circle.z) < circle.radius + WALK.radius);
}

describe("prop occupancy", () => {
  it("should mark a waist-high box as in the way", () => {
    // ARRANGE - a planter one metre tall, standing on the ground.
    const planter = new BoxGeometry(2, 1, 1).translate(0, 0.5, 0);

    // ACT
    const { occupied } = occupancyOf(planter, OPTIONS);

    // ASSERT
    assert.ok(occupied.some((cell) => Math.abs(cell.x) < 0.5 && Math.abs(cell.z) < 0.5));
  });

  it("should read a large low platform as floor at its own height", () => {
    // ARRANGE - a platform top 0.3 up, four metres square.
    const platform = new PlaneGeometry(4, 4).rotateX(-Math.PI / 2).translate(0, 0.3, 0);

    // ACT
    const { floors, occupied } = occupancyOf(platform, OPTIONS);

    // ASSERT
    assert.equal(occupied.length, 0);
    assert.ok(floors.length > 20 && floors.every((floor) => Math.abs(floor.height - 0.3) < 1e-6));
  });

  it("should stand a walker on the square's paving, above the ground under it", () => {
    // ARRANGE - a point on the square's paving, between the benches and the edge.
    const square = siteAt("praca-do-pinhao");
    const x = square.x - 9.8;
    const z = square.z + 1;

    // ACT
    const height = walkWorld().heightAt(x, z);

    // ASSERT
    assert.ok(height - landHeightAt(x, z) > 0.2, `lift ${height - landHeightAt(x, z)}`);
  });

  it("should keep a walker out of the square's planters and bandstand", () => {
    // ARRANGE - a planter centre (5.2 m east of the middle) and the bandstand's middle.
    const square = siteAt("praca-do-pinhao");

    // ACT
    const planter = blocked(square.x + 5.2, square.z);
    const bandstandRail = blocked(square.x + Math.cos(Math.PI / 8 * 3) * 2.7, square.z + Math.sin(Math.PI / 8 * 3) * 2.7);

    // ASSERT
    assert.equal(planter, true);
    assert.equal(bandstandRail, true);
  });
});
