import { ARAUCARIA_PATH } from "@/components/content/ridge-edge";

/**
 * The community in silhouette, closing the contest's hero: hills, araucárias, the chapel,
 * a house with its window lit, the fairground's wheel turning and, over it all, the UFO
 * from the plateau crossing the sky. Night-blue on the cream page, and its ground runs
 * straight into the night band below.
 *
 * Only the wheel and the UFO move, and neither does under reduced motion (see
 * globals.css). The whole scene is decoration.
 */

const TREES: ReadonlyArray<readonly [x: number, y: number, scale: number]> = [
  [40, 236, 2.4],
  [238, 226, 2.8],
  [300, 232, 2.0],
  [520, 222, 3.0],
  [640, 234, 2.2],
  [880, 226, 2.6],
  [956, 232, 1.9],
  [1380, 230, 2.7],
];

/** The wheel's eight gondolas, as angles round the rim. */
const GONDOLAS = [0, 45, 90, 135, 180, 225, 270, 315];
const WHEEL = { cx: 1180, cy: 150, r: 104 } as const;

interface SkylineSceneProps {
  readonly className?: string;
}

export function SkylineScene({ className }: SkylineSceneProps): React.ReactElement {
  return (
    <svg className={className} viewBox="0 0 1440 300" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
      {/* The sun going down behind the far hills. */}
      <circle cx="610" cy="206" r="64" className="fill-gold" />
      <path d="M0 300V214C160 186 300 196 440 206s300 -34 460 -28 330 34 540 8V300Z" className="fill-night" opacity="0.35" />

      <Wheel />
      <Chapel />
      <House />

      {TREES.map(([x, y, scale]) => (
        <path key={x} d={ARAUCARIA_PATH} className="fill-night" transform={`translate(${x} ${y}) scale(${scale})`} />
      ))}

      <path d="M0 300V244C200 228 380 236 560 242s420 -14 600 -8 200 10 280 4V300Z" className="fill-night" />

      <g className="ufo-cross">
        <g className="ufo-bob">
          <ellipse cx="760" cy="64" rx="18" ry="13" className="fill-frost" />
          <ellipse cx="760" cy="72" rx="46" ry="11" className="fill-night" />
          {[734, 760, 786].map((x) => (
            <circle key={x} cx={x} cy="73" r="3" className="fill-gold" />
          ))}
          <path d="M744 84L730 118H790L776 84Z" className="fill-gold" opacity="0.18" />
        </g>
      </g>
    </svg>
  );
}

function Wheel(): React.ReactElement {
  const { cx, cy, r } = WHEEL;
  return (
    <g>
      {/* The legs stand still; only the wheel on them turns. */}
      <path d={`M${cx} ${cy}L${cx - 70} 262H${cx - 52}L${cx} ${cy + 22}L${cx + 52} 262H${cx + 70}Z`} className="fill-night" />
      <g className="wheel-spin">
        <circle cx={cx} cy={cy} r={r} fill="none" strokeWidth="6" className="stroke-night" />
        <circle cx={cx} cy={cy} r={r - 30} fill="none" strokeWidth="3" className="stroke-night" />
        {GONDOLAS.map((angle) => {
          const radians = (angle * Math.PI) / 180;
          const x = cx + r * Math.cos(radians);
          const y = cy + r * Math.sin(radians);
          return (
            <g key={angle}>
              <line x1={cx} y1={cy} x2={x} y2={y} strokeWidth="3" className="stroke-night" />
              <rect x={x - 11} y={y - 4} width="22" height="16" rx="5" className="fill-wine" />
            </g>
          );
        })}
        <circle cx={cx} cy={cy} r="10" className="fill-night" />
      </g>
    </g>
  );
}

function Chapel(): React.ReactElement {
  return (
    <g className="fill-night">
      <rect x="380" y="186" width="64" height="70" />
      <path d="M372 190L412 158L452 190Z" />
      <rect x="400" y="120" width="24" height="44" />
      <path d="M396 124L412 70L428 124Z" />
      <rect x="410.5" y="52" width="3" height="20" />
      <rect x="404" y="58" width="16" height="3" />
      <rect x="404" y="212" width="16" height="30" rx="8" className="fill-gold" />
    </g>
  );
}

function House(): React.ReactElement {
  return (
    <g>
      <path d="M100 250V196L150 160L200 196V250Z" className="fill-night" />
      <rect x="166" y="150" width="12" height="26" className="fill-night" />
      <rect x="118" y="206" width="26" height="22" className="fill-gold" />
      <rect x="130" y="206" width="2" height="22" className="fill-night" />
    </g>
  );
}
