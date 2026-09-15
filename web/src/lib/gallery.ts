import "server-only";

import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * The extra photographs a place has, found on disk rather than listed in the database.
 *
 * A gallery is a folder: `public/images/places/<slug>/` holding WebP files, shown in
 * filename order. Adding a picture is dropping a file in, which is how the pictures
 * actually arrive; putting ninety paths in the seed would make the content file mostly
 * filenames, and the seed is for words.
 */

const GALLERY_ROOT = join(process.cwd(), "public", "images", "places");

/** How many a page will show, whatever the folder holds. */
export const GALLERY_MAX = 6;

const cache = new Map<string, readonly string[]>();

/** Every picture in a place's folder, in filename order, as public paths. */
export function galleryFor(slug: string): readonly string[] {
  const cached = cache.get(slug);
  if (cached) return cached;

  const directory = join(GALLERY_ROOT, slug);
  const files = existsSync(directory)
    ? readdirSync(directory)
        .filter((name) => name.endsWith(".webp"))
        .sort()
        .slice(0, GALLERY_MAX)
        .map((name) => `/images/places/${slug}/${name}`)
    : [];

  cache.set(slug, files);
  return files;
}
