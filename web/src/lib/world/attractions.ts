import type { BufferGeometry } from "three";

import { type BuildingSpec, createBuildingGeometry } from "./building";
import {
  arch,
  awning,
  blob,
  box,
  cone,
  createBenchGeometry,
  createCafeTableGeometry,
  createFenceGeometry,
  createLamppostGeometry,
  merge,
  pipe,
  post,
} from "./builders";
import { WORLD_COLORS } from "./constants";

/**
 * The attractions built to draw partners: an amusement park and a lakeside restaurant.
 *
 * The park is a fairground on the east slope - a Ferris wheel and a carousel that turn
 * (their moving parts are meshes of their own, see `createFerrisWheelGeometry` and
 * `createCarouselGeometry`), a bumper-car pavilion, food kiosks under striped awnings,
 * a ticket gate and strings of lights. The restaurant is a timber hall on the shore
 * with a deck out over the water.
 *
 * Both are built at the origin facing +Z, base at y = 0, like every other composite.
 */

/** Where the wheel's axle sits, so the scene can turn the wheel there. */
export const FERRIS_WHEEL = { x: -18, y: 13.5, z: -6, radius: 11 } as const;

/** Where the carousel's platform pivots. */
export const CAROUSEL = { x: 14, y: 0.55, z: 4, radius: 5.2 } as const;

/** The chair swing: its arms and chairs turn about the top of the mast. */
export const SWING = { x: 20, y: 8.2, z: -16, radius: 4.6 } as const;

/** The drop tower: a ring of seats that climbs the mast and falls. */
export const DROP_TOWER = { x: -22, z: -19, height: 19, low: 1.6, top: 16, periodSeconds: 13 } as const;

const PARK_COLORS = {
  red: "#c94a3a",
  cream: "#f5e9cf",
  teal: "#2f7f86",
  yellow: "#e9b53c",
  steel: "#8c9096",
} as const;

/** The wheel's static frame: two A-frames, the axle housing and the boarding platform. */
function ferrisFrame(): BufferGeometry[] {
  const { x, y, z, radius } = FERRIS_WHEEL;
  const legSpread = radius * 0.62;
  const parts: BufferGeometry[] = [];
  for (const side of [-1.6, 1.6]) {
    for (const lean of [-1, 1]) {
      const leg = post(0.22, 0.32, Math.hypot(legSpread, y) + 0.4, 6, PARK_COLORS.steel, 0, 0, 0, "metal");
      leg.translate(0, -0.2, 0);
      leg.rotateZ(-lean * Math.atan2(legSpread, y));
      leg.translate(x + lean * legSpread, 0, z + side);
      parts.push(leg);
    }
    parts.push(box(legSpread * 2 + 1, 0.4, 0.5, PARK_COLORS.steel, x, 0.2, z + side, 0, "metal"));
  }
  parts.push(pipe(0.5, 4.4, 10, PARK_COLORS.steel, x, y, z, 0, "metal"));
  // Boarding platform and its steps.
  parts.push(box(6, 0.6, 3.4, WORLD_COLORS.stone, x, 0.3, z + 3.2, 0, "stone"));
  parts.push(box(2, 0.3, 1.2, WORLD_COLORS.stone, x, 0.15, z + 5.4, 0, "stone"));
  return parts;
}

/** The carousel's roof and centre pole; the platform and horses turn separately. */
function carouselCanopy(): BufferGeometry[] {
  const { x, z, radius } = CAROUSEL;
  return [
    post(0.4, 0.5, 5.6, 8, PARK_COLORS.cream, x, 0, z, "plaster"),
    cone(radius + 0.8, 2.6, 16, PARK_COLORS.red, x, 4.4, z, "metal"),
    post(radius + 0.9, radius + 0.9, 0.3, 16, PARK_COLORS.cream, x, 4.3, z, "plaster"),
    blob(0.5, PARK_COLORS.yellow, x, 7.2, z, 1, 1, "glass"),
    post(radius + 0.4, radius + 0.6, 0.3, 16, WORLD_COLORS.stone, x, 0, z, "stone"),
  ];
}

