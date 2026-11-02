import { crearApp } from "./app.js";
import { config } from "./config.js";
import { conectarDb } from "./db/client.js";

const conexion = await conectarDb({ databaseUrl: config.databaseUrl, pgliteDir: config.pgliteDir });
await conexion.migrar();

const servidor = crearApp(conexion.db).listen(config.puerto, () => {
  const motor = config.databaseUrl ? "PostgreSQL" : `PGlite (${config.pgliteDir})`;
  console.log(`API de Hilo Circular en http://localhost:${config.puerto}/api · base de datos: ${motor}`);
});

const apagar = () => {
  servidor.close(() => conexion.cerrar().then(() => process.exit(0)));
};
process.on("SIGINT", apagar);
process.on("SIGTERM", apagar);
