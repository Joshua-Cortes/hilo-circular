import { z } from "zod";
import { COMUNAS } from "../../lib/catalogo.js";
import { celularChile } from "../oficios/esquemas.js";

const camposPerfil = {
  nombrePublico: z.string().trim().min(3, "Escribe el nombre que verán las personas").max(80),
  descripcion: z.string().trim().max(400),
  comunas: z.array(z.enum(COMUNAS)).min(1, "Selecciona al menos una comuna").max(COMUNAS.length),
  whatsapp: celularChile.nullable().optional(),
  telefono: celularChile.nullable().optional(),
};

export const filtroRepartidores = z.object({ comuna: z.enum(COMUNAS).optional() });

export const crearRepartidor = z
  .object({ ...camposPerfil, descripcion: camposPerfil.descripcion.default("") })
  .refine((datos) => datos.whatsapp || datos.telefono, {
    message: "Agrega al menos un WhatsApp o teléfono para que puedan coordinar contigo",
    path: ["whatsapp"],
  });

export const actualizarRepartidor = z
  .object({ ...camposPerfil, activo: z.boolean() })
  .partial()
  .refine((datos) => Object.keys(datos).length > 0, { message: "No hay cambios que guardar" })
  .refine(
    (datos) => (datos.whatsapp === undefined && datos.telefono === undefined) || datos.whatsapp || datos.telefono,
    {
      message: "Mantén al menos un WhatsApp o teléfono de contacto",
      path: ["whatsapp"],
    },
  );

export const contactoRepartidor = z.object({
  comuna: z.enum(COMUNAS),
  canal: z.enum(["whatsapp", "telefono"]),
});

export const parametroId = z.object({ id: z.uuid("Identificador inválido") });
