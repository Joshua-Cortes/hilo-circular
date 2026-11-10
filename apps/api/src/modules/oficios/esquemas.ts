import { z } from "zod";
import { CATEGORIAS_SERVICIO, COMUNAS, PRECISIONES_UBICACION, TIPOS_PRENDA } from "../../lib/catalogo.js";

/** Acepta "+56 9 1234 5678", "912345678", etc. y lo normaliza a "56912345678". */
export const celularChile = z
  .string()
  .transform((valor) => valor.replace(/[\s\-()+]/g, ""))
  .transform((valor) => (valor.startsWith("56") ? valor : `56${valor}`))
  .pipe(z.string().regex(/^569\d{8}$/, "Debe ser un celular chileno, por ejemplo +56 9 1234 5678"));

const coordenadas = {
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
};

export const busquedaOficios = z
  .object({
    lat: coordenadas.lat.optional(),
    lng: coordenadas.lng.optional(),
    radioKm: z.coerce.number().positive().max(100).default(15),
    categoria: z.enum(CATEGORIAS_SERVICIO).optional(),
    prenda: z.enum(TIPOS_PRENDA).optional(),
    q: z.string().trim().min(2).max(60).optional(),
    limite: z.coerce.number().int().min(1).max(50).default(20),
  })
  .refine((d) => (d.lat === undefined) === (d.lng === undefined), {
    message: "lat y lng deben enviarse juntos",
    path: ["lat"],
  });

const camposPerfil = {
  nombrePublico: z.string().trim().min(3).max(80),
  descripcion: z.string().trim().max(600),
  comuna: z.enum(COMUNAS),
  direccion: z.string().trim().max(160).optional(),
  ...coordenadas,
  precisionUbicacion: z.enum(PRECISIONES_UBICACION),
  whatsapp: celularChile.optional(),
  telefono: celularChile.optional(),
};

// Los valores por defecto van solo al crear: en Zod 4 se aplicarían también en un PATCH parcial.
export const crearOficio = z
  .object({
    ...camposPerfil,
    descripcion: camposPerfil.descripcion.default(""),
    precisionUbicacion: camposPerfil.precisionUbicacion.default("aproximada"),
  })
  .refine((d) => d.whatsapp || d.telefono, {
    message: "Agrega al menos un WhatsApp o teléfono para que te puedan contactar",
    path: ["whatsapp"],
  });

export const actualizarOficio = z
  .object({ ...camposPerfil, activo: z.boolean() })
  .partial()
  .refine((d) => Object.keys(d).length > 0, { message: "No hay cambios que guardar" });

export const crearServicio = z.object({
  categoria: z.enum(CATEGORIAS_SERVICIO),
  titulo: z.string().trim().min(3).max(80),
  descripcion: z.string().trim().max(400).default(""),
  prendas: z.array(z.enum(TIPOS_PRENDA)).min(1).max(TIPOS_PRENDA.length),
  precioDesde: z.number().int().min(0).max(1_000_000).nullable().default(null),
});

export const contacto = z.object({
  canal: z.enum(["whatsapp", "telefono"]),
});

export const parametroId = z.object({ id: z.uuid("Identificador inválido") });
export const parametroServicio = z.object({ servicioId: z.uuid("Identificador inválido") });
