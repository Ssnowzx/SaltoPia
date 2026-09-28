/**
 * The shapes of the seed's content.
 *
 * The words live in plain modules with no side effects, so the seed can write them and
 * the tests can read them without a database. Copy is Brazilian Portuguese; identifiers
 * and comments are English; a photo brief is English because the image generator reads
 * it.
 */

/** What kind of thing an experience is. Mirrors the `experience_kind` enum. */
export type ExperienceKindSeed = "FOOD" | "TRAIL" | "TOUR" | "EVENT" | "STAY";

export interface ExperienceSeed {
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly kind: ExperienceKindSeed;
  readonly durationMinutes: number | null;
}

export interface PlaceSeed {
  readonly slug: string;
  readonly name: string;
  readonly tagline: string;
  readonly description: string;
  /** Kept short: it is read on a pin the size of a thumbnail, from across the map. */
  readonly offer?: string;
  /** The colour the place's page is built around. See `tests/content.test.ts` for its rules. */
  readonly accent: string;
  readonly world: readonly [number, number, number];
  readonly camera: readonly [number, number, number];
  readonly experiences: readonly ExperienceSeed[];
}

/** One thing on a place's menu. Its photograph lives at `menuImagePath(place, slug)`. */
export interface MenuItemSeed {
  readonly slug: string;
  /** What the visitor reads on the card. At most 40 characters. */
  readonly name: string;
  /** One sentence, at most 110 characters. */
  readonly description: string;
  /** An optional short label - "Da casa", "Para dividir". At most 16 characters. */
  readonly tag?: string;
  /** The photograph's subject for the image generator, in English, one or two sentences. */
  readonly photo: string;
}

/** A place's menu: a heading of its own, one line under it, and its items in order. */
export interface PlaceMenuSeed {
  /** At most 40 characters - "Cardápio do galpão". */
  readonly title: string;
  /** One sentence, at most 160 characters. */
  readonly lede: string;
  readonly items: readonly MenuItemSeed[];
}

/** Where a menu item's photograph is expected, relative to `public/`. */
export function menuImagePath(placeSlug: string, itemSlug: string): string {
  return `/images/menu/${placeSlug}/${itemSlug}.webp`;
}
