import { crearApp } from "./app.js";
import { config } from "./config.js";
import { conectarDb } from "./db/client.js";
import { sembrar } from "./db/semilla.js";

const conexion = await conectarDb({ databaseUrl: config.databaseUrl, pgliteDir: config.pgliteDir });
await conexion.migrar();
// En desarrollo se completan los datos demo que falten (por ejemplo, al sumar un módulo nuevo).
// En producción solo con CARGAR_DEMO=true: son datos ficticios con una clave publicada en el README.
const conDemo = config.entorno !== "production" || config.cargarDemo;
if (conDemo && (await sembrar(conexion.db))) console.log("Datos demo agregados");

const servidor = crearApp(conexion.db).listen(config.puerto, () => {
  const motor = config.databaseUrl ? "PostgreSQL" : `PGlite (${config.pgliteDir})`;
  console.log(`API de Hilo Circular en http://localhost:${config.puerto}/api · base de datos: ${motor}`);
});

const apagar = () => {
  servidor.close(() => conexion.cerrar().then(() => process.exit(0)));
};
process.on("SIGINT", apagar);
process.on("SIGTERM", apagar);
