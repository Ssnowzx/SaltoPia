import { GROVES, WORLD_SEED } from "./constants";
import { fractalNoise2D } from "./noise";

/**
 * Where the woods are.
 *
 * Land is not evenly dotted with trees: they stand in woods and groves with open pasture
 * between. One field decides it, read twice - the scatter plants by it, and the terrain
 * darkens the ground under it - so every wood stands on its own shade and no dark patch
 * is left without trees. See design.md D5 and D8 of elevate-world-realism.
 */

/**
 * How wooded a point is, in [0, 1]: 0 open pasture, 1 the heart of a wood.
 *
 * @param x - World position.
 * @param z - World position.
 */
export function groveDensityAt(x: number, z: number): number {
  const field = fractalNoise2D(x * GROVES.frequency, z * GROVES.frequency, WORLD_SEED + 97, 2);
  const edge = fractalNoise2D(x * GROVES.edgeFrequency, z * GROVES.edgeFrequency, WORLD_SEED + 101, 2);
  const value = field + (edge - 0.5) * GROVES.edgeRoughness;
  const t = Math.min(1, Math.max(0, (value - GROVES.openBelow) / (GROVES.woodedAbove - GROVES.openBelow)));
  return t * t * (3 - 2 * t);
}
