import { count, eq } from "drizzle-orm";
import type { Rol } from "../lib/catalogo.js";
import { hashearClave } from "../lib/claves.js";
import type { Db } from "./client.js";
import {
  conversaciones,
  fundaciones,
  type Horario,
  mensajes,
  oficios,
  publicaciones,
  servicios,
  usuarios,
} from "./schema.js";

/**
 * Datos de DEMOSTRACIÓN. Nombres, teléfonos y horarios son ficticios; las coordenadas caen en
 * barrios reales de La Serena y Coquimbo para que el mapa se vea creíble. Antes del piloto se
 * reemplazan por oficios y fundaciones reales que hayan dado su consentimiento.
 */

/** Hash inválido a propósito: las cuentas demo no permiten iniciar sesión con contraseña. */
const SIN_ACCESO = "!demo-sin-acceso";

const horarioHabil = (abre: string, cierra: string, dias = [1, 2, 3, 4, 5]): Horario[] =>
  dias.map((dia) => ({ dia, abre, cierra }));

const OFICIOS_DEMO = [
  {
    nombrePublico: "Costuras Rosita",
    descripcion: "Más de 30 años haciendo bastas, cambiando cierres y ajustando uniformes en Las Compañías.",
    comuna: "La Serena",
    lat: -29.8772,
    lng: -71.2331,
    precisionUbicacion: "aproximada" as const,
    whatsapp: "56900000001",
    verificado: true,
    servicios: [
      {
        categoria: "costura" as const,
        titulo: "Bastas y ajustes",
        prendas: ["pantalon" as const, "falda_vestido" as const, "uniforme_escolar" as const],
        precioDesde: 3000,
      },
      {
        categoria: "costura" as const,
        titulo: "Cambio de cierre",
        prendas: ["pantalon" as const, "chaqueta_abrigo" as const],
        precioDesde: 5000,
      },
    ],
  },
  {
    nombrePublico: "Zapatería Don Lucho",
    descripcion: "Cambio de suelas, tapillas y costuras de calzado. Local a pasos de la Recova.",
    comuna: "La Serena",
    direccion: "Calle ficticia 123, La Serena",
    lat: -29.9022,
    lng: -71.2475,
    precisionUbicacion: "exacta" as const,
    telefono: "56900000002",
    whatsapp: "56900000002",
    verificado: true,
    servicios: [
      {
        categoria: "zapateria" as const,
        titulo: "Suelas y tapillas",
        prendas: ["calzado" as const],
        precioDesde: 6000,
      },
      {
        categoria: "marroquineria" as const,
        titulo: "Reparación de bolsos y cinturones",
        prendas: ["bolso_cartera" as const],
        precioDesde: 4000,
      },
    ],
  },
  {
    nombrePublico: "Taller Hilvana",
    descripcion: "Arreglos de ropa y transformación de prendas antiguas en piezas nuevas.",
    comuna: "Coquimbo",
    lat: -29.9531,
    lng: -71.3389,
    precisionUbicacion: "aproximada" as const,
    whatsapp: "56900000003",
    verificado: false,
    servicios: [
      {
        categoria: "costura" as const,
        titulo: "Arreglos generales",
        prendas: ["polera_camisa" as const, "pantalon" as const, "falda_vestido" as const, "ropa_infantil" as const],
        precioDesde: 2500,
      },
    ],
  },
  {
    nombrePublico: "Tejidos La Antena",
    descripcion: "Zurcido de sweaters, reparación de puntos corridos y tejido a palillo.",
    comuna: "La Serena",
    lat: -29.9165,
    lng: -71.2361,
    precisionUbicacion: "aproximada" as const,
    whatsapp: "56900000004",
    verificado: true,
    servicios: [
      {
        categoria: "tejido" as const,
        titulo: "Zurcido y puntos corridos",
        prendas: ["sweater" as const, "ropa_infantil" as const],
        precioDesde: null,
      },
    ],
  },
  {
    nombrePublico: "Tapicería Tierras Blancas",
    descripcion: "Fundas, cortinas y reparación de ropa de cama.",
    comuna: "Coquimbo",
    lat: -29.9748,
    lng: -71.3172,
    precisionUbicacion: "aproximada" as const,
    telefono: "56900000005",
    verificado: false,
    servicios: [
      {
        categoria: "tapiceria" as const,
        titulo: "Ropa de cama y cortinas",
        prendas: ["ropa_de_cama" as const],
        precioDesde: 5000,
      },
    ],
  },
];