/** A food kiosk: a hut with a striped awning and a counter. */
function kiosk(x: number, z: number, rotation: number, awningColor: string): BufferGeometry[] {
  const parts: BufferGeometry[] = [
    box(3.2, 2.6, 2.4, PARK_COLORS.cream, 0, 1.3, 0, 0, "planks"),
    box(3.4, 0.2, 2.6, WORLD_COLORS.slateDark, 0, 2.7, 0, 0, "metal"),
    box(3.0, 0.9, 0.16, WORLD_COLORS.timberDark, 0, 1.4, 1.22, 0, "planks"),
    box(3.2, 0.12, 0.7, WORLD_COLORS.timber, 0, 1.0, 1.5, 0, "planks"),
    awning(3.4, 0.9, awningColor, 0, 2.5, 1.55, "plain"),
  ];
  for (const part of parts) {
    part.rotateY(rotation);
    part.translate(x, 0, z);
  }
  return parts;
}

/** The bumper-car pavilion: a flat roof on posts over a dark floor, with a low wall. */
function bumperCars(x: number, z: number): BufferGeometry[] {
  const width = 12;
  const depth = 8;
  const parts: BufferGeometry[] = [
    box(width, 0.3, depth, WORLD_COLORS.slateDark, x, 0.15, z, 0, "metal"),
    box(width + 0.8, 0.5, depth + 0.8, PARK_COLORS.teal, x, 4.2, z, 0, "metal"),
    box(width + 0.8, 0.8, 0.2, PARK_COLORS.yellow, x, 3.6, z + depth / 2 + 0.4, 0, "plain"),
  ];
  for (const sx of [-width / 2 + 0.4, 0, width / 2 - 0.4]) {
    for (const sz of [-depth / 2 + 0.4, depth / 2 - 0.4]) {
      parts.push(post(0.16, 0.18, 4, 6, PARK_COLORS.steel, x + sx, 0.3, z + sz, "metal"));
    }
  }
  for (const [dx, dz, rotation] of [[-3.4, -1.6, 0.4], [-0.8, 1.8, 2.3], [2.6, -0.6, 1.1], [3.8, 2.2, 3.6]] as const) {
    parts.push(box(1.3, 0.5, 1.8, [PARK_COLORS.red, PARK_COLORS.teal, PARK_COLORS.yellow, WORLD_COLORS.wine][Math.abs(Math.round(rotation)) % 4], x + dx, 0.55, z + dz, rotation, "metal"));
    parts.push(post(0.36, 0.36, 0.5, 8, WORLD_COLORS.slateDark, x + dx, 0.8, z + dz, "metal"));
  }
  return parts;
}

/** The ticket gate: two pylons under a signboard arch. */
function ticketGate(x: number, z: number): BufferGeometry[] {
  return [
    box(1.4, 4.4, 1.4, PARK_COLORS.red, x - 4, 2.2, z, 0, "plaster"),
    box(1.4, 4.4, 1.4, PARK_COLORS.red, x + 4, 2.2, z, 0, "plaster"),
    arch(8, 2.2, 0.5, PARK_COLORS.cream, x, 4.4, z, "plaster"),
    box(6.4, 1.1, 0.2, PARK_COLORS.yellow, x, 5.2, z + 0.32, 0, "plain"),
    box(2.2, 2.2, 2.2, PARK_COLORS.cream, x - 7.4, 1.1, z + 1.2, 0, "planks"),
    cone(1.7, 1.2, 4, PARK_COLORS.teal, x - 7.4, 2.2, z + 1.2, "metal"),
  ];
}

