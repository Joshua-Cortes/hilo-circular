import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../lib/errores.js";

export function rutaNoEncontrada(req: Request, _res: Response, next: NextFunction) {
  next(new HttpError(404, "ruta_no_encontrada", `No existe ${req.method} ${req.path}`));
}

export function manejadorErrores(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: { codigo: err.codigo, mensaje: err.message, detalles: err.detalles } });
    return;
  }
  if (err instanceof SyntaxError && "body" in err) {
    res
      .status(400)
      .json({ error: { codigo: "json_invalido", mensaje: "El cuerpo de la solicitud no es JSON válido" } });
    return;
  }
  console.error(err);
  res.status(500).json({ error: { codigo: "error_interno", mensaje: "Ocurrió un error inesperado" } });
}
