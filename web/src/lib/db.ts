import { PrismaMariaDb } from "@prisma/adapter-mariadb";

import { PrismaClient } from "@/generated/prisma/client";

/**
 * The single Prisma client for the application.
 *
 * Prisma 7 requires an explicit driver adapter - there is no built-in engine that
 * reads the datasource URL on its own.
 *
 * Next.js hot-reloads modules in development, and a fresh client per reload exhausts
 * the connection pool within a few saves. Caching it on globalThis survives the
 * reload; production gets a plain instance.
 *
 * Nothing outside `src/lib` imports this directly - components go through the query
 * functions in the data layer.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy web/.env.example to web/.env and start the database with `npm run db:up`.",
    );
  }

  return new PrismaClient({
    adapter: new PrismaMariaDb(connectionString),
  });
}

export const prisma: PrismaClient = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
