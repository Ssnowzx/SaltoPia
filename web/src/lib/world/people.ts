import type { BufferGeometry } from "three";

import { blob, box, merge, post } from "./builders";
import { WORLD_COLORS } from "./constants";

/**
 * People, at the scale a map reads them: a torso, a head and two legs.
 *
 * Nothing finer survives at this camera distance, and nothing finer is needed - what a
 * figure contributes is a sense of scale and of the place being used. Each is about
 * 1.7 units tall, which is what makes the buildings around them read as buildings.
 */

/** Shirt colours, so a crowd is not one colour. */
export const SHIRT_COLORS: readonly string[] = [
  "#c9563a",
  "#2f6f7e",
  "#e0b34a",
  "#4a7c4e",
  "#8d5a9c",
  "#f0e6d2",
  "#3a4a5c",
  "#d98b4a",
];

const SKIN = "#c89a72";
const TROUSERS = "#3a4048";

/**
 * A standing figure facing +Z.
 *
 * @param shirt - Shirt colour.
 */
export function createPersonGeometry(shirt: string): BufferGeometry {
  return merge([
    // Legs.
    post(0.09, 0.1, 0.72, 5, TROUSERS, -0.1, 0, 0, "plain"),
    post(0.09, 0.1, 0.72, 5, TROUSERS, 0.1, 0, 0, "plain"),
    // Torso, slightly tapered.
    post(0.19, 0.22, 0.6, 6, shirt, 0, 0.72, 0, "plain"),
    // Arms.
    post(0.06, 0.07, 0.5, 5, shirt, -0.25, 0.78, 0, "plain"),
    post(0.06, 0.07, 0.5, 5, shirt, 0.25, 0.78, 0, "plain"),
    // Head.
    blob(0.16, SKIN, 0, 1.46, 0, 1, 1, "plain"),
  ]);
}

/** A figure seated on a bench or a deck, facing +Z. */
export function createSeatedPersonGeometry(shirt: string): BufferGeometry {
  return merge([
    box(0.36, 0.14, 0.4, TROUSERS, 0, 0.53, 0.06, 0, "plain"),
    post(0.09, 0.1, 0.46, 5, TROUSERS, -0.1, 0.06, 0.28, "plain"),
    post(0.09, 0.1, 0.46, 5, TROUSERS, 0.1, 0.06, 0.28, "plain"),
    post(0.18, 0.2, 0.5, 6, shirt, 0, 0.6, 0, "plain"),
    blob(0.15, SKIN, 0, 1.24, 0, 1, 1, "plain"),
  ]);
}

/** A parasol over a table, the kind that stands along a lakeside promenade. */
export function createParasolGeometry(canopy: string): BufferGeometry {
  return merge([
    post(0.04, 0.05, 2.2, 5, WORLD_COLORS.metal, 0, 0, 0, "metal"),
    post(1.3, 0.05, 0.18, 8, canopy, 0, 2.15, 0, "plain"),
    post(0.5, 0.3, 0.12, 8, WORLD_COLORS.stoneDark, 0, 0, 0, "stone"),
  ]);
}
