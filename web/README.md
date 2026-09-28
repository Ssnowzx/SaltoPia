# web

The Next.js application. Everything about running it, and the architecture behind it, is
in the repository root:

- [`../README.md`](../README.md) — install, commands, layout of the repository
- [`../docs/architecture/README.md`](../docs/architecture/README.md) — the architecture
  (arc42, C4, ADRs) and the rules it depends on
- [`../docs/README.md`](../docs/README.md) — all the documentation, by discipline:
  requirements, architecture, data model, testing, and the manuals
- [`../CONTRIBUTING.md`](../CONTRIBUTING.md) — how to make a change
- [`../CLAUDE.md`](../CLAUDE.md) — the project's own rules, and the traps specific to this
  development machine

Quick reference:

```bash
npm run dev             # development server on 3001
npm run check           # layout, assets, types and lint
npm test                # unit tests of the pure logic
npm run db:seed         # rewrite the content from prisma/content/
npm run images:prompts  # list the photographs still missing, for Grok
npm run images:sharpen  # after adding or replacing any photograph
```
