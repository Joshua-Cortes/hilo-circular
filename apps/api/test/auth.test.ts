import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { CLAVE_DEMO } from "../src/db/semilla.js";
import { crearEntorno, type Entorno } from "./ayudantes.js";

let entorno: Entorno;

beforeAll(async () => {
  entorno = await crearEntorno();
});
afterAll(() => entorno.cerrar());

describe("cuentas", () => {
  it("registra, inicia sesión y responde quién soy", async () => {
    const registro = await entorno
      .api()
      .post("/api/auth/registro")
      .send({ nombre: "Ana", email: "  Ana@Correo.CL ", clave: "unaclave123" });
    expect(registro.status).toBe(201);
    expect(registro.body.datos.usuario).toMatchObject({ nombre: "Ana", email: "ana@correo.cl", rol: "persona" });
    expect(registro.body.datos.usuario.passwordHash).toBeUndefined();

    const ingreso = await entorno
      .api()
      .post("/api/auth/ingreso")
      .send({ email: "ana@correo.cl", clave: "unaclave123" });
    expect(ingreso.status).toBe(200);

    const yo = await entorno.api().get("/api/auth/yo").set("Authorization", `Bearer ${ingreso.body.datos.token}`);
    expect(yo.body.datos.email).toBe("ana@correo.cl");
  });

  it("no permite dos cuentas con el mismo correo", async () => {
    const datos = { nombre: "Beto", email: "beto@correo.cl", clave: "unaclave123" };
    await entorno.api().post("/api/auth/registro").send(datos);
    const repetido = await entorno.api().post("/api/auth/registro").send(datos);
    expect(repetido.status).toBe(409);
  });

  it("no deja registrarse como fundación ni con contraseñas cortas", async () => {
    const fundacion = await entorno
      .api()
      .post("/api/auth/registro")
      .send({ nombre: "X", email: "x@correo.cl", clave: "unaclave123", rol: "fundacion" });
    expect(fundacion.status).toBe(400);

    const corta = await entorno
      .api()
      .post("/api/auth/registro")
      .send({ nombre: "Y", email: "y@correo.cl", clave: "123" });
    expect(corta.status).toBe(400);
  });

  it("rechaza contraseñas incorrectas con un mensaje que no revela si el correo existe", async () => {
    const mala = await entorno
      .api()
      .post("/api/auth/ingreso")
      .send({ email: "demo@hilocircular.cl", clave: "otra-cosa" });
    const inexistente = await entorno.api().post("/api/auth/ingreso").send({ email: "nadie@correo.cl", clave: "x" });
    expect(mala.status).toBe(401);
    expect(inexistente.status).toBe(401);
    expect(mala.body.error.mensaje).toBe(inexistente.body.error.mensaje);
  });

  it("la cuenta demo entra con la clave publicada y las cuentas sembradas sin clave no", async () => {
    const demo = await entorno
      .api()
      .post("/api/auth/ingreso")
      .send({ email: "demo@hilocircular.cl", clave: CLAVE_DEMO });
    expect(demo.status).toBe(200);

    const sinAcceso = await entorno
      .api()
      .post("/api/auth/ingreso")
      .send({ email: "oficio1@demo.hilocircular.cl", clave: "!demo-sin-acceso" });
    expect(sinAcceso.status).toBe(401);
  });

  it("la fundación demo entra, ve su panel y tiene donaciones por confirmar", async () => {
    const ingreso = await entorno
      .api()
      .post("/api/auth/ingreso")
      .send({ email: "fundacion@hilocircular.cl", clave: CLAVE_DEMO });
    expect(ingreso.body.datos.usuario.rol).toBe("fundacion");
    const auth = { Authorization: `Bearer ${ingreso.body.datos.token}` };

    const panel = await entorno.api().get("/api/fundaciones/yo").set(auth);
    expect(panel.body.datos.nombre).toContain("Ropero Solidario");

    const donaciones = await entorno.api().get("/api/donaciones/mias").set(auth);
    const pendientes = donaciones.body.datos.filter((d: { estado: string }) => d.estado === "registrada");
    expect(pendientes.length).toBeGreaterThan(0);

    const confirmada = await entorno.api().patch(`/api/donaciones/${pendientes[0].id}/recepcion`).set(auth);
    expect(confirmada.body.datos.estado).toBe("recibida");
  });

  it("actualiza nombre y correo exigiendo la clave actual y verificando unicidad", async () => {
    const reg = await entorno
      .api()
      .post("/api/auth/registro")
      .send({ nombre: "Lucas", email: "lucas@correo.cl", clave: "unaclave123" });
    const auth = { Authorization: `Bearer ${reg.body.datos.token}` };

    const soloNombre = await entorno.api().patch("/api/auth/yo").set(auth).send({ nombre: "Lucas Vega" });
    expect(soloNombre.status).toBe(200);
    expect(soloNombre.body.datos.nombre).toBe("Lucas Vega");

    const sinClave = await entorno.api().patch("/api/auth/yo").set(auth).send({ email: "lucas.nuevo@correo.cl" });
    expect(sinClave.status).toBe(401);

    const duplicado = await entorno
      .api()
      .patch("/api/auth/yo")
      .set(auth)
      .send({ email: "demo@hilocircular.cl", claveActual: "unaclave123" });
    expect(duplicado.status).toBe(409);

    const correoOk = await entorno
      .api()
      .patch("/api/auth/yo")
      .set(auth)
      .send({ email: "lucas.nuevo@correo.cl", claveActual: "unaclave123" });
    expect(correoOk.status).toBe(200);
    expect(correoOk.body.datos.email).toBe("lucas.nuevo@correo.cl");
  });

  it("cambia la contraseña validando la actual", async () => {
    const reg = await entorno
      .api()
      .post("/api/auth/registro")
      .send({ nombre: "Sofía", email: "sofia@correo.cl", clave: "unaclave123" });
    const auth = { Authorization: `Bearer ${reg.body.datos.token}` };

    const malaActual = await entorno
      .api()
      .patch("/api/auth/clave")
      .set(auth)
      .send({ claveActual: "incorrecta", claveNueva: "nuevaclave456" });
    expect(malaActual.status).toBe(401);

    const cambiada = await entorno
      .api()
      .patch("/api/auth/clave")
      .set(auth)
      .send({ claveActual: "unaclave123", claveNueva: "nuevaclave456" });
    expect(cambiada.status).toBe(200);

    const ingresoNuevo = await entorno
      .api()
      .post("/api/auth/ingreso")
      .send({ email: "sofia@correo.cl", clave: "nuevaclave456" });
    expect(ingresoNuevo.status).toBe(200);
  });
});
