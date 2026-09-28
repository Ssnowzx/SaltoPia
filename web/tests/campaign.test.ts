import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { calendarDate, campaignStatus, nextIdea, type CampaignPhase } from "@/lib/contest/campaign";

const PHASES: readonly CampaignPhase[] = [
  { starts: "2026-09-01", ends: "2026-10-31" },
  { starts: "2026-11-10", ends: "2026-11-24" },
  { starts: "2026-12-05", ends: "2026-12-05" },
];

describe("campaign status", () => {
  it("should mark the first phase as coming up before the campaign opens", () => {
    // ARRANGE
    const today = "2026-08-20";

    // ACT
    const status = campaignStatus(today, PHASES);

    // ASSERT
    assert.deepEqual(status, { kind: "upcoming", index: 0 });
  });

  it("should mark the first phase as running on 2026-09-28", () => {
    // ARRANGE
    const today = "2026-09-28";

    // ACT
    const status = campaignStatus(today, PHASES);

    // ASSERT
    assert.deepEqual(status, { kind: "running", index: 0 });
  });

  it("should count both ends of a phase as inside it", () => {
    // ARRANGE
    const lastDay = "2026-10-31";
    const oneDayPhase = "2026-12-05";

    // ACT
    const first = campaignStatus(lastDay, PHASES);
    const last = campaignStatus(oneDayPhase, PHASES);

    // ASSERT
    assert.deepEqual(first, { kind: "running", index: 0 });
    assert.deepEqual(last, { kind: "running", index: 2 });
  });

  it("should mark the next phase as coming up between two phases", () => {
    // ARRANGE
    const today = "2026-11-03";

    // ACT
    const status = campaignStatus(today, PHASES);

    // ASSERT
    assert.deepEqual(status, { kind: "upcoming", index: 1 });
  });

  it("should report the campaign finished after the last phase", () => {
    // ARRANGE
    const today = "2027-01-10";

    // ACT
    const status = campaignStatus(today, PHASES);

    // ASSERT
    assert.deepEqual(status, { kind: "finished" });
  });

  it("should turn the calendar at midnight in Lages, not in UTC", () => {
    // ARRANGE - 01:30 UTC on 1 September is still 31 August, 22:30, in Lages.
    const now = new Date("2026-09-01T01:30:00Z");

    // ACT
    const date = calendarDate(now);

    // ASSERT
    assert.equal(date, "2026-08-31");
  });
});

describe("idea deck", () => {
  it("should deal every idea once before the first comes back", () => {
    // ARRANGE
    const count = 8;
    const dealt: number[] = [0];

    // ACT
    for (let deal = 1; deal < count; deal += 1) dealt.push(nextIdea(dealt[dealt.length - 1], count));
    const afterAll = nextIdea(dealt[dealt.length - 1], count);

    // ASSERT
    assert.equal(new Set(dealt).size, count);
    assert.equal(afterAll, 0);
  });

  it("should stay on the only idea when the deck has one", () => {
    // ARRANGE
    const count = 1;

    // ACT
    const next = nextIdea(0, count);

    // ASSERT
    assert.equal(next, 0);
  });
});