const FUNDACIONES_DEMO = [
  {
    nombre: "Ropero Solidario Las Compañías (demo)",
    descripcion: "Entrega ropa a familias del sector norte de La Serena.",
    comuna: "La Serena",
    direccion: "Sede vecinal ficticia, Las Compañías",
    lat: -29.8745,
    lng: -71.2398,
    horarios: horarioHabil("10:00", "13:00", [1, 3, 5]),
    prendasAceptadas: [
      "ropa_infantil" as const,
      "uniforme_escolar" as const,
      "chaqueta_abrigo" as const,
      "calzado" as const,
    ],
    necesidadesActuales: "Uniformes escolares de básica y parkas de niño para el invierno.",
    aceptaDanada: false,
    verificado: true,
  },
  {
    nombre: "Hogar Puerto Esperanza (demo)",
    descripcion: "Residencia para personas en situación de calle en Coquimbo.",
    comuna: "Coquimbo",
    direccion: "Dirección ficticia 456, Coquimbo",
    lat: -29.9566,
    lng: -71.3361,
    horarios: horarioHabil("09:00", "18:00", [1, 2, 3, 4, 5, 6]),
    prendasAceptadas: [],
    necesidadesActuales: "Ropa de hombre talla M y L, frazadas y calzado en buen estado.",
    aceptaDanada: false,
    verificado: true,
  },
  {
    nombre: "Punto Verde Textil Peñuelas (demo)",
    descripcion: "Recibe textiles dañados para reciclaje y prendas reutilizables para venta solidaria.",
    comuna: "Coquimbo",
    direccion: "Punto limpio ficticio, Peñuelas",
    lat: -29.9443,
    lng: -71.2853,
    horarios: horarioHabil("08:30", "17:30", [1, 2, 3, 4, 5, 6]),
    prendasAceptadas: [],
    necesidadesActuales: "",
    aceptaDanada: true,
    verificado: false,
  },
  {
    nombre: "Parroquia Barrio Universitario (demo)",
    descripcion: "Campaña permanente de ropa de invierno.",
    comuna: "La Serena",
    direccion: "Dirección ficticia 789, La Serena",
    lat: -29.9128,
    lng: -71.2391,
    horarios: horarioHabil("16:00", "19:00", [2, 4]),
    prendasAceptadas: ["chaqueta_abrigo" as const, "sweater" as const, "ropa_de_cama" as const],
    necesidadesActuales: "Frazadas y sweaters de adulto.",
    aceptaDanada: false,
    verificado: true,
  },
  {
    nombre: "Contenedor Textil Avenida del Mar (demo)",
    descripcion: "Contenedor de recepción abierto todos los días junto al sector de playas.",
    comuna: "La Serena",
    direccion: "Avenida del Mar, ubicación ficticia",
    lat: -29.9172,
    lng: -71.2688,
    horarios: horarioHabil("08:00", "21:00", [0, 1, 2, 3, 4, 5, 6]),
    prendasAceptadas: [],
    necesidadesActuales: "",
    aceptaDanada: true,
    verificado: true,
  },
  {
    nombre: "Centro Comunitario La Florida (demo)",
    descripcion: "Arma ajuares para familias que llegan al sector oriente de La Serena.",
    comuna: "La Serena",
    direccion: "Sede ficticia, La Florida",
    lat: -29.9302,
    lng: -71.2268,
    horarios: horarioHabil("15:00", "19:00", [1, 2, 3, 4]),
    prendasAceptadas: ["ropa_infantil" as const, "ropa_de_cama" as const, "polera_camisa" as const],
    necesidadesActuales: "Ropa de bebé de 0 a 12 meses y sábanas de una plaza.",
    aceptaDanada: false,
    verificado: true,
  },
  {
    nombre: "Junta Vecinal San Joaquín (demo)",
    descripcion: "Recolecta abrigo para adultos mayores del barrio.",
    comuna: "La Serena",
    direccion: "Sede vecinal ficticia, San Joaquín",
    lat: -29.9216,
    lng: -71.2449,
    horarios: horarioHabil("10:00", "12:30", [2, 4, 6]),
    prendasAceptadas: ["chaqueta_abrigo" as const, "sweater" as const, "pantalon" as const, "calzado" as const],
    necesidadesActuales: "Parkas y zapatos de adulto mayor, tallas 38 a 42.",
    aceptaDanada: false,
    verificado: false,
  },
  {
    nombre: "Ropero Escolar Tierras Blancas (demo)",
    descripcion: "Presta uniformes a estudiantes de básica y media durante el año escolar.",
    comuna: "Coquimbo",
    direccion: "Escuela ficticia, Tierras Blancas",
    lat: -29.9712,
    lng: -71.3065,
    horarios: horarioHabil("08:30", "13:00"),
    prendasAceptadas: ["uniforme_escolar" as const, "calzado" as const, "ropa_infantil" as const],
    necesidadesActuales: "Poleras piqué y buzos escolares tallas 8 a 14.",
    aceptaDanada: false,
    verificado: true,
  },
  {
    nombre: "Abrigo Compartido La Herradura (demo)",
    descripcion: "Grupo de voluntarios que reparte ropa en el sector puerto y La Herradura.",
    comuna: "Coquimbo",
    direccion: "Dirección ficticia, La Herradura",
    lat: -29.9838,
    lng: -71.3532,
    horarios: horarioHabil("17:00", "20:00", [1, 3, 5]),
    prendasAceptadas: [],
    necesidadesActuales: "Ropa de trabajo y zapatos de seguridad en buen estado.",
    aceptaDanada: false,
    verificado: true,
  },
  {
    nombre: "Punto Limpio Sindempart (demo)",
    descripcion: "Recibe textiles en cualquier estado: lo que no se reutiliza se envía a reciclaje.",
    comuna: "Coquimbo",
    direccion: "Punto limpio ficticio, Sindempart",
    lat: -29.9334,
    lng: -71.2965,
    horarios: horarioHabil("09:00", "17:00", [1, 2, 3, 4, 5, 6]),
    prendasAceptadas: [],
    necesidadesActuales: "",
    aceptaDanada: true,
    verificado: false,
  },
];

