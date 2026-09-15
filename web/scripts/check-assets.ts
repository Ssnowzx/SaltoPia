import "dotenv/config";

import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { PrismaMariaDb } from "@prisma/adapter-mariadb";

import { PrismaClient } from "../src/generated/prisma/client";

/**
 * Fails when a place or experience points at an image that is not on disk.
 *
 * The paths are strings in the database, so nothing catches a typo or a renamed slug
 * until a page renders a broken image - and the one place that is never looked at
 * before a presentation is the page nobody clicked. Run it with the rest of the checks:
 * `npm run check:assets`.
 */
async function main(): Promise<void> {
  const prisma = new PrismaClient({ adapter: new PrismaMariaDb(process.env.DATABASE_URL ?? "") });
  const places = await prisma.place.findMany({
    where: { published: true },
    include: { experiences: { where: { published: true } } },
    orderBy: { position: "asc" },
  });
  await prisma.$disconnect();

  const publicDir = join(process.cwd(), "public");
  const missing: string[] = [];
  const check = (owner: string, path: string): void => {
    if (!existsSync(join(publicDir, path))) missing.push(`${owner} -> ${path}`);
  };

  for (const place of places) {
    check(place.slug, place.crestImage);
    check(place.slug, place.heroImage);
    for (const experience of place.experiences) {
      check(`${place.slug}/${experience.slug}`, experience.image);
    }
  }

  // Galleries are optional, so a thin one is reported rather than failed: the pictures
  // arrive in batches and a page has to work before the last one does.
  const thin: string[] = [];
  let pictures = 0;
  for (const place of places) {
    const directory = join(publicDir, "images", "places", place.slug);
    const found = existsSync(directory) ? readdirSync(directory).filter((name) => name.endsWith(".webp")).length : 0;
    pictures += found;
    if (found < 6) thin.push(`${place.slug} (${found}/6)`);
  }
  console.log(`galleries: ${pictures} pictures${thin.length > 0 ? `, still thin: ${thin.join(", ")}` : ""}`);

  const checked = places.length * 2 + places.reduce((count, place) => count + place.experiences.length, 0);
  if (missing.length > 0) {
    console.error(`Missing ${missing.length} of ${checked} assets:`);
    for (const line of missing) console.error(`  ${line}`);
    process.exit(1);
  }
  console.log(`ASSETS OK (${checked} files)`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
