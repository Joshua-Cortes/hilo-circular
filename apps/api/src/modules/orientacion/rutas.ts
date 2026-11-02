import { Router } from "express";
import { z } from "zod";
import { ESTADOS_PRENDA, TIPOS_PRENDA } from "../../lib/catalogo.js";
import { validar } from "../../lib/validar.js";
import { recomendar } from "./recomendar.js";

const consulta = z.object({
  prenda: z.enum(TIPOS_PRENDA),
  estado: z.enum(ESTADOS_PRENDA),
});

export function rutasOrientacion() {
  const rutas = Router();
  rutas.get("/", (req, res) => {
    const { prenda, estado } = validar(consulta, req.query);
    res.json({ datos: recomendar(prenda, estado) });
  });
  return rutas;
}
