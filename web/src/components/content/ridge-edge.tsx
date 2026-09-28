/**
 * The Serra's skyline, used as the top edge of a band: rolling hills with araucárias
 * standing on them. The hills take the colour of the band below (`currentColor`) and the
 * ground behind them is the band above, so one band rises out of the other.
 *
 * The drawing is sliced rather than stretched to the width, so the trees never go fat or
 * thin; a narrow screen shows the middle of the range.
 */

/** Where each tree stands on the 1440x120 drawing, and how big it is. */
const TREES: ReadonlyArray<readonly [x: number, y: number, scale: number]> = [
  [120, 70, 1.3],
  [176, 66, 0.9],
  [412, 64, 1.15],
  [566, 52, 1.0],
  [628, 48, 0.8],
  [870, 52, 0.9],
  [990, 64, 1.25],
  [1210, 60, 1.15],
  [1270, 58, 0.85],
  [1392, 58, 1.1],
];

/** Hills across the full width, closed along the bottom edge. */
const HILLS =
  "M0 120V80C120 62 222 54 340 66s250 -18 360 -22 250 28 380 22 250 -26 360 -10V120Z";

/**
 * One araucária, rooted at the origin: a tall bare trunk and the crown the tree is known
 * by - a wide cup of upswept branches whose tufted ends make an almost flat top. About 46
 * units tall at a scale of 1.
 */
export const ARAUCARIA_PATH = [
  "M-1.5 0L-1 -30H1L1.5 0Z",
  "M-2 -29C-8 -31 -18 -37 -23 -45Q-20 -48 -17 -46Q-13 -49 -9 -46Q-5 -49 -1 -46Q3 -49 7 -46Q11 -49 15 -46Q19 -48 23 -45C18 -37 8 -31 2 -29Z",
].join(" ");

interface RidgeEdgeProps {
  readonly className?: string;
}

export function RidgeEdge({ className }: RidgeEdgeProps): React.ReactElement {
  return (
    <svg className={className} viewBox="0 0 1440 120" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
      <path d={HILLS} fill="currentColor" />
      {TREES.map(([x, y, scale]) => (
        <path key={x} d={ARAUCARIA_PATH} fill="currentColor" transform={`translate(${x} ${y}) scale(${scale})`} />
      ))}
    </svg>
  );
}
