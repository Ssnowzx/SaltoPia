import "server-only";

import { existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Whether a file the page is about to point at is actually in `public/`.
 *
 * Photographs arrive after the words do - the menu has its names long before Grok has
 * made its pictures - so a path in the database is a promise, not a file. Asking here
 * lets the page draw a stand-in instead of a broken image and a 404.
 *
 * Answers are remembered in a production build, where `public/` cannot change under a
 * running server. In development they are not, so a photograph dropped in shows on the
 * next reload.
 */

const PUBLIC_DIR = join(process.cwd(), "public");
const REMEMBER = process.env.NODE_ENV === "production";
const known = new Map<string, boolean>();

/** True when `publicPath` - `/images/...` - names a file under `public/`. */
export function publicFileExists(publicPath: string): boolean {
  const cached = REMEMBER ? known.get(publicPath) : undefined;
  if (cached !== undefined) return cached;
  const exists = existsSync(join(PUBLIC_DIR, publicPath));
  if (REMEMBER) known.set(publicPath, exists);
  return exists;
}

/** The path when its file exists, otherwise null. */
export function presentOrNull(publicPath: string): string | null {
  return publicFileExists(publicPath) ? publicPath : null;
}
