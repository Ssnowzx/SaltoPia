import { CAROUSEL, DROP_TOWER, SWING } from "@/lib/world/attractions";
import { WALK } from "@/lib/world/constants";
import { LANDMARKS, MODEL_REGISTRY, type ModelKey, type Placement, buildingFootprint, createScatter, groundHeightFor } from "@/lib/world/neighborhood-layout";
import { SITES, siteAt } from "@/lib/world/sites";

import { occupancyOf } from "./prop-occupancy";
import type { SiteFootprint } from "./visits";
import type { Circle } from "./walk-world";

/**
 * What a walker bumps into, read from the same layout the scene is drawn from: buildings as
 * circles a little inside their footprint, tree trunks, parked cars and rocks. Open places -
 * the square, the fairground, the UFO port's apron - are walked through, not round.
 */

/** Places whose footprint is ground to walk on, not a wall. */
const OPEN_GROUND: ReadonlySet<ModelKey> = new Set<ModelKey>(["praca", "ufoPort", "amusementPark", "bosqueSign", "mirante", "pier", "stiltCabin"]);

/** How much of an open place's levelled pad counts as having arrived. */
const OPEN_ARRIVAL_SHARE = 0.7;

/** Landmarks whose footprint is a whole compound; only its buildings stand in the way. */
const COMPOUND_RADIUS: Readonly<Partial<Record<ModelKey, number>>> = {
  farmRed: 11,
  farmOchre: 11,
  farmTimber: 11,
  salto: 8,
  restaurant: 5,
};

const TRUNKS: ReadonlySet<ModelKey> = new Set<ModelKey>(["araucaria", "araucariaB", "araucariaYoung", "conifer", "broadleaf", "broadleafWarm", "palm"]);

const SMALL: Readonly<Partial<Record<ModelKey, number>>> = {
  sedanWhite: 1.3,
  sedanDark: 1.3,
  sedanSilver: 1.3,
  rock: 1.1,
  lamppost: 0.2,
};

function obstacleFor(placement: Placement): Circle | null {
  if (placement.afloat || OPEN_GROUND.has(placement.model)) return null;
  const compound = COMPOUND_RADIUS[placement.model];
  if (compound !== undefined) return { x: placement.x, z: placement.z, radius: compound * placement.scale };
  const footprint = buildingFootprint(placement);
  if (footprint !== null) return { x: placement.x, z: placement.z, radius: footprint * WALK.buildingShare };
  if (TRUNKS.has(placement.model)) return { x: placement.x, z: placement.z, radius: WALK.trunkRadius * placement.scale };
  const small = SMALL[placement.model];
  return small === undefined ? null : { x: placement.x, z: placement.z, radius: small * placement.scale };
}

/** A cell of walkable floor raised above the ground - paving, boards, a platform. */
export interface Floor {
  readonly x: number;
  readonly z: number;
  readonly height: number;
}

/** From a placement's own frame to the world: turned about Y, scaled, moved. */
function toWorld(placement: Placement, x: number, z: number): { x: number; z: number } {
  const cos = Math.cos(placement.rotationY);
  const sin = Math.sin(placement.rotationY);
  return { x: placement.x + (x * cos + z * sin) * placement.scale, z: placement.z + (-x * sin + z * cos) * placement.scale };
}

/** The props and floors inside the open places, read from their geometry. */
function openGroundDetail(): { readonly circles: readonly Circle[]; readonly floors: readonly Floor[] } {
  const circles: Circle[] = [];
  const floors: Floor[] = [];
  for (const placement of LANDMARKS.filter((candidate) => OPEN_GROUND.has(candidate.model) && !candidate.afloat)) {
    const geometry = MODEL_REGISTRY[placement.model]();
    const detail = occupancyOf(geometry, WALK_OCCUPANCY);
    geometry.dispose();
    const base = groundHeightFor(placement);
    for (const cell of detail.occupied) circles.push({ ...toWorld(placement, cell.x, cell.z), radius: WALK_OCCUPANCY.cell * 0.6 * placement.scale });
    for (const floor of detail.floors) floors.push({ ...toWorld(placement, floor.x, floor.z), height: base + floor.height * placement.scale });
  }
  return { circles, floors };
}

/** How the open places are read: half-metre cells, body height from the knee up. */
const WALK_OCCUPANCY = { cell: 0.5, bodyFrom: 0.62, bodyTo: 1.7, stepHeight: 0.7, floorMinArea: 1 } as const;

/** The fairground's rides turn as meshes of their own, outside the park's geometry. */
function rideCircles(): readonly Circle[] {
  const park = siteAt("parque-caveiras");
  return [
    { x: park.x + CAROUSEL.x, z: park.z + CAROUSEL.z, radius: CAROUSEL.radius + 0.4 },
    { x: park.x + SWING.x, z: park.z + SWING.z, radius: 1.2 },
    { x: park.x + DROP_TOWER.x, z: park.z + DROP_TOWER.z, radius: 1.6 },
  ];
}

let detailCache: { readonly circles: readonly Circle[]; readonly floors: readonly Floor[] } | null = null;

function detail(): { readonly circles: readonly Circle[]; readonly floors: readonly Floor[] } {
  detailCache ??= openGroundDetail();
  return detailCache;
}

/** Every obstacle in the world. Built once; the layout is seeded and does not change. */
export function worldObstacles(): readonly Circle[] {
  const placed = [...LANDMARKS, ...createScatter()].flatMap((placement) => {
    const circle = obstacleFor(placement);
    return circle ? [circle] : [];
  });
  return [...placed, ...detail().circles, ...rideCircles()];
}

/** Every raised floor inside the open places. */
export function worldFloors(): readonly Floor[] {
  return detail().floors;
}

/** Each place with the footprint of the building standing on it, for its arrival area. */
export function siteFootprints(): readonly SiteFootprint[] {
  return SITES.map((site) => {
    const landmark = LANDMARKS.find((placement) => Math.hypot(placement.x - site.x, placement.z - site.z) < 1 && buildingFootprint(placement) !== null);
    // An open place - a square, an apron - is arrived at on its own ground, so its area
    // follows the size of the ground rather than a building's.
    const open = !landmark || OPEN_GROUND.has(landmark.model);
    const footprint = open ? site.pad * OPEN_ARRIVAL_SHARE : (COMPOUND_RADIUS[landmark.model] ?? buildingFootprint(landmark) ?? 0);
    return { slug: site.slug, x: site.x, z: site.z, footprint };
  });
}
