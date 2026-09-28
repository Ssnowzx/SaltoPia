import "dotenv/config";

import { PrismaMariaDb } from "@prisma/adapter-mariadb";

import { PrismaClient } from "../src/generated/prisma/client";
import { MENUS } from "./content/menus";
import { PLACES } from "./content/places";
import { menuImagePath, type PlaceSeed } from "./content/types";

/**
 * Writes the content modules into the database: the places of Saltopia, their
 * experiences and their menus.
 *
 * The words live in `prisma/content/`, free of side effects, so the tests can hold them
 * to their rules without a database. This file only writes them.
 */

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb(process.env.DATABASE_URL ?? ""),
});

/** The columns a place writes the same way on create and on update. */
function placeFields(place: PlaceSeed, index: number) {
  const [worldX, worldY, worldZ] = place.world;
  const [cameraX, cameraY, cameraZ] = place.camera;
  const menu = MENUS[place.slug];
  return {
    name: place.name,
    tagline: place.tagline,
    description: place.description,
    // Set on update as well as on create: without these, a row made before a path
    // changed keeps the old one for ever, and three crests were still pointing at
    // .webp files that stopped being written when the crests became SVG.
    crestImage: `/images/crests/${place.slug}.svg`,
    heroImage: `/images/heroes/${place.slug}.webp`,
    worldX,
    worldY,
    worldZ,
    cameraX,
    cameraY,
    cameraZ,
    offer: place.offer ?? null,
    accent: place.accent,
    menuTitle: menu?.title ?? null,
    menuLede: menu?.lede ?? null,
    position: index,
    published: true,
  };
}

function experienceRows(place: PlaceSeed) {
  return place.experiences.map((experience, position) => ({
    ...experience,
    image: `/images/experiences/${experience.slug}.webp`,
    position,
    published: true,
  }));
}

function menuRows(place: PlaceSeed) {
  return (MENUS[place.slug]?.items ?? []).map((item, position) => ({
    slug: item.slug,
    name: item.name,
    description: item.description,
    tag: item.tag ?? null,
    image: menuImagePath(place.slug, item.slug),
    position,
    published: true,
  }));
}

async function main(): Promise<void> {
  for (const [index, place] of PLACES.entries()) {
    const fields = placeFields(place, index);
    const experiences = experienceRows(place);
    const menuItems = menuRows(place);

    // Upsert so the seed is safe to re-run; experiences and menu items are replaced
    // wholesale because they have no identity worth preserving across seeds.
    await prisma.place.upsert({
      where: { slug: place.slug },
      update: {
        ...fields,
        experiences: { deleteMany: {}, create: experiences },
        menuItems: { deleteMany: {}, create: menuItems },
      },
      create: {
        slug: place.slug,
        ...fields,
        experiences: { create: experiences },
        menuItems: { create: menuItems },
      },
    });
  }

  // A place renamed to a new slug leaves its old row behind: an upsert can only create
  // or update, never notice the absence. Without this the site kept showing the place
  // under both names.
  const removed = await prisma.place.deleteMany({ where: { slug: { notIn: PLACES.map((place) => place.slug) } } });
  if (removed.count > 0) process.stdout.write(`Removed ${removed.count} place(s) no longer seeded.\n`);

  const [places, experiences, menuItems] = await Promise.all([prisma.place.count(), prisma.experience.count(), prisma.menuItem.count()]);
  process.stdout.write(`Seeded ${places} places, ${experiences} experiences and ${menuItems} menu items.\n`);
}

main()
  .catch((error: unknown) => {
    process.stderr.write(`${String(error)}\n`);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
