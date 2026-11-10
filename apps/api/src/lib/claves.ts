import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt) as (clave: string, sal: Buffer, largo: number) => Promise<Buffer>;
const LARGO = 64;

/** Formato guardado: "scrypt$<sal hex>$<hash hex>". scrypt viene en Node, así no sumamos dependencias nativas. */
export async function hashearClave(clave: string): Promise<string> {
  const sal = randomBytes(16);
  const hash = await scryptAsync(clave, sal, LARGO);
  return `scrypt$${sal.toString("hex")}$${hash.toString("hex")}`;
}

/** Devuelve false ante cualquier formato desconocido (por ejemplo, las cuentas demo sin acceso). */
export async function verificarClave(clave: string, guardado: string): Promise<boolean> {
  const [algoritmo, salHex, hashHex] = guardado.split("$");
  if (algoritmo !== "scrypt" || !salHex || !hashHex) return false;
  const esperado = Buffer.from(hashHex, "hex");
  const calculado = await scryptAsync(clave, Buffer.from(salHex, "hex"), esperado.length);
  return calculado.length === esperado.length && timingSafeEqual(calculado, esperado);
}
