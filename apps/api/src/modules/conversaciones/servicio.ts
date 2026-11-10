import { and, asc, count, desc, eq, isNull, ne, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import type { Db } from "../../db/client.js";
import { conversaciones, fotosPublicacion, mensajes, publicaciones, usuarios } from "../../db/schema.js";
import { conflicto, HttpError, noEncontrado } from "../../lib/errores.js";
import { urlFoto } from "../mercado/servicio.js";

type Conversacion = typeof conversaciones.$inferSelect;

const esParticipante = (usuarioId: string) =>
  or(eq(conversaciones.compradorId, usuarioId), eq(conversaciones.vendedorId, usuarioId));

/** Abre (o retoma) la conversación de un comprador con quien publicó la prenda. */
export async function iniciar(db: Db, publicacionId: string, compradorId: string, texto?: string) {
  const [publicacion] = await db.select().from(publicaciones).where(eq(publicaciones.id, publicacionId));
  if (!publicacion) throw noEncontrado("La publicación");
  if (publicacion.vendedorId === compradorId) {
    throw new HttpError(400, "publicacion_propia", "No puedes abrir un chat con tu propia publicación");
  }

  let [conversacion] = await db
    .select()
    .from(conversaciones)
    .where(and(eq(conversaciones.publicacionId, publicacionId), eq(conversaciones.compradorId, compradorId)));

  if (!conversacion) {
    if (publicacion.estado === "vendida") throw conflicto("Esta prenda ya se vendió");
    [conversacion] = await db
      .insert(conversaciones)
      .values({ publicacionId, compradorId, vendedorId: publicacion.vendedorId })
      .onConflictDoNothing()
      .returning();
    // Dos pestañas pueden intentar crearla a la vez: si perdimos la carrera, leemos la que quedó.
    conversacion ??= (
      await db
        .select()
        .from(conversaciones)
        .where(and(eq(conversaciones.publicacionId, publicacionId), eq(conversaciones.compradorId, compradorId)))
    )[0];
  }

  if (texto) await guardarMensaje(db, conversacion, compradorId, texto);
  return { id: conversacion.id };
}

async function guardarMensaje(db: Db, conversacion: Conversacion, autorId: string, texto: string) {
  const [mensaje] = await db.insert(mensajes).values({ conversacionId: conversacion.id, autorId, texto }).returning();
  await db
    .update(conversaciones)
    .set({ ultimoMensajeEn: mensaje.creadoEn })
    .where(eq(conversaciones.id, conversacion.id));
  return mensaje;
}

async function deParticipante(db: Db, id: string, usuarioId: string) {
  const [conversacion] = await db
    .select()
    .from(conversaciones)
    .where(and(eq(conversaciones.id, id), esParticipante(usuarioId)));
  // 404 también cuando existe pero no es tuya: no confirmamos que exista.
  if (!conversacion) throw noEncontrado("La conversación");
  return conversacion;
}

const comprador = alias(usuarios, "comprador");
const vendedor = alias(usuarios, "vendedor");

const primeraFoto = sql<string | null>`(
  select ${fotosPublicacion.id} from ${fotosPublicacion}
  where ${fotosPublicacion.publicacionId} = ${conversaciones.publicacionId}
  order by ${fotosPublicacion.orden} limit 1
)`;

/** Bandeja de entrada: cada conversación con su prenda, la otra persona, el último mensaje y los no leídos. */
export async function listar(db: Db, usuarioId: string) {
  const ultimoTexto = sql<string | null>`(
    select ${mensajes.texto} from ${mensajes}
    where ${mensajes.conversacionId} = ${conversaciones.id}
    order by ${mensajes.creadoEn} desc limit 1
  )`;
  const noLeidos = sql<number>`(
    select count(*)::int from ${mensajes}
    where ${mensajes.conversacionId} = ${conversaciones.id}
      and ${mensajes.autorId} <> ${usuarioId} and ${mensajes.leidoEn} is null
  )`;

  const filas = await db
    .select({
      conversacion: conversaciones,
      publicacion: { titulo: publicaciones.titulo, precio: publicaciones.precio, estado: publicaciones.estado },
      fotoId: primeraFoto,
      comprador: comprador.nombre,
      vendedor: vendedor.nombre,
      ultimoTexto,
      noLeidos,
    })
    .from(conversaciones)
    .innerJoin(publicaciones, eq(publicaciones.id, conversaciones.publicacionId))
    .innerJoin(comprador, eq(comprador.id, conversaciones.compradorId))
    .innerJoin(vendedor, eq(vendedor.id, conversaciones.vendedorId))
    .where(esParticipante(usuarioId))
    .orderBy(desc(conversaciones.ultimoMensajeEn));

  return filas.map((f) => {
    const soyVendedor = f.conversacion.vendedorId === usuarioId;
    return {
      id: f.conversacion.id,
      publicacion: { id: f.conversacion.publicacionId, ...f.publicacion, foto: f.fotoId ? urlFoto(f.fotoId) : null },
      rol: soyVendedor ? ("vendedor" as const) : ("comprador" as const),
      contraparte: { nombre: soyVendedor ? f.comprador : f.vendedor },
      ultimoMensaje: f.ultimoTexto,
      ultimoMensajeEn: f.conversacion.ultimoMensajeEn,
      noLeidos: f.noLeidos,
    };
  });
}

/** Una conversación con todos sus mensajes. Al abrirla se marcan como leídos los de la otra persona. */
export async function obtener(db: Db, id: string, usuarioId: string) {
  await deParticipante(db, id, usuarioId);
  await db
    .update(mensajes)
    .set({ leidoEn: new Date() })
    .where(and(eq(mensajes.conversacionId, id), ne(mensajes.autorId, usuarioId), isNull(mensajes.leidoEn)));

  const resumen = (await listar(db, usuarioId)).find((c) => c.id === id);
  if (!resumen) throw noEncontrado("La conversación");

  const lista = await db.select().from(mensajes).where(eq(mensajes.conversacionId, id)).orderBy(asc(mensajes.creadoEn));

  return {
    ...resumen,
    mensajes: lista.map((m) => ({ id: m.id, texto: m.texto, creadoEn: m.creadoEn, mio: m.autorId === usuarioId })),
  };
}

export async function enviar(db: Db, id: string, usuarioId: string, texto: string) {
  const conversacion = await deParticipante(db, id, usuarioId);
  const mensaje = await guardarMensaje(db, conversacion, usuarioId, texto);
  return { id: mensaje.id, texto: mensaje.texto, creadoEn: mensaje.creadoEn, mio: true };
}

/** Total de mensajes sin leer, para el globo del menú. */
export async function totalNoLeidos(db: Db, usuarioId: string) {
  const [fila] = await db
    .select({ n: count() })
    .from(mensajes)
    .innerJoin(conversaciones, eq(conversaciones.id, mensajes.conversacionId))
    .where(and(esParticipante(usuarioId), ne(mensajes.autorId, usuarioId), isNull(mensajes.leidoEn)));
  return { total: fila?.n ?? 0 };
}
