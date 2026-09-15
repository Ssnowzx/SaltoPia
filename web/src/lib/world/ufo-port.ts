import type { BufferGeometry } from "three";

import { blob, box, cone, merge, pipe, post } from "./builders";
import { WORLD_COLORS } from "./constants";

/**
 * The Porto de OVNIs: the far attraction on the plateau behind the reservoir.
 *
 * A concrete landing apron ringed with beacons, a control tower with a dish, a windsock
 * and a hangar - and a saucer standing off above the pad on its light beam. It is
 * deliberately the most distant point of interest on the map, which is why it is built
 * tall: at that range only the tower, the beam and the saucer read.
 *
 * Built at the origin facing +Z, base at y = 0, like every other composite.
 */

/** Where the saucer hovers above the pad, so the scene can animate it there. */
export const SAUCER_HOVER = { x: 0, y: 16, z: 0 } as const;

/** The apron, its beacons, the tower, the hangar and the fence. */
export function createUfoPortGeometry(): BufferGeometry {
  const parts: BufferGeometry[] = [];

  // The landing apron: a low concrete disc with a painted ring and a cross.
  parts.push(post(15, 15.6, 0.5, 40, WORLD_COLORS.paving, 0, 0, 0, "paving"));
  parts.push(post(12.4, 12.4, 0.12, 40, WORLD_COLORS.lantern, 0, 0.5, 0));
  parts.push(post(11.2, 11.2, 0.14, 40, WORLD_COLORS.paving, 0, 0.5, 0, "paving"));
  parts.push(box(16, 0.16, 1.6, WORLD_COLORS.lantern, 0, 0.56, 0));
  parts.push(box(1.6, 0.16, 16, WORLD_COLORS.lantern, 0, 0.56, 0));

  // Beacons around the rim.
  for (let index = 0; index < 16; index += 1) {
    const angle = (index / 16) * Math.PI * 2;
    const x = Math.cos(angle) * 16.4;
    const z = Math.sin(angle) * 16.4;
    parts.push(post(0.2, 0.26, 1.1, 6, WORLD_COLORS.metal, x, 0, z, "metal"));
    parts.push(blob(0.36, index % 2 === 0 ? WORLD_COLORS.emberGlow : WORLD_COLORS.lantern, x, 1.3, z, 0.9, 1, "glass"));
  }

  // The control tower: a stalk, a glazed cab, a roof and a dish.
  const towerX = -21;
  const towerZ = 9;
  parts.push(post(1.5, 2.2, 13, 10, WORLD_COLORS.stone, towerX, 0, towerZ, "stone"));
  parts.push(post(3.6, 3.2, 2.6, 10, WORLD_COLORS.whitewash, towerX, 13, towerZ, "plaster"));
  parts.push(post(3.7, 3.7, 1.5, 10, WORLD_COLORS.frostBlue, towerX, 13.5, towerZ, "glass"));
  parts.push(cone(4.4, 1.5, 10, WORLD_COLORS.slateDark, towerX, 15.6, towerZ, "metal"));
  parts.push(post(0.16, 0.16, 3.4, 5, WORLD_COLORS.metal, towerX, 17.1, towerZ, "metal"));
  parts.push(blob(0.44, WORLD_COLORS.emberGlow, towerX, 20.8, towerZ, 1, 1, "glass"));

  // The dish on its mast beside the tower.
  parts.push(post(0.3, 0.4, 7, 6, WORLD_COLORS.metal, towerX + 6, 0, towerZ - 5, "metal"));
  const dish = cone(3.2, 1.4, 14, WORLD_COLORS.whitewash, 0, 0, 0, "metal");
  dish.rotateX(-0.9);
  dish.translate(towerX + 6, 7.6, towerZ - 5);
  parts.push(dish);

  // A hangar behind the apron.
  parts.push(box(16, 5, 11, WORLD_COLORS.rockLight, 21, 2.5, -8, 0.2, "metal"));
  parts.push(pipe(6.2, 16.4, 16, WORLD_COLORS.rail, 21, 5, -8, Math.PI / 2 + 0.2, "metal"));
  parts.push(box(6, 4.2, 0.3, WORLD_COLORS.slateDark, 21 - 1.2, 2.1, -2.6, 0.2, "metal"));

  // Windsock.
  parts.push(post(0.14, 0.18, 6, 5, WORLD_COLORS.metal, 19, 0, 12, "metal"));
  const sock = cone(0.9, 3.2, 8, WORLD_COLORS.ember, 0, 0, 0);
  sock.rotateZ(Math.PI / 2);
  sock.translate(20.6, 5.8, 12);
  parts.push(sock);

  // Perimeter fence posts, wide apart - the shape is what reads, not the wire.
  for (let index = 0; index < 20; index += 1) {
    const angle = (index / 20) * Math.PI * 2;
    parts.push(post(0.12, 0.14, 1.6, 4, WORLD_COLORS.metal, Math.cos(angle) * 21, 0, Math.sin(angle) * 21, "metal"));
  }

  return merge(parts);
}

/** The saucer itself: two shells, a lit rim and a cupola. */
export function createSaucerGeometry(): BufferGeometry {
  const upper = cone(5.4, 2.1, 20, WORLD_COLORS.rail, 0, 0, 0, "metal");
  const lower = cone(5.4, 1.7, 20, WORLD_COLORS.slateDark, 0, 0, 0, "metal");
  lower.rotateX(Math.PI);

  return merge([
    upper,
    lower,
    post(5.6, 5.6, 0.45, 20, WORLD_COLORS.emberGlow, 0, -0.22, 0, "glass"),
    post(2.4, 2.9, 1.5, 14, WORLD_COLORS.frostBlue, 0, 2.0, 0, "glass"),
    blob(1.7, WORLD_COLORS.rail, 0, 3.6, 0, 0.6, 1, "metal"),
  ]);
}

/** The beam of light the saucer stands on. */
export function createBeamGeometry(): BufferGeometry {
  const beam = cone(6.4, SAUCER_HOVER.y - 0.6, 20, WORLD_COLORS.lantern, 0, 0, 0);
  beam.rotateX(Math.PI);
  beam.translate(0, SAUCER_HOVER.y - 0.6, 0);
  return beam;
}
