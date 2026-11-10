import cors from "cors";
import express from "express";
import helmet from "helmet";
import { config } from "./config.js";
import type { Db } from "./db/client.js";
import { manejadorErrores, rutaNoEncontrada } from "./middleware/errores.js";
import { rutasAuth } from "./modules/auth/rutas.js";
import { rutasCatalogo } from "./modules/catalogo/rutas.js";
import { rutasConversaciones } from "./modules/conversaciones/rutas.js";
import { rutasDonaciones } from "./modules/donaciones/rutas.js";
import { rutasFundaciones } from "./modules/fundaciones/rutas.js";
import { rutasImpacto } from "./modules/impacto/rutas.js";
import { rutasMercado } from "./modules/mercado/rutas.js";
import { rutasOficios } from "./modules/oficios/rutas.js";
import { rutasOrientacion } from "./modules/orientacion/rutas.js";

export function crearApp(db: Db) {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors({ origin: config.corsOrigin }));
  // Publicar en el mercado incluye hasta 4 fotos en base64; el resto de la API mantiene el límite chico.
  app.use("/api/mercado", express.json({ limit: "4mb" }));
  app.use(express.json({ limit: "100kb" }));

  app.get("/api/salud", (_req, res) => {
    res.json({ estado: "ok", servicio: "hilo-circular-api" });
  });

  app.use("/api/auth", rutasAuth(db));
  app.use("/api/catalogo", rutasCatalogo());
  app.use("/api/orientacion", rutasOrientacion());
  app.use("/api/oficios", rutasOficios(db));
  app.use("/api/fundaciones", rutasFundaciones(db));
  app.use("/api/donaciones", rutasDonaciones(db));
  app.use("/api/impacto", rutasImpacto(db));
  app.use("/api/mercado", rutasMercado(db));
  app.use("/api/conversaciones", rutasConversaciones(db));

  app.use(rutaNoEncontrada);
  app.use(manejadorErrores);

  return app;
}
