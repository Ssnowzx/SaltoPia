/**
 * Choices the place page makes about its pictures, kept pure so they can be tested.
 */

/** A picture that may not exist yet: `src` is null until its file is on disk. */
export interface PrintSource {
  readonly src: string | null;
  readonly caption: string;
}

/** A picture that does exist, with the words written under it. */
export interface Print {
  readonly src: string;
  readonly caption: string;
}

/** How many prints the welcome band scatters. More than five reads as a pile. */
export const MAX_PRINTS = 5;

/**
 * The tilt of each print, in degrees. Fixed rather than random so the server and the
 * browser draw the same page, and alternating in sign so no two neighbours lean together.
 */
export const PRINT_TILTS: readonly number[] = [-7, 4, -3, 6, -5];

/**
 * The prints for the welcome band: the menu's photographs first, because they are what
 * the band is inviting the visitor down to; then the experiences'; then the gallery's.
 * Missing pictures are skipped and a picture is never used twice.
 */
export function pickPrints(sources: readonly (readonly PrintSource[])[], max: number = MAX_PRINTS): readonly Print[] {
  const picked: Print[] = [];
  const seen = new Set<string>();
  for (const source of sources.flat()) {
    if (picked.length >= max) break;
    if (source.src === null || seen.has(source.src)) continue;
    seen.add(source.src);
    picked.push({ src: source.src, caption: source.caption });
  }
  return picked;
}

/**
 * Whether a menu card carries the place's crest as a stamp. One card in three, starting
 * with the second, so the stamps fall on a diagonal across a three-column grid instead of
 * down one column.
 */
export function stampedAt(index: number): boolean {
  return index % 3 === 1;
}

/** How a gallery picture spans the mosaic. */
export type GalleryTile = "big" | "wide" | "small" | "wideOnPhone";

/** A gallery's shape: how many columns it runs to on a wide screen, and each picture's tile. */
export interface GalleryLayout {
  readonly columns: 1 | 2 | 3 | 4;
  readonly tiles: readonly GalleryTile[];
}

/**
 * The mosaic for a given number of pictures, chosen so that no count leaves a hole: the
 * first picture is always the big one, and the rest are arranged to close the rectangle.
 */
export function galleryLayout(count: number): GalleryLayout {
  const smalls = (n: number): GalleryTile[] => Array.from({ length: n }, () => "small");
  switch (count) {
    case 0:
      return { columns: 1, tiles: [] };
    case 1:
      return { columns: 1, tiles: ["wideOnPhone"] };
    case 2:
      return { columns: 2, tiles: smalls(2) };
    case 3:
      return { columns: 3, tiles: ["big", ...smalls(2)] };
    case 4:
      return { columns: 4, tiles: ["big", ...smalls(2), "wide"] };
    case 5:
      return { columns: 4, tiles: ["big", ...smalls(4)] };
    default: {
      // Six: the big one and two beside it, then a row of three; on a phone the last of
      // five small ones would stand alone, so it takes the whole row.
      const six: readonly GalleryTile[] = ["big", ...smalls(4), "wideOnPhone"];
      return { columns: 3, tiles: six.slice(0, count) };
    }
  }
}