/**
 * Cuentas demo CON acceso, para mostrar el proyecto sin registrarse. La contraseña se publica en el
 * README a propósito: son datos ficticios y no deben existir en producción.
 */
export const CLAVE_DEMO = "hilo2026";
const CUENTAS_DEMO = [
  { email: "demo@hilocircular.cl", nombre: "Camila (demo)", rol: "persona" as const },
  { email: "taller@hilocircular.cl", nombre: "Taller de prueba (demo)", rol: "oficio" as const },
];

const VENDEDORES_DEMO = ["Valentina (demo)", "Matías (demo)", "Javiera (demo)"];

type PublicacionDemo = Omit<typeof publicaciones.$inferInsert, "vendedorId"> & { vendedor: number };

/** vendedor: índice en VENDEDORES_DEMO; -1 = la cuenta demo@hilocircular.cl. */
const PUBLICACIONES_DEMO: PublicacionDemo[] = [
  {
    vendedor: 0,
    titulo: "Parka acolchada azul marino",
    descripcion: "La usé un invierno. Abriga harto y tiene capucha desmontable. Sin manchas ni roturas.",
    prenda: "chaqueta_abrigo",
    talla: "M",
    condicion: "como_nueva",
    precio: 18000,
    comuna: "La Serena",
    whatsapp: "56911111111",
  },
  {
    vendedor: 1,
    titulo: "Jeans tiro alto celeste",
    descripcion: "Corte recto, me quedaron grandes. Se pueden probar en el centro de Coquimbo.",
    prenda: "pantalon",
    talla: "38",
    condicion: "buen_estado",
    precio: 7000,
    comuna: "Coquimbo",
    whatsapp: "56922222222",
  },
  {
    vendedor: 2,
    titulo: "Uniforme escolar completo",
    descripcion: "Falda, polera piqué y polerón. Mi hija ya pasó a media; lo regalo a quien lo necesite.",
    prenda: "uniforme_escolar",
    talla: "12 años",
    condicion: "buen_estado",
    precio: 0,
    comuna: "La Serena",
    whatsapp: null,
  },
  {
    vendedor: 0,
    titulo: "Zapatillas de running blancas",
    descripcion: "Usadas tres veces, me quedaron chicas. Incluyen la caja.",
    prenda: "calzado",
    talla: "40",
    condicion: "como_nueva",
    precio: 15000,
    comuna: "La Serena",
    whatsapp: "56911111111",
  },
  {
    vendedor: 1,
    titulo: "Vestido de lino verde oliva",
    descripcion: "Nuevo, todavía con etiqueta. Ideal para el verano.",
    prenda: "falda_vestido",
    talla: "S",
    condicion: "nueva_con_etiqueta",
    precio: 14000,
    comuna: "Coquimbo",
    whatsapp: "56922222222",
  },
  {
    vendedor: 2,
    titulo: "Sweater de lana tejido a mano",
    descripcion: "Tejido por mi abuela, lana gruesa color crudo.",
    prenda: "sweater",
    talla: "L",
    condicion: "buen_estado",
    precio: 9000,
    comuna: "La Serena",
    whatsapp: null,
  },
  {
    vendedor: 0,
    titulo: "Lote de ropa de bebé (8 prendas)",
    descripcion: "Bodies, piluchos y dos pantalones, de 6 a 12 meses. Todo lavado.",
    prenda: "ropa_infantil",
    talla: "6-12 meses",
    condicion: "buen_estado",
    precio: 10000,
    comuna: "Coquimbo",
    whatsapp: "56911111111",
  },
  {
    vendedor: 1,
    titulo: "Cartera de cuero café",
    descripcion: "Tiene un roce en una esquina (sale en la descripción para que no haya sorpresas).",
    prenda: "bolso_cartera",
    talla: "Única",
    condicion: "con_detalles",
    precio: 8000,
    comuna: "La Serena",
    whatsapp: "56922222222",
  },
  {
    vendedor: -1,
    titulo: "Camisa de mezclilla oversize",
    descripcion: "Muy poco uso. Puedo entregarla en la ULS.",
    prenda: "polera_camisa",
    talla: "L",
    condicion: "como_nueva",
    precio: 6500,
    comuna: "La Serena",
    whatsapp: null,
  },
  {
    vendedor: 2,
    titulo: "Chaqueta de cuero negra",
    descripcion: "Ya encontró nueva dueña.",
    prenda: "chaqueta_abrigo",
    talla: "M",
    condicion: "buen_estado",
    precio: 25000,
    comuna: "Coquimbo",
    whatsapp: null,
    estado: "vendida",
  },
];

