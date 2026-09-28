import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { shouldInvite, type InvitationState } from "@/lib/contest/invitation";

const FIRST_VISIT: InvitationState = { seen: false, forced: false, isContestPage: false, blocked: false };

describe("shouldInvite", () => {
  it("should invite on the first page of a session", () => {
    // ARRANGE
    const state = FIRST_VISIT;

    // ACT
    const invite = shouldInvite(state);

    // ASSERT
    assert.equal(invite, true);
  });

  it("should not invite twice in a session", () => {
    // ARRANGE
    const state = { ...FIRST_VISIT, seen: true };

    // ACT
    const invite = shouldInvite(state);

    // ASSERT
    assert.equal(invite, false);
  });

  it("should invite again when the address asks for it", () => {
    // ARRANGE
    const state = { ...FIRST_VISIT, seen: true, forced: true };

    // ACT
    const invite = shouldInvite(state);

    // ASSERT
    assert.equal(invite, true);
  });

  it("should never invite on the contest page, even when asked", () => {
    // ARRANGE
    const state = { ...FIRST_VISIT, isContestPage: true, forced: true };

    // ACT
    const invite = shouldInvite(state);

    // ASSERT
    assert.equal(invite, false);
  });

  it("should wait while the visitor is using something, even when asked", () => {
    // ARRANGE
    const state = { ...FIRST_VISIT, blocked: true, forced: true };

    // ACT
    const invite = shouldInvite(state);

    // ASSERT
    assert.equal(invite, false);
  });
});
