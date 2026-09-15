import "dotenv/config";

import { existsSync } from "node:fs";
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
