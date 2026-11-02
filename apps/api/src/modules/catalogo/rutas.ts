import { Router } from "express";
import {
  CATEGORIAS_SERVICIO,
  COMUNAS,
  ESTADOS_PRENDA,
  ETIQUETAS_CATEGORIA,
  ETIQUETAS_ESTADO,
  ETIQUETAS_PRENDA,
  PESO_PROMEDIO_KG,
  TIPOS_PRENDA,
} from "../../lib/catalogo.js";

/** Vocabulario con etiquetas en español para que el frontend no duplique listas. */
export function rutasCatalogo() {
  const rutas = Router();
  rutas.get("/", (_req, res) => {
    res.set("Cache-Control", "public, max-age=3600");
    res.json({
      datos: {
        categorias: CATEGORIAS_SERVICIO.map((id) => ({ id, etiqueta: ETIQUETAS_CATEGORIA[id] })),
        prendas: TIPOS_PRENDA.map((id) => ({ id, etiqueta: ETIQUETAS_PRENDA[id], pesoKg: PESO_PROMEDIO_KG[id] })),
        estados: ESTADOS_PRENDA.map((id) => ({ id, etiqueta: ETIQUETAS_ESTADO[id] })),
        comunas: COMUNAS,
      },
    });
  });
  return rutas;
}
