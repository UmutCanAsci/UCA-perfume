/**
 * src/lib/prisma.ts
 * ─────────────────
 * Singleton Prisma 7 client for use in Next.js Route Handlers and Server
 * Components.  A single pool is shared across all requests (and preserved
 * across hot-reloads in development via globalThis).
 *
 * Usage:
 *   import { prisma } from "@/lib/prisma";
 *   const perfume = await prisma.perfume.findUnique({ where: { id } });
 */

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

// ─── Connection URL helpers ───────────────────────────────────────────────────

function getConnectionUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "[prisma.ts] DATABASE_URL environment variable is not set.\n" +
        "Add it to .env: DATABASE_URL=mysql://user:pass@localhost:3306/uca"
    );
  }
  return url;
}

/**
 * Parse a `mysql://` URL into a structured PoolConfig object.
 * The `mariadb` driver requires either a `mariadb://` scheme or a PoolConfig;
 * our DATABASE_URL uses the Prisma-standard `mysql://` scheme, so we parse
 * components manually and pass a typed config to avoid a scheme mismatch error.
 */
function buildPoolConfig(rawUrl: string) {
  const url = new URL(rawUrl.replace(/^mysql:\/\//, "mariadb://"));
  const decode = (s: string) => {
    try { return decodeURIComponent(s); } catch { return s; }
  };
  return {
    host:           url.hostname,
    port:           Number(url.port) || 3306,
    user:           url.username,
    password:       decode(url.password),
    database:       url.pathname.replace(/^\//, ""),
    bigIntAsNumber: true,        // return BIGINT columns as JS numbers
    connectionLimit: 5,          // conservative pool size for Next.js
  };
}

// ─── Singleton factory ────────────────────────────────────────────────────────

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaMariaDb(buildPoolConfig(getConnectionUrl()));
  return new PrismaClient({ adapter });
}

// Extend globalThis type so TypeScript is happy with the dev-mode cache.
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

/**
 * Exported singleton.  In development, Next.js hot-reloads modules on every
 * file save, which would leak a new connection pool each time.  We cache the
 * client on `globalThis` so only one pool ever exists per Node.js process.
 */
export const prisma: PrismaClient =
  globalThis.__prisma ?? (globalThis.__prisma = createPrismaClient());

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}
