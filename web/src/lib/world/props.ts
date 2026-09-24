import { BoxGeometry, BufferGeometry, ConeGeometry, CylinderGeometry, Float32BufferAttribute, IcosahedronGeometry } from "three";

import { blob, box, createGableRoofGeometry, merge, paint, post } from "./builders";
import { WORLD_COLORS } from "./constants";
import type { SurfaceKey } from "./textures";
import { createRandom } from "./noise";

/**
 * The things that make a lakeside community read as lived in: palms, parked cars,
 * piers, chalets, cabins on stilts, and the boats on the water.
 *
 * Like every builder, each returns one merged geometry, built at the origin facing +Z
 * with its base at y = 0 (boats and piers at the waterline).
 */

/** A double-sided triangle, for sails. */
function triangle(
  a: readonly [number, number, number],
  b: readonly [number, number, number],
  c: readonly [number, number, number],
  color: string,
): BufferGeometry {
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute([...a, ...b, ...c, ...c, ...b, ...a], 3));
  geometry.computeVertexNormals();
  return paint(geometry, color, "plain");
}

/** A sail: a triangle hinged on the mast, swung out by `boom` radians. */
function sail(
  a: readonly [number, number, number],
  b: readonly [number, number, number],
  c: readonly [number, number, number],
  boom: number,
  color: string,
): BufferGeometry {
  const geometry = triangle(a, b, c, color);
  // The mast stands at (0, y, a.z); rotate the sail about it.
  geometry.translate(0, 0, -a[2]);
  geometry.rotateY(boom);
  geometry.translate(0, 0, a[2]);
  return geometry;
}

/** A wheel lying on its side, axle along X. */
export function wheel(x: number, y: number, z: number, radius: number): BufferGeometry {
  const geometry = new CylinderGeometry(radius, radius, radius * 0.9, 8);
  geometry.rotateZ(Math.PI / 2);
  geometry.translate(x, y, z);
  return paint(geometry, WORLD_COLORS.wheel, "metal");
}

// ---------------------------------------------------------------------------------
// Palms
// ---------------------------------------------------------------------------------

/** A palm: a leaning, slightly curved trunk and a crown of drooping fronds. */
export function createPalmGeometry(height = 7, seed = 1): BufferGeometry {
  const random = createRandom(seed);
  const parts: BufferGeometry[] = [];
  const lean = 0.06 + random() * 0.06;
  const segments = 4;
  const segmentHeight = height / segments;

  for (let index = 0; index < segments; index += 1) {
    const offset = lean * index * index * 1.4;
    const trunk = new CylinderGeometry(0.16 - index * 0.015, 0.2 - index * 0.015, segmentHeight + 0.15, 6);
    trunk.translate(offset, index * segmentHeight + segmentHeight / 2, 0);
    parts.push(paint(trunk, WORLD_COLORS.bark, "bark"));
  }

  const crownX = lean * (segments - 1) * (segments - 1) * 1.4;
  const crownY = height;
  const fronds = 9;
  for (let index = 0; index < fronds; index += 1) {
    const angle = (index / fronds) * Math.PI * 2 + random() * 0.4;
    const frond = new BoxGeometry(0.55, 0.08, 3.4);
    frond.translate(0, 0, 1.7);
    frond.rotateX(-0.55 - random() * 0.25);
    frond.rotateY(angle);
    frond.translate(crownX, crownY, 0);
    parts.push(paint(frond, WORLD_COLORS.palm, "foliage"));
  }

  for (let index = 0; index < 3; index += 1) {
    const angle = index * 2.1;
    parts.push(blob(0.2, WORLD_COLORS.timberDark, crownX + Math.cos(angle) * 0.3, crownY - 0.3, Math.sin(angle) * 0.3, 1, 0, "bark"));
  }

  return merge(parts);
}

// ---------------------------------------------------------------------------------
// Cars
// ---------------------------------------------------------------------------------

/** A parked sedan, facing +Z. */
export function createSedanGeometry(color: string): BufferGeometry {
  const parts: BufferGeometry[] = [
    box(1.7, 0.5, 3.9, color, 0, 0.62, 0, 0, "metal"),
    box(1.5, 0.55, 2.0, color, 0, 1.12, -0.2, 0, "metal"),
    box(1.52, 0.4, 1.7, WORLD_COLORS.slateDark, 0, 1.15, -0.2, 0, "glass"),
    box(1.2, 0.12, 0.08, WORLD_COLORS.lantern, 0, 0.7, 1.96, 0, "glass"),
    box(1.2, 0.1, 0.08, WORLD_COLORS.ember, 0, 0.7, -1.96, 0, "glass"),
  ];
  for (const [x, z] of [[-0.85, 1.25], [0.85, 1.25], [-0.85, -1.25], [0.85, -1.25]] as const) {
    parts.push(wheel(x, 0.34, z, 0.34));
  }
  return merge(parts);
}

// ---------------------------------------------------------------------------------
// Piers and cabins
// ---------------------------------------------------------------------------------

