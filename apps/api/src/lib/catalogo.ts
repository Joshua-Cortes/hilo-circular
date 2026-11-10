/**
 * Vocabulario del dominio. Es la fuente única para los enums de la base de datos,
 * la validación de la API y las etiquetas que muestra el frontend.
 */

export const ROLES = ["persona", "oficio", "fundacion", "admin"] as const;
export type Rol = (typeof ROLES)[number];

export const CATEGORIAS_SERVICIO = ["costura", "zapateria", "marroquineria", "tejido", "tapiceria"] as const;
export type CategoriaServicio = (typeof CATEGORIAS_SERVICIO)[number];

export const TIPOS_PRENDA = [
  "polera_camisa",
  "pantalon",
  "falda_vestido",
  "chaqueta_abrigo",
  "sweater",
  "ropa_infantil",
  "uniforme_escolar",
  "ropa_de_cama",
  "calzado",
  "bolso_cartera",
] as const;
export type TipoPrenda = (typeof TIPOS_PRENDA)[number];

export const ESTADOS_PRENDA = ["buen_estado", "dano_reparable", "muy_deteriorada"] as const;
export type EstadoPrenda = (typeof ESTADOS_PRENDA)[number];

export const ESTADOS_DONACION = ["registrada", "recibida", "cancelada"] as const;
export const PRECISIONES_UBICACION = ["exacta", "aproximada"] as const;

/** Condición de una prenda publicada en el mercado de segunda mano. */
export const CONDICIONES_PRENDA = ["nueva_con_etiqueta", "como_nueva", "buen_estado", "con_detalles"] as const;
export type CondicionPrenda = (typeof CONDICIONES_PRENDA)[number];

/** Ciclo de vida de una publicación: el vendedor la marca reservada o vendida desde "Mis publicaciones". */
export const ESTADOS_PUBLICACION = ["disponible", "reservada", "vendida"] as const;
export type EstadoPublicacion = (typeof ESTADOS_PUBLICACION)[number];

/** Comunas de la Región de Coquimbo donde opera el piloto (La Serena y Coquimbo) y su entorno inmediato. */
export const COMUNAS = ["La Serena", "Coquimbo", "Ovalle", "Vicuña", "Andacollo", "La Higuera"] as const;

export const ETIQUETAS_CATEGORIA: Record<CategoriaServicio, string> = {
  costura: "Costura y arreglos",
  zapateria: "Zapatería",
  marroquineria: "Marroquinería (cuero y bolsos)",
  tejido: "Tejido y zurcido",
  tapiceria: "Tapicería y ropa de hogar",
};

export const ETIQUETAS_PRENDA: Record<TipoPrenda, string> = {
  polera_camisa: "Polera o camisa",
  pantalon: "Pantalón o jeans",
  falda_vestido: "Falda o vestido",
  chaqueta_abrigo: "Chaqueta o abrigo",
  sweater: "Sweater o polerón",
  ropa_infantil: "Ropa infantil",
  uniforme_escolar: "Uniforme escolar",
  ropa_de_cama: "Ropa de cama",
  calzado: "Calzado (par)",
  bolso_cartera: "Bolso o cartera",
};

export const ETIQUETAS_ESTADO: Record<EstadoPrenda, string> = {
  buen_estado: "En buen estado, lista para usar",
  dano_reparable: "Tiene un daño que se puede arreglar",
  muy_deteriorada: "Muy deteriorada, ya no se puede usar",
};

export const ETIQUETAS_CONDICION: Record<CondicionPrenda, string> = {
  nueva_con_etiqueta: "Nueva, con etiqueta",
  como_nueva: "Como nueva",
  buen_estado: "Buen estado",
  con_detalles: "Con detalles (se indican)",
};

/**
 * Peso promedio aproximado por unidad, en kilogramos. Son valores referenciales para estimar
 * los kilos de textil que se evitan desechar; se deben calibrar pesando donaciones reales
 * durante el piloto (ver docs/01-fundamentacion.md, sección Métricas).
 */
export const PESO_PROMEDIO_KG: Record<TipoPrenda, number> = {
  polera_camisa: 0.2,
  pantalon: 0.6,
  falda_vestido: 0.4,
  chaqueta_abrigo: 1.0,
  sweater: 0.5,
  ropa_infantil: 0.15,
  uniforme_escolar: 0.5,
  ropa_de_cama: 1.2,
  calzado: 0.8,
  bolso_cartera: 0.5,
};

/** Qué oficio corresponde, por defecto, para reparar cada tipo de prenda. */
export const CATEGORIA_POR_PRENDA: Record<TipoPrenda, CategoriaServicio> = {
  polera_camisa: "costura",
  pantalon: "costura",
  falda_vestido: "costura",
  chaqueta_abrigo: "costura",
  sweater: "tejido",
  ropa_infantil: "costura",
  uniforme_escolar: "costura",
  ropa_de_cama: "tapiceria",
  calzado: "zapateria",
  bolso_cartera: "marroquineria",
};

export function estimarKg(items: { prenda: TipoPrenda; cantidad: number }[]): number {
  const total = items.reduce((acc, item) => acc + PESO_PROMEDIO_KG[item.prenda] * item.cantidad, 0);
  return Math.round(total * 100) / 100;
}
