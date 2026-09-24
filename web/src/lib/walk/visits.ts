import { WALK } from "@/lib/world/constants";

/**
 * Where a walker counts as having arrived at a place: a circle round its site reaching past
 * the building, so it is entered from outside. See design.md D7 of add-walking-character.
 */

export interface ArrivalArea {
  readonly slug: string;
  readonly x: number;
  readonly z: number;
  readonly radius: number;
}

export interface SiteFootprint {
  readonly slug: string;
  readonly x: number;
  readonly z: number;
  /** The keep-out radius of the place's building, 0 for an open place. */
  readonly footprint: number;
}

export function arrivalAreas(sites: readonly SiteFootprint[]): readonly ArrivalArea[] {
  return sites.map((site) => ({
    slug: site.slug,
    x: site.x,
    z: site.z,
    radius: Math.max(WALK.arrivalMinimum, site.footprint * WALK.buildingShare + WALK.arrivalMargin),
  }));
}

/** The area a point is in - the nearest centre when areas overlap - or null. */
export function areaAt(x: number, z: number, areas: readonly ArrivalArea[]): ArrivalArea | null {
  let best: ArrivalArea | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const area of areas) {
    const distance = Math.hypot(x - area.x, z - area.z);
    if (distance <= area.radius && distance < bestDistance) {
      best = area;
      bestDistance = distance;
    }
  }
  return best;
}
