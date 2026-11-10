import { z } from "zod";

const email = z.string().trim().toLowerCase().pipe(z.email("Escribe un correo válido, por ejemplo nombre@correo.cl"));

export const registro = z.object({
  nombre: z.string().trim().min(2, "Escribe tu nombre").max(80),
  email,
  clave: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").max(200),
  // Las cuentas de fundación las crea el equipo al verificarlas (CU4), no el registro público.
  rol: z.enum(["persona", "oficio"]).default("persona"),
});

export const ingreso = z.object({
  email,
  clave: z.string().min(1, "Escribe tu contraseña").max(200),
});