async function cuentaDemo(db: Db, datos: { email: string; nombre: string; rol: Rol }, passwordHash: string) {
  const [existente] = await db.select().from(usuarios).where(eq(usuarios.email, datos.email));
  if (existente) return existente;
  const [usuario] = await db
    .insert(usuarios)
    .values({ ...datos, passwordHash })
    .returning();
  return usuario;
}

/**
 * Inserta los datos demo que falten. Cada bloque se revisa por separado, así una base creada antes
 * de que existiera el mercado recibe solo lo nuevo. Devuelve false si no había nada que agregar.
 */
export async function sembrar(db: Db): Promise<boolean> {
  let sembro = false;

  const [{ n: totalOficios }] = await db.select({ n: count() }).from(oficios);
  if (totalOficios === 0) {
    await sembrarOficios(db);
    sembro = true;
  }

  const existentes = new Set((await db.select({ nombre: fundaciones.nombre }).from(fundaciones)).map((f) => f.nombre));
  for (const [i, fundacion] of FUNDACIONES_DEMO.entries()) {
    if (existentes.has(fundacion.nombre)) continue;
    const usuario = await cuentaDemo(
      db,
      { email: `fundacion${i + 1}@demo.hilocircular.cl`, nombre: fundacion.nombre, rol: "fundacion" },
      SIN_ACCESO,
    );
    await db.insert(fundaciones).values({ ...fundacion, usuarioId: usuario.id });
    sembro = true;
  }

  const [{ n: totalPublicaciones }] = await db.select({ n: count() }).from(publicaciones);
  if (totalPublicaciones === 0) {
    await sembrarMercado(db);
    sembro = true;
  }

  return sembro;
}

