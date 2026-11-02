import { count } from "drizzle-orm";
import type { Db } from "./client.js";
import { fundaciones, type Horario, oficios, servicios, usuarios } from "./schema.js";

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
];

/** Inserta los datos demo si la base está vacía. Devuelve false si ya había datos. */
export async function sembrar(db: Db): Promise<boolean> {
  const [{ n }] = await db.select({ n: count() }).from(oficios);
  if (n > 0) return false;

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

  for (const [i, fundacion] of FUNDACIONES_DEMO.entries()) {
    const [usuario] = await db
      .insert(usuarios)
      .values({
        email: `fundacion${i + 1}@demo.hilocircular.cl`,
        passwordHash: SIN_ACCESO,
        nombre: fundacion.nombre,
        rol: "fundacion",
      })
      .returning();
    await db.insert(fundaciones).values({ ...fundacion, usuarioId: usuario.id });
  }

  return true;
}
