import type { BufferGeometry } from "three";

import { arch, blob, box, cone, merge, paint, pipe, post } from "./builders";
import { WORLD_COLORS } from "./constants";

/**
 * The Ovni Porto: the far attraction on the plateau behind the reservoir.
 *
 * A stepped landing platform ringed with beacon masts, a glass-domed terminal, a radar
 * array, an approach lane of lights, a boarding gantry, a landed saucer and one holding
 * station overhead. It is the most distant point of interest on the map, so everything
 * that has to read from there is built tall and lit: the masts, the dome, the beams.
 *
 * Built at the origin facing +Z, base at y = 0, like every other composite.
 */

/** Where the saucer hovers above the pad, so the scene can animate it there. */
export const SAUCER_HOVER = { x: 0, y: 19, z: 0 } as const;

/** Where the landed saucer sits, so the gantry can meet it. */
const LANDED_SAUCER = { x: -11, y: 8.2, z: 6.5 } as const;

/** Top of the painted tier, so legs, gantry and walkway all meet the same floor. */
const APRON_TOP = 2.2;

const APRON_RADIUS = 15;

/** Where the radar dish pivots, so the scene can turn it there. */
export const RADAR = { x: 30, y: 10.4, z: 19 } as const;

/** The second saucer's landing cycle: where it comes down, and how high it goes. */
export const LANDING = { x: 14, z: -6, top: 46, bottom: 7.4, periodSeconds: 28 } as const;

/** A glowing lamp head on a mast. */
function beacon(x: number, z: number, height: number, color: string): BufferGeometry[] {
  return [
    post(0.18, 0.3, height, 6, WORLD_COLORS.metal, x, 0, z, "metal"),
    box(0.9, 0.12, 0.9, WORLD_COLORS.metal, x, height, z, 0, "metal"),
    blob(0.5, color, x, height + 0.4, z, 0.8, 1, "glass"),
    post(0.5, 0.56, 0.16, 8, WORLD_COLORS.slateDark, x, height + 0.78, z, "metal"),
  ];
}

