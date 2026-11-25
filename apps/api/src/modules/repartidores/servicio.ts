import { and, arrayContains, eq } from "drizzle-orm";
import type { z } from "zod";
import type { Db } from "../../db/client.js";
import { contactosReparto, repartidores } from "../../db/schema.js";
import type { COMUNAS } from "../../lib/catalogo.js";
import { conflicto, HttpError, noEncontrado } from "../../lib/errores.js";
import type { actualizarRepartidor, crearRepartidor } from "./esquemas.js";

type Repartidor = typeof repartidores.$inferSelect;

const MENSAJE_WHATSAPP = (comuna: string) =>
  `Hola, te encontré en Hilo Circular. ¿Podemos coordinar un reparto de ropa en ${comuna}?`;

function perfilPublico(repartidor: Repartidor) {
  return {
    id: repartidor.id,
    nombrePublico: repartidor.nombrePublico,
    descripcion: repartidor.descripcion,
    comunas: repartidor.comunas,
    canales: { whatsapp: Boolean(repartidor.whatsapp), telefono: Boolean(repartidor.telefono) },
    verificado: repartidor.verificado,
  };
}

export async function buscarRepartidores(db: Db, comuna?: string) {
  const filas = await db
    .select()
    .from(repartidores)
    .where(
      comuna
        ? and(eq(repartidores.activo, true), arrayContains(repartidores.comunas, [comuna]))
        : eq(repartidores.activo, true),
    );
  return filas
    .sort((a, b) => Number(b.verificado) - Number(a.verificado) || a.nombrePublico.localeCompare(b.nombrePublico, "es"))
    .map(perfilPublico);
}

export async function obtenerMiReparto(db: Db, usuarioId: string) {
  const [perfil] = await db.select().from(repartidores).where(eq(repartidores.usuarioId, usuarioId));
  return perfil ?? null;
}

export async function crearMiReparto(db: Db, usuarioId: string, datos: z.infer<typeof crearRepartidor>) {
  const [existente] = await db
    .select({ id: repartidores.id })
    .from(repartidores)
    .where(eq(repartidores.usuarioId, usuarioId));
  if (existente) throw conflicto("Ya tienes un perfil de reparto; edítalo en lugar de crear otro");
  const [creado] = await db
    .insert(repartidores)
    .values({ ...datos, usuarioId })
    .returning();
  return creado;
}

export async function actualizarMiReparto(db: Db, usuarioId: string, datos: z.infer<typeof actualizarRepartidor>) {
  const [perfil] = await db
    .select({ id: repartidores.id })
    .from(repartidores)
    .where(eq(repartidores.usuarioId, usuarioId));
  if (!perfil) throw noEncontrado("Tu perfil de reparto");
  await db.update(repartidores).set(datos).where(eq(repartidores.id, perfil.id));
  return obtenerMiReparto(db, usuarioId);
}

export async function registrarContacto(
  db: Db,
  repartidorId: string,
  comuna: (typeof COMUNAS)[number],
  canal: "whatsapp" | "telefono",
  usuarioId?: string,
) {
  const [repartidor] = await db
    .select()
    .from(repartidores)
    .where(and(eq(repartidores.id, repartidorId), eq(repartidores.activo, true)));
  if (!repartidor?.comunas.includes(comuna)) throw noEncontrado("El reparto disponible en esa comuna");

  const numero = canal === "whatsapp" ? repartidor.whatsapp : repartidor.telefono;
  if (!numero) throw new HttpError(422, "canal_no_disponible", `Este repartidor no tiene ${canal} registrado`);

  await db.insert(contactosReparto).values({ repartidorId, usuarioId, comuna, canal });
  const url =
    canal === "whatsapp"
      ? `https://wa.me/${numero}?text=${encodeURIComponent(MENSAJE_WHATSAPP(comuna))}`
      : `tel:+${numero}`;
  return { canal, url };
}
