import request from "supertest";
import { crearApp } from "../src/app.js";
import { conectarDb } from "../src/db/client.js";
import { fundaciones, oficios, usuarios } from "../src/db/schema.js";
import { sembrar } from "../src/db/semilla.js";
import type { Rol } from "../src/lib/catalogo.js";
import { firmarToken } from "../src/middleware/auth.js";

/** Plaza de Armas de La Serena: punto de referencia para las búsquedas por cercanía. */
export const CENTRO_LA_SERENA = { lat: -29.9027, lng: -71.252 };

/** Levanta la API sobre una base PGlite en memoria, migrada y con los datos demo. */
export async function crearEntorno({ conSemilla = true } = {}) {
  const conexion = await conectarDb();
  await conexion.migrar();
  if (conSemilla) await sembrar(conexion.db);
  const app = crearApp(conexion.db);

  let contador = 0;
  async function crearUsuario(rol: Rol) {
    contador += 1;
    const [usuario] = await conexion.db
      .insert(usuarios)
      .values({ email: `${rol}${contador}@test.cl`, passwordHash: "x", nombre: `${rol} ${contador}`, rol })
      .returning();
    const token = await firmarToken({ id: usuario.id, rol });
    return { usuario, token, auth: { Authorization: `Bearer ${token}` } };
  }

  return {
    db: conexion.db,
    api: () => request(app),
    crearUsuario,
    cerrar: conexion.cerrar,
    tablas: { oficios, fundaciones },
  };
}

export type Entorno = Awaited<ReturnType<typeof crearEntorno>>;
