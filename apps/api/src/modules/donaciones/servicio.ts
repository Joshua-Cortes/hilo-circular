import { and, desc, eq } from "drizzle-orm";
import type { z } from "zod";
import type { Db } from "../../db/client.js";
import { donaciones, fundaciones } from "../../db/schema.js";
import { estimarKg } from "../../lib/catalogo.js";
import { conflicto, HttpError, noEncontrado, prohibido } from "../../lib/errores.js";
import type { UsuarioAutenticado } from "../../middleware/auth.js";
import { fundacionDelUsuario } from "../fundaciones/servicio.js";
import { recomendar } from "../orientacion/recomendar.js";
import type { crearDonacion } from "./esquemas.js";

/**
 * Registra la intención de donar. Antes de aceptar comprueba que la fundación de verdad reciba
 * esas prendas: así se evita que las fundaciones terminen desechando ropa que no pueden usar.
 */
export async function registrarDonacion(db: Db, donanteId: string, datos: z.infer<typeof crearDonacion>) {
  const [fundacion] = await db
    .select()
    .from(fundaciones)
    .where(and(eq(fundaciones.id, datos.fundacionId), eq(fundaciones.activo, true)));
  if (!fundacion) throw noEncontrado("La fundación");

  const noAceptadas = datos.items.filter(
    (item) => fundacion.prendasAceptadas.length > 0 && !fundacion.prendasAceptadas.includes(item.prenda),
  );
  if (noAceptadas.length > 0) {
    throw new HttpError(422, "prenda_no_aceptada", `${fundacion.nombre} no recibe algunas de estas prendas`, {
      prendas: noAceptadas.map((item) => item.prenda),
    });
  }

  const danadas = datos.items.filter((item) => item.estado !== "buen_estado");
  if (danadas.length > 0 && !fundacion.aceptaDanada) {
    throw new HttpError(
      422,
      "fundacion_no_acepta_danada",
      `${fundacion.nombre} solo recibe prendas en buen estado. Te sugerimos qué hacer con las demás.`,
      { sugerencias: danadas.map((item) => ({ prenda: item.prenda, ...recomendar(item.prenda, item.estado) })) },
    );
  }

  const [donacion] = await db
    .insert(donaciones)
    .values({
      fundacionId: fundacion.id,
      donanteId,
      items: datos.items,
      totalPrendas: datos.items.reduce((acc, item) => acc + item.cantidad, 0),
      kgEstimados: estimarKg(datos.items),
    })
    .returning();
  return { ...donacion, fundacion: { id: fundacion.id, nombre: fundacion.nombre, direccion: fundacion.direccion } };
}

/** Una persona ve las donaciones que hizo; una fundación, las que le llegan. */
export async function listarMisDonaciones(db: Db, usuario: UsuarioAutenticado) {
  const filtro =
    usuario.rol === "fundacion"
      ? eq(donaciones.fundacionId, (await fundacionDelUsuario(db, usuario.id)).id)
      : eq(donaciones.donanteId, usuario.id);
  const filas = await db
    .select({ donacion: donaciones, fundacion: { id: fundaciones.id, nombre: fundaciones.nombre } })
    .from(donaciones)
    .innerJoin(fundaciones, eq(donaciones.fundacionId, fundaciones.id))
    .where(filtro)
    .orderBy(desc(donaciones.creadoEn));
  return filas.map((f) => ({ ...f.donacion, fundacion: f.fundacion }));
}

async function donacionRegistrada(db: Db, id: string) {
  const [donacion] = await db.select().from(donaciones).where(eq(donaciones.id, id));
  if (!donacion) throw noEncontrado("La donación");
  if (donacion.estado !== "registrada") throw conflicto(`La donación ya está ${donacion.estado}`);
  return donacion;
}

/** La fundación confirma que recibió las prendas. Solo las donaciones confirmadas cuentan como impacto. */
export async function confirmarRecepcion(db: Db, usuarioId: string, id: string) {
  const fundacion = await fundacionDelUsuario(db, usuarioId);
  const donacion = await donacionRegistrada(db, id);
  if (donacion.fundacionId !== fundacion.id) throw prohibido("Esta donación es para otra fundación");
  const [actualizada] = await db
    .update(donaciones)
    .set({ estado: "recibida", recibidaEn: new Date() })
    .where(eq(donaciones.id, id))
    .returning();
  return actualizada;
}

export async function cancelarDonacion(db: Db, usuarioId: string, id: string) {
  const donacion = await donacionRegistrada(db, id);
  if (donacion.donanteId !== usuarioId) throw prohibido("Solo quien registró la donación puede cancelarla");
  const [actualizada] = await db
    .update(donaciones)
    .set({ estado: "cancelada" })
    .where(eq(donaciones.id, id))
    .returning();
  return actualizada;
}
