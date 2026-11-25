import { and, arrayContains, asc, desc, eq, exists, ilike, inArray, lte, or, type SQL, sql } from "drizzle-orm";
import type { z } from "zod";
import type { Db } from "../../db/client.js";
import { contactos, oficios, servicios } from "../../db/schema.js";
import { conflicto, HttpError, noEncontrado } from "../../lib/errores.js";
import { difuminar, distanciaKm } from "../../lib/geo.js";
import type { actualizarOficio, busquedaOficios, crearOficio, crearServicio } from "./esquemas.js";

type Oficio = typeof oficios.$inferSelect;
type Servicio = typeof servicios.$inferSelect;

const MENSAJE_WHATSAPP = "Hola, te encontré en Hilo Circular y quisiera consultar por un arreglo.";

/** Lo que ve cualquier visitante. Con precisión "aproximada" se ocultan dirección y coordenadas exactas. */
export function perfilPublico(oficio: Oficio, serviciosDelOficio: Servicio[], distancia?: number | null) {
  const exacta = oficio.precisionUbicacion === "exacta";
  return {
    id: oficio.id,
    nombrePublico: oficio.nombrePublico,
    descripcion: oficio.descripcion,
    comuna: oficio.comuna,
    direccion: exacta ? oficio.direccion : null,
    ubicacion: {
      lat: exacta ? oficio.lat : difuminar(oficio.lat),
      lng: exacta ? oficio.lng : difuminar(oficio.lng),
      precision: oficio.precisionUbicacion,
    },
    distanciaKm: distancia == null ? null : Math.round(distancia * 10) / 10,
    canales: { whatsapp: Boolean(oficio.whatsapp), telefono: Boolean(oficio.telefono) },
    verificado: oficio.verificado,
    servicios: serviciosDelOficio.map(servicioPublico),
  };
}

function servicioPublico(servicio: Servicio) {
  return {
    id: servicio.id,
    categoria: servicio.categoria,
    titulo: servicio.titulo,
    descripcion: servicio.descripcion,
    prendas: servicio.prendas,
    precioDesde: servicio.precioDesde,
  };
}

async function serviciosPorOficio(db: Db, ids: string[]) {
  const porOficio = new Map<string, Servicio[]>();
  if (ids.length === 0) return porOficio;
  const filas = await db
    .select()
    .from(servicios)
    .where(inArray(servicios.oficioId, ids))
    .orderBy(asc(servicios.creadoEn));
  for (const fila of filas) {
    porOficio.set(fila.oficioId, [...(porOficio.get(fila.oficioId) ?? []), fila]);
  }
  return porOficio;
}

const escaparLike = (texto: string) => texto.replace(/[\\%_]/g, "\\$&");

export async function buscarOficios(db: Db, filtros: z.infer<typeof busquedaOficios>) {
  const { lat, lng, radioKm, categoria, prenda, q, limite } = filtros;
  const conCoordenadas = lat !== undefined && lng !== undefined;
  const distancia = conCoordenadas ? distanciaKm(lat, lng, oficios.lat, oficios.lng) : sql<null>`null`;

  const condiciones: SQL[] = [eq(oficios.activo, true)];

  if (categoria || prenda) {
    const delServicio: SQL[] = [eq(servicios.oficioId, oficios.id)];
    if (categoria) delServicio.push(eq(servicios.categoria, categoria));
    if (prenda) delServicio.push(arrayContains(servicios.prendas, [prenda]));
    condiciones.push(
      exists(
        db
          .select({ uno: sql`1` })
          .from(servicios)
          .where(and(...delServicio)),
      ),
    );
  }

  if (q) {
    const patron = `%${escaparLike(q)}%`;
    const coincidencia = or(
      ilike(oficios.nombrePublico, patron),
      ilike(oficios.descripcion, patron),
      exists(
        db
          .select({ uno: sql`1` })
          .from(servicios)
          .where(and(eq(servicios.oficioId, oficios.id), ilike(servicios.titulo, patron))),
      ),
    );
    if (coincidencia) condiciones.push(coincidencia);
  }

  if (conCoordenadas) condiciones.push(lte(distancia, radioKm));

  const filas = await db
    .select({ oficio: oficios, distancia })
    .from(oficios)
    .where(and(...condiciones))
    .orderBy(...(conCoordenadas ? [asc(distancia)] : [desc(oficios.verificado), asc(oficios.nombrePublico)]))
    .limit(limite);

  const porOficio = await serviciosPorOficio(
    db,
    filas.map((f) => f.oficio.id),
  );
  return filas.map((f) => perfilPublico(f.oficio, porOficio.get(f.oficio.id) ?? [], f.distancia));
}

