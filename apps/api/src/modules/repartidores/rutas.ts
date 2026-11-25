import { Router } from "express";
import type { Db } from "../../db/client.js";
import { validar } from "../../lib/validar.js";
import { autenticacionOpcional, requiereSesion, usuarioDe } from "../../middleware/auth.js";
import * as esquemas from "./esquemas.js";
import * as servicio from "./servicio.js";

export function rutasRepartidores(db: Db) {
  const rutas = Router();

  rutas.get("/", async (req, res) => {
    const { comuna } = validar(esquemas.filtroRepartidores, req.query);
    res.json({ datos: await servicio.buscarRepartidores(db, comuna) });
  });

  rutas.get("/yo", requiereSesion(), async (req, res) => {
    res.json({ datos: await servicio.obtenerMiReparto(db, usuarioDe(req).id) });
  });

  rutas.post("/", requiereSesion(), async (req, res) => {
    const datos = validar(esquemas.crearRepartidor, req.body);
    res.status(201).json({ datos: await servicio.crearMiReparto(db, usuarioDe(req).id, datos) });
  });

  rutas.patch("/yo", requiereSesion(), async (req, res) => {
    const datos = validar(esquemas.actualizarRepartidor, req.body);
    res.json({ datos: await servicio.actualizarMiReparto(db, usuarioDe(req).id, datos) });
  });

  rutas.post("/:id/contacto", autenticacionOpcional, async (req, res) => {
    const { id } = validar(esquemas.parametroId, req.params);
    const { comuna, canal } = validar(esquemas.contactoRepartidor, req.body);
    res.status(201).json({ datos: await servicio.registrarContacto(db, id, comuna, canal, req.usuario?.id) });
  });

  return rutas;
}