async function sembrarMercado(db: Db) {
  const hashDemo = await hashearClave(CLAVE_DEMO);
  const [demo] = await Promise.all(CUENTAS_DEMO.map((cuenta) => cuentaDemo(db, cuenta, hashDemo)));
  const vendedores = [];
  for (const [i, nombre] of VENDEDORES_DEMO.entries()) {
    vendedores.push(
      await cuentaDemo(db, { email: `vendedor${i + 1}@demo.hilocircular.cl`, nombre, rol: "persona" }, SIN_ACCESO),
    );
  }

  const ahora = Date.now();
  const creadas = [];
  for (const [i, { vendedor, ...publicacion }] of PUBLICACIONES_DEMO.entries()) {
    // Fechas escalonadas para que "más recientes" tenga un orden creíble.
    const creadoEn = new Date(ahora - (i + 1) * 5 * 60 * 60 * 1000);
    const [fila] = await db
      .insert(publicaciones)
      .values({ ...publicacion, vendedorId: vendedor === -1 ? demo.id : vendedores[vendedor].id, creadoEn })
      .returning();
    creadas.push(fila);
  }

  // Una conversación iniciada, para que el chat de la cuenta demo no parta vacío.
  const parka = creadas[0];
  const [conversacion] = await db
    .insert(conversaciones)
    .values({ publicacionId: parka.id, compradorId: demo.id, vendedorId: parka.vendedorId })
    .returning();
  const hace = (minutos: number) => new Date(ahora - minutos * 60 * 1000);
  await db.insert(mensajes).values([
    {
      conversacionId: conversacion.id,
      autorId: demo.id,
      texto: "Hola! ¿La parka sigue disponible?",
      creadoEn: hace(50),
      leidoEn: hace(45),
    },
    {
      conversacionId: conversacion.id,
      autorId: parka.vendedorId,
      texto: "Hola Camila, sí. Puedo mostrártela mañana en la tarde cerca de la Plaza de Armas.",
      creadoEn: hace(40),
    },
  ]);
  await db
    .update(conversaciones)
    .set({ ultimoMensajeEn: hace(40) })
    .where(eq(conversaciones.id, conversacion.id));
}

async function sembrarOficios(db: Db) {
  for (const [i, { servicios: serviciosDemo, ...perfil }] of OFICIOS_DEMO.entries()) {
    const [usuario] = await db
      .insert(usuarios)
      .values({
        email: `oficio${i + 1}@demo.hilocircular.cl`,
        passwordHash: SIN_ACCESO,
        nombre: perfil.nombrePublico,
        rol: "oficio",
      })
      .returning();
    const [oficio] = await db
      .insert(oficios)
      .values({ ...perfil, usuarioId: usuario.id })
      .returning();
    await db.insert(servicios).values(serviciosDemo.map((s) => ({ ...s, oficioId: oficio.id })));
  }
}
