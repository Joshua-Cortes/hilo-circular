import type { NextFunction, Request, Response } from "express";
import { jwtVerify, SignJWT } from "jose";
import { config } from "../config.js";
import { ROLES, type Rol } from "../lib/catalogo.js";
import { HttpError, prohibido } from "../lib/errores.js";

export type UsuarioAutenticado = { id: string; rol: Rol };

declare global {
  namespace Express {
    interface Request {
      usuario?: UsuarioAutenticado;
    }
  }
}

const clave = () => new TextEncoder().encode(config.jwtSecret);

/**
 * Firma un token de acceso. Lo usa el módulo de autenticación (registro / inicio de sesión)
 * y los tests para simular usuarios.
 */
export async function firmarToken(usuario: UsuarioAutenticado, expiraEn = "7d"): Promise<string> {
  return new SignJWT({ rol: usuario.rol })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(usuario.id)
    .setIssuedAt()
    .setExpirationTime(expiraEn)
    .sign(clave());
}

async function leerUsuario(req: Request): Promise<UsuarioAutenticado | undefined> {
  const [esquema, token] = req.headers.authorization?.split(" ") ?? [];
  if (esquema !== "Bearer" || !token) return undefined;
  try {
    const { payload } = await jwtVerify(token, clave(), { algorithms: ["HS256"] });
    const rol = payload.rol as Rol;
    if (!payload.sub || !ROLES.includes(rol)) return undefined;
    return { id: payload.sub, rol };
  } catch {
    throw new HttpError(401, "token_invalido", "La sesión expiró o no es válida");
  }
}

/** Adjunta `req.usuario` si viene un token válido, sin exigirlo. */
export async function autenticacionOpcional(req: Request, _res: Response, next: NextFunction) {
  req.usuario = await leerUsuario(req);
  next();
}

/** Exige sesión iniciada y, si se indican, alguno de los roles. */
export function requiereSesion(...roles: Rol[]) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const usuario = await leerUsuario(req);
    if (!usuario) throw new HttpError(401, "sin_sesion", "Debes iniciar sesión");
    if (roles.length > 0 && !roles.includes(usuario.rol)) {
      throw prohibido(`Esta acción es solo para: ${roles.join(", ")}`);
    }
    req.usuario = usuario;
    next();
  };
}

/** Para usar después de `requiereSesion`: devuelve el usuario sin tener que comprobar undefined. */
export function usuarioDe(req: Request): UsuarioAutenticado {
  if (!req.usuario) throw new HttpError(401, "sin_sesion", "Debes iniciar sesión");
  return req.usuario;
}