/** The drop tower's mast, base and crown; the ring of seats is a mesh of its own. */
function dropTowerMast(): BufferGeometry[] {
  const { x, z, height } = DROP_TOWER;
  return [
    post(2.6, 3, 0.6, 12, WORLD_COLORS.stone, x, 0, z, "stone"),
    post(0.5, 0.7, height, 8, PARK_COLORS.steel, x, 0.6, z, "metal"),
    post(0.14, 0.14, height, 4, PARK_COLORS.red, x + 0.6, 0.6, z, "metal"),
    post(0.14, 0.14, height, 4, PARK_COLORS.red, x - 0.6, 0.6, z, "metal"),
    box(2.4, 0.8, 2.4, PARK_COLORS.red, x, height + 0.9, z, 0, "metal"),
    blob(0.4, PARK_COLORS.yellow, x, height + 1.6, z, 1, 1, "glass"),
  ];
}

/** The chair swing's mast and canopy; the arms and chairs turn separately. */
function swingMast(): BufferGeometry[] {
  const { x, y, z, radius } = SWING;
  return [
    post(1.6, 1.8, 0.4, 12, WORLD_COLORS.stone, x, 0, z, "stone"),
    post(0.36, 0.44, y - 0.2, 8, PARK_COLORS.cream, x, 0.4, z, "plaster"),
    cone(radius * 0.7, 1.6, 12, PARK_COLORS.teal, x, y + 0.6, z, "metal"),
    blob(0.35, PARK_COLORS.yellow, x, y + 2.4, z, 1, 1, "glass"),
  ];
}

/** A game stall: a tent with a striped roof and a counter, facing +Z before `rotation`. */
function gameStall(x: number, z: number, rotation: number, color: string): BufferGeometry[] {
  const parts: BufferGeometry[] = [
    box(3.6, 0.2, 2.6, WORLD_COLORS.timber, 0, 0.1, 0, 0, "planks"),
    box(3.4, 1.0, 0.3, WORLD_COLORS.timberDark, 0, 0.7, 1.15, 0, "planks"),
    box(3.4, 1.6, 0.2, PARK_COLORS.cream, 0, 1.0, -1.2, 0, "plaster"),
    cone(2.6, 1.6, 4, color, 0, 2.6, 0, "plain"),
    blob(0.22, PARK_COLORS.yellow, 0, 4.3, 0, 1, 0, "glass"),
  ];
  for (const px of [-1.6, 1.6]) {
    for (const pz of [-1.1, 1.1]) parts.push(post(0.08, 0.1, 2.6, 4, WORLD_COLORS.timberDark, px, 0.2, pz, "bark"));
  }
  // Prizes on the back wall.
  for (const [px, py] of [[-1.1, 1.4], [-0.4, 1.6], [0.4, 1.3], [1.1, 1.6]] as const) {
    parts.push(blob(0.22, [PARK_COLORS.red, PARK_COLORS.teal, PARK_COLORS.yellow][Math.abs(Math.round(px * 3)) % 3], px, py, -1.05, 1, 0, "plain"));
  }
  for (const part of parts) {
    part.rotateY(rotation);
    part.translate(x, 0, z);
  }
  return parts;
}

/** A bandstand: a round deck under a conical roof on posts. */
function bandstand(x: number, z: number): BufferGeometry[] {
  const parts: BufferGeometry[] = [
    post(3.4, 3.6, 0.6, 12, WORLD_COLORS.stone, x, 0, z, "stone"),
    post(3.2, 3.2, 0.2, 12, WORLD_COLORS.timber, x, 0.6, z, "planks"),
    cone(4.0, 1.8, 8, PARK_COLORS.teal, x, 3.6, z, "metal"),
    post(3.9, 3.9, 0.2, 8, PARK_COLORS.cream, x, 3.5, z, "plaster"),
    blob(0.3, PARK_COLORS.yellow, x, 5.7, z, 1, 1, "glass"),
  ];
  for (let index = 0; index < 8; index += 1) {
    const angle = (index / 8) * Math.PI * 2;
    parts.push(post(0.12, 0.14, 3, 5, PARK_COLORS.cream, x + Math.cos(angle) * 3, 0.6, z + Math.sin(angle) * 3, "plaster"));
  }
  const rail = createFenceGeometry(2.2);
  for (let index = 1; index < 8; index += 1) {
    const angle = (index / 8) * Math.PI * 2 + Math.PI / 8;
    const segment = rail.clone();
    segment.rotateY(-angle + Math.PI / 2);
    segment.translate(x + Math.cos(angle) * 3, 0.8, z + Math.sin(angle) * 3);
    parts.push(segment);
  }
  return parts;
}

