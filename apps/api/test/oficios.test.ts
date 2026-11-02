import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { CENTRO_LA_SERENA, crearEntorno, type Entorno } from "./ayudantes.js";

let entorno: Entorno;

beforeAll(async () => {
  entorno = await crearEntorno();
});
afterAll(() => entorno.cerrar());

const perfilValido = {
  nombrePublico: "Arreglos Doña Marta",
  comuna: "La Serena",
  lat: -29.91,
  lng: -71.25,
  whatsapp: "+56 9 1234 5678",
};

describe("GET /api/oficios (búsqueda)", () => {
  it("ordena por cercanía e informa la distancia", async () => {
    const res = await entorno.api().get("/api/oficios").query(CENTRO_LA_SERENA);
    expect(res.status).toBe(200);
    const distancias = res.body.datos.map((o: { distanciaKm: number }) => o.distanciaKm);
    expect(distancias.length).toBeGreaterThan(0);
    expect(distancias).toEqual([...distancias].sort((a, b) => a - b));
    expect(res.body.datos[0].nombrePublico).toBe("Zapatería Don Lucho");
  });

  it("respeta el radio de búsqueda", async () => {
    const res = await entorno
      .api()
      .get("/api/oficios")
      .query({ ...CENTRO_LA_SERENA, radioKm: 3 });
    expect(res.body.datos.every((o: { comuna: string }) => o.comuna === "La Serena")).toBe(true);
    expect(res.body.datos.every((o: { distanciaKm: number }) => o.distanciaKm <= 3)).toBe(true);
  });

  it("filtra por oficio y tipo de prenda", async () => {
    const res = await entorno.api().get("/api/oficios").query({ categoria: "zapateria", prenda: "calzado" });
    expect(res.body.datos).toHaveLength(1);
    expect(res.body.datos[0].nombrePublico).toBe("Zapatería Don Lucho");
  });

  it("busca por texto en nombre, descripción o servicios", async () => {
    const res = await entorno.api().get("/api/oficios").query({ q: "cierre" });
    const nombres = res.body.datos.map((o: { nombrePublico: string }) => o.nombrePublico);
    expect(nombres).toContain("Costuras Rosita");
  });

  it("trata los comodines de SQL como texto literal", async () => {
    const res = await entorno.api().get("/api/oficios").query({ q: "%%" });
    expect(res.status).toBe(200);
    expect(res.body.datos).toHaveLength(0);
  });

  it("sin coordenadas no calcula distancia", async () => {
    const res = await entorno.api().get("/api/oficios");
    expect(res.body.datos[0].distanciaKm).toBeNull();
  });

  it("rechaza lat sin lng", async () => {
    const res = await entorno.api().get("/api/oficios").query({ lat: -29.9 });
    expect(res.status).toBe(400);
    expect(res.body.error.codigo).toBe("datos_invalidos");
  });

  it("no expone teléfonos ni la ubicación exacta de quien la pidió aproximada", async () => {
    const res = await entorno.api().get("/api/oficios").query({ q: "Rosita" });
    const rosita = res.body.datos[0];
    expect(rosita.ubicacion).toEqual({ lat: -29.88, lng: -71.23, precision: "aproximada" });
    expect(rosita.direccion).toBeNull();
    expect(rosita.canales).toEqual({ whatsapp: true, telefono: false });
    expect(JSON.stringify(rosita)).not.toContain("56900000001");
  });
});

describe("GET /api/oficios/:id", () => {
  it("devuelve el perfil con sus servicios", async () => {
    const lista = await entorno.api().get("/api/oficios").query({ q: "Lucho" });
    const res = await entorno.api().get(`/api/oficios/${lista.body.datos[0].id}`);
    expect(res.status).toBe(200);
    expect(res.body.datos.direccion).toBe("Calle ficticia 123, La Serena");
    expect(res.body.datos.servicios).toHaveLength(2);
  });

  it("responde 400 con un id mal formado y 404 si no existe", async () => {
    expect((await entorno.api().get("/api/oficios/abc")).status).toBe(400);
    const res = await entorno.api().get("/api/oficios/00000000-0000-4000-8000-000000000000");
    expect(res.status).toBe(404);
  });
});

