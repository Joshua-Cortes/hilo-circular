import { and, asc, count, desc, eq, ilike, lte, ne, or, type SQL, sql } from "drizzle-orm";
import type { z } from "zod";
import type { Db } from "../../db/client.js";
import { conversaciones, fotosPublicacion, publicaciones, usuarios } from "../../db/schema.js";
import { HttpError, noEncontrado, prohibido } from "../../lib/errores.js";
import { type actualizar, type busqueda, type crear, MAX_BYTES_FOTO } from "./esquemas.js";

type Publicacion = typeof publicaciones.$inferSelect;

export const urlFoto = (id: string) => `/api/mercado/fotos/${id}`;

/** Primera foto de cada publicación, sin traer los datos de la imagen. */
const primeraFoto = sql<string | null>`(
  select ${fotosPublicacion.id} from ${fotosPublicacion}
  where ${fotosPublicacion.publicacionId} = ${publicaciones.id}
  order by ${fotosPublicacion.orden} limit 1
)`;

function resumen(fila: Publicacion, fotoId: string | null, vendedorNombre: string) {
  return {
    id: fila.id,
    titulo: fila.titulo,
    prenda: fila.prenda,
    talla: fila.talla,
    condicion: fila.condicion,
    precio: fila.precio,
    comuna: fila.comuna,
    estado: fila.estado,
    foto: fotoId ? urlFoto(fotoId) : null,
    vendedor: { nombre: vendedorNombre },
    creadoEn: fila.creadoEn,
  };
}

const escaparLike = (texto: string) => texto.replace(/[\\%_]/g, "\\$&");

export async function buscar(db: Db, filtros: z.infer<typeof busqueda>) {
  // Las vendidas salen del listado público; las reservadas se muestran marcadas.
  const condiciones: SQL[] = [ne(publicaciones.estado, "vendida")];
  if (filtros.prenda) condiciones.push(eq(publicaciones.prenda, filtros.prenda));
  if (filtros.comuna) condiciones.push(eq(publicaciones.comuna, filtros.comuna));
  if (filtros.condicion) condiciones.push(eq(publicaciones.condicion, filtros.condicion));
  if (filtros.precioMax !== undefined) condiciones.push(lte(publicaciones.precio, filtros.precioMax));
  if (filtros.soloRegalo) condiciones.push(eq(publicaciones.precio, 0));
  if (filtros.q) {
    const patron = `%${escaparLike(filtros.q)}%`;
    condiciones.push(or(ilike(publicaciones.titulo, patron), ilike(publicaciones.descripcion, patron)) as SQL);
  }

  const orden = {
    recientes: [desc(publicaciones.creadoEn)],
    precio_asc: [asc(publicaciones.precio), desc(publicaciones.creadoEn)],
    precio_desc: [desc(publicaciones.precio), desc(publicaciones.creadoEn)],
  }[filtros.orden];

  const filas = await db
    .select({ publicacion: publicaciones, fotoId: primeraFoto, vendedorNombre: usuarios.nombre })
    .from(publicaciones)
    .innerJoin(usuarios, eq(usuarios.id, publicaciones.vendedorId))
    .where(and(...condiciones))
    .orderBy(...orden)
    .limit(filtros.limite);

  return filas.map((f) => resumen(f.publicacion, f.fotoId, f.vendedorNombre));
}

export async function obtener(db: Db, id: string, usuarioId?: string) {
  const [fila] = await db
    .select({
      publicacion: publicaciones,
      vendedor: { id: usuarios.id, nombre: usuarios.nombre, desde: usuarios.creadoEn },
    })
    .from(publicaciones)
    .innerJoin(usuarios, eq(usuarios.id, publicaciones.vendedorId))
    .where(eq(publicaciones.id, id));
  if (!fila) throw noEncontrado("La publicación");

  const fotos = await db
    .select({ id: fotosPublicacion.id })
    .from(fotosPublicacion)
    .where(eq(fotosPublicacion.publicacionId, id))
    .orderBy(asc(fotosPublicacion.orden));

  const esMia = fila.vendedor.id === usuarioId;
  const { publicacion } = fila;
  return {
    ...resumen(publicacion, fotos[0]?.id ?? null, fila.vendedor.nombre),
    descripcion: publicacion.descripcion,
    fotos: fotos.map((f) => urlFoto(f.id)),
    vendedor: { nombre: fila.vendedor.nombre, desde: fila.vendedor.desde },
    canales: { whatsapp: Boolean(publicacion.whatsapp), chat: true },
    esMia,
    // Solo la dueña o el dueño ve su número tal como lo guardó, para poder editarlo.
    whatsapp: esMia ? publicacion.whatsapp : undefined,
  };
}

