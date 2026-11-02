import {
  CATEGORIA_POR_PRENDA,
  type CategoriaServicio,
  type EstadoPrenda,
  ETIQUETAS_CATEGORIA,
  type TipoPrenda,
} from "../../lib/catalogo.js";

export type Recomendacion = {
  accion: "donar" | "reparar" | "reciclar";
  titulo: string;
  explicacion: string;
  /** Oficio sugerido cuando la acción es reparar. */
  categoria: CategoriaServicio | null;
  /** Filtros listos para llamar a /api/oficios o /api/fundaciones. */
  filtros: Record<string, string>;
};

/**
 * Asistente "¿Qué hago con esta prenda?". Ordena las opciones según la jerarquía de residuos:
 * primero alargar la vida útil de la prenda (reparar o donar) y reciclar solo como último recurso.
 */
export function recomendar(prenda: TipoPrenda, estado: EstadoPrenda): Recomendacion {
  if (estado === "buen_estado") {
    return {
      accion: "donar",
      titulo: "Dónala a quien la necesita",
      explicacion:
        "Está lista para usarse. Te mostramos las fundaciones cercanas que reciben este tipo de prenda y qué necesitan hoy.",
      categoria: null,
      filtros: { prenda },
    };
  }
  if (estado === "dano_reparable") {
    const categoria = CATEGORIA_POR_PRENDA[prenda];
    return {
      accion: "reparar",
      titulo: "Repárala: le quedan años de uso",
      explicacion: `Un arreglo suele costar mucho menos que una prenda nueva. Te mostramos talleres de ${ETIQUETAS_CATEGORIA[categoria].toLowerCase()} cerca tuyo.`,
      categoria,
      filtros: { categoria, prenda },
    };
  }
  return {
    accion: "reciclar",
    titulo: "Llévala a reciclaje textil",
    explicacion:
      "Ya no se puede usar, pero su tela sí. No la dones a una fundación que no la recibe: te mostramos los puntos que aceptan textiles dañados para reciclarlos.",
    categoria: null,
    filtros: { prenda, aceptaDanada: "true" },
  };
}
