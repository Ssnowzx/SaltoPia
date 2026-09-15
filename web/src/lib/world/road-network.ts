/**
 * The road network as data: streets, tracks, driveways, car parks, bridges.
 *
 * This module imports nothing. The terrain reads it to grade the ground under every
 * road, and the road geometry reads it to build the ribbons, so it cannot depend on
 * either of them. A road that is not in one of these lists is a road the terrain does
 * not know about, and it will show grass through its edges on the first slope.
 *
 * The network follows the east shore the way the road does in the reference
 * photograph: one road runs the length of the community a little inland, a lower street
 * serves the lakefront and the square, and each landmark has its own driveway ending in
 * a yard. A track leaves the north end of town, crosses the outlet channel on a bridge,
 * climbs through the chalet village and over the ridge, and runs the plateau to the
 * farms and the UFO port.
 */

export type Waypoint = readonly [number, number];

export interface RoadWidths {
  readonly streetWidth: number;
  readonly kerbExtra: number;
  readonly drivewayWidth: number;
  readonly trackWidth: number;
  readonly pathWidth: number;
}

/** Widths live here rather than in constants so the terrain can grade to them. */
export const ROAD_WIDTHS: RoadWidths = {
  streetWidth: 4.4,
  /** Kerb and pavement strip either side of a street. */
  kerbExtra: 1.2,
  drivewayWidth: 3.6,
  /** The plateau track: wider than a driveway, unpaved. */
  trackWidth: 4.2,
  pathWidth: 2.4,
};

/** The road along the community, a little inland of the shore. */
export const MAIN_ROAD: readonly Waypoint[] = [
  [48, 150],
  [52, 116],
  [58, 86],
  [66, 56],
  [74, 26],
  [82, -6],
  [86, -38],
  [82, -68],
  [76, -84],
  [72, -94],
];

/** The lakefront street: past the resort, its car park and the square. */
export const SHORE_STREET: readonly Waypoint[] = [
  [48, 142],
  [46, 126],
  [40, 106],
  [36, 88],
  [40, 52],
  [52, 30],
  [62, 12],
  [66, -8],
  [82, -6],
];

/** The road in from the south-east. */
export const ENTRY_ROAD: readonly Waypoint[] = [
  [48, 150],
  [72, 168],
  [104, 182],
];

/**
 * The plateau track: over the channel bridge, up between the chalet clusters, across
 * the ridge saddle, then along the back of the ridge to the farms and the UFO port.
 */
export const PLATEAU_TRACK: readonly Waypoint[] = [
  [72, -94],
  [72, -126],
  [76, -150],
  [80, -176],
  [86, -200],
  [80, -226],
  [56, -236],
  [22, -240],
];

/** The west branch of the plateau track, to Santa Barbara and the Cedro. */
export const PLATEAU_WEST: readonly Waypoint[] = [
  [22, -240],
  [-20, -243],
  [-60, -244],
  [-110, -246],
  [-150, -244],
  [-190, -240],
];

/** The east branch, to the Pinheiros farm. */
export const PLATEAU_EAST: readonly Waypoint[] = [
  [80, -226],
  [120, -234],
  [170, -238],
  [202, -241],
];

/** The spur up the approach lane to the UFO port's gate. */
export const PORT_SPUR: readonly Waypoint[] = [
  [22, -240],
  [22, -256],
];

export interface Driveway {
  readonly points: readonly Waypoint[];
  readonly width: number;
  readonly surface: "street" | "track";
  readonly yard: Waypoint;
  readonly yardRadius: number;
}

