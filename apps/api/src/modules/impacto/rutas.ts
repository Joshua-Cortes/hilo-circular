import { count, eq, sql } from "drizzle-orm";
import { Router } from "express";
import type { Db } from "../../db/client.js";
import { contactos, contactosReparto, donaciones, fundaciones, oficios } from "../../db/schema.js";
import { cifras as cifrasMercado } from "../mercado/servicio.js";

/** Indicadores públicos de impacto (los mismos que se reportan en los hitos del proyecto). */
export async function calcularImpacto(db: Db) {
  const [[oficiosActivos], [puntosDonacion], [contactosReparacion], [contactosDelivery], porEstado, mercado] =
    await Promise.all([
      db.select({ n: count() }).from(oficios).where(eq(oficios.activo, true)),
      db.select({ n: count() }).from(fundaciones).where(eq(fundaciones.activo, true)),
      db.select({ n: count() }).from(contactos),
      db.select({ n: count() }).from(contactosReparto),
      db
        .select({
          estado: donaciones.estado,
          donaciones: count(),
          prendas: sql<number>`coalesce(sum(${donaciones.totalPrendas}), 0)::int`,
          kg: sql<number>`coalesce(sum(${donaciones.kgEstimados}), 0)::float8`,
        })
        .from(donaciones)
        .groupBy(donaciones.estado),
      cifrasMercado(db),
    ]);

  const estado = (nombre: "registrada" | "recibida") =>
    porEstado.find((fila) => fila.estado === nombre) ?? { donaciones: 0, prendas: 0, kg: 0 };
  const recibidas = estado("recibida");
  const pendientes = estado("registrada");

  return {
    oficiosActivos: oficiosActivos?.n ?? 0,
    puntosDonacion: puntosDonacion?.n ?? 0,
    contactosReparacion: contactosReparacion?.n ?? 0,
    contactosDelivery: contactosDelivery?.n ?? 0,
    donacionesRecibidas: recibidas.donaciones,
    donacionesPendientes: pendientes.donaciones,
    prendasDonadas: recibidas.prendas,
    /** Solo cuenta donaciones confirmadas por la fundación. */
    kgTextilRecuperados: Math.round(recibidas.kg * 10) / 10,
    ...mercado,
  };
}

export function rutasImpacto(db: Db) {
  const rutas = Router();
  rutas.get("/", async (_req, res) => {
    res.json({ datos: await calcularImpacto(db) });
  });
  return rutas;
}