/** A vendor's cart: a box on two wheels under a small awning. */
function cart(x: number, z: number, rotation: number, color: string): BufferGeometry[] {
  const parts: BufferGeometry[] = [
    box(1.6, 1.0, 0.9, PARK_COLORS.cream, 0, 0.9, 0, 0, "planks"),
    box(1.7, 0.1, 1.0, color, 0, 1.45, 0, 0, "plain"),
    post(0.05, 0.05, 1.3, 4, PARK_COLORS.steel, 0.7, 1.4, 0.35, "metal"),
    post(0.05, 0.05, 1.3, 4, PARK_COLORS.steel, -0.7, 1.4, 0.35, "metal"),
    awning(1.9, 0.6, color, 0, 2.7, 0, "plain"),
  ];
  for (const wx of [-0.55, 0.55]) {
    const wheel = post(0.3, 0.3, 0.08, 10, WORLD_COLORS.slateDark, 0, 0, 0, "metal");
    wheel.rotateZ(Math.PI / 2);
    wheel.translate(wx, 0.3, 0.25);
    parts.push(wheel);
  }
  for (const part of parts) {
    part.rotateY(rotation);
    part.translate(x, 0, z);
  }
  return parts;
}

/** Poles with strings of lights between them, around the fairground. */
function lightStrings(points: ReadonlyArray<readonly [number, number]>): BufferGeometry[] {
  const parts: BufferGeometry[] = [];
  for (let index = 0; index < points.length; index += 1) {
    const [x, z] = points[index];
    parts.push(post(0.12, 0.16, 5, 5, WORLD_COLORS.timberDark, x, 0, z, "bark"));
    const [nx, nz] = points[(index + 1) % points.length];
    const span = Math.hypot(nx - x, nz - z);
    const bulbs = Math.max(2, Math.floor(span / 1.6));
    for (let bulb = 1; bulb < bulbs; bulb += 1) {
      const t = bulb / bulbs;
      const sag = Math.sin(t * Math.PI) * 0.7;
      parts.push(blob(0.16, WORLD_COLORS.lantern, x + (nx - x) * t, 4.9 - sag, z + (nz - z) * t, 1, 0, "glass"));
    }
  }
  return parts;
}

