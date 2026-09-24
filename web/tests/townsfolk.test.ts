import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { Point } from "@/lib/walk/pathfinding";
import { isWalkable } from "@/lib/walk/navigator";
import { type TownspersonSpec, type TownspersonState, initialState, stepTownsperson, townsfolkPlans } from "@/lib/walk/townsfolk";
import { TOWNSFOLK } from "@/lib/world/constants";
import { siteAt } from "@/lib/world/sites";

/** A frame at 60 fps. */
const FRAME = 1 / 60;

/** Every half metre along a route, so a straight leg between two points is checked too. */
function alongEveryLeg(route: readonly Point[], loop: boolean): Point[] {
  const legs = loop ? route.length : route.length - 1;
  const points: Point[] = [];
  for (let index = 0; index < legs; index += 1) {
    const a = route[index];
    const b = route[(index + 1) % route.length];
    const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / 0.5));
    for (let step = 0; step <= steps; step += 1) points.push({ x: a.x + ((b.x - a.x) * step) / steps, z: a.z + ((b.z - a.z) * step) / steps });
  }
  return points;
}

function pointsOf(person: TownspersonSpec): Point[] {
  return person.plan.kind === "stand" ? [person.plan.at] : alongEveryLeg(person.plan.route, person.plan.loop);
}

/** Runs a townsperson for some seconds of frames. */
function run(spec: TownspersonSpec, state: TownspersonState, from: number, seconds: number, visitor: Point | null, reducedMotion = false): TownspersonState {
  let current = state;
  for (let frame = 0; frame < Math.round(seconds / FRAME); frame += 1) current = stepTownsperson(current, spec, from + frame * FRAME, FRAME, visitor, reducedMotion);
  return current;
}

function firstStroller(): TownspersonSpec {
  const stroller = townsfolkPlans().find((person) => person.plan.kind === "stroll");
  assert.ok(stroller, "there is a stroller");
  return stroller;
}

describe("townsfolk plans", () => {
  it("should put every route and every standing place on walkable ground", () => {
    // ARRANGE
    const people = townsfolkPlans();

    // ACT
    const unwalkable = people.flatMap((person) => pointsOf(person).filter((point) => !isWalkable(point.x, point.z)).map((point) => `${person.id} (${point.x.toFixed(1)}, ${point.z.toFixed(1)})`));

    // ASSERT
    assert.deepEqual(unwalkable, []);
  });

  it("should keep those who stand off the routes of those who stroll", () => {
    // ARRANGE
    const people = townsfolkPlans();
    const standers = people.flatMap((person) => (person.plan.kind === "stand" ? [{ id: person.id, at: person.plan.at }] : []));
    const routes = people.flatMap((person) => (person.plan.kind === "stroll" ? alongEveryLeg(person.plan.route, person.plan.loop) : []));

    // ACT
    const inTheWay = standers.filter((stander) => routes.some((point) => Math.hypot(point.x - stander.at.x, point.z - stander.at.z) < TOWNSFOLK.radius * 3)).map((stander) => stander.id);

    // ASSERT
    assert.deepEqual(inTheWay, []);
  });

  it("should have someone strolling round the square and someone standing in it", () => {
    // ARRANGE
    const square = siteAt("praca-do-pinhao");
    const inSquare = (point: Point): boolean => Math.hypot(point.x - square.x, point.z - square.z) < square.pad;

    // ACT
    const people = townsfolkPlans();

    // ASSERT
    assert.ok(people.some((person) => person.plan.kind === "stroll" && person.plan.route.every(inSquare)));
    assert.ok(people.some((person) => person.plan.kind === "stand" && inSquare(person.plan.at)));
  });
});

describe("townsfolk behaviour", () => {
  it("should walk a stroller along its route", () => {
    // ARRANGE
    const spec = firstStroller();
    const start = initialState(spec);

    // ACT
    const later = run(spec, start, 0, 1, null);

    // ASSERT
    assert.ok(Math.hypot(later.x - start.x, later.z - start.z) > 0.5);
    assert.equal(later.clip, "Walk");
  });

  it("should stand a while at the end of an out-and-back route, then turn back", () => {
    // ARRANGE - put the stroller a step from the end of its route.
    const spec = firstStroller();
    assert.equal(spec.plan.kind, "stroll");
    const route = spec.plan.kind === "stroll" ? spec.plan.route : [];
    const length = route.slice(1).reduce((sum, point, index) => sum + Math.hypot(point.x - route[index].x, point.z - route[index].z), 0);
    const nearEnd = { ...initialState(spec), travelled: length - 0.1, outbound: true };

    // ACT
    const atEnd = run(spec, nearEnd, 100, 0.5, null);
    const afterPause = run(spec, atEnd, 100.5, TOWNSFOLK.pauseAtEnds[1] + 1, null);

    // ASSERT
    assert.equal(atEnd.clip, "Idle");
    assert.equal(atEnd.outbound, false);
    assert.ok(afterPause.travelled < length - 0.5);
  });

  it("should stop, face the visitor and wave when the visitor comes near", () => {
    // ARRANGE - the visitor a metre and a half to the stroller's east.
    const spec = firstStroller();
    const start = initialState(spec);
    const visitor = { x: start.x + 1.5, z: start.z };

    // ACT
    const met = run(spec, start, 0, 1, visitor);

    // ASSERT
    assert.equal(met.speed, 0);
    assert.equal(met.clip, "Wave");
    assert.ok(Math.abs(Math.atan2(Math.sin(met.heading - Math.PI / 2), Math.cos(met.heading - Math.PI / 2))) < 0.05);
  });

  it("should go on its way once the visitor has moved off", () => {
    // ARRANGE
    const spec = firstStroller();
    const start = initialState(spec);
    const met = run(spec, start, 0, 1, { x: start.x + 1.5, z: start.z });

    // ACT
    const after = run(spec, met, 1, 1, { x: start.x + TOWNSFOLK.releaseBeyond + 1, z: start.z });

    // ASSERT
    assert.equal(after.attending, false);
    assert.equal(after.clip, "Walk");
  });

  it("should gesture from time to time when standing", () => {
    // ARRANGE
    const spec = townsfolkPlans().find((person) => person.plan.kind === "stand");
    assert.ok(spec);

    // ACT - long enough for the longest wait between gestures.
    let gestured = false;
    let state = initialState(spec);
    for (let frame = 0; frame < (TOWNSFOLK.gestureEvery[1] + 1) / FRAME; frame += 1) {
      state = stepTownsperson(state, spec, frame * FRAME, FRAME, null, false);
      gestured ||= state.clip !== "Idle";
    }

    // ASSERT
    assert.ok(gestured);
  });

  it("should have nobody walk a route under reduced motion", () => {
    // ARRANGE
    const people = townsfolkPlans();

    // ACT
    const moved = people.filter((spec) => {
      const start = initialState(spec);
      const later = run(spec, start, 0, 3, null, true);
      return later.clip !== "Idle" || Math.hypot(later.x - start.x, later.z - start.z) > 0;
    });

    // ASSERT
    assert.deepEqual(moved.map((spec) => spec.id), []);
  });
});
