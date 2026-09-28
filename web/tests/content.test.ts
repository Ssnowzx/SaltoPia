import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { MENUS } from "../prisma/content/menus";
import { PLACES } from "../prisma/content/places";
import { menuImagePath } from "../prisma/content/types";

import { contrastRatio, MIN_BODY_CONTRAST, MIN_REFERENCE_DISTANCE, nearestReferenceSwatch } from "@/lib/colour";

/** The page's pale text colour - `--color-mist` in globals.css. */
const PAGE_TEXT = "#f6efe2";

/** How many items a menu may hold: enough to fill rows, few enough to read. */
const MENU_ITEMS = { min: 6, max: 12 } as const;

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;

describe("place colours", () => {
  it("should keep pale text legible on every place colour", () => {
    // ARRANGE
    const accents = PLACES.map((place) => [place.slug, place.accent] as const);

    // ACT
    const failing = accents.filter(([, accent]) => contrastRatio(accent, PAGE_TEXT) < MIN_BODY_CONTRAST);

    // ASSERT
    assert.deepEqual(failing, []);
  });

  it("should keep every place colour away from the reference site's palette", () => {
    // ARRANGE
    const accents = PLACES.map((place) => [place.slug, place.accent] as const);

    // ACT
    const tooClose = accents
      .map(([slug, accent]) => ({ slug, ...nearestReferenceSwatch(accent) }))
      .filter((found) => found.distance < MIN_REFERENCE_DISTANCE);

    // ASSERT
    assert.deepEqual(tooClose, []);
  });
});

describe("menus", () => {
  it("should give every place a menu with a heading, a lede and a full set of items", () => {
    // ARRANGE
    const slugs = PLACES.map((place) => place.slug);

    // ACT
    const incomplete = slugs.filter((slug) => {
      const menu = MENUS[slug];
      return !menu || !menu.title || !menu.lede || menu.items.length < MENU_ITEMS.min || menu.items.length > MENU_ITEMS.max;
    });

    // ASSERT
    assert.deepEqual(incomplete, []);
  });

  it("should not hold a menu for a place that does not exist", () => {
    // ARRANGE
    const places = new Set(PLACES.map((place) => place.slug));

    // ACT
    const orphans = Object.keys(MENUS).filter((slug) => !places.has(slug));

    // ASSERT
    assert.deepEqual(orphans, []);
  });

  it("should use unique kebab-case slugs within each menu", () => {
    // ARRANGE
    const menus = Object.entries(MENUS);

    // ACT
    const problems = menus.flatMap(([place, menu]) => {
      const slugs = menu.items.map((item) => item.slug);
      const repeated = slugs.filter((slug, index) => slugs.indexOf(slug) !== index);
      const malformed = slugs.filter((slug) => !KEBAB.test(slug));
      return [...repeated, ...malformed].map((slug) => `${place}/${slug}`);
    });

    // ASSERT
    assert.deepEqual(problems, []);
  });

  it("should keep every item's words inside the lengths a card can hold", () => {
    // ARRANGE
    const items = Object.entries(MENUS).flatMap(([place, menu]) => menu.items.map((item) => ({ place, item })));

    // ACT
    const tooLong = items
      .filter(({ item }) => item.name.length > 40 || item.description.length > 110 || (item.tag?.length ?? 0) > 16)
      .map(({ place, item }) => `${place}/${item.slug}`);

    // ASSERT
    assert.deepEqual(tooLong, []);
  });

  it("should give every item a photo brief", () => {
    // ARRANGE
    const items = Object.entries(MENUS).flatMap(([place, menu]) => menu.items.map((item) => ({ place, item })));

    // ACT
    const missing = items.filter(({ item }) => item.photo.trim().length < 40).map(({ place, item }) => `${place}/${item.slug}`);

    // ASSERT
    assert.deepEqual(missing, []);
  });

  it("should expect each photograph under the place's own menu folder", () => {
    // ARRANGE
    const place = "galpao-do-fogo";
    const item = "costela-de-chao";

    // ACT
    const path = menuImagePath(place, item);

    // ASSERT
    assert.equal(path, "/images/menu/galpao-do-fogo/costela-de-chao.webp");
  });
});
