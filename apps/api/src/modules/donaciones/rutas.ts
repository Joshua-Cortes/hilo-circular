import { Router } from "express";
import type { Db } from "../../db/client.js";
import { validar } from "../../lib/validar.js";
import { requiereSesion, usuarioDe } from "../../middleware/auth.js";
import * as esquemas from "./esquemas.js";
import * as servicio from "./servicio.js";

export function rutasDonaciones(db: Db) {
  const rutas = Router();

  rutas.post("/", requiereSesion("persona", "oficio"), async (req, res) => {
    const datos = validar(esquemas.crearDonacion, req.body);
    res.status(201).json({ datos: await servicio.registrarDonacion(db, usuarioDe(req).id, datos) });
  });

  rutas.get("/mias", requiereSesion(), async (req, res) => {
    res.json({ datos: await servicio.listarMisDonaciones(db, usuarioDe(req)) });
  });

  rutas.patch("/:id/recepcion", requiereSesion("fundacion"), async (req, res) => {
    const { id } = validar(esquemas.parametroId, req.params);
    res.json({ datos: await servicio.confirmarRecepcion(db, usuarioDe(req).id, id) });
  });

  rutas.patch("/:id/cancelacion", requiereSesion("persona", "oficio"), async (req, res) => {
    const { id } = validar(esquemas.parametroId, req.params);
    res.json({ datos: await servicio.cancelarDonacion(db, usuarioDe(req).id, id) });
  });

  return rutas;
}
