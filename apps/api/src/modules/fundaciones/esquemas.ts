import { z } from "zod";
import { COMUNAS, TIPOS_PRENDA } from "../../lib/catalogo.js";

const hora = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Usa el formato HH:MM");

const horario = z
  .object({ dia: z.number().int().min(0).max(6), abre: hora, cierra: hora })
  .refine((h) => h.abre < h.cierra, { message: "La hora de cierre debe ser posterior a la de apertura" });

const booleanoQuery = z.enum(["true", "false"]).transform((v) => v === "true");

export const busquedaFundaciones = z
  .object({
    lat: z.coerce.number().min(-90).max(90).optional(),
    lng: z.coerce.number().min(-180).max(180).optional(),
    radioKm: z.coerce.number().positive().max(100).default(25),
    prenda: z.enum(TIPOS_PRENDA).optional(),
    aceptaDanada: booleanoQuery.optional(),
    abiertoAhora: booleanoQuery.optional(),
    limite: z.coerce.number().int().min(1).max(100).default(50),
  })
  .refine((d) => (d.lat === undefined) === (d.lng === undefined), {
    message: "lat y lng deben enviarse juntos",
    path: ["lat"],
  });

const camposFundacion = {
  nombre: z.string().trim().min(3).max(100),
  descripcion: z.string().trim().max(600),
  comuna: z.enum(COMUNAS),
  direccion: z.string().trim().min(5).max(160),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  horarios: z.array(horario).max(21),
  prendasAceptadas: z.array(z.enum(TIPOS_PRENDA)).max(TIPOS_PRENDA.length),
  necesidadesActuales: z.string().trim().max(400),
  aceptaDanada: z.boolean(),
  telefono: z.string().trim().max(20),
  email: z.email("Correo inválido"),
};

// Los valores por defecto van solo al crear: en Zod 4 se aplicarían también en un PATCH parcial.
export const crearFundacion = z.object({
  ...camposFundacion,
  descripcion: camposFundacion.descripcion.default(""),
  horarios: camposFundacion.horarios.default([]),
  prendasAceptadas: camposFundacion.prendasAceptadas.default([]),
  necesidadesActuales: camposFundacion.necesidadesActuales.default(""),
  aceptaDanada: camposFundacion.aceptaDanada.default(false),
  telefono: camposFundacion.telefono.optional(),
  email: camposFundacion.email.optional(),
});

export const actualizarFundacion = z
  .object({ ...camposFundacion, activo: z.boolean() })
  .partial()
  .refine((d) => Object.keys(d).length > 0, { message: "No hay cambios que guardar" });

export const parametroId = z.object({ id: z.uuid("Identificador inválido") });
