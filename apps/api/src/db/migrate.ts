import { config } from "../config.js";
import { conectarDb } from "./client.js";

const conexion = await conectarDb({ databaseUrl: config.databaseUrl, pgliteDir: config.pgliteDir });
await conexion.migrar();
await conexion.cerrar();
console.log("Migraciones aplicadas");
