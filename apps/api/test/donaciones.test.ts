import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { fundaciones } from "../src/db/schema.js";
import { firmarToken } from "../src/middleware/auth.js";
import { crearEntorno, type Entorno } from "./ayudantes.js";

let entorno: Entorno;
let ropero: { id: string; usuarioId: string | null };
let hogar: { id: string; usuarioId: string | null };

beforeAll(async () => {
  entorno = await crearEntorno();
  const todas = await entorno.db.select().from(fundaciones);
  const porNombre = (nombre: string) => todas.find((f) => f.nombre.startsWith(nombre))!;
  ropero = porNombre("Ropero Solidario");
  hogar = porNombre("Hogar Puerto Esperanza");
});
afterAll(() => entorno.cerrar());

const tokenDeFundacion = async (usuarioId: string | null) => ({
  Authorization: `Bearer ${await firmarToken({ id: usuarioId!, rol: "fundacion" })}`,
});

describe("POST /api/donaciones", () => {
  it("registra la donación y estima los kilos", async () => {
    const { auth } = await entorno.crearUsuario("persona");
    const res = await entorno
      .api()
      .post("/api/donaciones")
      .set(auth)
      .send({
        fundacionId: ropero.id,
        items: [
          { prenda: "uniforme_escolar", cantidad: 2, estado: "buen_estado" },
          { prenda: "calzado", cantidad: 1, estado: "buen_estado" },
        ],
      });
    expect(res.status).toBe(201);
    expect(res.body.datos).toMatchObject({ estado: "registrada", totalPrendas: 3, kgEstimados: 1.8 });
    expect(res.body.datos.fundacion.nombre).toContain("Ropero Solidario");
  });

  it("rechaza prendas que la fundación no recibe", async () => {
    const { auth } = await entorno.crearUsuario("persona");
    const res = await entorno
      .api()
      .post("/api/donaciones")
      .set(auth)
      .send({ fundacionId: ropero.id, items: [{ prenda: "ropa_de_cama", cantidad: 1, estado: "buen_estado" }] });
    expect(res.status).toBe(422);
    expect(res.body.error.codigo).toBe("prenda_no_aceptada");
    expect(res.body.error.detalles.prendas).toEqual(["ropa_de_cama"]);
  });

  it("si la prenda está dañada sugiere repararla en vez de donarla", async () => {
    const { auth } = await entorno.crearUsuario("persona");
    const res = await entorno
      .api()
      .post("/api/donaciones")
      .set(auth)
      .send({ fundacionId: hogar.id, items: [{ prenda: "calzado", cantidad: 1, estado: "dano_reparable" }] });
    expect(res.status).toBe(422);
    expect(res.body.error.codigo).toBe("fundacion_no_acepta_danada");
    expect(res.body.error.detalles.sugerencias[0]).toMatchObject({ accion: "reparar", categoria: "zapateria" });
  });

  it("valida cantidades y exige al menos una prenda", async () => {
    const { auth } = await entorno.crearUsuario("persona");
    const vacia = await entorno.api().post("/api/donaciones").set(auth).send({ fundacionId: hogar.id, items: [] });
    expect(vacia.status).toBe(400);
    const excesiva = await entorno
      .api()
      .post("/api/donaciones")
      .set(auth)
      .send({ fundacionId: hogar.id, items: [{ prenda: "pantalon", cantidad: 500, estado: "buen_estado" }] });
    expect(excesiva.status).toBe(400);
  });

  it("una fundación no puede registrar donaciones como donante", async () => {
    const res = await entorno
      .api()
      .post("/api/donaciones")
      .set(await tokenDeFundacion(hogar.usuarioId))
      .send({ fundacionId: hogar.id, items: [{ prenda: "pantalon", cantidad: 1, estado: "buen_estado" }] });
    expect(res.status).toBe(403);
  });

  it("responde 404 si la fundación no existe o está inactiva", async () => {
    const { auth } = await entorno.crearUsuario("persona");
    await entorno.db
      .update(fundaciones)
      .set({ activo: false })
      .where(eq(fundaciones.nombre, "Parroquia Barrio Universitario (demo)"));
    const [inactiva] = await entorno.db.select().from(fundaciones).where(eq(fundaciones.activo, false));
    const res = await entorno
      .api()
      .post("/api/donaciones")
      .set(auth)
      .send({ fundacionId: inactiva.id, items: [{ prenda: "sweater", cantidad: 1, estado: "buen_estado" }] });
    expect(res.status).toBe(404);
  });
});