/** A timber pier along +Z from the origin, its deck just above the waterline. */
export function createPierGeometry(length = 10, width = 2.2): BufferGeometry {
  const parts: BufferGeometry[] = [box(width, 0.16, length, WORLD_COLORS.timber, 0, 0.9, length / 2, 0, "planks")];
  for (let z = 0.6; z < length; z += 2.4) {
    for (const side of [-1, 1]) {
      parts.push(post(0.12, 0.13, 2.6, 5, WORLD_COLORS.timberDark, side * (width / 2 - 0.15), -1.6, z, "planks"));
      parts.push(post(0.05, 0.05, 0.8, 4, WORLD_COLORS.timberDark, side * (width / 2 - 0.15), 0.98, z, "planks"));
    }
  }
  for (const side of [-1, 1]) {
    parts.push(box(0.06, 0.06, length, WORLD_COLORS.timber, side * (width / 2 - 0.15), 1.72, length / 2, 0, "planks"));
  }
  return merge(parts);
}

/** A flat triangle, wound as given. */
function pane(points: ReadonlyArray<readonly [number, number, number]>, color: string, surface: SurfaceKey): BufferGeometry {
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(points.flat(), 3));
  return paint(geometry, color, surface);
}

/**
 * An A-frame chalet facing +Z: the roof is the wall, two thick slabs down to a stone
 * plinth, the front gable glazed floor to ridge behind timber mullions, a deck out front.
 * Built as a solid prism with a door and a window, it read from the hub as a red tent.
 */
export function createAFrameGeometry(roofColor: string, roofSurface: "shingle" | "slate" | "tiles" = "shingle"): BufferGeometry {
  const width = 4.6;
  const depth = 5.4;
  const height = 4.8;
  const base = 0.3;
  const thickness = 0.16;
  const halfWidth = width / 2;
  const pitch = Math.atan2(height, halfWidth);
  const slope = (halfWidth + 0.3) / Math.cos(pitch);
  const length = depth + 0.7;
  const parts: BufferGeometry[] = [box(width + 0.5, base, depth + 0.4, WORLD_COLORS.stoneDark, 0, base / 2, 0, 0, "stone")];

  for (const side of [-1, 1] as const) {
    const slab = new BoxGeometry(slope, thickness, length);
    slab.rotateZ(-side * pitch);
    const centreX = side * (slope / 2) * Math.cos(pitch) - side * Math.sin(pitch) * (thickness / 2);
    const centreY = base + height - (slope / 2) * Math.sin(pitch) - Math.cos(pitch) * (thickness / 2);
    slab.translate(centreX, centreY, 0);
    parts.push(paint(slab, roofColor, roofSurface));
  }
  parts.push(box(0.3, 0.18, length, WORLD_COLORS.tileDark, 0, base + height + 0.03, 0, 0, roofSurface));

  // The glazed front, set back behind the slabs' edges, and the planked back.
  const inset = 0.28;
  const top = base + height - 0.35;
  const front = depth / 2 - 0.12;
  parts.push(pane([[-halfWidth + inset, base, front], [halfWidth - inset, base, front], [0, top, front]], WORLD_COLORS.glass, "glass"));
  parts.push(pane([[halfWidth - inset, base, -front], [-halfWidth + inset, base, -front], [0, top, -front]], WORLD_COLORS.timber, "planks"));
  parts.push(box(0.1, top - base, 0.1, WORLD_COLORS.timberDark, 0, (base + top) / 2, front + 0.04, 0, "planks"));
  parts.push(box(width * 0.62, 0.1, 0.1, WORLD_COLORS.timberDark, 0, base + 2.1, front + 0.04, 0, "planks"));
  parts.push(box(1.0, 2.0, 0.12, WORLD_COLORS.timberDark, 0, base + 1.0, front + 0.06, 0, "planks"));

  // The deck and its rail.
  const deckZ = depth / 2 + 1.1;
  parts.push(box(width + 1.4, 0.14, 2.2, WORLD_COLORS.timber, 0, base + 0.07, deckZ, 0, "planks"));
  for (const x of [-2.9, -1.45, 0, 1.45, 2.9]) parts.push(post(0.05, 0.05, 0.9, 4, WORLD_COLORS.timberDark, x, base, deckZ + 1.0, "planks"));
  parts.push(box(width + 1.4, 0.07, 0.07, WORLD_COLORS.timberDark, 0, base + 0.92, deckZ + 1.0, 0, "planks"));

  parts.push(box(0.5, 2.2, 0.5, WORLD_COLORS.tileDark, 1.2, base + height * 0.62 + 0.6, -0.9, 0, "brick"));
  return merge(parts);
}

