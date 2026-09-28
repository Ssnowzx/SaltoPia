import { DEFAULT_PIN_ICON, PIN_ICONS } from "@/components/world-map/pin-icons";
import { mixHex } from "@/lib/colour";

/**
 * A place's crest: a round badge with the place's pin glyph and its name set around the
 * rim. Built as SVG markup so the same crest serves the hero, the cards and the file the
 * seed points at - one drawing, three uses.
 *
 * Colours are the design tokens' values, written out because an SVG file has no access
 * to the stylesheet.
 */

const CREST = {
  size: 200,
  ring: "#151830",
  rim: "#d9bf86",
  disc: "#1f2346",
  glyph: "#f6efe2",
  text: "#f6efe2",
  /** The bark token, which a place colour is darkened towards for the ring. */
  bark: "#2f2a24",
} as const;

/**
 * How many letters of the name the rim holds at full size. The name runs along the top
 * half of the rim and a textPath silently drops whatever does not fit, so "Galpão do Fogo
 * de Chão" was printed as "ALPÃO DO FOGO DE CHÃ"; a longer name is set smaller instead.
 */
const RIM_LETTERS = 16;
const RIM_FONT = { size: 15, spacing: 2.5 } as const;

/** How much of the place colour survives in the ring - the page's `--place-deep` mix. */
const RING_ACCENT_SHARE = 0.78;

export interface CrestOptions {
  /** The place's own colour. The disc takes it and the ring a darker cut of it. */
  readonly accent?: string;
  /**
   * Appended to the ids the rim text runs along. One page can draw a place's crest five
   * times, and ids repeated in a document are resolved to the first - which breaks the
   * moment that first crest is hidden.
   */
  readonly idSuffix?: string;
}

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** The crest as an SVG document string. */
export function crestSvg(slug: string, name: string, options: CrestOptions = {}): string {
  const { size } = CREST;
  const disc = options.accent ?? CREST.disc;
  const ring = options.accent ? mixHex(options.accent, CREST.bark, RING_ACCENT_SHARE) : CREST.ring;
  const key = `${slug}${options.idSuffix ? `-${options.idSuffix.replace(/[^a-zA-Z0-9_-]/g, "")}` : ""}`;
  const centre = size / 2;
  const glyph = PIN_ICONS[slug] ?? DEFAULT_PIN_ICON;
  const label = escapeXml(name.toUpperCase());
  const rimScale = Math.min(1, RIM_LETTERS / name.length);
  const rimSize = (RIM_FONT.size * rimScale).toFixed(1);
  const rimSpacing = (RIM_FONT.spacing * rimScale).toFixed(2);
  // The name runs round the top of the rim; the founding year balances it below.
  const textRadius = centre - 22;
  const arc = `M ${centre - textRadius} ${centre} A ${textRadius} ${textRadius} 0 1 1 ${centre + textRadius} ${centre}`;
  const lowerArc = `M ${centre - textRadius + 8} ${centre + 6} A ${textRadius - 8} ${textRadius - 8} 0 0 0 ${centre + textRadius - 8} ${centre + 6}`;

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" role="img" aria-label="${label}">`,
    `<circle cx="${centre}" cy="${centre}" r="${centre - 2}" fill="${ring}" stroke="${CREST.rim}" stroke-width="4"/>`,
    `<circle cx="${centre}" cy="${centre}" r="${centre - 34}" fill="${disc}" stroke="${CREST.rim}" stroke-width="3"/>`,
    `<defs><path id="crest-arc-${key}" d="${arc}"/><path id="crest-lower-${key}" d="${lowerArc}"/></defs>`,
    `<text fill="${CREST.text}" font-family="Figtree, Arial, sans-serif" font-size="${rimSize}" font-weight="800" letter-spacing="${rimSpacing}">`,
    `<textPath href="#crest-arc-${key}" startOffset="50%" text-anchor="middle">${label}</textPath></text>`,
    `<text fill="${CREST.rim}" font-family="Figtree, Arial, sans-serif" font-size="11" font-weight="800" letter-spacing="3">`,
    `<textPath href="#crest-lower-${key}" startOffset="50%" text-anchor="middle">SALTOPIA · 2028</textPath></text>`,
    `<g transform="translate(${centre - 42} ${centre - 42}) scale(3.5)"><path d="${glyph}" fill="${CREST.glyph}"/></g>`,
    `</svg>`,
  ].join("");
}
