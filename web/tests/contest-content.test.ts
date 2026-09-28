import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { PLACES } from "../prisma/content/places";

import { CONTEST_PHOTOS, IDEAS, PHASES, PRIZE, RULES } from "@/lib/contest/content";

describe("contest content", () => {
  it("should name only partners that are places on the map", () => {
    // ARRANGE
    const places = new Set(PLACES.map((place) => place.slug));

    // ACT
    const unknown = PRIZE.flatMap((item) => item.partners).filter((slug) => !places.has(slug));

    // ASSERT
    assert.deepEqual(unknown, []);
  });

  it("should list the phases in order, each ending on or after it starts", () => {
    // ARRANGE
    const phases = PHASES;

    // ACT
    const outOfOrder = phases.filter((phase, index) => phase.ends < phase.starts || (index > 0 && phase.starts <= phases[index - 1].ends));

    // ASSERT
    assert.deepEqual(outOfOrder, []);
  });

  it("should open the rulebook by saying the contest is fictional", () => {
    // ARRANGE
    const first = RULES[0];

    // ACT
    const answer = first.answer.toLowerCase();

    // ASSERT
    assert.ok(answer.startsWith("não"));
    assert.ok(answer.includes("nenhum prêmio é entregue"));
  });

  it("should hold enough ideas for the deck to show three at once", () => {
    // ARRANGE
    const minimum = 3;

    // ACT
    const count = IDEAS.length;

    // ASSERT
    assert.ok(count >= minimum);
  });

  it("should expect every contest photograph under the contest folder", () => {
    // ARRANGE
    const photos = Object.values(CONTEST_PHOTOS);

    // ACT
    const misplaced = photos.filter((photo) => !photo.path.startsWith("/images/contest/") || !photo.path.endsWith(".webp"));

    // ASSERT
    assert.deepEqual(misplaced, []);
  });
});