/** A cabin on stilts, for the island shore: deck, hut, gable roof, railing. */
export function createStiltCabinGeometry(): BufferGeometry {
  const deckY = 1.7;
  const parts: BufferGeometry[] = [];

  for (const [x, z] of [[-1.9, -1.9], [1.9, -1.9], [-1.9, 1.9], [1.9, 1.9], [0, 2.8], [0, -1.9]] as const) {
    parts.push(post(0.13, 0.15, deckY + 1.6, 5, WORLD_COLORS.timberDark, x, -1.6, z, "planks"));
  }
  parts.push(box(4.6, 0.16, 5.8, WORLD_COLORS.timber, 0, deckY, 0.4, 0, "planks"));
  parts.push(box(3.4, 2.3, 3.2, WORLD_COLORS.timber, 0, deckY + 1.15 + 0.08, -0.6, 0, "planks"));

  const roof = createGableRoofGeometry(3.9, 3.7, 1.5);
  roof.translate(0, deckY + 2.38, -0.6);
  parts.push(paint(roof, WORLD_COLORS.shingle, "shingle"));

  parts.push(box(0.7, 1.5, 0.08, WORLD_COLORS.timberDark, -0.6, deckY + 0.83, 1.02, 0, "planks"));
  parts.push(box(0.8, 0.7, 0.08, WORLD_COLORS.frostBlue, 0.8, deckY + 1.4, 1.02, 0, "glass"));

  for (const x of [-2.2, -1.1, 0, 1.1, 2.2]) {
    parts.push(post(0.05, 0.05, 0.9, 4, WORLD_COLORS.timberDark, x, deckY + 0.08, 3.2, "planks"));
  }
  parts.push(box(4.6, 0.06, 0.06, WORLD_COLORS.timber, 0, deckY + 0.98, 3.2, 0, "planks"));

  return merge(parts);
}

// ---------------------------------------------------------------------------------
// Boats - built with the bow toward +Z and the waterline at y = 0
// ---------------------------------------------------------------------------------

/** A hull: a box with a pointed bow. */
function hull(width: number, height: number, length: number, color: string): BufferGeometry[] {
  const body = box(width, height, length, color, 0, height / 2 - 0.25, -0.4, 0, "plain");
  const bow = new ConeGeometry(width / 2, width * 1.1, 4);
  bow.rotateX(Math.PI / 2);
  bow.rotateZ(Math.PI / 4);
  bow.scale(1, height / (width / 2), 1);
  bow.translate(0, height / 2 - 0.25, length / 2 - 0.4 + width * 0.55);
  return [body, paint(bow, color, "plain")];
}

/** A small sailboat with a main and a jib. */
export function createSailboatGeometry(sailColor: string): BufferGeometry {
  const parts: BufferGeometry[] = [
    ...hull(1.3, 0.7, 4.0, WORLD_COLORS.boatHull),
    box(0.9, 0.12, 2.0, WORLD_COLORS.timber, 0, 0.46, -0.6, 0, "planks"),
    post(0.05, 0.06, 5.2, 5, WORLD_COLORS.whitewash, 0, 0.4, 0.4, "metal"),
    box(0.06, 0.06, 2.4, WORLD_COLORS.whitewash, 0, 1.2, -0.8, 0, "metal"),
    // The sails are sheeted out at different angles. Both along the centreline, they
    // vanished together whenever the boat pointed at the camera - a flat sheet seen
    // edge-on has no width - and the boat lost its shape for a stretch of every lap.
    sail([0, 1.25, 0.4], [0, 5.4, 0.4], [0, 1.25, -2.0], 0.5, sailColor),
    sail([0, 1.2, 0.5], [0, 4.6, 0.5], [0, 1.2, 2.1], -0.38, WORLD_COLORS.whitewash),
  ];
  return merge(parts);
}

/** A motor yacht with a cabin and a flybridge. */
export function createYachtGeometry(): BufferGeometry {
  const parts: BufferGeometry[] = [
    ...hull(2.3, 0.9, 6.8, WORLD_COLORS.boatHull),
    box(2.3, 0.14, 6.6, WORLD_COLORS.boatTrim, 0, 0.66, -0.5, 0, "plain"),
    box(1.9, 0.9, 3.2, WORLD_COLORS.boatHull, 0, 1.1, -0.6, 0, "plain"),
    box(1.92, 0.42, 2.9, WORLD_COLORS.slateDark, 0, 1.24, -0.6, 0, "glass"),
    box(1.3, 0.5, 1.6, WORLD_COLORS.boatHull, 0, 1.8, -1.0, 0, "plain"),
    box(1.32, 0.3, 1.4, WORLD_COLORS.slateDark, 0, 1.9, -1.0, 0, "glass"),
    box(0.9, 0.06, 0.9, WORLD_COLORS.boatTrim, 0, 2.08, -1.0, 0, "plain"),
    post(0.04, 0.04, 1.2, 4, WORLD_COLORS.metal, 0, 2.1, -0.6, "metal"),
  ];
  return merge(parts);
}

/** A kayak with a paddle across it. */
export function createKayakGeometry(color: string): BufferGeometry {
  const body = new IcosahedronGeometry(1, 1);
  body.scale(0.42, 0.22, 1.7);
  body.translate(0, 0.08, 0);
  const paddle = new BoxGeometry(2.2, 0.05, 0.12);
  paddle.rotateY(0.6);
  paddle.translate(0, 0.42, 0);
  return merge([paint(body, color, "plain"), paint(paddle, WORLD_COLORS.timber, "planks")]);
}
