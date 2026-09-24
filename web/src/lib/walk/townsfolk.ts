import { TOWNSFOLK } from "@/lib/world/constants";
import { createCurve } from "@/lib/world/curves";
import { LANDMARKS, type ModelKey } from "@/lib/world/neighborhood-layout";
import { MAIN_ROAD, ROAD_WIDTHS, SHORE_STREET, type Waypoint } from "@/lib/world/road-network";
import { type Site, siteAt } from "@/lib/world/sites";
import { lakeDistance } from "@/lib/world/terrain";

import type { CharacterKey } from "./characters";
import type { Point } from "./pathfinding";

/**
 * The community's people: who they are, where they walk or stand, and one pure step of
 * their behaviour. See design.md D2 of add-living-townsfolk.
 */

export type Gesture = "Wave" | "Interact";
export type TownsfolkClip = "Idle" | "Walk" | Gesture;

export type Plan =
  | { readonly kind: "stroll"; readonly route: readonly Point[]; readonly loop: boolean; readonly speed: number }
  | { readonly kind: "stand"; readonly at: Point; readonly heading: number; readonly gesture: Gesture };

export interface TownspersonSpec {
  readonly id: string;
  readonly model: CharacterKey;
  readonly outfit: number;
  readonly skin: number;
  readonly plan: Plan;
}

// ---------------------------------------------------------------------------------
// Routes and places, from the layout
// ---------------------------------------------------------------------------------

/** A site-local point in world space, turned with the site. */
function onSite(site: Site, x: number, z: number): Point {
  const cos = Math.cos(site.rotationY);
  const sin = Math.sin(site.rotationY);
  return { x: site.x + x * cos + z * sin, z: site.z - x * sin + z * cos };
}

/** An arc round a site's centre, in the site's frame, from one angle to another in degrees. */
function arc(site: Site, radius: number, fromDegrees: number, toDegrees: number): Point[] {
  const count = Math.max(2, Math.round((radius * Math.abs(toDegrees - fromDegrees) * Math.PI) / 180 / TOWNSFOLK.routeStep));
  return Array.from({ length: count + 1 }, (_, index) => {
    const angle = ((fromDegrees + ((toDegrees - fromDegrees) * index) / count) * Math.PI) / 180;
    return onSite(site, Math.cos(angle) * radius, Math.sin(angle) * radius);
  });
}

/** The heading from one point toward another. */
function facing(from: Point, to: Point): number {
  return Math.atan2(to.x - from.x, to.z - from.z);
}

/**
 * The landward pavement of a street between two shares of its length: the centreline
 * offset to the pavement's middle, on whichever side is further from the water.
 */
export function pavementRoute(street: readonly Waypoint[], from: number, to: number): Point[] {
  const curve = createCurve(street, false);
  const offset = ROAD_WIDTHS.streetWidth / 2 + ROAD_WIDTHS.kerbExtra / 4;
  const count = Math.max(2, Math.round((curve.getLength() * (to - from)) / TOWNSFOLK.routeStep));
  return Array.from({ length: count + 1 }, (_, index) => {
    const share = from + ((to - from) * index) / count;
    const point = curve.getPointAt(share);
    const tangent = curve.getTangentAt(share);
    const left = { x: point.x + tangent.z * offset, z: point.z - tangent.x * offset };
    const right = { x: point.x - tangent.z * offset, z: point.z + tangent.x * offset };
    return lakeDistance(left.x, left.z) > lakeDistance(right.x, right.z) ? left : right;
  });
}

/** Where to stand at a shop's window, facing it. */
function atShopWindow(model: ModelKey): { at: Point; heading: number } | null {
  const shop = LANDMARKS.find((placement) => placement.model === model);
  if (!shop) return null;
  const outX = Math.sin(shop.rotationY);
  const outZ = Math.cos(shop.rotationY);
  return { at: { x: shop.x + outX * TOWNSFOLK.windowDistance, z: shop.z + outZ * TOWNSFOLK.windowDistance }, heading: Math.atan2(-outX, -outZ) };
}

function stroll(route: readonly Point[], loop: boolean, speed: number): Plan {
  return { kind: "stroll", route, loop, speed };
}

function stand(at: Point, heading: number, gesture: Gesture): Plan {
  return { kind: "stand", at, heading, gesture };
}

type Person = readonly [CharacterKey, number, number, Plan];

