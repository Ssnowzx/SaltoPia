import type { BufferGeometry } from "three";

import {
  type BuildingSpec,
  box,
  cone,
  createBuildingGeometry,
  createFenceGeometry,
  createGableRoofGeometry,
  createWoodpileGeometry,
  merge,
  paint,
  post,
} from "./builders";
import { WORLD_COLORS } from "./constants";

/**
 * The cattle farms on the plateau behind the ridge.
 *
 * Each is a barn with a hayloft door, a pair of grain silos, the farmhouse, an open
 * machine shed, hay bales and a fenced paddock. They face +Z - toward the camera and
 * the plateau track - with the paddock to the east, so the whole farm fits inside its
 * flat pad: one merged geometry sits at one height, and anything hanging past the pad
 * would float on the slope.
 *
 * Built at the origin facing +Z, base at y = 0, like every other composite.
 */

/** How far a farm reaches from its centre, for pads and clearings. */
export const FARM_RADIUS = 34;

const FARMHOUSE: BuildingSpec = {
  width: 9,
  depth: 7.4,
  height: 3.4,
  roofHeight: 2.2,
  wallColor: WORLD_COLORS.whitewash,
  roofColor: WORLD_COLORS.tileDark,
  wallSurface: "plaster",
  roofSurface: "tiles",
  stories: 2,
  windows: true,
};

const BARN = { width: 17, depth: 11, height: 6.4 } as const;

/** One grain silo: a ribbed drum under a conical cap. */
function silo(x: number, z: number, height: number, radius: number): BufferGeometry[] {
  const parts: BufferGeometry[] = [
    post(radius, radius + 0.25, 0.5, 16, WORLD_COLORS.stoneDark, x, 0, z, "stone"),
    post(radius, radius, height, 16, WORLD_COLORS.rail, x, 0.5, z, "metal"),
    cone(radius + 0.35, radius * 1.05, 16, WORLD_COLORS.slateDark, x, height + 0.5, z, "metal"),
  ];
  // Three hoops, so the drum does not read as a plain cylinder from a distance.
  for (let index = 0; index < 3; index += 1) {
    parts.push(post(radius + 0.12, radius + 0.12, 0.22, 16, WORLD_COLORS.metal, x, 1.6 + index * (height / 3.4), z, "metal"));
  }
  return parts;
}

/** The paddock fence: a run of posts and rails around a rectangle. */
function paddock(x: number, z: number, width: number, depth: number): BufferGeometry[] {
  const parts: BufferGeometry[] = [];
  const panel = 6;
  for (const [along, across, horizontal] of [
    [width, depth / 2, true],
    [width, -depth / 2, true],
    [depth, width / 2, false],
    [depth, -width / 2, false],
  ] as ReadonlyArray<readonly [number, number, boolean]>) {
    const panels = Math.max(1, Math.round(along / panel));
    for (let index = 0; index < panels; index += 1) {
      const offset = -along / 2 + (index + 0.5) * (along / panels);
      const fence = createFenceGeometry(along / panels);
      if (!horizontal) fence.rotateY(Math.PI / 2);
      fence.translate(x + (horizontal ? offset : across), 0, z + (horizontal ? across : offset));
      parts.push(fence);
    }
  }
  return parts;
}

/** The barn: a long shed with a tall gable and a hayloft door in the front wall. */
function barn(wallColor: string): BufferGeometry[] {
  const front = BARN.depth / 2;
  const roof = paint(createGableRoofGeometry(BARN.width + 1.2, BARN.depth + 1.2, 4.6), WORLD_COLORS.slateDark, "slate");
  roof.translate(0, BARN.height, 0);
  return [
    box(BARN.width, BARN.height, BARN.depth, wallColor, 0, BARN.height / 2, 0, 0, "planks"),
    box(BARN.width + 0.5, 0.5, BARN.depth + 0.5, WORLD_COLORS.stoneDark, 0, 0.25, 0, 0, "stone"),
    roof,
    box(5.6, 4.6, 0.3, WORLD_COLORS.timberDark, 0, 2.3, front + 0.05, 0, "planks"),
    box(0.4, 4.6, 0.36, WORLD_COLORS.whitewash, 0, 2.3, front + 0.08, 0, "plaster"),
    box(2.6, 2.4, 0.3, WORLD_COLORS.timberDark, 0, BARN.height + 1.6, front + 0.05, 0, "planks"),
    box(BARN.width + 0.4, 0.34, 0.34, WORLD_COLORS.whitewash, 0, BARN.height - 0.2, front + 0.08, 0, "plaster"),
  ];
}

/** An open machine shed: a roof on posts, north of the barn. */
function machineShed(wallColor: string): BufferGeometry[] {
  const width = 11;
  const depth = 6;
  const centreX = -2;
  const centreZ = -17;
  const parts: BufferGeometry[] = [];
  for (const sx of [-width / 2 + 0.4, 0, width / 2 - 0.4]) {
    for (const sz of [-depth / 2 + 0.4, depth / 2 - 0.4]) {
      parts.push(post(0.24, 0.3, 3.4, 6, WORLD_COLORS.timberDark, centreX + sx, 0, centreZ + sz, "bark"));
    }
  }
  const roof = paint(createGableRoofGeometry(width + 1, depth + 1, 1.7), WORLD_COLORS.metal, "metal");
  roof.translate(centreX, 3.4, centreZ);
  parts.push(roof);
  parts.push(box(width, 1.2, 0.3, wallColor, centreX, 0.6, centreZ - depth / 2, 0, "planks"));
  return parts;
}

/** Hay bales stacked by the shed. */
function bales(): BufferGeometry[] {
  const parts: BufferGeometry[] = [];
  for (const [hx, hz, rotated] of [[-14, -9, false], [-11.4, -9, false], [-12.7, -11.6, true]] as const) {
    const bale = post(1.1, 1.1, 2.2, 12, WORLD_COLORS.straw, 0, 0, 0, "grass");
    bale.rotateZ(Math.PI / 2);
    if (rotated) bale.rotateY(Math.PI / 2);
    bale.translate(hx, 1.1, hz);
    parts.push(bale);
  }
  return parts;
}

/** A barn, two silos, the farmhouse, a machine shed and a paddock. */
export function createFarmGeometry(wallColor: string): BufferGeometry {
  const house = createBuildingGeometry(FARMHOUSE);
  house.rotateY(Math.PI * 0.04);
  house.translate(-15, 0, 11);

  const woodpile = createWoodpileGeometry();
  woodpile.translate(-24, 0, 5);

  return merge([
    ...barn(wallColor),
    // The silos stand west of the barn, clear of the house and the yard.
    ...silo(-13, -3, 12, 2.5),
    ...silo(-18.5, -5.5, 9.5, 2.1),
    house,
    ...machineShed(wallColor),
    ...bales(),
    woodpile,
    // The paddock is east of the barn, beside the forecourt the track arrives at.
    ...paddock(24, 1, 20, 18),
  ]);
}
