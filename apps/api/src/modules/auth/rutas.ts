import { Router } from "express";
import type { Db } from "../../db/client.js";
import { validar } from "../../lib/validar.js";
import { requiereSesion, usuarioDe } from "../../middleware/auth.js";
import * as esquemas from "./esquemas.js";
import * as servicio from "./servicio.js";

export function rutasAuth(db: Db) {
  const rutas = Router();

  rutas.post("/registro", async (req, res) => {
    const datos = validar(esquemas.registro, req.body);
    res.status(201).json({ datos: await servicio.registrar(db, datos) });
  });

  rutas.post("/ingreso", async (req, res) => {
    const datos = validar(esquemas.ingreso, req.body);
    res.json({ datos: await servicio.ingresar(db, datos) });
  });

  rutas.get("/yo", requiereSesion(), async (req, res) => {
    res.json({ datos: await servicio.obtenerYo(db, usuarioDe(req).id) });
  });

  return rutas;
}