/** The fairground: everything that does not move. */
export function createAmusementParkGeometry(): BufferGeometry {
  const parts: BufferGeometry[] = [
    ...ferrisFrame(),
    ...carouselCanopy(),
    ...dropTowerMast(),
    ...swingMast(),
    ...bumperCars(2, -18),
    ...bandstand(-12, -19),
    ...ticketGate(2, 18),
    ...kiosk(-10, 12, 0.3, PARK_COLORS.red),
    ...kiosk(-4, 14, 0.1, PARK_COLORS.teal),
    ...kiosk(12, 14, -0.2, PARK_COLORS.yellow),
    // Game stalls down the west and east fences, facing the midway.
    ...gameStall(-25, 2, Math.PI / 2, PARK_COLORS.red),
    ...gameStall(-25, 8, Math.PI / 2, PARK_COLORS.teal),
    ...gameStall(-25, -12, Math.PI / 2, PARK_COLORS.yellow),
    ...gameStall(25, -8, -Math.PI / 2, PARK_COLORS.teal),
    ...gameStall(25, -2, -Math.PI / 2, PARK_COLORS.red),
    ...gameStall(25, 10, -Math.PI / 2, PARK_COLORS.yellow),
    ...cart(-8, 8, 0.4, PARK_COLORS.red),
    ...cart(9, 10, -0.5, PARK_COLORS.teal),
    ...cart(-2, -9, 1.2, PARK_COLORS.yellow),
    ...lightStrings([[-28, 16], [-28, -22], [22, -24], [24, 16]]),
    ...lightStrings([[-6, -3], [10, -3], [10, 1], [-6, 1]]),
  ];

  // A paved midway from the gate past the rides.
  parts.push(box(6, 0.12, 30, WORLD_COLORS.paving, 2, 0.06, 2, 0, "paving"));
  parts.push(box(34, 0.12, 5, WORLD_COLORS.paving, -4, 0.06, 5, 0, "paving"));

  for (const [x, z, rotation] of [[-22, 6, 0.2], [6, -6, 1.8], [18, -4, -0.6]] as const) {
    const bench = createBenchGeometry();
    bench.rotateY(rotation);
    bench.translate(x, 0, z);
    parts.push(bench);
  }
  for (const [x, z] of [[-24, 14], [20, -20], [24, 12], [-26, -20]] as const) {
    const lamp = createLamppostGeometry();
    lamp.translate(x, 0, z);
    parts.push(lamp);
  }
  for (const [x, z] of [[-14, 18], [-2, 20], [16, 20]] as const) {
    const table = createCafeTableGeometry(PARK_COLORS.red);
    table.translate(x, 0, z);
    parts.push(table);
  }

  // A fence around the ground, with the gate as its only gap.
  for (const [ax, az, length, rotation] of [
    [-28, -3, 38, Math.PI / 2],
    [26, -4, 40, Math.PI / 2],
    [-1, -25, 54, 0],
    [-18, 18, 20, 0],
    [17, 18, 18, 0],
  ] as const) {
    const fence = createFenceGeometry(length);
    fence.rotateY(rotation);
    fence.translate(ax, 0, az);
    parts.push(fence);
  }

  return merge(parts);
}

/** The wheel itself: rim, spokes and gondolas, centred on its axle, in the XY plane. */
export function createFerrisWheelGeometry(): BufferGeometry {
  const { radius } = FERRIS_WHEEL;
  const gondolas = 12;
  const parts: BufferGeometry[] = [];

  for (const side of [-1.2, 1.2]) {
    for (let index = 0; index < gondolas; index += 1) {
      const angle = (index / gondolas) * Math.PI * 2;
      const next = ((index + 1) / gondolas) * Math.PI * 2;
      // A rod up the Y axis from the hub, swung round to its angle in the wheel's plane.
      const spoke = post(0.09, 0.09, radius, 5, PARK_COLORS.steel, 0, 0, 0, "metal");
      spoke.rotateZ(angle - Math.PI / 2);
      spoke.translate(0, 0, side);
      parts.push(spoke);
      const chord = 2 * radius * Math.sin(Math.PI / gondolas);
      const mid = (angle + next) / 2;
      const rim = box(chord + 0.1, 0.16, 0.16, PARK_COLORS.steel, 0, 0, 0, 0, "metal");
      rim.rotateZ(mid + Math.PI / 2);
      rim.translate(Math.cos(mid) * radius * Math.cos(Math.PI / gondolas), Math.sin(mid) * radius * Math.cos(Math.PI / gondolas), side);
      parts.push(rim);
    }
  }
  // The hub: a drum along the axle.
  parts.push(pipe(1.1, 3.2, 12, PARK_COLORS.red, 0, 0, 0, 0, "metal"));

  // Gondolas hang from the rim: a cabin under a little roof, one of three colours.
  const colours = [PARK_COLORS.red, PARK_COLORS.teal, PARK_COLORS.yellow];
  for (let index = 0; index < gondolas; index += 1) {
    const angle = (index / gondolas) * Math.PI * 2;
    const gx = Math.cos(angle) * radius;
    const gy = Math.sin(angle) * radius;
    parts.push(box(1.7, 1.5, 1.6, colours[index % 3], gx, gy - 1.3, 0, 0, "metal"));
    parts.push(box(1.9, 0.14, 1.8, WORLD_COLORS.slateDark, gx, gy - 0.5, 0, 0, "metal"));
    parts.push(box(1.4, 0.7, 1.62, WORLD_COLORS.frostBlue, gx, gy - 1.05, 0, 0, "glass"));
    parts.push(box(0.12, 0.6, 0.12, PARK_COLORS.steel, gx, gy - 0.2, 0, 0, "metal"));
  }

  return merge(parts);
}

