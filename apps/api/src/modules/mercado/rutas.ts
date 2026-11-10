import { Router } from "express";
import type { Db } from "../../db/client.js";
import { validar } from "../../lib/validar.js";
import { autenticacionOpcional, requiereSesion, usuarioDe } from "../../middleware/auth.js";
import * as conversaciones from "../conversaciones/servicio.js";
import * as esquemas from "./esquemas.js";
import * as servicio from "./servicio.js";

export function rutasMercado(db: Db) {
  const rutas = Router();

  rutas.get("/", async (req, res) => {
    const filtros = validar(esquemas.busqueda, req.query);
    res.json({ datos: await servicio.buscar(db, filtros) });
  });

  // Rutas fijas antes de "/:id" para que "mias" o "fotos" no se lean como un id.
  rutas.get("/mias", requiereSesion(), async (req, res) => {
    res.json({ datos: await servicio.misPublicaciones(db, usuarioDe(req).id) });
  });

  rutas.get("/fotos/:id", async (req, res) => {
    const { id } = validar(esquemas.parametroId, req.params);
    const { mime, bytes } = await servicio.foto(db, id);
    // Las fotos no cambian nunca (editar = subir otra), así que se pueden cachear sin límite.
    res.set({
      "Content-Type": mime,
      "Cache-Control": "public, max-age=31536000, immutable",
      "Cross-Origin-Resource-Policy": "cross-origin",
    });
    res.send(bytes);
  });

  rutas.post("/", requiereSesion(), async (req, res) => {
    const datos = validar(esquemas.crear, req.body);
    res.status(201).json({ datos: await servicio.crearPublicacion(db, usuarioDe(req).id, datos) });
  });

  rutas.get("/:id", autenticacionOpcional, async (req, res) => {
    const { id } = validar(esquemas.parametroId, req.params);
    res.json({ datos: await servicio.obtener(db, id, req.usuario?.id) });
  });

  rutas.patch("/:id", requiereSesion(), async (req, res) => {
    const { id } = validar(esquemas.parametroId, req.params);
    const datos = validar(esquemas.actualizar, req.body);
    res.json({ datos: await servicio.actualizarPublicacion(db, usuarioDe(req).id, id, datos) });
  });

  rutas.delete("/:id", requiereSesion(), async (req, res) => {
    const { id } = validar(esquemas.parametroId, req.params);
    await servicio.eliminarPublicacion(db, usuarioDe(req).id, id);
    res.status(204).end();
  });

  rutas.post("/:id/contacto", async (req, res) => {
    const { id } = validar(esquemas.parametroId, req.params);
    res.json({ datos: await servicio.contactoWhatsapp(db, id) });
  });

  rutas.post("/:id/conversacion", requiereSesion(), async (req, res) => {
    const { id } = validar(esquemas.parametroId, req.params);
    const { texto } = validar(esquemas.iniciarConversacion, req.body ?? {});
    res.status(201).json({ datos: await conversaciones.iniciar(db, id, usuarioDe(req).id, texto) });
  });

  return rutas;
}
