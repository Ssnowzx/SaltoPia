import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { WALK } from "@/lib/world/constants";
import { LIFT } from "@/lib/world/road-surfaces";
import { surfaceHeightAt } from "@/lib/world/roads";
import { resolveStep, stepWalker, directionFromCamera } from "@/lib/walk/movement";
import { buildWalkGrid, findPath } from "@/lib/walk/pathfinding";
import { areaAt, arrivalAreas } from "@/lib/walk/visits";
import { type WalkWorld, createObstacleIndex, isGroundBlocked, walkHeightAt } from "@/lib/walk/walk-world";
import { siteFootprints, worldObstacles } from "@/lib/walk/obstacles";

/** A flat test world: water where x < 0, one house of radius 3 at (10, 0). */
function testWorld(): WalkWorld {
  const house = { x: 10, z: 0, radius: 3 };
  return { heightAt: () => 0, isGroundBlocked: (x) => x < 0, obstaclesNear: createObstacleIndex([house], 16) };
}

describe("walk world", () => {
  it("should stand a walker on the carriageway, above the graded ground", () => {
    // ARRANGE - a point on the main road, mid-carriageway.
    const x = 58;
    const z = 86;

    // ACT
    const height = walkHeightAt(x, z);

    // ASSERT
    assert.ok(Math.abs(height - (surfaceHeightAt(x, z) + LIFT.carriageway)) < 0.05, `height ${height}`);
  });

  it("should block the lake and leave the street open", () => {
    // ARRANGE
    const lake = { x: -60, z: 40 };
    const street = { x: 58, z: 86 };

    // ACT
    const lakeBlocked = isGroundBlocked(lake.x, lake.z);
    const streetBlocked = isGroundBlocked(street.x, street.z);

    // ASSERT
    assert.equal(lakeBlocked, true);
    assert.equal(streetBlocked, false);
  });

  it("should find a building among the obstacles at its own position", () => {
    // ARRANGE
    const obstacles = worldObstacles();
    const near = createObstacleIndex(obstacles, WALK.obstacleCell);

    // ACT - the pousada stands at (20, 120).
    const hit = near(20, 120).some((circle) => Math.hypot(circle.x - 20, circle.z - 120) < 1 && circle.radius > 5);

    // ASSERT
    assert.ok(hit);
  });
});

describe("walking", () => {
  it("should stop at the water's edge rather than step into it", () => {
    // ARRANGE
    const world = testWorld();

    // ACT
    const next = resolveStep(0.5, 0, -2, 0, world);

    // ASSERT
    assert.ok(next.x >= 0, `x ${next.x}`);
  });

  it("should slide along a wall met at an angle", () => {
    // ARRANGE - walking diagonally into the house's side.
    const world = testWorld();

    // ACT
    const next = resolveStep(6.4, -1, 1, 1, world);

    // ASSERT
    assert.ok(Math.hypot(next.x - 10, next.z) >= 3 + WALK.radius - 1e-6, "outside the house");
    assert.ok(next.z > -1, "moved along the wall");
  });

  it("should walk away from the camera when pushed forward", () => {
    // ARRANGE - camera looking toward +Z.
    const world = testWorld();
    const direction = directionFromCamera(1, 0, 0, 1);

    // ACT
    let walker = { x: 3, z: 5, heading: 0, speed: 0 };
    for (let frame = 0; frame < 30; frame += 1) walker = stepWalker(walker, { directionX: direction.x, directionZ: direction.z, run: false }, 1 / 60, world);

    // ASSERT
    assert.ok(walker.z > 5.3, `z ${walker.z}`);
    assert.ok(walker.speed > 0.5);
  });
});

describe("routes", () => {
  it("should route round an obstacle, every waypoint walkable", () => {
    // ARRANGE - a wall across the middle with a gap at the top.
    const blocked = (x: number, z: number): boolean => x > 18 && x < 22 && z < 30;
    const grid = buildWalkGrid(0, 0, 40, 1, (x, z) => !blocked(x, z));

    // ACT
    const path = findPath(grid, { x: 5, z: 5 }, { x: 35, z: 5 });

    // ASSERT
    assert.ok(path && path.length > 1);
    assert.ok(path.every((point) => !blocked(point.x, point.z)));
    assert.ok(path.some((point) => point.z >= 29), "went round the top of the wall");
  });

  it("should give every place an arrival area with walkable ground in it", () => {
    // ARRANGE
    const areas = arrivalAreas(siteFootprints());

    // ACT
    const reachable = areas.map((area) => {
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 12) {
        for (let r = 1; r <= area.radius; r += 1) {
          const x = area.x + Math.cos(angle) * r;
          const z = area.z + Math.sin(angle) * r;
          if (!isGroundBlocked(x, z) && areaAt(x, z, areas)?.slug === area.slug) return true;
        }
      }
      return false;
    });

    // ASSERT
    areas.forEach((area, index) => assert.ok(reachable[index], area.slug));
  });
});
