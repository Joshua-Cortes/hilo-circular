import { Router } from "express";
import type { Db } from "../../db/client.js";
import { validar } from "../../lib/validar.js";
import { requiereSesion, usuarioDe } from "../../middleware/auth.js";
import * as esquemas from "./esquemas.js";
import * as servicio from "./servicio.js";

export function rutasFundaciones(db: Db) {
  const rutas = Router();

  rutas.get("/", async (req, res) => {
    const filtros = validar(esquemas.busquedaFundaciones, req.query);
    res.json({ datos: await servicio.buscarFundaciones(db, filtros) });
  });

  rutas.get("/yo", requiereSesion("fundacion"), async (req, res) => {
    res.json({ datos: await servicio.fundacionDelUsuario(db, usuarioDe(req).id) });
  });

  rutas.post("/", requiereSesion("fundacion"), async (req, res) => {
    const datos = validar(esquemas.crearFundacion, req.body);
    res.status(201).json({ datos: await servicio.crearMiFundacion(db, usuarioDe(req).id, datos) });
  });

  rutas.patch("/yo", requiereSesion("fundacion"), async (req, res) => {
    const datos = validar(esquemas.actualizarFundacion, req.body);
    res.json({ datos: await servicio.actualizarMiFundacion(db, usuarioDe(req).id, datos) });
  });

  rutas.get("/:id", async (req, res) => {
    const { id } = validar(esquemas.parametroId, req.params);
    res.json({ datos: await servicio.obtenerFundacion(db, id) });
  });

  return rutas;
}
