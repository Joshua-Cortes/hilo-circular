/** Combina nombres de clase condicionales sin dependencias adicionales. */
export function cn(...clases: Array<string | false | null | undefined>): string {
  return clases.filter(Boolean).join(" ");
}
