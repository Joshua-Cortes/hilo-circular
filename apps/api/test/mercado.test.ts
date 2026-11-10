import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { crearEntorno, type Entorno } from "./ayudantes.js";

let entorno: Entorno;

beforeAll(async () => {
  entorno = await crearEntorno();
});
afterAll(() => entorno.cerrar());

/** PNG de 1×1 px: lo más chico que pasa la revisión de firma. */
const PNG_MINIMO = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

const publicacionValida = {
  titulo: "Polerón gris con capucha",
  descripcion: "Poco uso",
  prenda: "sweater",
  talla: "M",
  condicion: "como_nueva",
  precio: 5000,
  comuna: "La Serena",
  whatsapp: "+56 9 8765 4321",
};

describe("GET /api/mercado", () => {
  it("lista las prendas demo sin las vendidas", async () => {
    const res = await entorno.api().get("/api/mercado");
    expect(res.status).toBe(200);
    expect(res.body.datos.length).toBeGreaterThan(5);
    expect(res.body.datos.every((p: { estado: string }) => p.estado !== "vendida")).toBe(true);
  });

  it("filtra por prenda, regalo y ordena por precio", async () => {
    const regalos = await entorno.api().get("/api/mercado").query({ soloRegalo: "true" });
    expect(regalos.body.datos.every((p: { precio: number }) => p.precio === 0)).toBe(true);

    const baratos = await entorno.api().get("/api/mercado").query({ orden: "precio_asc" });
    const precios = baratos.body.datos.map((p: { precio: number }) => p.precio);
    expect(precios).toEqual([...precios].sort((a, b) => a - b));

    const calzado = await entorno.api().get("/api/mercado").query({ prenda: "calzado" });
    expect(calzado.body.datos.every((p: { prenda: string }) => p.prenda === "calzado")).toBe(true);
  });
});

describe("publicar", () => {
  it("exige sesión", async () => {
    const res = await entorno.api().post("/api/mercado").send(publicacionValida);
    expect(res.status).toBe(401);
  });

  it("publica con foto, normaliza el WhatsApp y sirve la imagen", async () => {
    const { auth } = await entorno.crearUsuario("persona");
    const res = await entorno
      .api()
      .post("/api/mercado")
      .set(auth)
      .send({ ...publicacionValida, fotos: [{ mime: "image/png", datos: PNG_MINIMO }] });
    expect(res.status).toBe(201);
    expect(res.body.datos).toMatchObject({ esMia: true, whatsapp: "56987654321", estado: "disponible" });
    expect(res.body.datos.fotos).toHaveLength(1);

    const imagen = await entorno.api().get(res.body.datos.fotos[0]);
    expect(imagen.status).toBe(200);
    expect(imagen.headers["content-type"]).toBe("image/png");
  });

  it("rechaza archivos que dicen ser imagen pero no lo son", async () => {
    const { auth } = await entorno.crearUsuario("persona");
    const res = await entorno
      .api()
      .post("/api/mercado")
      .set(auth)
      .send({
        ...publicacionValida,
        fotos: [{ mime: "image/jpeg", datos: Buffer.from("<script>").toString("base64") }],
      });
    expect(res.status).toBe(400);
    expect(res.body.error.codigo).toBe("foto_invalida");
  });

  it("solo quien publicó puede marcarla vendida, y entonces sale del listado", async () => {
    const duena = await entorno.crearUsuario("persona");
    const otra = await entorno.crearUsuario("persona");
    const { body } = await entorno.api().post("/api/mercado").set(duena.auth).send(publicacionValida);
    const id = body.datos.id;

    const ajena = await entorno.api().patch(`/api/mercado/${id}`).set(otra.auth).send({ estado: "vendida" });
    expect(ajena.status).toBe(403);

    const propia = await entorno.api().patch(`/api/mercado/${id}`).set(duena.auth).send({ estado: "vendida" });
    expect(propia.body.datos.estado).toBe("vendida");

    const listado = await entorno.api().get("/api/mercado");
    expect(listado.body.datos.some((p: { id: string }) => p.id === id)).toBe(false);
    const mias = await entorno.api().get("/api/mercado/mias").set(duena.auth);
    expect(mias.body.datos.some((p: { id: string }) => p.id === id)).toBe(true);
  });

  it("arma el enlace de WhatsApp solo si la persona dejó su número", async () => {
    const { auth } = await entorno.crearUsuario("persona");
    const con = await entorno.api().post("/api/mercado").set(auth).send(publicacionValida);
    const enlace = await entorno.api().post(`/api/mercado/${con.body.datos.id}/contacto`);
    expect(enlace.body.datos.url).toMatch(/^https:\/\/wa\.me\/56987654321\?text=/);

    const sin = await entorno
      .api()
      .post("/api/mercado")
      .set(auth)
      .send({ ...publicacionValida, whatsapp: null });
    const sinEnlace = await entorno.api().post(`/api/mercado/${sin.body.datos.id}/contacto`);
    expect(sinEnlace.status).toBe(422);
    // Nunca se expone el número de otra persona en el detalle.
    const detalle = await entorno.api().get(`/api/mercado/${con.body.datos.id}`);
    expect(detalle.body.datos.whatsapp).toBeUndefined();
  });
});

