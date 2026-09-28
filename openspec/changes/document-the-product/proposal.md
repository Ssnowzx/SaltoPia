## Why

On 2026-09-28 the owner set the direction for everything that follows:
- Saltopia is the final project of the *Engenharia de Sistemas* course and will become a
  product afterwards.
- The focus is the data structure, well-written documentation (the app's intent, its
  architecture, clean code) and documentation for users and partners.
- The documents and the structure must follow the discipline's standards.

The professor's brief makes documentation, a manual and an individual presentation
mandatory, and grades documentation writing, idea validation, creativity and resolution.

Before this change the repository explained how it is built (`README.md`,
`docs/architecture.md`) and how its pictures are made. It did not say:
- why it exists;
- what exactly it must do;
- how each requirement is verified;
- anything for someone who is not a developer.

## What Changes

- **Requirements** (`docs/requirements/`):
  - Vision and Scope in Wiegers' template, including a section on idea validation with
    hypotheses, experiments and criteria, which separates what is validated from what is
    not;
  - an SRS structured after ISO/IEC/IEEE 29148, with 64 functional requirements traced to
    the OpenSpec specs and 15 non-functional requirements in ISO/IEC 25010 categories;
  - a bidirectional traceability matrix.
- **Architecture** (`docs/architecture/`):
  - an arc42 description with C4 context and container diagrams, runtime sequences and a
    deployment view, in Mermaid;
  - 14 ADRs in Nygard's format;
  - the data model with an ER diagram and data dictionary;
  - the former `docs/architecture.md`, now `building-blocks.md`.
- **Testing** (`docs/testing/`): a test plan and completion report after ISO/IEC/IEEE
  29119-3, with the measured coverage. It adds `npm run test:coverage`.
- **Manuals** (`docs/manual/`, pt-BR): for the visitor, for the partner establishment,
  and for installation and operation.
- **Process:** `CONTRIBUTING.md`, and `CHANGELOG.md` in Keep a Changelog format.
- `README.md`, `web/README.md`, `CLAUDE.md` and `openspec/config.yaml` point at the new
  structure. The README screenshot is retaken in the new palette, and one of a place's
  menu is added.
- The Grok manifest stops being tracked. It lists only what is missing, so it is
  generated, not committed.

*Mirrors:* nothing in the reference. It publishes no documentation.

## Non-goals

- Changing the data model. The product path in the data model document is a proposal, and
  each step needs its own change with specs.
- The presentation and the marketing material. The presentation is mandatory, but it is
  its own deliverable.
- Translating the engineering documents. They stay in English, like the code and the
  specs (`CLAUDE.md` §4). The manuals are in Portuguese because their readers are
  visitors, partners and operators.
- An end-to-end test suite. The test plan records it as the main gap.

## Capabilities

### New Capabilities

None. Documentation and tooling only (`skip_specs: true`).

### Modified Capabilities

None.

## Impact

- `docs/`, `README.md`, `web/README.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `CHANGELOG.md`,
  `openspec/config.yaml` and `.gitignore`.
- `web/package.json` gains the `test:coverage` script.
- No application code changes.
