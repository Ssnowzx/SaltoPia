import type { CSSProperties } from "react";

/**
 * A place's own colours, as custom properties its page is built from.
 *
 * Every place carries one accent; the tints and the ink are mixed from it here so that a
 * section only ever has to say `bg-place` or `text-place-ink`. Naming them once is what
 * keeps fifteen differently coloured pages a single layout rather than fifteen layouts.
 */
export function placeTheme(accent: string): CSSProperties {
  return {
    "--place-accent": accent,
    /** The pale ground a light section sits on: a whisper of the accent in the cream. */
    "--place-wash": `color-mix(in srgb, ${accent} 9%, var(--color-mist))`,
    /** One step deeper, for a band that has to separate from the wash. */
    "--place-veil": `color-mix(in srgb, ${accent} 18%, var(--color-mist))`,
    /** The accent darkened, for a block that has to sit under the accent itself. */
    "--place-deep": `color-mix(in srgb, ${accent} 78%, var(--color-bark))`,
    /** Text on the accent, and text on the wash. */
    "--place-on-accent": "var(--color-mist)",
    "--place-ink": `color-mix(in srgb, ${accent} 62%, var(--color-bark))`,
  } as CSSProperties;
}
