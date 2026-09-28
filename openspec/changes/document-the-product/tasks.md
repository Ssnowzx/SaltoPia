## 1. Requirements

- [x] 1.1 Write `docs/requirements/vision.md` (Vision and Scope, including idea validation). Verify that every claim of what exists points at a file, a spec or a result, and that no hypothesis is marked validated without evidence.
- [x] 1.2 Write `docs/requirements/srs.md` (ISO/IEC/IEEE 29148). Verify it has one FR per spec requirement: 64, checked against the `### Requirement:` headings under `openspec/changes/*/specs`.
- [x] 1.3 Write `docs/requirements/traceability.md`. Verify that every FR and NFR has a verification, and that each unit test named exists in `web/tests/`.

## 2. Architecture

- [x] 2.1 Write `docs/architecture/README.md` (arc42 + C4 in Mermaid). Verify that every diagram parses.
- [x] 2.2 Write the ADRs in `docs/architecture/decisions/`. Verify each names the design section it came from.
- [x] 2.3 Move the data model into `docs/architecture/` with an ER diagram, and verify its columns against `web/prisma/schema.prisma`. Move `docs/architecture.md` to `building-blocks.md`.

## 3. Testing

- [x] 3.1 Write `docs/testing/test-plan.md` with the completion report, and add `npm run test:coverage`. Verify the figures by running it: 83 tests; 96.8% lines, 92.2% branches, 66.6% functions.

## 4. Manuals

- [x] 4.1 Write the visitor, partner, and installation and operation manuals in pt-BR. Verify every on-screen label and every limit they quote against the code, and every command against `package.json`.

## 5. Process and entry points

- [x] 5.1 Write `CONTRIBUTING.md` and `CHANGELOG.md`, and update `README.md`, `web/README.md`, `CLAUDE.md`, `openspec/config.yaml` and `docs/README.md`. Verify every relative link resolves.
- [x] 5.2 Stop tracking `docs/grok/manifest.jsonl` and retake the README screenshots. Verify with `git check-ignore`.
