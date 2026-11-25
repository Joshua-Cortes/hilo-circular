import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { crearEntorno, type Entorno } from "./ayudantes.js";

let entorno: Entorno;

beforeAll(async () => {
  entorno = await crearEntorno();
});
afterAll(() => entorno.cerrar());

const perfilRepartoValido = {
  nombrePublico: "Pedalea Elqui",
  descripcion: "Retiros y entregas en bicicleta dentro del radio urbano",
  comunas: ["La Serena", "Coquimbo"],
  whatsapp: "+56 9 8765 4321",
};

describe("Delivery por zona (/api/repartidores)", () => {
  it("parte sin repartidores ficticios en el directorio ni contactos en impacto", async () => {
    const lista = await entorno.api().get("/api/repartidores");
    expect(lista.status).toBe(200);
    expect(lista.body.datos).toEqual([]);

    const impacto = await entorno.api().get("/api/impacto");
    expect(impacto.status).toBe(200);
    expect(impacto.body.datos.contactosDelivery).toBe(0);
  });

  it("exige sesión para consultar o publicar el perfil propio", async () => {
    expect((await entorno.api().get("/api/repartidores/yo")).status).toBe(401);
    expect((await entorno.api().post("/api/repartidores").send(perfilRepartoValido)).status).toBe(401);
    expect((await entorno.api().patch("/api/repartidores/yo").send({ activo: false })).status).toBe(401);
  });

  it("valida comunas y al menos un medio de contacto al crear perfil", async () => {
    const { auth } = await entorno.crearUsuario("persona");

    const sinComunas = await entorno
      .api()
      .post("/api/repartidores")
      .set(auth)
      .send({ nombrePublico: "Sin zona", comunas: [], whatsapp: "+56 9 1111 2222" });
    expect(sinComunas.status).toBe(400);

    const sinContacto = await entorno
      .api()
      .post("/api/repartidores")
      .set(auth)
      .send({ nombrePublico: "Sin teléfono", comunas: ["La Serena"] });
    expect(sinContacto.status).toBe(400);
  });

  it("permite crear, filtrar por comuna sin exponer teléfonos, pausar y registrar contacto", async () => {
    const { auth } = await entorno.crearUsuario("persona");

    const inicial = await entorno.api().get("/api/repartidores/yo").set(auth);
    expect(inicial.status).toBe(200);
    expect(inicial.body.datos).toBeNull();

    const creado = await entorno.api().post("/api/repartidores").set(auth).send(perfilRepartoValido);
    expect(creado.status).toBe(201);
    expect(creado.body.datos.nombrePublico).toBe("Pedalea Elqui");
    expect(creado.body.datos.activo).toBe(true);
    const id = creado.body.datos.id as string;

    const duplicado = await entorno.api().post("/api/repartidores").set(auth).send(perfilRepartoValido);
    expect(duplicado.status).toBe(409);

    // Filtra por comuna y protege el número crudo en el listado público.
    const enSerena = await entorno.api().get("/api/repartidores").query({ comuna: "La Serena" });
    expect(enSerena.status).toBe(200);
    expect(enSerena.body.datos).toHaveLength(1);
    expect(enSerena.body.datos[0].canales).toEqual({ whatsapp: true, telefono: false });
    expect(JSON.stringify(enSerena.body.datos[0])).not.toContain("87654321");

    const enOvalle = await entorno.api().get("/api/repartidores").query({ comuna: "Ovalle" });
    expect(enOvalle.status).toBe(200);
    expect(enOvalle.body.datos).toHaveLength(0);

    // Contacto rechaza comuna no cubierta o canal no configurado.
    const comunaNoCubierta = await entorno
      .api()
      .post(`/api/repartidores/${id}/contacto`)
      .send({ comuna: "Ovalle", canal: "whatsapp" });
    expect(comunaNoCubierta.status).toBe(404);

    const canalNoRegistrado = await entorno
      .api()
      .post(`/api/repartidores/${id}/contacto`)
      .send({ comuna: "Coquimbo", canal: "telefono" });
    expect(canalNoRegistrado.status).toBe(422);

    // Contacto válido devuelve enlace wa.me e incrementa contactosDelivery.
    const contactoOk = await entorno
      .api()
      .post(`/api/repartidores/${id}/contacto`)
      .send({ comuna: "Coquimbo", canal: "whatsapp" });
    expect(contactoOk.status).toBe(201);
    expect(contactoOk.body.datos.canal).toBe("whatsapp");
    expect(contactoOk.body.datos.url).toContain("https://wa.me/56987654321");

    const impacto = await entorno.api().get("/api/impacto");
    expect(impacto.status).toBe(200);
    expect(impacto.body.datos.contactosDelivery).toBe(1);

    // Pausar oculta del directorio y bloquea contactos nuevos; reactivar lo habilita.
    const pausado = await entorno.api().patch("/api/repartidores/yo").set(auth).send({ activo: false });
    expect(pausado.status).toBe(200);
    expect(pausado.body.datos.activo).toBe(false);

    const listaTrasPausa = await entorno.api().get("/api/repartidores");
    expect(listaTrasPausa.body.datos).toHaveLength(0);

    const contactoPausado = await entorno
      .api()
      .post(`/api/repartidores/${id}/contacto`)
      .send({ comuna: "La Serena", canal: "whatsapp" });
    expect(contactoPausado.status).toBe(404);

    const reactivado = await entorno
      .api()
      .patch("/api/repartidores/yo")
      .set(auth)
      .send({ activo: true, telefono: "+56 9 2222 3333" });
    expect(reactivado.status).toBe(200);
    expect(reactivado.body.datos.activo).toBe(true);
    expect(reactivado.body.datos.telefono).toBe("56922223333");
  });
});
