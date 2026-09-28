import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { contrastRatio, nearestReferenceSwatch, oklabDistance, parseHex } from "@/lib/colour";

describe("colour", () => {
  it("should measure mist on night at about 13.2 to 1", () => {
    // ARRANGE
    const mist = "#f6efe2";
    const night = "#1f2346";

    // ACT
    const ratio = contrastRatio(mist, night);

    // ASSERT
    assert.ok(Math.abs(ratio - 13.24) < 0.05, `got ${ratio}`);
  });

  it("should keep gold legible on night, as the footer and the contest set it", () => {
    // ARRANGE
    const gold = "#e2b04a";
    const night = "#1f2346";

    // ACT
    const ratio = contrastRatio(gold, night);

    // ASSERT
    assert.ok(ratio >= 4.5, `got ${ratio}`);
  });

  it("should give the same contrast whichever colour comes first", () => {
    // ARRANGE
    const pair = ["#7b2d3f", "#f6efe2"] as const;

    // ACT
    const forward = contrastRatio(pair[0], pair[1]);
    const backward = contrastRatio(pair[1], pair[0]);

    // ASSERT
    assert.equal(forward, backward);
  });

  it("should find the old Parque Caveiras colour almost on the reference orange-red", () => {
    // ARRANGE
    const oldParque = "#c0432f";

    // ACT
    const nearest = nearestReferenceSwatch(oldParque);

    // ASSERT
    assert.equal(nearest.name, "orangeRed");
    assert.ok(nearest.distance < 0.02, `got ${nearest.distance}`);
  });

  it("should measure no distance between a colour and itself", () => {
    // ARRANGE
    const colour = "#4b2f7a";

    // ACT
    const distance = oklabDistance(colour, colour);

    // ASSERT
    assert.equal(distance, 0);
  });

  it("should reject a colour that is not #rrggbb", () => {
    // ARRANGE
    const malformed = "#abc";

    // ACT
    const parse = (): unknown => parseHex(malformed);

    // ASSERT
    assert.throws(parse);
  });
});
