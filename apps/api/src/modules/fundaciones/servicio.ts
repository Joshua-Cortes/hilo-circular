import { and, arrayContains, asc, eq, lte, or, type SQL, sql } from "drizzle-orm";
import type { z } from "zod";
import type { Db } from "../../db/client.js";
import { fundaciones } from "../../db/schema.js";
import { conflicto, noEncontrado } from "../../lib/errores.js";
import { distanciaKm } from "../../lib/geo.js";
import { estaAbierto } from "../../lib/horarios.js";
import type { actualizarFundacion, busquedaFundaciones, crearFundacion } from "./esquemas.js";

type Fundacion = typeof fundaciones.$inferSelect;

export function fundacionPublica(fundacion: Fundacion, distancia?: number | null, ahora = new Date()) {
  return {
    id: fundacion.id,
    nombre: fundacion.nombre,
    descripcion: fundacion.descripcion,
    comuna: fundacion.comuna,
    direccion: fundacion.direccion,
    ubicacion: { lat: fundacion.lat, lng: fundacion.lng },
    distanciaKm: distancia == null ? null : Math.round(distancia * 10) / 10,
    horarios: fundacion.horarios,
    abiertoAhora: estaAbierto(fundacion.horarios, ahora),
    prendasAceptadas: fundacion.prendasAceptadas,
    necesidadesActuales: fundacion.necesidadesActuales,
    aceptaDanada: fundacion.aceptaDanada,
    telefono: fundacion.telefono,
    email: fundacion.email,
    verificado: fundacion.verificado,
  };
}

export async function buscarFundaciones(db: Db, filtros: z.infer<typeof busquedaFundaciones>, ahora = new Date()) {
  const { lat, lng, radioKm, prenda, aceptaDanada, abiertoAhora, limite } = filtros;
  const conCoordenadas = lat !== undefined && lng !== undefined;
  const distancia = conCoordenadas ? distanciaKm(lat, lng, fundaciones.lat, fundaciones.lng) : sql<null>`null`;

  const condiciones: SQL[] = [eq(fundaciones.activo, true)];
  if (prenda) {
    // Un arreglo vacío significa "acepta cualquier prenda".
    const aceptaPrenda = or(
      sql`cardinality(${fundaciones.prendasAceptadas}) = 0`,
      arrayContains(fundaciones.prendasAceptadas, [prenda]),
    );
    if (aceptaPrenda) condiciones.push(aceptaPrenda);
  }
  if (aceptaDanada !== undefined) condiciones.push(eq(fundaciones.aceptaDanada, aceptaDanada));
  if (conCoordenadas) condiciones.push(lte(distancia, radioKm));

  const filas = await db
    .select({ fundacion: fundaciones, distancia })
    .from(fundaciones)
    .where(and(...condiciones))
    .orderBy(conCoordenadas ? asc(distancia) : asc(fundaciones.nombre));

  // "Abierto ahora" depende de la hora de Chile, así que se filtra después de consultar.
  return filas
    .map((f) => fundacionPublica(f.fundacion, f.distancia, ahora))
    .filter((f) => abiertoAhora === undefined || f.abiertoAhora === abiertoAhora)
    .slice(0, limite);
}

export async function obtenerFundacion(db: Db, id: string) {
  const [fundacion] = await db
    .select()
    .from(fundaciones)
    .where(and(eq(fundaciones.id, id), eq(fundaciones.activo, true)));
  if (!fundacion) throw noEncontrado("La fundación");
  return fundacionPublica(fundacion);
}

export async function fundacionDelUsuario(db: Db, usuarioId: string) {
  const [fundacion] = await db.select().from(fundaciones).where(eq(fundaciones.usuarioId, usuarioId));
  if (!fundacion) throw noEncontrado("Tu fundación");
  return fundacion;
}

export async function crearMiFundacion(db: Db, usuarioId: string, datos: z.infer<typeof crearFundacion>) {
  const [existente] = await db
    .select({ id: fundaciones.id })
    .from(fundaciones)
    .where(eq(fundaciones.usuarioId, usuarioId));
  if (existente) throw conflicto("Ya tienes una fundación registrada; edítala en lugar de crear otra");
  // Queda sin verificar hasta que el equipo confirme que la organización existe.
  const [creada] = await db
    .insert(fundaciones)
    .values({ ...datos, usuarioId, verificado: false })
    .returning();
  return creada;
}

export async function actualizarMiFundacion(db: Db, usuarioId: string, datos: z.infer<typeof actualizarFundacion>) {
  const fundacion = await fundacionDelUsuario(db, usuarioId);
  const [actualizada] = await db.update(fundaciones).set(datos).where(eq(fundaciones.id, fundacion.id)).returning();
  return actualizada;
}