describe("chat", () => {
  it("comprador y vendedor conversan y se cuentan los no leídos", async () => {
    const vendedora = await entorno.crearUsuario("persona");
    const comprador = await entorno.crearUsuario("persona");
    const { body } = await entorno.api().post("/api/mercado").set(vendedora.auth).send(publicacionValida);

    const inicio = await entorno
      .api()
      .post(`/api/mercado/${body.datos.id}/conversacion`)
      .set(comprador.auth)
      .send({ texto: "Hola, ¿sigue disponible?" });
    expect(inicio.status).toBe(201);
    const conversacionId = inicio.body.datos.id;

    // Volver a iniciar retoma la misma conversación.
    const otraVez = await entorno.api().post(`/api/mercado/${body.datos.id}/conversacion`).set(comprador.auth);
    expect(otraVez.body.datos.id).toBe(conversacionId);

    const pendientes = await entorno.api().get("/api/conversaciones/no-leidos").set(vendedora.auth);
    expect(pendientes.body.datos.total).toBe(1);

    const bandeja = await entorno.api().get("/api/conversaciones").set(vendedora.auth);
    expect(bandeja.body.datos[0]).toMatchObject({ id: conversacionId, rol: "vendedor", noLeidos: 1 });

    const abierta = await entorno.api().get(`/api/conversaciones/${conversacionId}`).set(vendedora.auth);
    expect(abierta.body.datos.mensajes).toEqual([
      expect.objectContaining({ texto: "Hola, ¿sigue disponible?", mio: false }),
    ]);
    const leidos = await entorno.api().get("/api/conversaciones/no-leidos").set(vendedora.auth);
    expect(leidos.body.datos.total).toBe(0);

    const respuesta = await entorno
      .api()
      .post(`/api/conversaciones/${conversacionId}/mensajes`)
      .set(vendedora.auth)
      .send({ texto: "Sí, te la muestro mañana" });
    expect(respuesta.status).toBe(201);
    const vistaComprador = await entorno.api().get(`/api/conversaciones/${conversacionId}`).set(comprador.auth);
    expect(vistaComprador.body.datos.mensajes.map((m: { mio: boolean }) => m.mio)).toEqual([true, false]);
  });

  it("nadie fuera de la conversación puede leerla ni escribir", async () => {
    const vendedora = await entorno.crearUsuario("persona");
    const comprador = await entorno.crearUsuario("persona");
    const intrusa = await entorno.crearUsuario("persona");
    const { body } = await entorno.api().post("/api/mercado").set(vendedora.auth).send(publicacionValida);
    const inicio = await entorno.api().post(`/api/mercado/${body.datos.id}/conversacion`).set(comprador.auth);

    const leer = await entorno.api().get(`/api/conversaciones/${inicio.body.datos.id}`).set(intrusa.auth);
    expect(leer.status).toBe(404);
    const escribir = await entorno
      .api()
      .post(`/api/conversaciones/${inicio.body.datos.id}/mensajes`)
      .set(intrusa.auth)
      .send({ texto: "hola" });
    expect(escribir.status).toBe(404);
  });

  it("no se puede abrir un chat con una publicación propia", async () => {
    const vendedora = await entorno.crearUsuario("persona");
    const { body } = await entorno.api().post("/api/mercado").set(vendedora.auth).send(publicacionValida);
    const res = await entorno.api().post(`/api/mercado/${body.datos.id}/conversacion`).set(vendedora.auth);
    expect(res.status).toBe(400);
  });
});
