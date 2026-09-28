import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { galleryLayout, MAX_PRINTS, pickPrints, stampedAt, type PrintSource } from "@/lib/menu-layout";

const menu: readonly PrintSource[] = [
  { src: "/images/menu/praca/a.webp", caption: "Pinhão na chapa" },
  { src: null, caption: "Quentão" },
  { src: "/images/menu/praca/c.webp", caption: "Cuca" },
];
const experiences: readonly PrintSource[] = [
  { src: "/images/experiences/festa.webp", caption: "Festa do Pinhão" },
  { src: "/images/experiences/panela.webp", caption: "Pinhão na panela" },
];
const gallery: readonly PrintSource[] = [
  { src: "/images/places/praca/01.webp", caption: "" },
  { src: "/images/places/praca/02.webp", caption: "" },
];

describe("pickPrints", () => {
  it("should take the menu's photographs first and skip the missing ones", () => {
    // ARRANGE
    const sources = [menu, experiences, gallery];

    // ACT
    const prints = pickPrints(sources);

    // ASSERT
    assert.deepEqual(
      prints.map((print) => print.caption),
      ["Pinhão na chapa", "Cuca", "Festa do Pinhão", "Pinhão na panela", ""],
    );
  });

  it("should never scatter more than the maximum", () => {
    // ARRANGE
    const sources = [menu, experiences, gallery, gallery];

    // ACT
    const prints = pickPrints(sources);

    // ASSERT
    assert.equal(prints.length, MAX_PRINTS);
  });

  it("should fall back to the experiences when no menu photograph exists yet", () => {
    // ARRANGE
    const noPhotos: readonly PrintSource[] = menu.map((item) => ({ ...item, src: null }));

    // ACT
    const prints = pickPrints([noPhotos, experiences], 3);

    // ASSERT
    assert.deepEqual(
      prints.map((print) => print.src),
      ["/images/experiences/festa.webp", "/images/experiences/panela.webp"],
    );
  });

  it("should not use the same picture twice", () => {
    // ARRANGE
    const repeated: readonly PrintSource[] = [experiences[0], experiences[0]];

    // ACT
    const prints = pickPrints([repeated]);

    // ASSERT
    assert.equal(prints.length, 1);
  });
});

describe("stampedAt", () => {
  it("should stamp one card in three, starting with the second", () => {
    // ARRANGE
    const indices = [0, 1, 2, 3, 4, 5, 6, 7, 8];

    // ACT
    const stamped = indices.filter(stampedAt);

    // ASSERT
    assert.deepEqual(stamped, [1, 4, 7]);
  });
});

describe("galleryLayout", () => {
  it("should make the first picture the big one whenever there are three or more", () => {
    // ARRANGE
    const counts = [3, 4, 5, 6];

    // ACT
    const firsts = counts.map((count) => galleryLayout(count).tiles[0]);

    // ASSERT
    assert.deepEqual(firsts, ["big", "big", "big", "big"]);
  });

  it("should fill every cell of the wide mosaic, leaving no hole", () => {
    // ARRANGE - area of each tile on a wide screen, in cells.
    const area = { big: 4, wide: 2, small: 1, wideOnPhone: 1 } as const;
    const counts = [2, 3, 4, 5, 6];

    // ACT
    const leftovers = counts.map((count) => {
      const layout = galleryLayout(count);
      const cells = layout.tiles.reduce((sum, tile) => sum + area[tile], 0);
      return cells % layout.columns;
    });

    // ASSERT
    assert.deepEqual(leftovers, [0, 0, 0, 0, 0]);
  });

  it("should give one tile per picture", () => {
    // ARRANGE
    const counts = [0, 1, 2, 3, 4, 5, 6];

    // ACT
    const lengths = counts.map((count) => galleryLayout(count).tiles.length);

    // ASSERT
    assert.deepEqual(lengths, counts);
  });
});
