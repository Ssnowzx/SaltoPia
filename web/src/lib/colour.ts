/**
 * Colour arithmetic for the rules the place colours are held to: legible under the page's
 * pale text, and clear of the reference site's palette.
 *
 * Contrast is WCAG 2.1's relative-luminance ratio. Distance is Euclidean in OKLab, which is
 * close to how different two colours look; RGB distance calls a dark green and a dark teal
 * far apart when the eye does not.
 */

type Rgb = readonly [number, number, number];

/**
 * The reference site's signature colours, measured from visitmeatopia.com on 2026-09-28:
 * its orange-red block, coral headings, deep green band, teal, mint, cream ground and
 * mustard stars. They are here to be kept away from, never to be used.
 */
export const REFERENCE_SWATCHES: Readonly<Record<string, string>> = {
  orangeRed: "#c04c2e",
  coral: "#e75b37",
  deepGreen: "#0c5a50",
  teal: "#00a08a",
  mint: "#cde8de",
  cream: "#fef2df",
  mustard: "#f9a825",
};

/** How far, in OKLab, a place colour must stand from every reference swatch. */
export const MIN_REFERENCE_DISTANCE = 0.08;

/** WCAG AA for body text. */
export const MIN_BODY_CONTRAST = 4.5;

const HEX = /^#([0-9a-f]{6})$/i;

/** `#rrggbb` as channels in 0-1. Throws on anything else, so a typo in content fails loudly. */
export function parseHex(hex: string): Rgb {
  const match = HEX.exec(hex.trim());
  if (!match) throw new Error(`Not a #rrggbb colour: ${hex}`);
  const value = match[1];
  const channel = (offset: number): number => parseInt(value.slice(offset, offset + 2), 16) / 255;
  return [channel(0), channel(2), channel(4)];
}

function toLinear(channel: number): number {
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = parseHex(hex).map(toLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * `first` mixed into `second`, `share` being how much of `first` survives - the same
 * arithmetic as CSS `color-mix(in srgb, first share, second)`, for places a stylesheet
 * cannot reach, such as an SVG file.
 */
export function mixHex(first: string, second: string, share: number): string {
  const a = parseHex(first);
  const b = parseHex(second);
  return `#${a
    .map((channel, index) => Math.round((channel * share + b[index] * (1 - share)) * 255))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("")}`;
}

/** WCAG contrast ratio between two colours, from 1 to 21. */
export function contrastRatio(first: string, second: string): number {
  const [light, dark] = [relativeLuminance(first), relativeLuminance(second)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}

function toOklab(hex: string): Rgb {
  const [r, g, b] = parseHex(hex).map(toLinear);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

/** Perceptual distance between two colours; about 0.02 is a just-visible difference. */
export function oklabDistance(first: string, second: string): number {
  const [l1, a1, b1] = toOklab(first);
  const [l2, a2, b2] = toOklab(second);
  return Math.hypot(l1 - l2, a1 - a2, b1 - b2);
}

/** The reference swatch a colour sits closest to, and how close. */
export function nearestReferenceSwatch(hex: string): { readonly name: string; readonly distance: number } {
  return Object.entries(REFERENCE_SWATCHES)
    .map(([name, swatch]) => ({ name, distance: oklabDistance(hex, swatch) }))
    .reduce((nearest, candidate) => (candidate.distance < nearest.distance ? candidate : nearest));
}
