# Saltopia

An immersive 3D web experience for **Saltopia**, an imagined community at the Salto do
Rio Caveiras reservoir outside Lages, in the Serra Catarinense. The home page is not a
page that scrolls: it is a navigable 3D map. Every place on it has a pin, every pin flies
the camera and opens a card, and every card leads to a page about that place.

Fifth-semester academic project, presented as a live demo. The interaction model follows
`visitmeatopia.com`; the architecture and timing are reproduced, and no asset, string or
name is copied.

![The hub](docs/screenshots/hub.jpg)

---

## Getting started

Requirements: Node 20+, Docker, and Python 3 with Pillow (only to rebuild the wordmark).

```bash
docker compose up -d          # MariaDB on 3307 and Adminer on 8080
cd web
npm install
cp .env.example .env          # DATABASE_URL points at 127.0.0.1:3307
npx prisma migrate dev        # create the schema
npm run db:seed               # 15 places, 25 experiences
npm run dev                   # http://localhost:3001
```

The port is **3307**, not 3306: a native `mysqld` already owns 3306 on the development
machine, and pointing Prisma at it fails with an authentication error that never mentions
the port. See `CLAUDE.md` for that and two other traps.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server on 3001 |
| `npm run build` / `npm start` | Production build and server |
| `npm run db:seed` | Rewrite every place and experience from `prisma/seed.ts` |
| `npm run check` | Layout, assets, types and lint in one go |
| `npm run check:layout` | Fails on overlapping buildings, buildings on roads, boats that collide |
| `npm run check:assets` | Fails when a place or experience points at an image that is not on disk |
| `npm run build:logo` | Rebuild both wordmark files from `logo.png` |
| `npm run build:crests` | Rebuild the place crests from the pin glyphs |

`npx tsc --noEmit` only passes **after** `npm run build`: Next generates its route types
into `.next/types` during the build.

## Where things are

```
.
├── CLAUDE.md                  project rules: spec-first, clean code, the local traps
├── docs/
│   ├── architecture.md        how the world is built and why - start here
│   └── image-prompts.md       the photographic briefs behind every page image
├── openspec/                  the specs and the change that built this
├── logo.png                   the wordmark's source artwork
└── web/
    ├── prisma/                schema, migrations, seed
    ├── scripts/               the checks and the asset builders
    └── src/
        ├── app/               routes
        ├── components/        world-map/ (the hub) and content/ (the pages)
        ├── lib/world/         the world itself: terrain, roads, buildings, materials
        └── lib/places.ts      the only module that talks to the database about places
```

## How it fits together

The **hub** (`/`) is a `@react-three/fiber` canvas. Nothing in the world is downloaded:
the terrain, the roads, every building, tree and boat are generated at runtime from the
numbers in `src/lib/world/`. The 3D payload is therefore zero bytes, which is the whole
reason the world can be inspected, changed and reviewed like any other code.

The **pins** are HTML above the canvas, not objects inside it. A projector writes each
pin's screen position straight to its DOM node every frame, outside React's render cycle.

The **pages** (`/[place]`, `/[place]/experiencias/[experience]`) scroll normally and
create no WebGL context. Navigation between them is a full document load, which is what
lets the browser play the iris transition as a cross-document view transition.

`docs/architecture.md` explains the parts that are not obvious from the file names — why
roads are graded into the terrain, why hills that carry buildings are terrain, and the
traps that took the longest to find.

## Data

MariaDB through Prisma 7 with an explicit driver adapter. `src/lib/places.ts` is the only
module that imports the client; everything else works with the `Place` and `Experience`
types, so the database stays a replaceable detail.

To change the content — copy, promotional offers, which places exist — edit
`prisma/seed.ts` and run `npm run db:seed`. The seed is authoritative: it rewrites every
field on every run and deletes places it no longer carries.

## Images

Place heroes and experience photographs are generated from the briefs in
`docs/image-prompts.md` and dropped into `web/public/images/`. The crests are SVGs drawn
from the pin glyphs, built by `npm run build:crests`. Nothing is fetched at runtime.

The optimiser caches by URL, so after replacing an image in `public/` remove
`web/.next/dev/cache/images` and hard-refresh, or the old one keeps being served.

## What is not built yet

- **The static fallback for devices without WebGL2.** It is a spec requirement and the
  largest open item; the hub currently assumes a working WebGL2 context.
- **Pin occlusion.** A pin whose place is behind a hill still draws.
- **A contrast test** over the colour tokens.

## Licence and provenance

Academic work. The wordmark and the page photographs were generated for this project. The
world's geometry is generated by the code in this repository — there are no third-party
models, so there is nothing to attribute.