/** The square: someone walking round it, two talking, one at the brazier, one at a table. */
function squareFolk(): readonly Person[] {
  const square = siteAt("praca-do-pinhao");
  const talker = onSite(square, 5.3, -2.6);
  const listener = onSite(square, 6.4, -1.7);
  const warming = onSite(square, 3.0, 6.9);
  const atTable = onSite(square, -5.0, 4.4);
  return [
    // Round the square between the benches and the lamps, turning back at the café.
    ["man-casual", 0, 2, stroll(arc(square, 8.8, 152, 466), false, 1.2)],
    ["woman-formal", 3, 1, stand(talker, facing(talker, listener), "Wave")],
    ["man-farmer", 0, 3, stand(listener, facing(listener, talker), "Interact")],
    ["man-hiker", 5, 4, stand(warming, facing(warming, onSite(square, 3.6, 5.4)), "Interact")],
    ["woman-casual", 4, 0, stand(atTable, facing(atTable, onSite(square, -6.2, 5.6)), "Interact")],
  ];
}

/** The pavements, the shops and the lakeside. */
function streetFolk(): readonly Person[] {
  const shop = atShopWindow("shopYellow");
  const lakeside: Point = { x: 32.5, z: 47 };
  return [
    ["woman-hiker", 0, 0, stroll(pavementRoute(SHORE_STREET, 0.3, 0.62), false, 1.3)],
    ["man-hiker", 2, 2, stroll(pavementRoute(MAIN_ROAD, 0.12, 0.34), false, 1.25)],
    ["woman-casual", 1, 3, stroll(pavementRoute(MAIN_ROAD, 0.38, 0.55), false, 1.15)],
    ["woman-formal", 5, 2, stand(lakeside, -Math.PI / 2, "Interact")],
    ...(shop ? [["woman-casual", 3, 1, stand(shop.at, shop.heading, "Interact")] as const] : []),
  ];
}

/** The fairground, the inn, the CTG and the lookout. */
function placeFolk(): readonly Person[] {
  const park = siteAt("parque-caveiras");
  const inn = siteAt("pousada-da-geada");
  const ctg = siteAt("ctg-porteira-do-tropeiro");
  const lookout = siteAt("mirante-da-neblina");
  const atLookout = onSite(lookout, 5.5, 2);
  return [
    ["man-casual", 2, 4, stroll([onSite(park, 2, 15), onSite(park, 2, -9)], false, 1.1)],
    ["woman-formal", 0, 0, stand(onSite(park, 7, 9), Math.PI * 0.9, "Wave")],
    ["man-farmer", 4, 1, stand(onSite(inn, -6, 12), inn.rotationY, "Wave")],
    ["man-farmer", 1, 2, stand(onSite(ctg, 1.5, 9.5), ctg.rotationY, "Wave")],
    ["woman-hiker", 3, 2, stand(atLookout, facing(atLookout, { x: 0, z: 0 }), "Interact")],
  ];
}

/** Every townsperson, built from the layout. */
export function townsfolkPlans(): readonly TownspersonSpec[] {
  return [...squareFolk(), ...streetFolk(), ...placeFolk()].map(([model, outfit, skin, plan], index) => ({ id: `townsperson-${index}`, model, outfit, skin, plan }));
}

// ---------------------------------------------------------------------------------
// Behaviour
// ---------------------------------------------------------------------------------

export interface TownspersonState {
  readonly x: number;
  readonly z: number;
  readonly heading: number;
  readonly speed: number;
  /** Arc length along the route. */
  readonly travelled: number;
  readonly outbound: boolean;
  readonly pauseUntil: number;
  readonly clip: TownsfolkClip;
  readonly clipUntil: number;
  readonly nextGestureAt: number;
  readonly greetedAt: number;
  /** Stopped for the visitor; released once the visitor has moved away. */
  readonly attending: boolean;
}

/** A stable number in [0, 1) for a person, so each one keeps its own rhythm. */
function seeded(id: string, salt: number): number {
  let hash = salt;
  for (let index = 0; index < id.length; index += 1) hash = Math.imul(hash ^ id.charCodeAt(index), 2654435761);
  return ((hash >>> 0) % 10000) / 10000;
}

function routeLength(route: readonly Point[], loop: boolean): number {
  let length = 0;
  const last = loop ? route.length : route.length - 1;
  for (let index = 0; index < last; index += 1) {
    const next = route[(index + 1) % route.length];
    length += Math.hypot(next.x - route[index].x, next.z - route[index].z);
  }
  return length;
}

/** The point and heading at an arc length along a route. */
export function alongRoute(route: readonly Point[], loop: boolean, distance: number): { x: number; z: number; heading: number } {
  const segments = loop ? route.length : route.length - 1;
  let remaining = distance;
  for (let index = 0; index < segments; index += 1) {
    const a = route[index];
    const b = route[(index + 1) % route.length];
    const length = Math.hypot(b.x - a.x, b.z - a.z);
    if (remaining <= length || index === segments - 1) {
      const t = length > 0 ? Math.min(1, remaining / length) : 0;
      return { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t, heading: Math.atan2(b.x - a.x, b.z - a.z) };
    }
    remaining -= length;
  }
  return { x: route[0].x, z: route[0].z, heading: 0 };
}

