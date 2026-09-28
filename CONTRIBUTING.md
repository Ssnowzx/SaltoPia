# Contributing to Saltopia

How work gets from an idea into `main`. The project's detailed rules are in
[`CLAUDE.md`](CLAUDE.md) (Portuguese). This page is the process.

## 1. Set up

Follow "Getting started" in [`README.md`](README.md): Docker for MariaDB on port 3307,
`npm install`, `.env` from `.env.example`, migrate, seed, `npm run dev`.

## 2. Specify before you build

Every change in behaviour starts as an OpenSpec change (ADR-0009):

```bash
openspec new change "<kebab-case-name>"
# write proposal.md → specs/<capability>/spec.md → design.md → tasks.md
openspec validate <kebab-case-name> --strict   # must pass before any code
```

- **Specs** describe behaviour: `SHALL`/`MUST`, with `WHEN/THEN` scenarios. A library or
  class name belongs in the design, never in a spec.
- **Every task** states how it will be verified.
- **Documentation, tooling or refactoring only?** Set `skip_specs: true` in the change's
  `.openspec.yaml` instead of inventing a requirement.
- **Spec and code disagree?** The spec is the truth. Fix the code, or open a change that
  corrects the spec.
- **When the change ships:** `openspec archive <name>`.

Then add the requirement to [`docs/requirements/srs.md`](docs/requirements/srs.md) and
[`docs/requirements/traceability.md`](docs/requirements/traceability.md). A decision that
constrains later work also gets an ADR in `docs/architecture/decisions/`.

## 3. Write the code

- **TypeScript:** `strict`, no `any`, no class inheritance, and functions no longer than
  50 lines.
- **No magic numbers:** durations, colours and positions are tokens or named constants.
- **Language:** identifiers, comments, commits and specs are in English. Everything a
  visitor reads is in Brazilian Portuguese.
- **Content is data:** words, colours and menus go in `web/prisma/content/`, never in a
  component.
- **Database access:** only `web/src/lib/places.ts` talks to the database.
- **Motion:** every animation respects `prefers-reduced-motion`, and reducing motion never
  makes a destination unreachable.
- **Colour:** no colour from the reference site. The tests will fail if one comes back.

## 4. Test it

Unit tests follow arrange–act–assert, cover one behaviour each, have names that start with
"should", and are independent of each other. Mock only external services: the database
in tests is a real one. See [`docs/testing/test-plan.md`](docs/testing/test-plan.md).

```bash
cd web
npm test               # unit and content tests
npm run test:coverage  # with coverage; lines must stay at or above 80%
npm run check          # layout, assets, types, lint
npm run build          # also generates the route types tsc needs
```

## 5. Document it

The documentation moves with the code, in the same commit:

| You changed | Update |
| --- | --- |
| The data model | `docs/architecture/data-model.md` |
| Something a visitor sees | `docs/manual/manual-do-visitante.md` |
| Something a partner supplies or gets | `docs/manual/manual-do-parceiro.md` |
| Installation, commands or operation | `docs/manual/manual-de-instalacao.md` |
| A requirement | `docs/requirements/srs.md` and `traceability.md` |
| A significant decision | a new ADR |
| Anything user-visible | `CHANGELOG.md` under *Unreleased* |

## 6. Commit

[Conventional Commits](https://www.conventionalcommits.org/), in English and in the
imperative mood, with one logical reason per commit and the OpenSpec change in brackets:

```
feat: add the menu to each place page (elevate-place-pages)
fix: rename the wordmark so no cached copy survives (add-contest-invitation)
docs: document the data model (document-the-product)
```

The types are `feat`, `fix`, `refactor`, `test`, `docs`, `style` and `perf`.

**Before a commit:**
- `npm test`, `npm run lint` and `npx tsc --noEmit` are clean;
- there is no `console.log`.

**Before a push:**
- `git pull origin main`;
- the same checks, plus `npm run check` and `npm run build`.

## 7. Branches

Branches are kebab-case and start from `main`: `feature/partner-panel`, `fix/pin-occlusion`.
Delete them after merging. The repository is `github.com/Ssnowzx/SaltoPia` (private).
