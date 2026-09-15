/**
 * The canonical position of every named place on the map.
 *
 * The terrain pad under a landmark, the building itself, the clearing that keeps trees
 * off it and the seeded map pin all read from here. They used to be four hand-kept
 * lists in three files, and every time a place moved the others were left behind: a
 * building standing off its own pad, a pin hanging over empty grass, a tree growing
 * through a roof.
 *
 * The places are deliberately spread the length of the shore rather than packed into
 * the middle of the frame - the community reads as a town that way, not as a cluster.
 */

export interface Site {
  /** Matches the `slug` seeded for the place, so the pin and the building agree. */
  readonly slug: string;
  readonly x: number;
  readonly z: number;
  /** Which way the building faces, in radians. */
  readonly rotationY: number;
  /** Radius of flat ground it needs, so it stands square. */
  readonly pad: number;
  /** Radius kept clear of scattered trees and rocks. */
  readonly clearing: number;
}

export const SITES: readonly Site[] = [
  // The south end of the shore: the pousada looks back over the whole bay.
  { slug: "pousada-da-geada", x: 20, z: 120, rotationY: Math.PI * 0.92, pad: 20, clearing: 17 },
  // The middle: the square on the waterline, with its pier.
  { slug: "praca-do-pinhao", x: 48, z: 12, rotationY: 0, pad: 16, clearing: 15 },
  // Inland on the east slope.
  { slug: "galpao-do-fogo", x: 140, z: 38, rotationY: Math.PI * 1.08, pad: 14, clearing: 14 },
  // The south-east of the community, out past the houses.
  { slug: "ctg-porteira-do-tropeiro", x: 108, z: 104, rotationY: Math.PI * 0.96, pad: 14, clearing: 14 },
  // Beside the railway, at the edge of the map.
  { slug: "estacao-velha", x: 150, z: 120, rotationY: Math.PI * 0.82, pad: 16, clearing: 16 },
  // North, on the high ground above the dam.
  { slug: "vinicola-de-altitude", x: 150, z: -44, rotationY: Math.PI * 0.86, pad: 12, clearing: 12 },
  // The lookout, right across the water on the west hill.
  { slug: "mirante-da-neblina", x: -132, z: -96, rotationY: 0.3, pad: 8, clearing: 9 },
  // The araucaria wood on the peninsula.
  { slug: "bosque-das-araucarias", x: -60, z: -44, rotationY: 0.6, pad: 12, clearing: 5 },
  // The falls at the dam, where the river leaves the reservoir.
  // No pad: the dam complex samples the ground under each of its parts, and a pad here
  // pushed a flat green tongue out into the channel.
  { slug: "salto-caveiras", x: 118, z: -96, rotationY: 0, pad: 3, clearing: 12 },
  // The far attraction: out on the plateau at the very end of the map.
  { slug: "ovni-porto", x: 22, z: -288, rotationY: 0, pad: 38, clearing: 40 },
  // The farms, on the plateau behind the ridge, at the back of the map. They face the
  // camera and the plateau track, which reaches each one's forecourt.
  { slug: "fazenda-do-cedro", x: -200, z: -254, rotationY: 0.06, pad: 32, clearing: 36 },
  { slug: "fazenda-santa-barbara", x: -60, z: -266, rotationY: -0.04, pad: 32, clearing: 36 },
  { slug: "fazenda-dos-pinheiros", x: 206, z: -262, rotationY: 0.08, pad: 32, clearing: 36 },
  // The attractions. The fairground is out on the east slope, past the last houses, so
  // the wheel stands against the sky; the restaurant's deck reaches over the water
  // between the square and the pousada, its door on the shore street.
  { slug: "parque-caveiras", x: 178, z: 64, rotationY: 0, pad: 32, clearing: 34 },
  { slug: "deck-do-lago", x: 27, z: 74, rotationY: Math.PI / 2, pad: 6, clearing: 12 },
];

const BY_SLUG: ReadonlyMap<string, Site> = new Map(SITES.map((site) => [site.slug, site]));

/** The site for a slug. Throws rather than silently placing something at the origin. */
export function siteAt(slug: string): Site {
  const site = BY_SLUG.get(slug);
  if (!site) throw new Error(`Unknown site: ${slug}`);
  return site;
}

/**
 * The chalet village on the ridge behind the far shore.
 *
 * They used to stand in one tight row on the beach, which read as a fence rather than a
 * village. Up on the slope they step through the trees at four different heights, which
 * is how the hamlets above the reservoir actually sit.
 *
 * The ridge is part of the terrain, not a backdrop mesh - see `RIDGE` in terrain.ts. A
 * building cannot stand on geometry the height function knows nothing about.
 */
export const CHALET_SITES: ReadonlyArray<readonly [number, number]> = [
  [-124, -140], [-110, -150], [-118, -162], [-98, -142], [-88, -156], [-76, -146],
  [-58, -160], [-48, -144], [-34, -156], [-20, -142], [-8, -164], [-30, -172],
  [14, -146], [28, -158], [42, -140], [54, -152], [66, -166], [36, -174],
  [84, -146], [96, -160], [110, -142], [122, -154], [134, -168], [112, -176],
];
