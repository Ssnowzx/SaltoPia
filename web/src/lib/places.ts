import "server-only";

import type { Experience, MenuItem, Place, PlaceMenu } from "@/types";

import { prisma } from "./db";
import { presentOrNull } from "./public-file";

/**
 * The data layer for places and experiences.
 *
 * This is the only module that talks to Prisma about places. Components import these
 * functions and the domain types, never the client - see CLAUDE.md. That is what keeps
 * the database a replaceable detail rather than a dependency woven through the UI.
 */

/** Shape returned by the queries below, before mapping to the domain type. */
type PlaceRecord = Awaited<ReturnType<typeof queryPublishedPlaces>>[number];

function queryPublishedPlaces() {
  return prisma.place.findMany({
    where: { published: true },
    orderBy: { position: "asc" },
    include: {
      experiences: {
        where: { published: true },
        orderBy: { position: "asc" },
      },
    },
  });
}

function toExperience(
  record: PlaceRecord["experiences"][number],
  placeSlug: string,
): Experience {
  return {
    slug: record.slug,
    name: record.name,
    description: record.description,
    image: record.image,
    kind: record.kind,
    durationMinutes: record.durationMinutes,
    placeSlug,
  };
}

function toPlace(record: PlaceRecord): Place {
  return {
    slug: record.slug,
    name: record.name,
    tagline: record.tagline,
    description: record.description,
    crestImage: record.crestImage,
    heroImage: record.heroImage,
    offer: record.offer,
    accent: record.accent,
    worldPosition: { x: record.worldX, y: record.worldY, z: record.worldZ },
    cameraPosition: { x: record.cameraX, y: record.cameraY, z: record.cameraZ },
    experiences: record.experiences.map((experience) =>
      toExperience(experience, record.slug),
    ),
  };
}

/** Every published place, in display order, with its published experiences. */
export async function getPlaces(): Promise<readonly Place[]> {
  const records = await queryPublishedPlaces();
  return records.map(toPlace);
}

/** One published place by slug, or null when it does not exist or is unpublished. */
export async function getPlaceBySlug(slug: string): Promise<Place | null> {
  const record = await prisma.place.findFirst({
    where: { slug, published: true },
    include: {
      experiences: {
        where: { published: true },
        orderBy: { position: "asc" },
      },
    },
  });

  return record ? toPlace(record) : null;
}

/**
 * One experience under its place, or null - including when the experience exists but
 * belongs to another place. Slugs are unique within a place, not across the site.
 */
export async function getExperience(
  placeSlug: string,
  experienceSlug: string,
): Promise<{ readonly place: Place; readonly experience: Experience } | null> {
  const place = await getPlaceBySlug(placeSlug);
  const experience = place?.experiences.find((candidate) => candidate.slug === experienceSlug);
  return place && experience ? { place, experience } : null;
}

/**
 * A published place's menu, or null when the place does not exist, is unpublished or has
 * no menu yet. A photograph that is not on disk comes back as null, so the page draws a
 * stand-in rather than asking for a file that is not there.
 */
export async function getPlaceMenu(slug: string): Promise<PlaceMenu | null> {
  const record = await prisma.place.findFirst({
    where: { slug, published: true },
    select: {
      menuTitle: true,
      menuLede: true,
      menuItems: { where: { published: true }, orderBy: { position: "asc" } },
    },
  });
  if (!record?.menuTitle || record.menuItems.length === 0) return null;

  const items: MenuItem[] = record.menuItems.map((item) => ({
    slug: item.slug,
    name: item.name,
    description: item.description,
    tag: item.tag,
    image: presentOrNull(item.image),
  }));
  return { title: record.menuTitle, lede: record.menuLede ?? "", items };
}