describe("Ciclo de la donación", () => {
  it("solo las donaciones recibidas cuentan como kilos recuperados", async () => {
    const donante = await entorno.crearUsuario("persona");
    const impactoInicial = (await entorno.api().get("/api/impacto")).body.datos;

    const creada = await entorno
      .api()
      .post("/api/donaciones")
      .set(donante.auth)
      .send({ fundacionId: hogar.id, items: [{ prenda: "chaqueta_abrigo", cantidad: 3, estado: "buen_estado" }] });
    const id = creada.body.datos.id;

    const pendiente = (await entorno.api().get("/api/impacto")).body.datos;
    expect(pendiente.kgTextilRecuperados).toBe(impactoInicial.kgTextilRecuperados);
    expect(pendiente.donacionesPendientes).toBe(impactoInicial.donacionesPendientes + 1);

    const otraFundacion = await entorno
      .api()
      .patch(`/api/donaciones/${id}/recepcion`)
      .set(await tokenDeFundacion(ropero.usuarioId));
    expect(otraFundacion.status).toBe(403);

    const recibida = await entorno
      .api()
      .patch(`/api/donaciones/${id}/recepcion`)
      .set(await tokenDeFundacion(hogar.usuarioId));
    expect(recibida.status).toBe(200);
    expect(recibida.body.datos.estado).toBe("recibida");
    expect(recibida.body.datos.recibidaEn).not.toBeNull();

    const repetida = await entorno
      .api()
      .patch(`/api/donaciones/${id}/recepcion`)
      .set(await tokenDeFundacion(hogar.usuarioId));
    expect(repetida.status).toBe(409);

    const final = (await entorno.api().get("/api/impacto")).body.datos;
    expect(final.kgTextilRecuperados).toBeCloseTo(impactoInicial.kgTextilRecuperados + 3, 5);
    expect(final.prendasDonadas).toBe(impactoInicial.prendasDonadas + 3);
  });

  it("lista las donaciones propias según el rol", async () => {
    const donante = await entorno.crearUsuario("persona");
    await entorno
      .api()
      .post("/api/donaciones")
      .set(donante.auth)
      .send({ fundacionId: hogar.id, items: [{ prenda: "pantalon", cantidad: 1, estado: "buen_estado" }] });

    const mias = await entorno.api().get("/api/donaciones/mias").set(donante.auth);
    expect(mias.body.datos).toHaveLength(1);
    expect(mias.body.datos[0].fundacion.nombre).toContain("Hogar");

    const recibidasPorHogar = await entorno
      .api()
      .get("/api/donaciones/mias")
      .set(await tokenDeFundacion(hogar.usuarioId));
    expect(recibidasPorHogar.body.datos.length).toBeGreaterThanOrEqual(2);
  });

  it("solo quien donó puede cancelar", async () => {
    const donante = await entorno.crearUsuario("persona");
    const otro = await entorno.crearUsuario("persona");
    const creada = await entorno
      .api()
      .post("/api/donaciones")
      .set(donante.auth)
      .send({ fundacionId: hogar.id, items: [{ prenda: "sweater", cantidad: 1, estado: "buen_estado" }] });
    const id = creada.body.datos.id;

    expect((await entorno.api().patch(`/api/donaciones/${id}/cancelacion`).set(otro.auth)).status).toBe(403);
    const cancelada = await entorno.api().patch(`/api/donaciones/${id}/cancelacion`).set(donante.auth);
    expect(cancelada.body.datos.estado).toBe("cancelada");
  });
});