/** The apron, terminal, masts, radar, gantry, landed saucer and perimeter. */
export function createUfoPortGeometry(): BufferGeometry {
  const parts: BufferGeometry[] = [];

  // A stepped platform: three concrete tiers, so the pad reads as built rather than
  // painted onto the ground.
  parts.push(post(APRON_RADIUS + 4.5, APRON_RADIUS + 5.4, 0.8, 44, WORLD_COLORS.stoneDark, 0, 0, 0, "stone"));
  parts.push(post(APRON_RADIUS + 2.2, APRON_RADIUS + 3, 0.7, 44, WORLD_COLORS.stone, 0, 0.8, 0, "stone"));
  parts.push(post(APRON_RADIUS, APRON_RADIUS + 1, 0.7, 44, WORLD_COLORS.paving, 0, 1.5, 0, "paving"));

  // Painted landing target: two rings and a cross.
  parts.push(post(APRON_RADIUS - 1.4, APRON_RADIUS - 1.4, 0.1, 44, WORLD_COLORS.lantern, 0, 2.2, 0));
  parts.push(post(APRON_RADIUS - 2.6, APRON_RADIUS - 2.6, 0.12, 44, WORLD_COLORS.paving, 0, 2.2, 0, "paving"));
  parts.push(post(7.2, 7.2, 0.1, 40, WORLD_COLORS.ember, 0, 2.24, 0));
  parts.push(post(6.2, 6.2, 0.12, 40, WORLD_COLORS.paving, 0, 2.24, 0, "paving"));
  parts.push(box(APRON_RADIUS * 1.5, 0.14, 1.5, WORLD_COLORS.lantern, 0, 2.26, 0));
  parts.push(box(1.5, 0.14, APRON_RADIUS * 1.5, WORLD_COLORS.lantern, 0, 2.26, 0));

  // Recessed floor lights around the target ring.
  for (let index = 0; index < 24; index += 1) {
    const angle = (index / 24) * Math.PI * 2;
    parts.push(post(0.34, 0.34, 0.16, 8, WORLD_COLORS.emberGlow, Math.cos(angle) * (APRON_RADIUS - 4.4), 2.2, Math.sin(angle) * (APRON_RADIUS - 4.4)));
  }

  // Beacon masts around the rim, alternating in height so the silhouette has rhythm.
  for (let index = 0; index < 10; index += 1) {
    const angle = (index / 10) * Math.PI * 2 + 0.3;
    const tall = index % 2 === 0;
    parts.push(
      ...beacon(
        Math.cos(angle) * (APRON_RADIUS + 7),
        Math.sin(angle) * (APRON_RADIUS + 7),
        tall ? 11 : 7.5,
        tall ? WORLD_COLORS.emberGlow : WORLD_COLORS.lantern,
      ),
    );
  }

  // The terminal: a drum with a glazed band and a glass dome, on the north side.
  const terminalX = -30;
  const terminalZ = -18;
  parts.push(post(9.5, 10.2, 1.2, 24, WORLD_COLORS.stoneDark, terminalX, 0, terminalZ, "stone"));
  parts.push(post(8.6, 8.8, 4.2, 24, WORLD_COLORS.whitewash, terminalX, 1.2, terminalZ, "plaster"));
  parts.push(post(8.75, 8.75, 2.1, 24, WORLD_COLORS.frostBlue, terminalX, 2.6, terminalZ, "glass"));
  parts.push(post(9.1, 8.8, 0.5, 24, WORLD_COLORS.slateDark, terminalX, 5.4, terminalZ, "metal"));
  parts.push(blob(7.6, WORLD_COLORS.frostBlue, terminalX, 5.9, terminalZ, 0.62, 2, "glass"));
  parts.push(post(0.5, 0.6, 3.4, 8, WORLD_COLORS.metal, terminalX, 10.6, terminalZ, "metal"));
  parts.push(blob(0.7, WORLD_COLORS.emberGlow, terminalX, 14.4, terminalZ, 1, 1, "glass"));
  parts.push(arch(2.4, 3.6, 0.3, WORLD_COLORS.slateDark, terminalX, 1.2, terminalZ + 8.7, "glass"));

  // A covered walkway from the terminal door to the apron rim. It has to follow the line
  // between the two: built on its own axis it read as a slab dropped at an angle.
  const walkAngle = Math.atan2(-terminalZ, -terminalX);
  const walkFrom = 9.2;
  const walkTo = Math.hypot(terminalX, terminalZ) - (APRON_RADIUS + 4.5);
  const walkLength = walkTo - walkFrom;
  const alongWalk = (distance: number, offset: number): readonly [number, number] => [
    terminalX + Math.cos(walkAngle) * distance - Math.sin(walkAngle) * offset,
    terminalZ + Math.sin(walkAngle) * distance + Math.cos(walkAngle) * offset,
  ];
  for (let index = 0; index <= 4; index += 1) {
    const distance = walkFrom + (index / 4) * walkLength;
    for (const offset of [-1.7, 1.7]) {
      const [x, z] = alongWalk(distance, offset);
      parts.push(post(0.16, 0.18, 3.2, 5, WORLD_COLORS.metal, x, 0, z, "metal"));
    }
  }
  const [roofX, roofZ] = alongWalk(walkFrom + walkLength / 2, 0);
  const walkRoof = box(walkLength + 1.6, 0.22, 4.4, WORLD_COLORS.rail, 0, 0, 0, 0, "metal");
  walkRoof.rotateY(-walkAngle);
  walkRoof.translate(roofX, 3.3, roofZ);
  parts.push(walkRoof);

  // The control tower: a tapered stalk, a glazed cab, a crown of aerials.
  const towerX = 21;
  const towerZ = -14;
  parts.push(post(2.4, 3.6, 4, 12, WORLD_COLORS.stoneDark, towerX, 0, towerZ, "stone"));
  parts.push(post(1.5, 2.2, 14, 12, WORLD_COLORS.whitewash, towerX, 4, towerZ, "plaster"));
  parts.push(post(4.2, 3.4, 1.4, 12, WORLD_COLORS.slateDark, towerX, 18, towerZ, "metal"));
  parts.push(post(4.4, 4.4, 2.6, 12, WORLD_COLORS.frostBlue, towerX, 19.4, towerZ, "glass"));
  parts.push(post(4.8, 4.2, 0.5, 12, WORLD_COLORS.whitewash, towerX, 22, towerZ, "plaster"));
  parts.push(cone(5.4, 1.8, 12, WORLD_COLORS.slateDark, towerX, 22.5, towerZ, "metal"));
  parts.push(post(0.16, 0.16, 4.2, 5, WORLD_COLORS.metal, towerX, 24.3, towerZ, "metal"));
  parts.push(blob(0.5, WORLD_COLORS.emberGlow, towerX, 28.8, towerZ, 1, 1, "glass"));
  for (let index = 0; index < 4; index += 1) {
    const angle = (index / 4) * Math.PI * 2 + 0.4;
    parts.push(post(0.08, 0.1, 2.4, 4, WORLD_COLORS.metal, towerX + Math.cos(angle) * 4.6, 22.3, towerZ + Math.sin(angle) * 4.6, "metal"));
  }

  // Radar array: a big dish on a truss, and two small ones.
  const radarX = RADAR.x;
  const radarZ = RADAR.z;
  parts.push(post(1.1, 1.6, 9, 8, WORLD_COLORS.metal, radarX, 0, radarZ, "metal"));
  for (const angle of [0.6, 2.7, 4.5]) {
    parts.push(post(0.3, 0.34, 9.4, 4, WORLD_COLORS.rail, radarX + Math.cos(angle) * 2.4, 0, radarZ + Math.sin(angle) * 2.4, "metal"));
  }
  // The big dish is a mesh of its own - see `createRadarDishGeometry` - so it can turn.
  parts.push(post(0.6, 0.8, 1.4, 8, WORLD_COLORS.slateDark, radarX, 9, radarZ, "metal"));
  parts.push(post(0.4, 0.4, 3.4, 6, WORLD_COLORS.metal, radarX, 10.4, radarZ, "metal"));
  for (const [dx, dz, lift] of [[-7, 5, 5.4], [7, 6, 4.6]] as const) {
    parts.push(post(0.4, 0.5, lift, 6, WORLD_COLORS.metal, radarX + dx, 0, radarZ + dz, "metal"));
    const small = post(2.2, 0.6, 1.1, 16, WORLD_COLORS.rail, 0, 0, 0, "metal");
    small.rotateX(-0.5);
    small.rotateY(dx > 0 ? 0.6 : -0.6);
    small.translate(radarX + dx, lift + 0.7, radarZ + dz);
    parts.push(small);
  }

  // A hangar with an arched roof, doors open toward the apron.
  const hangarX = 4;
  const hangarZ = -26;
  parts.push(box(22, 6, 14, WORLD_COLORS.rockLight, hangarX, 3, hangarZ, 0.12, "metal"));
  parts.push(pipe(7.6, 22.4, 18, WORLD_COLORS.rail, hangarX, 6, hangarZ, Math.PI / 2 + 0.12, "metal"));
  parts.push(box(9, 5.2, 0.4, WORLD_COLORS.slateDark, hangarX - 1, 2.6, hangarZ + 7.1, 0.12, "metal"));
  parts.push(box(22.4, 0.5, 0.5, WORLD_COLORS.ember, hangarX, 6.2, hangarZ + 7.1, 0.12, "metal"));

  // The approach lane: paired lights leading in from the south.
  for (let index = 0; index < 7; index += 1) {
    const z = APRON_RADIUS + 10 + index * 6;
    const spread = 3.2 + index * 0.55;
    for (const side of [-1, 1]) {
      parts.push(post(0.16, 0.2, 1.5 + index * 0.15, 5, WORLD_COLORS.metal, side * spread, 0, z, "metal"));
      parts.push(blob(0.34, index % 2 === 0 ? WORLD_COLORS.lantern : WORLD_COLORS.emberGlow, side * spread, 1.8 + index * 0.15, z, 0.9, 1, "glass"));
    }
  }

  // The landed saucer on its legs, with a boarding gantry up to the hatch.
  parts.push(...saucerParts(LANDED_SAUCER.x, LANDED_SAUCER.y, LANDED_SAUCER.z, 0.85));
  // The legs have to reach the hull where they meet it, not its centre height: a leg
  // that stops short leaves the saucer resting on its belly.
  const legHeight = LANDED_SAUCER.y - APRON_TOP - 0.45;
  for (let index = 0; index < 3; index += 1) {
    const angle = (index / 3) * Math.PI * 2 + 0.5;
    const legX = LANDED_SAUCER.x + Math.cos(angle) * 3;
    const legZ = LANDED_SAUCER.z + Math.sin(angle) * 3;
    parts.push(post(0.24, 0.32, legHeight, 5, WORLD_COLORS.rail, legX, APRON_TOP, legZ, "metal"));
    parts.push(post(0.9, 1, 0.22, 10, WORLD_COLORS.slateDark, legX, APRON_TOP, legZ, "metal"));
  }

  // The gantry is one sloped deck with rails that follow it. Stacked step boxes with
  // level rails read as a floating grid from any distance.
  const rampRun = 8;
  const rampTop = LANDED_SAUCER.y - 1.6;
  const rampTilt = -Math.atan2(rampTop - APRON_TOP, rampRun);
  const rampX = LANDED_SAUCER.x + 3 + rampRun / 2;
  const rampY = (rampTop + APRON_TOP) / 2;
  const rampSpan = Math.hypot(rampRun, rampTop - APRON_TOP);
  const deck = box(rampSpan, 0.24, 2.6, WORLD_COLORS.rail, 0, 0, 0, 0, "metal");
  deck.rotateZ(rampTilt);
  deck.translate(rampX, rampY, LANDED_SAUCER.z);
  parts.push(deck);
  for (const side of [-1.3, 1.3]) {
    const handrail = box(rampSpan, 0.12, 0.12, WORLD_COLORS.metal, 0, 0, 0, 0, "metal");
    handrail.rotateZ(rampTilt);
    handrail.translate(rampX, rampY + 1.05, LANDED_SAUCER.z + side);
    parts.push(handrail);
    for (let index = 0; index <= 3; index += 1) {
      const t = index / 3;
      parts.push(
        post(0.09, 0.09, 1.05, 4, WORLD_COLORS.metal, LANDED_SAUCER.x + 3 + t * rampRun, rampTop - t * (rampTop - APRON_TOP), LANDED_SAUCER.z + side, "metal"),
      );
    }
  }

  // Perimeter: posts joined by two rails, with a gap for the gate on the approach side.
  // Bare posts on their own read as scattered sticks in the grass rather than a fence.
  const fenceRadius = APRON_RADIUS + 11;
  const fencePosts = 34;
  const insideGate = (angle: number): boolean => angle > 1.34 && angle < 1.81;
  for (let index = 0; index < fencePosts; index += 1) {
    const angle = (index / fencePosts) * Math.PI * 2;
    const next = ((index + 1) / fencePosts) * Math.PI * 2;
    if (!insideGate(angle)) {
      parts.push(post(0.18, 0.24, 1.9, 5, WORLD_COLORS.rail, Math.cos(angle) * fenceRadius, 0, Math.sin(angle) * fenceRadius, "metal"));
    }
    if (insideGate(angle) || insideGate(next)) continue;
    const midAngle = (angle + next) / 2;
    const chord = 2 * fenceRadius * Math.sin(Math.PI / fencePosts);
    const midRadius = fenceRadius * Math.cos(Math.PI / fencePosts);
    for (const railY of [0.72, 1.52]) {
      const rail = box(chord + 0.12, 0.11, 0.11, WORLD_COLORS.rail, 0, 0, 0, 0, "metal");
      rail.rotateY(-(midAngle + Math.PI / 2));
      rail.translate(Math.cos(midAngle) * midRadius, railY, Math.sin(midAngle) * midRadius);
      parts.push(rail);
    }
  }
  for (const side of [-1, 1]) {
    parts.push(box(1.2, 5.4, 1.2, WORLD_COLORS.stone, side * 3.4, 2.7, APRON_RADIUS + 11, 0, "stone"));
  }
  parts.push(box(9, 1.1, 0.5, WORLD_COLORS.slateDark, 0, 5.8, APRON_RADIUS + 11, 0, "metal"));
  parts.push(box(7.4, 0.7, 0.14, WORLD_COLORS.lantern, 0, 5.8, APRON_RADIUS + 11.3));

  // Windsock, so the place reads as an aerodrome.
  parts.push(post(0.16, 0.2, 7, 5, WORLD_COLORS.metal, -30, 0, 20, "metal"));
  const sock = cone(1.0, 3.6, 8, WORLD_COLORS.ember, 0, 0, 0);
  sock.rotateZ(Math.PI / 2);
  sock.translate(-28.2, 6.8, 20);
  parts.push(sock);

  return merge(parts);
}

