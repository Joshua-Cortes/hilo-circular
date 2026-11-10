import { Router } from "express";
import type { Db } from "../../db/client.js";
import { validar } from "../../lib/validar.js";
import { requiereSesion, usuarioDe } from "../../middleware/auth.js";
import * as esquemas from "../mercado/esquemas.js";
import * as servicio from "./servicio.js";

/** Chat entre comprador y vendedor. El frontend consulta cada pocos segundos (sin WebSockets). */
export function rutasConversaciones(db: Db) {
  const rutas = Router();
  rutas.use(requiereSesion());

  rutas.get("/", async (req, res) => {
    res.json({ datos: await servicio.listar(db, usuarioDe(req).id) });
  });

  rutas.get("/no-leidos", async (req, res) => {
    res.json({ datos: await servicio.totalNoLeidos(db, usuarioDe(req).id) });
  });

  rutas.get("/:id", async (req, res) => {
    const { id } = validar(esquemas.parametroId, req.params);
    res.json({ datos: await servicio.obtener(db, id, usuarioDe(req).id) });
  });

  rutas.post("/:id/mensajes", async (req, res) => {
    const { id } = validar(esquemas.parametroId, req.params);
    const { texto } = validar(esquemas.mensaje, req.body);
    res.status(201).json({ datos: await servicio.enviar(db, id, usuarioDe(req).id, texto) });
  });

  return rutas;
}