export function initialState(spec: TownspersonSpec): TownspersonState {
  const base = { speed: 0, outbound: true, pauseUntil: 0, clip: "Idle" as const, clipUntil: 0, greetedAt: -Infinity, attending: false };
  const nextGestureAt = TOWNSFOLK.gestureEvery[0] * seeded(spec.id, 3);
  if (spec.plan.kind === "stand") return { ...base, x: spec.plan.at.x, z: spec.plan.at.z, heading: spec.plan.heading, travelled: 0, nextGestureAt };
  const travelled = routeLength(spec.plan.route, spec.plan.loop) * seeded(spec.id, 7);
  const start = alongRoute(spec.plan.route, spec.plan.loop, travelled);
  return { ...base, x: start.x, z: start.z, heading: start.heading, travelled, nextGestureAt };
}

/** Turns toward a heading by at most `step`, the short way. */
function turn(from: number, to: number, step: number): number {
  const difference = Math.atan2(Math.sin(to - from), Math.cos(to - from));
  return from + Math.max(-step, Math.min(step, difference));
}

function attend(state: TownspersonState, visitor: Point, now: number, delta: number): TownspersonState {
  const heading = turn(state.heading, Math.atan2(visitor.x - state.x, visitor.z - state.z), TOWNSFOLK.turnRate * delta);
  const wave = now - state.greetedAt > TOWNSFOLK.greetEvery;
  if (wave) return { ...state, heading, speed: 0, attending: true, clip: "Wave", clipUntil: now + TOWNSFOLK.gestureSeconds, greetedAt: now };
  return { ...state, heading, speed: 0, attending: true, clip: now < state.clipUntil ? state.clip : "Idle" };
}

function standStep(state: TownspersonState, plan: Extract<Plan, { kind: "stand" }>, id: string, now: number, delta: number): TownspersonState {
  const heading = turn(state.heading, plan.heading, TOWNSFOLK.turnRate * delta);
  if (now < state.clipUntil) return { ...state, heading };
  if (now >= state.nextGestureAt) {
    const [least, most] = TOWNSFOLK.gestureEvery;
    return { ...state, heading, clip: plan.gesture, clipUntil: now + TOWNSFOLK.gestureSeconds, nextGestureAt: now + least + (most - least) * seeded(id, Math.floor(now)) };
  }
  return { ...state, heading, clip: "Idle" };
}

function strollStep(state: TownspersonState, plan: Extract<Plan, { kind: "stroll" }>, id: string, now: number, delta: number): TownspersonState {
  if (now < state.pauseUntil) return { ...state, speed: 0, clip: "Idle" };
  const length = routeLength(plan.route, plan.loop);
  let travelled = state.travelled + (state.outbound ? 1 : -1) * plan.speed * delta;
  let outbound = state.outbound;
  let pauseUntil = state.pauseUntil;
  if (plan.loop) {
    travelled = ((travelled % length) + length) % length;
  } else if (travelled >= length || travelled <= 0) {
    travelled = Math.min(length, Math.max(0, travelled));
    outbound = !outbound;
    const [least, most] = TOWNSFOLK.pauseAtEnds;
    pauseUntil = now + least + (most - least) * seeded(id, Math.floor(now));
  }
  const point = alongRoute(plan.route, plan.loop, travelled);
  const heading = outbound ? point.heading : point.heading + Math.PI;
  return { ...state, x: point.x, z: point.z, heading: turn(state.heading, heading, TOWNSFOLK.turnRate * delta), travelled, outbound, pauseUntil, speed: plan.speed, clip: "Walk" };
}

/**
 * One step of a townsperson. `visitor` is the walker's position in walk mode, null from the
 * air. Under reduced motion everyone stands idle where they are.
 */
export function stepTownsperson(state: TownspersonState, spec: TownspersonSpec, now: number, delta: number, visitor: Point | null, reducedMotion: boolean): TownspersonState {
  if (reducedMotion) return { ...state, speed: 0, clip: "Idle", attending: false };
  const distance = visitor ? Math.hypot(visitor.x - state.x, visitor.z - state.z) : Number.POSITIVE_INFINITY;
  if (visitor && (distance < TOWNSFOLK.noticeWithin || (state.attending && distance < TOWNSFOLK.releaseBeyond))) return attend(state, visitor, now, delta);
  const released = state.attending ? { ...state, attending: false } : state;
  if (spec.plan.kind === "stand") return standStep(released, spec.plan, spec.id, now, delta);
  return strollStep(released, spec.plan, spec.id, now, delta);
}
