import { Router } from "express";
import type { Db } from "../../db/client.js";
import { validar } from "../../lib/validar.js";
import { autenticacionOpcional, requiereSesion, usuarioDe } from "../../middleware/auth.js";
import * as esquemas from "./esquemas.js";
import * as servicio from "./servicio.js";

export function rutasOficios(db: Db) {
  const rutas = Router();

  rutas.get("/", async (req, res) => {
    const filtros = validar(esquemas.busquedaOficios, req.query);
    res.json({ datos: await servicio.buscarOficios(db, filtros) });
  });

  // Rutas del propio oficio: van antes de "/:id" para que "yo" no se lea como un id.
  rutas.get("/yo", requiereSesion("oficio"), async (req, res) => {
    res.json({ datos: await servicio.obtenerMiOficio(db, usuarioDe(req).id) });
  });

  rutas.post("/", requiereSesion("oficio"), async (req, res) => {
    const datos = validar(esquemas.crearOficio, req.body);
    res.status(201).json({ datos: await servicio.crearMiOficio(db, usuarioDe(req).id, datos) });
  });

  rutas.patch("/yo", requiereSesion("oficio"), async (req, res) => {
    const datos = validar(esquemas.actualizarOficio, req.body);
    res.json({ datos: await servicio.actualizarMiOficio(db, usuarioDe(req).id, datos) });
  });

  rutas.post("/yo/servicios", requiereSesion("oficio"), async (req, res) => {
    const datos = validar(esquemas.crearServicio, req.body);
    res.status(201).json({ datos: await servicio.agregarServicio(db, usuarioDe(req).id, datos) });
  });

  rutas.delete("/yo/servicios/:servicioId", requiereSesion("oficio"), async (req, res) => {
    const { servicioId } = validar(esquemas.parametroServicio, req.params);
    await servicio.eliminarServicio(db, usuarioDe(req).id, servicioId);
    res.status(204).end();
  });

  rutas.get("/:id", async (req, res) => {
    const { id } = validar(esquemas.parametroId, req.params);
    res.json({ datos: await servicio.obtenerOficio(db, id) });
  });

  rutas.post("/:id/contacto", autenticacionOpcional, async (req, res) => {
    const { id } = validar(esquemas.parametroId, req.params);
    const { canal } = validar(esquemas.contacto, req.body);
    res.status(201).json({ datos: await servicio.registrarContacto(db, id, canal, req.usuario?.id) });
  });

  return rutas;
}
