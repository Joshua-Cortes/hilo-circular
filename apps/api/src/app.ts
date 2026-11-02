import cors from "cors";
import express from "express";
import helmet from "helmet";
import { config } from "./config.js";
import type { Db } from "./db/client.js";
import { manejadorErrores, rutaNoEncontrada } from "./middleware/errores.js";
import { rutasCatalogo } from "./modules/catalogo/rutas.js";
import { rutasOrientacion } from "./modules/orientacion/rutas.js";

// biome-ignore lint/correctness/noUnusedFunctionParameters: los módulos de recursos usarán db (#12)
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

  app.use(rutaNoEncontrada);
  app.use(manejadorErrores);

  return app;
}