describe("Perfil propio del oficio", () => {
  it("exige sesión y rol de oficio", async () => {
    expect((await entorno.api().post("/api/oficios").send(perfilValido)).status).toBe(401);
    const persona = await entorno.crearUsuario("persona");
    const res = await entorno.api().post("/api/oficios").set(persona.auth).send(perfilValido);
    expect(res.status).toBe(403);
  });

  it("rechaza un token adulterado", async () => {
    const oficio = await entorno.crearUsuario("oficio");
    const res = await entorno
      .api()
      .get("/api/oficios/yo")
      .set({ Authorization: `${oficio.auth.Authorization}x` });
    expect(res.status).toBe(401);
    expect(res.body.error.codigo).toBe("token_invalido");
  });

  it("crea, edita parcialmente y gestiona servicios", async () => {
    const { auth } = await entorno.crearUsuario("oficio");

    const creado = await entorno
      .api()
      .post("/api/oficios")
      .set(auth)
      .send({ ...perfilValido, descripcion: "Bastas en el día" });
    expect(creado.status).toBe(201);
    expect(creado.body.datos.whatsapp).toBe("56912345678");
    expect(creado.body.datos.precisionUbicacion).toBe("aproximada");

    const duplicado = await entorno.api().post("/api/oficios").set(auth).send(perfilValido);
    expect(duplicado.status).toBe(409);

    const editado = await entorno.api().patch("/api/oficios/yo").set(auth).send({ nombrePublico: "Arreglos Marta" });
    expect(editado.status).toBe(200);
    expect(editado.body.datos.nombrePublico).toBe("Arreglos Marta");
    // Un PATCH parcial no debe borrar lo que no se envió.
    expect(editado.body.datos.descripcion).toBe("Bastas en el día");

    const servicio = await entorno
      .api()
      .post("/api/oficios/yo/servicios")
      .set(auth)
      .send({ categoria: "costura", titulo: "Bastas", prendas: ["pantalon"] });
    expect(servicio.status).toBe(201);
    expect(servicio.body.datos.precioDesde).toBeNull();

    const buscado = await entorno.api().get("/api/oficios").query({ q: "Arreglos Marta", prenda: "pantalon" });
    expect(buscado.body.datos).toHaveLength(1);

    const borrado = await entorno.api().delete(`/api/oficios/yo/servicios/${servicio.body.datos.id}`).set(auth);
    expect(borrado.status).toBe(204);
    const mio = await entorno.api().get("/api/oficios/yo").set(auth);
    expect(mio.body.datos.servicios).toHaveLength(0);
  });

  it("exige un medio de contacto válido", async () => {
    const { auth } = await entorno.crearUsuario("oficio");
    const sinContacto = await entorno
      .api()
      .post("/api/oficios")
      .set(auth)
      .send({ ...perfilValido, whatsapp: undefined });
    expect(sinContacto.status).toBe(400);
    const numeroMalo = await entorno
      .api()
      .post("/api/oficios")
      .set(auth)
      .send({ ...perfilValido, whatsapp: "1234" });
    expect(numeroMalo.status).toBe(400);
    expect(numeroMalo.body.error.detalles[0].campo).toBe("whatsapp");
  });

  it("no permite borrar servicios de otro oficio", async () => {
    const lista = await entorno.api().get("/api/oficios").query({ q: "Lucho" });
    const servicioAjeno = lista.body.datos[0].servicios[0].id;
    const { auth } = await entorno.crearUsuario("oficio");
    await entorno.api().post("/api/oficios").set(auth).send(perfilValido);
    const res = await entorno.api().delete(`/api/oficios/yo/servicios/${servicioAjeno}`).set(auth);
    expect(res.status).toBe(404);
  });
});

describe("POST /api/oficios/:id/contacto", () => {
  it("entrega el enlace de WhatsApp y suma a la métrica de impacto", async () => {
    const antes = await entorno.api().get("/api/impacto");
    const lista = await entorno.api().get("/api/oficios").query({ q: "Rosita" });
    const res = await entorno.api().post(`/api/oficios/${lista.body.datos[0].id}/contacto`).send({ canal: "whatsapp" });
    expect(res.status).toBe(201);
    expect(res.body.datos.url).toMatch(/^https:\/\/wa\.me\/56900000001\?text=/);
    const despues = await entorno.api().get("/api/impacto");
    expect(despues.body.datos.contactosReparacion).toBe(antes.body.datos.contactosReparacion + 1);
  });

  it("responde 422 si el oficio no tiene ese canal", async () => {
    const lista = await entorno.api().get("/api/oficios").query({ q: "Rosita" });
    const res = await entorno.api().post(`/api/oficios/${lista.body.datos[0].id}/contacto`).send({ canal: "telefono" });
    expect(res.status).toBe(422);
  });
});
