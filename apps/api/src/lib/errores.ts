export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly codigo: string,
    message: string,
    readonly detalles?: unknown,
  ) {
    super(message);
  }
}

export const noEncontrado = (recurso: string) => new HttpError(404, "no_encontrado", `${recurso} no existe`);
export const prohibido = (mensaje = "No tienes permiso para esta acción") => new HttpError(403, "prohibido", mensaje);
export const conflicto = (mensaje: string) => new HttpError(409, "conflicto", mensaje);
