import "dotenv/config";

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { PrismaMariaDb } from "@prisma/adapter-mariadb";

import { PrismaClient } from "../src/generated/prisma/client";
import { crestSvg } from "../src/lib/crest";

/**
 * Writes one crest SVG per published place to public/images/crests, at the path the
 * seed points each place's `crestImage` at. Also writes places.json for the hero render
 * script when a path is given as the first argument.
 */
async function main(): Promise<void> {
  const prisma = new PrismaClient({ adapter: new PrismaMariaDb(process.env.DATABASE_URL ?? "") });
  const places = await prisma.place.findMany({ where: { published: true }, select: { slug: true, name: true }, orderBy: { position: "asc" } });

  const directory = join(process.cwd(), "public", "images", "crests");
  mkdirSync(directory, { recursive: true });
  for (const place of places) {
    writeFileSync(join(directory, `${place.slug}.svg`), crestSvg(place.slug, place.name));
  }
  console.log(`crests: ${places.length}`);

  const listPath = process.argv[2];
  if (listPath) writeFileSync(listPath, JSON.stringify(places));

  await prisma.$disconnect();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
