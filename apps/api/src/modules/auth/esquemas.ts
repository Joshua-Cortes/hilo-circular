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

export const actualizarCuenta = z
  .object({
    nombre: z.string().trim().min(2, "Escribe tu nombre").max(80).optional(),
    email: email.optional(),
    claveActual: z.string().min(1, "Escribe tu contraseña actual").max(200).optional(),
  })
  .refine((d) => d.nombre !== undefined || d.email !== undefined, {
    message: "No hay cambios que guardar",
  });

export const cambiarClave = z.object({
  claveActual: z.string().min(1, "Escribe tu contraseña actual").max(200),
  claveNueva: z.string().min(8, "La contraseña nueva debe tener al menos 8 caracteres").max(200),
});