export async function obtenerOficio(db: Db, id: string) {
  const [oficio] = await db
    .select()
    .from(oficios)
    .where(and(eq(oficios.id, id), eq(oficios.activo, true)));
  if (!oficio) throw noEncontrado("El oficio");
  const porOficio = await serviciosPorOficio(db, [oficio.id]);
  return perfilPublico(oficio, porOficio.get(oficio.id) ?? []);
}

async function oficioDelUsuario(db: Db, usuarioId: string) {
  const [oficio] = await db.select().from(oficios).where(eq(oficios.usuarioId, usuarioId));
  if (!oficio) throw noEncontrado("Tu perfil de oficio");
  return oficio;
}

/** Perfil completo (sin difuminar) para que el propio oficio lo edite. */
export async function obtenerMiOficio(db: Db, usuarioId: string) {
  const oficio = await oficioDelUsuario(db, usuarioId);
  const porOficio = await serviciosPorOficio(db, [oficio.id]);
  return { ...oficio, servicios: (porOficio.get(oficio.id) ?? []).map(servicioPublico) };
}

export async function crearMiOficio(db: Db, usuarioId: string, datos: z.infer<typeof crearOficio>) {
  const [existente] = await db.select({ id: oficios.id }).from(oficios).where(eq(oficios.usuarioId, usuarioId));
  if (existente) throw conflicto("Ya tienes un perfil de oficio; edítalo en lugar de crear otro");
  const [creado] = await db
    .insert(oficios)
    .values({ ...datos, usuarioId })
    .returning();
  return { ...creado, servicios: [] };
}

export async function actualizarMiOficio(db: Db, usuarioId: string, datos: z.infer<typeof actualizarOficio>) {
  const oficio = await oficioDelUsuario(db, usuarioId);
  await db.update(oficios).set(datos).where(eq(oficios.id, oficio.id));
  return obtenerMiOficio(db, usuarioId);
}

export async function agregarServicio(db: Db, usuarioId: string, datos: z.infer<typeof crearServicio>) {
  const oficio = await oficioDelUsuario(db, usuarioId);
  const [creado] = await db
    .insert(servicios)
    .values({ ...datos, oficioId: oficio.id })
    .returning();
  return servicioPublico(creado);
}

export async function eliminarServicio(db: Db, usuarioId: string, servicioId: string) {
  const oficio = await oficioDelUsuario(db, usuarioId);
  const eliminados = await db
    .delete(servicios)
    .where(and(eq(servicios.id, servicioId), eq(servicios.oficioId, oficio.id)))
    .returning({ id: servicios.id });
  if (eliminados.length === 0) throw noEncontrado("El servicio");
}

/**
 * Registra que alguien quiere contactar al oficio y devuelve el enlace para hacerlo.
 * El contacto ocurre fuera de la plataforma (WhatsApp o llamada), que es como ya trabajan los oficios.
 */
export async function registrarContacto(db: Db, oficioId: string, canal: "whatsapp" | "telefono", usuarioId?: string) {
  const [oficio] = await db
    .select()
    .from(oficios)
    .where(and(eq(oficios.id, oficioId), eq(oficios.activo, true)));
  if (!oficio) throw noEncontrado("El oficio");

  const numero = canal === "whatsapp" ? oficio.whatsapp : oficio.telefono;
  if (!numero) throw new HttpError(422, "canal_no_disponible", `Este oficio no tiene ${canal} registrado`);

  await db.insert(contactos).values({ oficioId, canal, usuarioId });
  const url =
    canal === "whatsapp" ? `https://wa.me/${numero}?text=${encodeURIComponent(MENSAJE_WHATSAPP)}` : `tel:+${numero}`;
  return { canal, url };
}
