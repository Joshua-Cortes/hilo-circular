import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

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
  /**
   * Carpeta con la web ya compilada (`npm run build`). Si existe, la API también sirve la web y
   * todo queda en una sola dirección: así `/api` funciona sin configurar CORS ni otra URL.
   */
  webDist: process.env.WEB_DIST ?? fileURLToPath(new URL("../../web/dist", import.meta.url)),
  /** En producción los datos demo solo se cargan si se pide explícitamente (para la presentación). */
  cargarDemo: process.env.CARGAR_DEMO === "true",
  appUrl: process.env.APP_URL ?? "http://localhost:5173",
  resendApiKey: process.env.RESEND_API_KEY,
  emailFrom: process.env.EMAIL_FROM,
};
