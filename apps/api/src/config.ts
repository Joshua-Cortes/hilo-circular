import { existsSync } from "node:fs";

if (existsSync(".env")) process.loadEnvFile(".env");

const entorno = process.env.NODE_ENV ?? "development";
const SECRETO_DESARROLLO = "solo-para-desarrollo-cambiar-en-produccion";

if (entorno === "production" && !process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET es obligatorio en producción");
}

export const config = {
  entorno,
  puerto: Number(process.env.PORT ?? 3000),
  /** Si no se define, la API usa PGlite (PostgreSQL embebido) guardado en PGLITE_DIR. */
  databaseUrl: process.env.DATABASE_URL,
  pgliteDir: process.env.PGLITE_DIR ?? ".data/pglite",
  jwtSecret: process.env.JWT_SECRET ?? SECRETO_DESARROLLO,
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
};
