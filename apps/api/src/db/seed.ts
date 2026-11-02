import { config } from "../config.js";
import { conectarDb } from "./client.js";
import { sembrar } from "./semilla.js";

const conexion = await conectarDb({ databaseUrl: config.databaseUrl, pgliteDir: config.pgliteDir });
await conexion.migrar();
const sembro = await sembrar(conexion.db);
await conexion.cerrar();
console.log(sembro ? "Datos demo cargados" : "La base ya tenía datos; no se cargó nada");
