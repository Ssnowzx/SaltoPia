# web

The Next.js application. Everything about running it, and the architecture behind it, is
in the repository root:

- [`../README.md`](../README.md) — install, commands, layout of the repository
- [`../docs/architecture.md`](../docs/architecture.md) — how the world is built and the
  rules it depends on
- [`../CLAUDE.md`](../CLAUDE.md) — the project's own rules, and the traps specific to this
  development machine

Quick reference:

```bash
npm run dev             # development server on 3001
npm run check           # layout, assets, types and lint
npm run db:seed         # rewrite the content from prisma/seed.ts
npm run images:sharpen  # after adding or replacing any photograph
```
