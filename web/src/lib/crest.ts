import { DEFAULT_PIN_ICON, PIN_ICONS } from "@/components/world-map/pin-icons";

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
  ring: "#24443a",
  rim: "#e2b04a",
  disc: "#1f6068",
  glyph: "#f6efe2",
  text: "#f6efe2",
} as const;

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** The crest as an SVG document string. */
export function crestSvg(slug: string, name: string): string {
  const { size } = CREST;
  const centre = size / 2;
  const glyph = PIN_ICONS[slug] ?? DEFAULT_PIN_ICON;
  const label = escapeXml(name.toUpperCase());
  // The name runs round the top of the rim; the founding year balances it below.
  const textRadius = centre - 22;
  const arc = `M ${centre - textRadius} ${centre} A ${textRadius} ${textRadius} 0 1 1 ${centre + textRadius} ${centre}`;
  const lowerArc = `M ${centre - textRadius + 8} ${centre + 6} A ${textRadius - 8} ${textRadius - 8} 0 0 0 ${centre + textRadius - 8} ${centre + 6}`;

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" role="img" aria-label="${label}">`,
    `<circle cx="${centre}" cy="${centre}" r="${centre - 2}" fill="${CREST.ring}" stroke="${CREST.rim}" stroke-width="4"/>`,
    `<circle cx="${centre}" cy="${centre}" r="${centre - 34}" fill="${CREST.disc}" stroke="${CREST.rim}" stroke-width="3"/>`,
    `<defs><path id="crest-arc-${slug}" d="${arc}"/><path id="crest-lower-${slug}" d="${lowerArc}"/></defs>`,
    `<text fill="${CREST.text}" font-family="Figtree, Arial, sans-serif" font-size="15" font-weight="800" letter-spacing="2.5">`,
    `<textPath href="#crest-arc-${slug}" startOffset="50%" text-anchor="middle">${label}</textPath></text>`,
    `<text fill="${CREST.rim}" font-family="Figtree, Arial, sans-serif" font-size="11" font-weight="800" letter-spacing="3">`,
    `<textPath href="#crest-lower-${slug}" startOffset="50%" text-anchor="middle">SALTOPIA · 2028</textPath></text>`,
    `<g transform="translate(${centre - 42} ${centre - 42}) scale(3.5)"><path d="${glyph}" fill="${CREST.glyph}"/></g>`,
    `</svg>`,
  ].join("");
}
