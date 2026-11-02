import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { estimarKg, TIPOS_PRENDA } from "../src/lib/catalogo.js";
import { recomendar } from "../src/modules/orientacion/recomendar.js";
import { crearEntorno, type Entorno } from "./ayudantes.js";

let entorno: Entorno;

beforeAll(async () => {
  entorno = await crearEntorno({ conSemilla: false });
});
afterAll(() => entorno.cerrar());

describe("API general", () => {
  it("responde el chequeo de salud", async () => {
    const res = await entorno.api().get("/api/salud");
    expect(res.status).toBe(200);
    expect(res.body.estado).toBe("ok");
  });

  it("entrega el catálogo con etiquetas en español", async () => {
    const res = await entorno.api().get("/api/catalogo");
    expect(res.body.datos.prendas).toHaveLength(TIPOS_PRENDA.length);
    expect(res.body.datos.categorias[0]).toEqual({ id: "costura", etiqueta: "Costura y arreglos" });
  });

  it("devuelve errores en un formato uniforme", async () => {
    const ruta = await entorno.api().get("/api/no-existe");
    expect(ruta.status).toBe(404);
    expect(ruta.body.error.codigo).toBe("ruta_no_encontrada");

    const json = await entorno.api().post("/api/donaciones").set("Content-Type", "application/json").send("{malo");
    expect(json.status).toBe(400);
    expect(json.body.error.codigo).toBe("json_invalido");
  });

  it("con la base vacía el impacto parte en cero", async () => {
    const res = await entorno.api().get("/api/impacto");
    expect(res.body.datos).toEqual({
      oficiosActivos: 0,
      puntosDonacion: 0,
      contactosReparacion: 0,
      donacionesRecibidas: 0,
      donacionesPendientes: 0,
      prendasDonadas: 0,
      kgTextilRecuperados: 0,
    });
  });
});

describe("Orientación: ¿qué hago con esta prenda?", () => {
  it("prenda en buen estado → donar", () => {
    expect(recomendar("pantalon", "buen_estado").accion).toBe("donar");
  });

  it("prenda reparable → el oficio que corresponde", () => {
    expect(recomendar("calzado", "dano_reparable")).toMatchObject({ accion: "reparar", categoria: "zapateria" });
    expect(recomendar("sweater", "dano_reparable").categoria).toBe("tejido");
  });

  it("prenda muy deteriorada → reciclaje, nunca a una fundación que no la recibe", () => {
    expect(recomendar("polera_camisa", "muy_deteriorada")).toMatchObject({
      accion: "reciclar",
      filtros: { aceptaDanada: "true" },
    });
  });

  it("expone la recomendación por HTTP y valida la consulta", async () => {
    const ok = await entorno.api().get("/api/orientacion").query({ prenda: "bolso_cartera", estado: "dano_reparable" });
    expect(ok.body.datos.categoria).toBe("marroquineria");
    const mala = await entorno.api().get("/api/orientacion").query({ prenda: "auto", estado: "buen_estado" });
    expect(mala.status).toBe(400);
  });
});

describe("Estimación de kilos", () => {
  it("suma el peso promedio por cantidad y redondea a gramos útiles", () => {
    expect(estimarKg([{ prenda: "polera_camisa", cantidad: 3 }])).toBe(0.6);
    expect(estimarKg([])).toBe(0);
  });
});
