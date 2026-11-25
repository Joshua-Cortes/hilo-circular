import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import type { z } from "zod";
import { config } from "../../config.js";
import type { Db } from "../../db/client.js";
import { restablecimientosClave, usuarios } from "../../db/schema.js";
import { hashearClave, verificarClave } from "../../lib/claves.js";
import { conflicto, HttpError, noEncontrado } from "../../lib/errores.js";
import { firmarToken } from "../../middleware/auth.js";
import type { actualizarCuenta, cambiarClave, ingreso, registro } from "./esquemas.js";

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

export async function actualizarYo(db: Db, id: string, datos: z.infer<typeof actualizarCuenta>) {
  const [usuario] = await db.select().from(usuarios).where(eq(usuarios.id, id));
  if (!usuario) throw noEncontrado("La cuenta");

  const cambios: Partial<typeof usuarios.$inferInsert> = {};
  if (datos.nombre !== undefined) cambios.nombre = datos.nombre;

  if (datos.email !== undefined && datos.email !== usuario.email) {
    if (!datos.claveActual || !(await verificarClave(datos.claveActual, usuario.passwordHash))) {
      throw new HttpError(401, "credenciales_invalidas", "Escribe tu contraseña actual para cambiar el correo");
    }
    const [otro] = await db.select({ id: usuarios.id }).from(usuarios).where(eq(usuarios.email, datos.email));
    if (otro && otro.id !== id) {
      throw conflicto("Ya existe otra cuenta con ese correo");
    }
    cambios.email = datos.email;
  }

  if (Object.keys(cambios).length === 0) return usuarioPublico(usuario);

  const [actualizado] = await db.update(usuarios).set(cambios).where(eq(usuarios.id, id)).returning();
  return usuarioPublico(actualizado);
}

export async function actualizarClave(db: Db, id: string, datos: z.infer<typeof cambiarClave>) {
  const [usuario] = await db.select().from(usuarios).where(eq(usuarios.id, id));
  if (!usuario) throw noEncontrado("La cuenta");

  if (!(await verificarClave(datos.claveActual, usuario.passwordHash))) {
    throw new HttpError(401, "credenciales_invalidas", "Tu contraseña actual no coincide");
  }

  await db
    .update(usuarios)
    .set({ passwordHash: await hashearClave(datos.claveNueva) })
    .where(eq(usuarios.id, id));

  return { ok: true };
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function enviarCorreoRestablecimiento(email: string, url: string) {
  if (!config.resendApiKey || !config.emailFrom) return false;

  const respuesta = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${config.resendApiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: config.emailFrom,
      to: [email],
      subject: "Restablece tu contraseña de Hilo Circular",
      text: `Recibimos una solicitud para cambiar tu contraseña de Hilo Circular. Este enlace vence en 30 minutos y solo se puede usar una vez: ${url}\n\nSi no solicitaste este cambio, ignora este correo.`,
      html: `<p>Recibimos una solicitud para cambiar tu contraseña de Hilo Circular.</p><p><a href="${url}">Crear una contraseña nueva</a></p><p>El enlace vence en 30 minutos y solo se puede usar una vez. Si no lo solicitaste, ignora este correo.</p>`,
    }),
  });
  if (!respuesta.ok) throw new Error(`El servicio de correo respondió ${respuesta.status}`);
  return true;
}

export async function solicitarRestablecimiento(db: Db, email: string) {
  if (config.entorno === "production" && (!config.resendApiKey || !config.emailFrom)) {
    throw new HttpError(
      503,
      "correo_no_configurado",
      "La recuperación por correo aún no está disponible. Contacta al equipo de Hilo Circular.",
    );
  }

  const [usuario] = await db.select({ id: usuarios.id }).from(usuarios).where(eq(usuarios.email, email));
  let resetUrl: string | undefined;

  if (usuario) {
    const token = randomBytes(32).toString("base64url");
    await db.delete(restablecimientosClave).where(eq(restablecimientosClave.usuarioId, usuario.id));
    await db.insert(restablecimientosClave).values({
      usuarioId: usuario.id,
      tokenHash: hashToken(token),
      expiraEn: new Date(Date.now() + 30 * 60 * 1000),
    });
    resetUrl = new URL(`/recuperar?token=${encodeURIComponent(token)}`, config.appUrl).toString();
    try {
      await enviarCorreoRestablecimiento(email, resetUrl);
    } catch (error) {
      // La respuesta sigue siendo idéntica para no revelar si el correo pertenece a una cuenta.
      console.error("No se pudo enviar el correo de recuperación", error);
      if (config.entorno === "production") {
        await db.delete(restablecimientosClave).where(eq(restablecimientosClave.usuarioId, usuario.id));
      }
    }
  }

  // En desarrollo se entrega el enlace para poder probar el flujo sin exponer claves de correo.
  return config.entorno === "development" ? { resetUrl } : {};
}

export async function restablecerClave(db: Db, token: string, clave: string) {
  const tokenHash = hashToken(token);
  await db.transaction(async (tx) => {
    const [restablecimiento] = await tx
      .delete(restablecimientosClave)
      .where(and(eq(restablecimientosClave.tokenHash, tokenHash), gt(restablecimientosClave.expiraEn, new Date())))
      .returning({ usuarioId: restablecimientosClave.usuarioId });
    if (!restablecimiento) {
      throw new HttpError(400, "enlace_expirado", "El enlace venció o ya se utilizó. Solicita uno nuevo.");
    }
    await tx
      .update(usuarios)
      .set({ passwordHash: await hashearClave(clave) })
      .where(eq(usuarios.id, restablecimiento.usuarioId));
    await tx.delete(restablecimientosClave).where(eq(restablecimientosClave.usuarioId, restablecimiento.usuarioId));
  });
}
