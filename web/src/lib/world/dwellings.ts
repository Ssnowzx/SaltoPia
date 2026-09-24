import type { BuildingSpec } from "./building";
import { DWELLING_COLORS } from "./constants";
import { createRandom } from "./noise";

/**
 * The houses of the community, in the vernacular of the Serra.
 *
 * Rendered masonry in pale colours under ceramic tile, and the painted timber houses Lages
 * is built of - board and batten, white trim, a tile or tin roof - with a sobrado and a
 * timber chalet among them. Four designs repeated along a street read as a model village;
 * ten, placed so that no house stands beside its twin, read as a place people built one at
 * a time. See design.md D7 of elevate-world-realism.
 */

export const DWELLING_KEYS = [
  "houseWhite",
  "houseCream",
  "houseYellow",
  "houseSalmon",
  "houseGreenTimber",
  "houseBlueTimber",
  "houseOchreTimber",
  "sobrado",
  "chaletTimber",
  "houseSage",
] as const;

export type DwellingKey = (typeof DWELLING_KEYS)[number];

const ONE_STOREY = { width: 6.8, depth: 5.6, height: 3.1, roofHeight: 2.0, windows: true, chimney: true } as const;

export const DWELLINGS: Readonly<Record<DwellingKey, BuildingSpec>> = {
  houseWhite: { ...ONE_STOREY, wallColor: DWELLING_COLORS.white, roofColor: DWELLING_COLORS.tile, wallSurface: "plaster", roofSurface: "tiles", shutters: DWELLING_COLORS.shutterGreen, porch: true },
  houseCream: { ...ONE_STOREY, width: 7.4, wallColor: DWELLING_COLORS.cream, roofColor: DWELLING_COLORS.tileDeep, wallSurface: "plaster", roofSurface: "tiles", roofStyle: "hip" },
  houseYellow: { ...ONE_STOREY, wallColor: DWELLING_COLORS.yellow, roofColor: DWELLING_COLORS.tile, wallSurface: "plaster", roofSurface: "tiles", shutters: DWELLING_COLORS.shutterBlue },
  houseSalmon: { ...ONE_STOREY, width: 7.2, wallColor: DWELLING_COLORS.salmon, roofColor: DWELLING_COLORS.slateGrey, wallSurface: "plaster", roofSurface: "slate", roofStyle: "hip", porch: true },
  houseGreenTimber: { ...ONE_STOREY, wallColor: DWELLING_COLORS.timberGreen, roofColor: DWELLING_COLORS.tile, wallSurface: "planks", roofSurface: "tiles", porch: true },
  houseBlueTimber: { ...ONE_STOREY, width: 6.4, wallColor: DWELLING_COLORS.timberBlue, roofColor: DWELLING_COLORS.tin, wallSurface: "planks", roofSurface: "metal" },
  houseOchreTimber: { ...ONE_STOREY, width: 7.0, wallColor: DWELLING_COLORS.timberOchre, roofColor: DWELLING_COLORS.tileDeep, wallSurface: "planks", roofSurface: "tiles", veranda: true },
  sobrado: { ...ONE_STOREY, width: 7.0, depth: 6.0, height: 3.0, roofHeight: 1.7, stories: 2, wallColor: DWELLING_COLORS.sobrado, roofColor: DWELLING_COLORS.tile, wallSurface: "plaster", roofSurface: "tiles", roofStyle: "hip", balcony: true, shutters: DWELLING_COLORS.shutterGreen },
  chaletTimber: { ...ONE_STOREY, width: 6.2, roofHeight: 2.9, wallColor: DWELLING_COLORS.timberNatural, roofColor: DWELLING_COLORS.shingle, wallSurface: "planks", roofSurface: "shingle", trim: DWELLING_COLORS.trimCream, porch: true },
  houseSage: { ...ONE_STOREY, width: 7.2, wallColor: DWELLING_COLORS.sage, roofColor: DWELLING_COLORS.tile, wallSurface: "plaster", roofSurface: "tiles", shutters: DWELLING_COLORS.shutterWhite },
};

/** A dwelling already standing, with its design fixed - a lakefront house, a cabin. */
export interface FixedDwelling {
  readonly x: number;
  readonly z: number;
  readonly design: string;
}

interface Point {
  readonly x: number;
  readonly z: number;
}

function nearestIndex(points: readonly Point[], index: number): number {
  let best = -1;
  let bestDistance = Number.POSITIVE_INFINITY;
  points.forEach((other, otherIndex) => {
    if (otherIndex === index) return;
    const d = Math.hypot(points[index].x - other.x, points[index].z - other.z);
    if (d < bestDistance) {
      bestDistance = d;
      best = otherIndex;
    }
  });
  return best;
}

/**
 * Chooses a design for each new dwelling so that no dwelling's nearest dwelling - new or
 * fixed - shares its design, and neighbours within `radius` avoid repeating where the
 * designs allow. Seeded, so the town is the same on every load.
 *
 * @returns One design per entry of `sites`, in order.
 */
export function assignDwellingDesigns<T extends string>(
  sites: readonly Point[],
  designs: readonly T[],
  fixed: readonly FixedDwelling[],
  seed: number,
  radius: number,
): T[] {
  const random = createRandom(seed);
  const all: Point[] = [...fixed, ...sites];
  const picks: T[] = [];
  const designOf = (index: number): string => (index < fixed.length ? fixed[index].design : picks[index - fixed.length]);
  const nearest = all.map((_, index) => nearestIndex(all, index));

  for (let index = fixed.length; index < all.length; index += 1) {
    const taken = new Set<string>();
    for (let other = 0; other < index; other += 1) {
      const near = Math.hypot(all[index].x - all[other].x, all[index].z - all[other].z) < radius;
      if (near || nearest[index] === other || nearest[other] === index) taken.add(designOf(other));
    }
    const start = Math.floor(random() * designs.length);
    const free = designs.map((_, step) => designs[(start + step) % designs.length]).find((design) => !taken.has(design));
    picks.push(free ?? designs[start]);
  }

  return picks;
}
