import type { z } from "zod";
import { HttpError } from "./errores.js";

/** Valida `datos` con el esquema y lanza un 400 con los errores por campo si no cumple. */
export function validar<T extends z.ZodType>(esquema: T, datos: unknown): z.infer<T> {
  const resultado = esquema.safeParse(datos);
  if (!resultado.success) {
    const campos = resultado.error.issues.map((issue) => ({
      campo: issue.path.join("."),
      mensaje: issue.message,
    }));
    throw new HttpError(400, "datos_invalidos", "Revisa los datos enviados", campos);
  }
  return resultado.data;
}
