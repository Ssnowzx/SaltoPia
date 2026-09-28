# ADR-0009: Develop spec first, with OpenSpec

- **Status:** Accepted
- **Date:** 2026-09-14

## Context

The work is assessed on process as well as result. A commit with no specification behind
it cannot be defended, and without written behaviour the code and its intent drift apart.

## Decision

No behaviour is changed without an OpenSpec change:
1. proposal;
2. specs (SHALL/MUST requirements with WHEN/THEN scenarios);
3. design;
4. tasks;
5. `openspec validate`, which must pass before implementation.

Changes that are only documentation, tooling or refactoring set `skip_specs: true`. Specs
describe behaviour, never implementation: a library or a class name belongs in the
design. Commits reference their change: `feat: … (change-name)`.

## Consequences

- Every functional requirement in the SRS traces to a spec requirement.
- It adds overhead to small changes, which is accepted.
- When a spec and the code disagree, the spec is the truth: the code is fixed, or a change
  corrects the spec.
