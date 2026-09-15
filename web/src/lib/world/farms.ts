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
  post,
} from "./builders";
import { WORLD_COLORS } from "./constants";

/**
 * The cattle farms out on the plateau, well clear of the community.
 *
 * Each is a barn with a hayloft door, a pair of grain silos, the farmhouse, an open
 * machine shed, hay bales and a fenced paddock. They are built large on purpose: they
 * sit at the far edge of the map and have to read at that distance, and they are what
 * separates the town from the empty land around it.
 *
 * Built at the origin facing +Z, base at y = 0, like every other composite.
 */

/** How far a farm reaches from its centre, for pads and clearings. */
export const FARM_RADIUS = 30;

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

/** A barn, two silos, the farmhouse, a machine shed and a paddock. */
export function createFarmGeometry(wallColor: string): BufferGeometry {
  const parts: BufferGeometry[] = [];

  // The barn: a long shed with a tall gable and a hayloft door in the end wall.
  const barnWidth = 17;
  const barnDepth = 11;
  const barnHeight = 6.4;
  parts.push(box(barnWidth, barnHeight, barnDepth, wallColor, 0, barnHeight / 2, 0, 0, "planks"));
  parts.push(box(barnWidth + 0.5, 0.5, barnDepth + 0.5, WORLD_COLORS.stoneDark, 0, 0.25, 0, 0, "stone"));
  const roof = createGableRoofGeometry(barnWidth + 1.2, barnDepth + 1.2, 4.6);
  roof.translate(0, barnHeight, 0);
  parts.push(roof);
  parts.push(box(5.6, 4.6, 0.3, WORLD_COLORS.timberDark, 0, 2.3, barnDepth / 2 + 0.05, 0, "planks"));
  parts.push(box(0.4, 4.6, 0.36, WORLD_COLORS.whitewash, 0, 2.3, barnDepth / 2 + 0.08, 0, "plaster"));
  parts.push(box(2.6, 2.4, 0.3, WORLD_COLORS.timberDark, 0, barnHeight + 1.6, barnDepth / 2 + 0.05, 0, "planks"));
  parts.push(box(barnWidth + 0.4, 0.34, 0.34, WORLD_COLORS.whitewash, 0, barnHeight - 0.2, barnDepth / 2 + 0.08, 0, "plaster"));

  parts.push(...silo(barnWidth / 2 + 4.6, -1, 12, 2.5));
  parts.push(...silo(barnWidth / 2 + 9.4, -2.4, 9.5, 2.1));

  // The farmhouse, set back from the barn behind its own hedge line.
  const house = createBuildingGeometry(FARMHOUSE);
  house.rotateY(Math.PI * 0.04);
  house.translate(-barnWidth / 2 - 9, 0, 7);
  parts.push(house);

  // An open machine shed: a roof on posts, with the tractor-sized bay facing the yard.
  const shedWidth = 11;
  const shedDepth = 6;
  for (const sx of [-shedWidth / 2 + 0.4, 0, shedWidth / 2 - 0.4]) {
    for (const sz of [-shedDepth / 2 + 0.4, shedDepth / 2 - 0.4]) {
      parts.push(post(0.24, 0.3, 3.4, 6, WORLD_COLORS.timberDark, sx - 2, 0, sz - 17, "bark"));
    }
  }
  const shedRoof = createGableRoofGeometry(shedWidth + 1, shedDepth + 1, 1.7);
  shedRoof.translate(-2, 3.4, -17);
  parts.push(shedRoof);
  parts.push(box(shedWidth, 1.2, 0.3, wallColor, -2, 0.6, -17 - shedDepth / 2, 0, "planks"));

  // Hay bales in the yard and a woodpile by the house.
  for (const [hx, hz, rotated] of [[-14, -9, false], [-11.4, -9, false], [-12.7, -11.6, true]] as const) {
    const bale = post(1.1, 1.1, 2.2, 12, WORLD_COLORS.straw, 0, 0, 0, "grass");
    bale.rotateZ(Math.PI / 2);
    if (rotated) bale.rotateY(Math.PI / 2);
    bale.translate(hx, 1.1, hz);
    parts.push(bale);
  }
  const woodpile = createWoodpileGeometry();
  woodpile.translate(-barnWidth / 2 - 14, 0, 4);
  parts.push(woodpile);

  parts.push(...paddock(6, 17, 34, 20));

  return merge(parts);
}
