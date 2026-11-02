import cors from "cors";
import express from "express";
import helmet from "helmet";
import { config } from "./config.js";
import type { Db } from "./db/client.js";
import { manejadorErrores, rutaNoEncontrada } from "./middleware/errores.js";
import { rutasCatalogo } from "./modules/catalogo/rutas.js";
import { rutasDonaciones } from "./modules/donaciones/rutas.js";
import { rutasFundaciones } from "./modules/fundaciones/rutas.js";
import { rutasImpacto } from "./modules/impacto/rutas.js";
import { rutasOficios } from "./modules/oficios/rutas.js";
import { rutasOrientacion } from "./modules/orientacion/rutas.js";

export function crearApp(db: Db) {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json({ limit: "100kb" }));

  app.get("/api/salud", (_req, res) => {
    res.json({ estado: "ok", servicio: "hilo-circular-api" });
  });

  app.use("/api/catalogo", rutasCatalogo());
  app.use("/api/orientacion", rutasOrientacion());
  app.use("/api/oficios", rutasOficios(db));
  app.use("/api/fundaciones", rutasFundaciones(db));
  app.use("/api/donaciones", rutasDonaciones(db));
  app.use("/api/impacto", rutasImpacto(db));

  app.use(rutaNoEncontrada);
  app.use(manejadorErrores);

  return app;
}