/** The chair swing's turning top: arms from the hub, chains, and chairs flung outward. */
export function createSwingGeometry(): BufferGeometry {
  const { radius } = SWING;
  const chairs = 10;
  const parts: BufferGeometry[] = [post(1.2, 1.4, 0.5, 12, PARK_COLORS.red, 0, -0.25, 0, "metal")];
  const colours = [PARK_COLORS.red, PARK_COLORS.teal, PARK_COLORS.yellow];
  for (let index = 0; index < chairs; index += 1) {
    const angle = (index / chairs) * Math.PI * 2;
    const arm = post(0.06, 0.06, radius, 4, PARK_COLORS.steel, 0, 0, 0, "metal");
    arm.rotateZ(-Math.PI / 2);
    arm.rotateY(-angle);
    parts.push(arm);
    // The chair hangs out and down, as if flung by the turn.
    const cx = Math.cos(angle) * (radius + 1.4);
    const cz = Math.sin(angle) * (radius + 1.4);
    const chain = post(0.03, 0.03, 3.4, 3, PARK_COLORS.steel, 0, 0, 0, "metal");
    chain.rotateZ(0.42);
    chain.rotateY(-angle);
    chain.translate(Math.cos(angle) * (radius + 0.7), -3.2, Math.sin(angle) * (radius + 0.7));
    parts.push(chain);
    const chair = box(0.6, 0.5, 0.6, colours[index % 3], 0, 0, 0, 0, "metal");
    chair.rotateY(-angle);
    chair.translate(cx, -3.4, cz);
    parts.push(chair);
  }
  return merge(parts);
}

/** The drop tower's ring of seats, centred on the mast. */
export function createDropRingGeometry(): BufferGeometry {
  const seats = 8;
  const parts: BufferGeometry[] = [post(1.5, 1.5, 0.7, 12, PARK_COLORS.yellow, 0, 0, 0, "metal")];
  for (let index = 0; index < seats; index += 1) {
    const angle = (index / seats) * Math.PI * 2;
    const seat = box(0.7, 0.9, 0.7, PARK_COLORS.red, 0, 0, 0, 0, "metal");
    seat.rotateY(-angle);
    seat.translate(Math.cos(angle) * 1.9, 0.5, Math.sin(angle) * 1.9);
    parts.push(seat);
    const back = box(0.7, 1.0, 0.16, PARK_COLORS.steel, 0, 0, 0, 0, "metal");
    back.rotateY(-angle + Math.PI / 2);
    back.translate(Math.cos(angle) * 1.55, 1.0, Math.sin(angle) * 1.55);
    parts.push(back);
  }
  return merge(parts);
}

/** The carousel's turning platform with its horses and poles, centred on its pivot. */
export function createCarouselGeometry(): BufferGeometry {
  const { radius } = CAROUSEL;
  const horses = 8;
  const parts: BufferGeometry[] = [post(radius, radius + 0.2, 0.5, 16, PARK_COLORS.cream, 0, 0, 0, "planks")];
  const colours = [WORLD_COLORS.whitewash, PARK_COLORS.red, PARK_COLORS.teal, PARK_COLORS.yellow];
  for (let index = 0; index < horses; index += 1) {
    const angle = (index / horses) * Math.PI * 2;
    const hx = Math.cos(angle) * radius * 0.7;
    const hz = Math.sin(angle) * radius * 0.7;
    const lift = 0.3 + (index % 2) * 0.4;
    parts.push(post(0.06, 0.06, 3.9, 5, PARK_COLORS.yellow, hx, 0.5, hz, "metal"));
    const body = box(0.5, 0.55, 1.5, colours[index % 4], 0, 0, 0, 0, "plain");
    body.rotateY(-angle + Math.PI / 2);
    body.translate(hx, 1.4 + lift, hz);
    parts.push(body);
    const head = box(0.36, 0.5, 0.5, colours[index % 4], 0, 0, 0, 0, "plain");
    head.rotateY(-angle + Math.PI / 2);
    head.translate(hx + Math.sin(angle) * 0.75 * -1 * 0, 1.95 + lift, hz);
    head.translate(Math.cos(angle + Math.PI / 2) * 0.75, 0, Math.sin(angle + Math.PI / 2) * 0.75);
    parts.push(head);
  }
  return merge(parts);
}

