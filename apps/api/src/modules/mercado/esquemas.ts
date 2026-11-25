import { z } from "zod";
import { COMUNAS, CONDICIONES_PRENDA, ESTADOS_PUBLICACION, TIPOS_PRENDA } from "../../lib/catalogo.js";
import { celularChile } from "../oficios/esquemas.js";

export const MAX_FOTOS = 4;
/** Tope por foto ya decodificada. El frontend las reduce a ~1200 px en JPEG antes de subirlas. */
export const MAX_BYTES_FOTO = 700 * 1024;

export const busqueda = z.object({
  prenda: z.enum(TIPOS_PRENDA).optional(),
  comuna: z.enum(COMUNAS).optional(),
  condicion: z.enum(CONDICIONES_PRENDA).optional(),
  q: z.string().trim().min(2).max(60).optional(),
  precioMax: z.coerce.number().int().min(0).optional(),
  soloRegalo: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  orden: z.enum(["recientes", "precio_asc", "precio_desc"]).default("recientes"),
  limite: z.coerce.number().int().min(1).max(60).default(24),
});

const foto = z.object({
  mime: z.enum(["image/jpeg", "image/png", "image/webp"], "Solo se aceptan fotos JPG, PNG o WebP"),
  datos: z.base64("La foto no llegó en el formato esperado"),
});

const campos = {
  titulo: z.string().trim().min(4, "Ponle un título de al menos 4 letras").max(80),
  descripcion: z.string().trim().max(800),
  prenda: z.enum(TIPOS_PRENDA),
  talla: z.string().trim().min(1, "Indica la talla").max(16),
  condicion: z.enum(CONDICIONES_PRENDA),
  precio: z.number().int().min(0).max(2_000_000),
  comuna: z.enum(COMUNAS),
  whatsapp: celularChile.nullable(),
};

export const crear = z.object({
  ...campos,
  descripcion: campos.descripcion.default(""),
  whatsapp: campos.whatsapp.default(null),
  fotos: z.array(foto).max(MAX_FOTOS, `Puedes subir hasta ${MAX_FOTOS} fotos`).default([]),
});

export const actualizar = z
  .object({ ...campos, estado: z.enum(ESTADOS_PUBLICACION) })
  .partial()
  .refine((d) => Object.keys(d).length > 0, { message: "No hay cambios que guardar" });

export const mensaje = z.object({
  texto: z.string().trim().min(1, "Escribe un mensaje").max(1000),
});

export const iniciarConversacion = z.object({
  texto: z.string().trim().min(1).max(1000).optional(),
});

export const parametroId = z.object({ id: z.uuid("Identificador inválido") });