/** The shells of a saucer, centred on (x, y, z). */
function saucerParts(x: number, y: number, z: number, scale: number): BufferGeometry[] {
  const radius = 5.4 * scale;
  const upper = cone(radius, 2.1 * scale, 22, WORLD_COLORS.rail, 0, 0, 0, "metal");
  const lower = cone(radius, 1.7 * scale, 22, WORLD_COLORS.slateDark, 0, 0, 0, "metal");
  lower.rotateX(Math.PI);

  const parts = [
    upper,
    lower,
    post(radius * 1.04, radius * 1.04, 0.45 * scale, 22, WORLD_COLORS.emberGlow, 0, -0.22 * scale, 0, "glass"),
    post(2.4 * scale, 2.9 * scale, 1.5 * scale, 16, WORLD_COLORS.frostBlue, 0, 2.0 * scale, 0, "glass"),
    blob(1.7 * scale, WORLD_COLORS.rail, 0, 3.6 * scale, 0, 0.6, 1, "metal"),
  ];

  // Lights around the rim.
  for (let index = 0; index < 12; index += 1) {
    const angle = (index / 12) * Math.PI * 2;
    parts.push(blob(0.3 * scale, WORLD_COLORS.lantern, Math.cos(angle) * radius * 0.92, -0.1 * scale, Math.sin(angle) * radius * 0.92, 1, 1, "glass"));
  }

  for (const part of parts) part.translate(x, y, z);
  return parts;
}

/** The saucer that holds station overhead. */
export function createSaucerGeometry(): BufferGeometry {
  return merge(saucerParts(0, 0, 0, 1));
}

/** The radar's bowl and feed horn, centred on their pivot and tipped to the approach. */
export function createRadarDishGeometry(): BufferGeometry {
  // A bowl, not a cone: wide rim over a narrow throat.
  const bowl = post(5.6, 1.3, 2.3, 22, WORLD_COLORS.whitewash, 0, -0.2, 0, "metal");
  const feed = post(0.34, 0.5, 4.2, 6, WORLD_COLORS.metal, 0, 1.0, 0, "metal");
  const dish = merge([bowl, feed]);
  dish.rotateX(-0.6);
  return dish;
}

/** The beam of light the hovering saucer stands on. */
export function createBeamGeometry(): BufferGeometry {
  const beam = cone(7.2, SAUCER_HOVER.y - 2.4, 22, WORLD_COLORS.lantern, 0, 0, 0);
  beam.rotateX(Math.PI);
  beam.translate(0, SAUCER_HOVER.y - 2.4, 0);
  return paint(beam, WORLD_COLORS.lantern, "plain");
}
