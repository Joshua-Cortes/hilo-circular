import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { estaAbierto, momentoEnChile } from "../src/lib/horarios.js";
import { buscarFundaciones } from "../src/modules/fundaciones/servicio.js";
import { CENTRO_LA_SERENA, crearEntorno, type Entorno } from "./ayudantes.js";

let entorno: Entorno;

beforeAll(async () => {
  entorno = await crearEntorno();
});
afterAll(() => entorno.cerrar());

type FundacionRespuesta = { nombre: string; distanciaKm: number; aceptaDanada: boolean };

describe("GET /api/fundaciones", () => {
  it("ordena los puntos de donación por cercanía", async () => {
    const res = await entorno.api().get("/api/fundaciones").query(CENTRO_LA_SERENA);
    expect(res.status).toBe(200);
    const distancias = res.body.datos.map((f: FundacionRespuesta) => f.distanciaKm);
    expect(distancias).toEqual([...distancias].sort((a, b) => a - b));
    expect(res.body.datos[0]).toHaveProperty("abiertoAhora");
    expect(res.body.datos[0]).toHaveProperty("necesidadesActuales");
  });

  it("incluye a quienes aceptan la prenda o aceptan cualquier prenda", async () => {
    const res = await entorno.api().get("/api/fundaciones").query({ prenda: "uniforme_escolar" });
    const nombres = res.body.datos.map((f: FundacionRespuesta) => f.nombre);
    expect(nombres).toContain("Ropero Solidario Las Compañías (demo)");
    expect(nombres).toContain("Hogar Puerto Esperanza (demo)");
    expect(nombres).not.toContain("Parroquia Barrio Universitario (demo)");
  });

  it("filtra puntos que reciben textiles dañados", async () => {
    const res = await entorno.api().get("/api/fundaciones").query({ aceptaDanada: "true" });
    expect(res.body.datos).toHaveLength(1);
    expect(res.body.datos[0].aceptaDanada).toBe(true);
  });

  it("rechaza valores booleanos ambiguos", async () => {
    const res = await entorno.api().get("/api/fundaciones").query({ aceptaDanada: "si" });
    expect(res.status).toBe(400);
  });

  it("filtra por abierto ahora según la hora de Chile", async () => {
    // Miércoles 4 de noviembre de 2026, 16:30 en Chile (UTC-3 en horario de verano).
    const miercolesTarde = new Date("2026-11-04T19:30:00Z");
    const abiertas = await buscarFundaciones(
      entorno.db,
      { radioKm: 25, limite: 50, abiertoAhora: true },
      miercolesTarde,
    );
    const nombres = abiertas.map((f) => f.nombre);
    expect(nombres).toContain("Hogar Puerto Esperanza (demo)");
    expect(nombres).not.toContain("Ropero Solidario Las Compañías (demo)");
  });
});

describe("Horarios", () => {
  it("convierte a la hora de Chile continental", () => {
    expect(momentoEnChile(new Date("2026-11-04T13:00:00Z"))).toEqual({ dia: 3, hora: "10:00" });
  });

  it("considera el cierre como exclusivo", () => {
    const horarios = [{ dia: 3, abre: "10:00", cierra: "13:00" }];
    expect(estaAbierto(horarios, new Date("2026-11-04T13:00:00Z"))).toBe(true);
    expect(estaAbierto(horarios, new Date("2026-11-04T16:00:00Z"))).toBe(false);
  });
});

describe("Fundación propia", () => {
  it("una fundación nueva queda sin verificar y puede actualizar sus necesidades", async () => {
    const { auth } = await entorno.crearUsuario("fundacion");
    const creada = await entorno
      .api()
      .post("/api/fundaciones")
      .set(auth)
      .send({
        nombre: "Junta de Vecinos San Joaquín",
        comuna: "La Serena",
        direccion: "Sede vecinal San Joaquín",
        lat: -29.91,
        lng: -71.227,
        horarios: [{ dia: 6, abre: "10:00", cierra: "12:00" }],
      });
    expect(creada.status).toBe(201);
    expect(creada.body.datos.verificado).toBe(false);

    const actualizada = await entorno
      .api()
      .patch("/api/fundaciones/yo")
      .set(auth)
      .send({ necesidadesActuales: "Ropa de bebé" });
    expect(actualizada.body.datos.necesidadesActuales).toBe("Ropa de bebé");
    expect(actualizada.body.datos.horarios).toHaveLength(1);
  });

  it("valida que el horario cierre después de abrir", async () => {
    const { auth } = await entorno.crearUsuario("fundacion");
    const res = await entorno
      .api()
      .post("/api/fundaciones")
      .set(auth)
      .send({
        nombre: "Fundación X",
        comuna: "Coquimbo",
        direccion: "Calle 1, Coquimbo",
        lat: -29.95,
        lng: -71.33,
        horarios: [{ dia: 1, abre: "18:00", cierra: "09:00" }],
      });
    expect(res.status).toBe(400);
  });
});
