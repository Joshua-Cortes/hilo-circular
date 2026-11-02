import { z } from "zod";
import { ESTADOS_PRENDA, TIPOS_PRENDA } from "../../lib/catalogo.js";

export const crearDonacion = z.object({
  fundacionId: z.uuid("Identificador de fundación inválido"),
  items: z
    .array(
      z.object({
        prenda: z.enum(TIPOS_PRENDA),
        cantidad: z.number().int().min(1).max(50),
        estado: z.enum(ESTADOS_PRENDA),
      }),
    )
    .min(1, "Agrega al menos una prenda")
    .max(20),
});

export const parametroId = z.object({ id: z.uuid("Identificador inválido") });