export const DRIVEWAYS: readonly Driveway[] = [
  // Pousada da Geada, at the south end of the lakefront.
  { points: [[40, 106], [32, 110]], width: ROAD_WIDTHS.drivewayWidth, surface: "street", yard: [29, 111], yardRadius: 6 },
  // Praca do Pinhao and its pier.
  { points: [[62, 12], [54, 12]], width: ROAD_WIDTHS.drivewayWidth, surface: "street", yard: [51, 12], yardRadius: 5 },
  // The shops, off the road through the middle of the community.
  { points: [[62, 78], [68, 72]], width: ROAD_WIDTHS.drivewayWidth, surface: "street", yard: [69, 70], yardRadius: 4 },
  // Galpao do Fogo de Chao, inland on the east slope.
  { points: [[66, 56], [92, 54], [110, 53]], width: ROAD_WIDTHS.drivewayWidth, surface: "track", yard: [113, 52], yardRadius: 4 },
  // CTG Porteira do Tropeiro, out to the south-east.
  { points: [[50, 122], [72, 116], [90, 110]], width: ROAD_WIDTHS.drivewayWidth, surface: "track", yard: [93, 109], yardRadius: 4 },
  // Estacao Velha, at the edge of the map.
  { points: [[49, 134], [98, 128], [140, 121]], width: ROAD_WIDTHS.drivewayWidth, surface: "street", yard: [145, 120], yardRadius: 5 },
  // Vinicola de Altitude, up on the north slope.
  { points: [[85, -42], [110, -44], [126, -44]], width: ROAD_WIDTHS.drivewayWidth, surface: "track", yard: [129, -44], yardRadius: 4 },
  // The dam and the usina. The yard stops short of the channel bank.
  { points: [[82, -68], [98, -80], [108, -88]], width: ROAD_WIDTHS.drivewayWidth, surface: "track", yard: [110, -89], yardRadius: 3.5 },
  // The farms, each off the plateau track at its own gate.
  { points: [[-60, -244], [-60, -246]], width: ROAD_WIDTHS.drivewayWidth, surface: "track", yard: [-60, -245], yardRadius: 6 },
  { points: [[-190, -240], [-196, -235]], width: ROAD_WIDTHS.drivewayWidth, surface: "track", yard: [-200, -232], yardRadius: 6 },
  { points: [[202, -241], [205, -240]], width: ROAD_WIDTHS.drivewayWidth, surface: "track", yard: [206, -240], yardRadius: 6 },
  // The UFO port's gate.
  { points: [[22, -256], [22, -258]], width: ROAD_WIDTHS.trackWidth, surface: "track", yard: [22, -259], yardRadius: 5 },
];

/** Paved paths around the square. */
export const PATHS: readonly (readonly Waypoint[])[] = [
  [[44, 18], [54, 12]],
  [[44, 6], [56, 0], [66, -8]],
];

/** The footbridge below the dam. */
export const FOOTBRIDGE: readonly Waypoint[] = [
  [122, -110],
  [128, -104],
  [134, -98],
];

export interface ParkingLot {
  readonly x: number;
  readonly z: number;
  readonly width: number;
  readonly depth: number;
  readonly rotationY: number;
}

/** Car parks: a paved rectangle, with cars placed by the layout. */
export const PARKING_LOTS: readonly ParkingLot[] = [
  { x: 38, z: 104, width: 16, depth: 11, rotationY: -0.3 },
  { x: 64, z: 40, width: 12, depth: 8, rotationY: -0.3 },
  { x: 144, z: 106, width: 10, depth: 7, rotationY: 0.5 },
];

export interface Bridge {
  readonly from: Waypoint;
  readonly to: Waypoint;
  /** Half the deck's width, including the parapets. */
  readonly halfWidth: number;
  /** Absolute height of the deck. */
  readonly deck: number;
}

/**
 * Where a road crosses water on a deck. The ribbon rides the deck instead of the
 * ground, and the terrain is graded up to the deck at both abutments.
 */
export const BRIDGES: readonly Bridge[] = [
  // The plateau track over the outlet channel. The deck sits a little above the bank,
  // so the approaches read as embankments rather than a dip into the water.
  { from: [72, -97], to: [72, -125], halfWidth: 3.4, deck: 2.6 },
];

export interface Polyline {
  readonly points: readonly Waypoint[];
  readonly closed: boolean;
  readonly width: number;
}

const STREET_WIDTH = ROAD_WIDTHS.streetWidth + ROAD_WIDTHS.kerbExtra;

/** Every ribbon on the ground, with its full width, for keep-out tests and grading. */
export const ROAD_POLYLINES: readonly Polyline[] = [
  { points: MAIN_ROAD, closed: false, width: STREET_WIDTH },
  { points: SHORE_STREET, closed: false, width: STREET_WIDTH },
  { points: ENTRY_ROAD, closed: false, width: STREET_WIDTH },
  { points: PLATEAU_TRACK, closed: false, width: ROAD_WIDTHS.trackWidth },
  { points: PLATEAU_WEST, closed: false, width: ROAD_WIDTHS.trackWidth },
  { points: PLATEAU_EAST, closed: false, width: ROAD_WIDTHS.trackWidth },
  { points: PORT_SPUR, closed: false, width: ROAD_WIDTHS.trackWidth },
  ...DRIVEWAYS.map((driveway) => ({ points: driveway.points, closed: false, width: driveway.width })),
  { points: FOOTBRIDGE, closed: false, width: 2.2 },
  ...PATHS.map((points) => ({ points, closed: false, width: ROAD_WIDTHS.pathWidth })),
];

export interface Yard {
  readonly x: number;
  readonly z: number;
  readonly radius: number;
}

/** Every flat paved area: driveway yards and car parks. */
export const YARDS: readonly Yard[] = [
  ...DRIVEWAYS.map((driveway) => ({ x: driveway.yard[0], z: driveway.yard[1], radius: driveway.yardRadius })),
  ...PARKING_LOTS.map((lot) => ({ x: lot.x, z: lot.z, radius: Math.max(lot.width, lot.depth) / 2 })),
];
