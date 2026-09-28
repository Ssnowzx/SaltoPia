# ADR-0005: Keep MariaDB behind a single data layer

- **Status:** Accepted
- **Date:** 2026-09-14

## Context

The founding design treated content as typed modules and listed a CMS as a non-goal, while
noting that changing the data source must not change any spec. The project will become a
product, where content is edited by partners.

## Decision

Content is stored in MariaDB 11, accessed through Prisma 7 with the MariaDB driver
adapter. `web/src/lib/places.ts` is the only module that queries it, and everything else
works with the domain types in `web/src/types/`. Schema changes go through versioned
migrations only. Development runs the database in Docker on host port 3307, because a
native server already holds 3306 on the development machine.

## Consequences

- Replacing the database with a CMS or an API means rewriting one module (NFR-13).
- Every product step in `data-model.md` is a change to the data layer, not to the pages.
- A new query needs a function in the data layer, never a direct client call.
