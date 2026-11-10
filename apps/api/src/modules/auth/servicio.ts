import { eq } from "drizzle-orm";
import type { z } from "zod";
import type { Db } from "../../db/client.js";
import { usuarios } from "../../db/schema.js";
import { hashearClave, verificarClave } from "../../lib/claves.js";
import { conflicto, HttpError, noEncontrado } from "../../lib/errores.js";
import { firmarToken } from "../../middleware/auth.js";
import type { ingreso, registro } from "./esquemas.js";

type Usuario = typeof usuarios.$inferSelect;

export function usuarioPublico(usuario: Usuario) {
  return { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol };
}

async function sesionPara(usuario: Usuario) {
  return { token: await firmarToken({ id: usuario.id, rol: usuario.rol }), usuario: usuarioPublico(usuario) };
}

export async function registrar(db: Db, datos: z.infer<typeof registro>) {
  const [existente] = await db.select({ id: usuarios.id }).from(usuarios).where(eq(usuarios.email, datos.email));
  if (existente) throw conflicto("Ya existe una cuenta con ese correo. Prueba iniciando sesión.");

  const [usuario] = await db
    .insert(usuarios)
    .values({ nombre: datos.nombre, email: datos.email, rol: datos.rol, passwordHash: await hashearClave(datos.clave) })
    .returning();
  return sesionPara(usuario);
}

export async function ingresar(db: Db, datos: z.infer<typeof ingreso>) {
  const [usuario] = await db.select().from(usuarios).where(eq(usuarios.email, datos.email));
  // Mismo mensaje para correo inexistente y contraseña incorrecta: no revelamos qué correos están registrados.
  if (!usuario || !(await verificarClave(datos.clave, usuario.passwordHash))) {
    throw new HttpError(401, "credenciales_invalidas", "El correo o la contraseña no coinciden");
  }
  return sesionPara(usuario);
}

export async function obtenerYo(db: Db, id: string) {
  const [usuario] = await db.select().from(usuarios).where(eq(usuarios.id, id));
  if (!usuario) throw noEncontrado("La cuenta");
  return usuarioPublico(usuario);
}