const RESTAURANT: BuildingSpec = {
  width: 12,
  depth: 8,
  height: 3.6,
  roofHeight: 2.6,
  wallColor: WORLD_COLORS.timber,
  roofColor: WORLD_COLORS.slateDark,
  wallSurface: "planks",
  roofSurface: "slate",
  stories: 1,
  windows: true,
};

/**
 * The lakeside restaurant: a timber hall with a deck out over the water, tables under
 * umbrellas, a bar counter, string lights and a small jetty for arriving boats.
 * The deck side faces -Z, toward the water; the entrance faces the street.
 */
export function createRestaurantGeometry(): BufferGeometry {
  const parts: BufferGeometry[] = [createBuildingGeometry(RESTAURANT)];

  // The deck, on piles, reaching over the water behind the hall.
  const deckDepth = 9;
  const deckZ = -RESTAURANT.depth / 2 - deckDepth / 2 + 0.2;
  parts.push(box(15, 0.3, deckDepth, WORLD_COLORS.timber, 0, 0.9, deckZ, 0, "planks"));
  for (const px of [-6.8, -3.4, 0, 3.4, 6.8]) {
    for (const pz of [deckZ - deckDepth / 2 + 0.5, deckZ + deckDepth / 2 - 0.5]) {
      parts.push(post(0.18, 0.22, 2.6, 6, WORLD_COLORS.timberDark, px, -1.6, pz, "bark"));
    }
  }
  // Railings on three sides.
  for (const [ax, az, length, rotation] of [
    [0, deckZ - deckDepth / 2, 15, 0],
    [-7.5, deckZ, deckDepth, Math.PI / 2],
    [7.5, deckZ, deckDepth, Math.PI / 2],
  ] as const) {
    const rail = createFenceGeometry(length);
    rail.rotateY(rotation);
    rail.translate(ax, 0.9, az);
    parts.push(rail);
  }
  for (const [tx, tz] of [[-5, deckZ + 1], [-1, deckZ - 1.5], [3, deckZ + 1.2], [6, deckZ - 1.8]] as const) {
    const table = createCafeTableGeometry(WORLD_COLORS.wine);
    table.translate(tx, 0.9, tz);
    parts.push(table);
  }
  parts.push(...lightStrings([[-7.2, deckZ - 4.2], [7.2, deckZ - 4.2], [7.2, deckZ + 4.2], [-7.2, deckZ + 4.2]]).map((part) => {
    part.translate(0, 0.9, 0);
    return part;
  }));

  // The sign over the door, the bar hatch on the deck side, and the jetty.
  parts.push(box(6, 1.0, 0.2, WORLD_COLORS.whitewash, 0, RESTAURANT.height + 0.4, RESTAURANT.depth / 2 + 0.12, 0, "plaster"));
  parts.push(awning(7, 1.1, WORLD_COLORS.wine, 0, RESTAURANT.height - 0.2, RESTAURANT.depth / 2 + 0.6, "plain"));
  parts.push(box(4, 1.0, 0.6, WORLD_COLORS.timberDark, 2, 1.4, -RESTAURANT.depth / 2 - 0.3, 0, "planks"));
  parts.push(box(1.8, 0.24, 8, WORLD_COLORS.timber, -9.5, 0.7, deckZ - 2, 0, "planks"));
  for (const jz of [deckZ - 5.5, deckZ + 1.5]) {
    parts.push(post(0.16, 0.2, 1.8, 6, WORLD_COLORS.timberDark, -9.5, -0.6, jz, "bark"));
  }

  return merge(parts);
}