export async function misPublicaciones(db: Db, usuarioId: string) {
  const conversacionesPorPublicacion = sql<number>`(
    select count(*)::int from ${conversaciones} where ${conversaciones.publicacionId} = ${publicaciones.id}
  )`;
  const filas = await db
    .select({
      publicacion: publicaciones,
      fotoId: primeraFoto,
      vendedorNombre: usuarios.nombre,
      conversaciones: conversacionesPorPublicacion,
    })
    .from(publicaciones)
    .innerJoin(usuarios, eq(usuarios.id, publicaciones.vendedorId))
    .where(eq(publicaciones.vendedorId, usuarioId))
    .orderBy(desc(publicaciones.creadoEn));
  return filas.map((f) => ({
    ...resumen(f.publicacion, f.fotoId, f.vendedorNombre),
    conversaciones: f.conversaciones,
  }));
}

/** Revisa la firma real del archivo: no basta con el mime que declara el navegador. */
function firmaCoincide(mime: string, bytes: Buffer) {
  if (mime === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mime === "image/png") return bytes.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  return bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP";
}

export async function crearPublicacion(db: Db, vendedorId: string, datos: z.infer<typeof crear>) {
  const { fotos, ...campos } = datos;
  for (const [i, foto] of fotos.entries()) {
    const bytes = Buffer.from(foto.datos, "base64");
    if (bytes.length > MAX_BYTES_FOTO) {
      throw new HttpError(413, "foto_muy_grande", `La foto ${i + 1} pesa demasiado (máximo 700 KB)`);
    }
    if (!firmaCoincide(foto.mime, bytes)) {
      throw new HttpError(400, "foto_invalida", `La foto ${i + 1} no es una imagen válida`);
    }
  }

  const id = await db.transaction(async (tx) => {
    const [publicacion] = await tx
      .insert(publicaciones)
      .values({ ...campos, vendedorId })
      .returning({ id: publicaciones.id });
    if (fotos.length > 0) {
      await tx
        .insert(fotosPublicacion)
        .values(fotos.map((f, orden) => ({ publicacionId: publicacion.id, orden, mime: f.mime, datos: f.datos })));
    }
    return publicacion.id;
  });
  return obtener(db, id, vendedorId);
}

async function propia(db: Db, usuarioId: string, id: string) {
  const [publicacion] = await db.select().from(publicaciones).where(eq(publicaciones.id, id));
  if (!publicacion) throw noEncontrado("La publicación");
  if (publicacion.vendedorId !== usuarioId) throw prohibido("Solo quien publicó la prenda puede modificarla");
  return publicacion;
}

export async function actualizarPublicacion(db: Db, usuarioId: string, id: string, datos: z.infer<typeof actualizar>) {
  await propia(db, usuarioId, id);
  await db.update(publicaciones).set(datos).where(eq(publicaciones.id, id));
  return obtener(db, id, usuarioId);
}

export async function eliminarPublicacion(db: Db, usuarioId: string, id: string) {
  await propia(db, usuarioId, id);
  await db.delete(publicaciones).where(eq(publicaciones.id, id));
}

export async function contactoWhatsapp(db: Db, id: string) {
  const [publicacion] = await db.select().from(publicaciones).where(eq(publicaciones.id, id));
  if (!publicacion) throw noEncontrado("La publicación");
  if (!publicacion.whatsapp) {
    throw new HttpError(422, "sin_whatsapp", "Esta persona prefiere conversar por el chat de Hilo Circular");
  }
  const texto = `Hola, vi tu publicación "${publicacion.titulo}" en Hilo Circular. ¿Sigue disponible?`;
  return { url: `https://wa.me/${publicacion.whatsapp}?text=${encodeURIComponent(texto)}` };
}

export async function foto(db: Db, id: string) {
  const [fila] = await db.select().from(fotosPublicacion).where(eq(fotosPublicacion.id, id));
  if (!fila) throw noEncontrado("La foto");
  return { mime: fila.mime, bytes: Buffer.from(fila.datos, "base64") };
}

/** Publicaciones activas y prendas que ya cambiaron de dueño (para los indicadores de impacto). */
export async function cifras(db: Db) {
  const filas = await db
    .select({ estado: publicaciones.estado, n: count() })
    .from(publicaciones)
    .groupBy(publicaciones.estado);
  const de = (estado: string) => filas.find((f) => f.estado === estado)?.n ?? 0;
  return { publicacionesActivas: de("disponible") + de("reservada"), prendasRecirculadas: de("vendida") };
}
