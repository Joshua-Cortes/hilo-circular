import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzleNodePg } from "drizzle-orm/node-postgres";
import { migrate as migrateNodePg } from "drizzle-orm/node-postgres/migrator";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import pg from "pg";
import * as schema from "./schema.js";

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

export type ConexionDb = {
  db: Db;
  migrar: () => Promise<void>;
  cerrar: () => Promise<void>;
};

const carpetaMigraciones = fileURLToPath(new URL("../../drizzle", import.meta.url));

/**
 * Con `databaseUrl` se conecta a PostgreSQL. Sin ella usa PGlite: en disco si se entrega
 * `pgliteDir`, o en memoria (tests). Así nadie del equipo necesita instalar PostgreSQL para empezar.
 */
export async function conectarDb(opciones: { databaseUrl?: string; pgliteDir?: string } = {}): Promise<ConexionDb> {
  if (opciones.databaseUrl) {
    const pool = new pg.Pool({ connectionString: opciones.databaseUrl });
    const db = drizzleNodePg(pool, { schema });
    return {
      db: db as unknown as Db,
      migrar: () => migrateNodePg(db, { migrationsFolder: carpetaMigraciones }),
      cerrar: () => pool.end(),
    };
  }

  // PGlite no crea las carpetas padre por su cuenta.
  if (opciones.pgliteDir) mkdirSync(opciones.pgliteDir, { recursive: true });
  const cliente = new PGlite(opciones.pgliteDir);
  const db = drizzlePglite(cliente, { schema });
  return {
    db: db as unknown as Db,
    migrar: () => migratePglite(db, { migrationsFolder: carpetaMigraciones }),
    cerrar: () => cliente.close(),
  };
}
