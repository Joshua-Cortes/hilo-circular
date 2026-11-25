import { relations } from "drizzle-orm";
import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import {
  CATEGORIAS_SERVICIO,
  CONDICIONES_PRENDA,
  ESTADOS_DONACION,
  ESTADOS_PUBLICACION,
  PRECISIONES_UBICACION,
  ROLES,
  TIPOS_PRENDA,
} from "../lib/catalogo.js";

export const rolEnum = pgEnum("rol", ROLES);
export const categoriaServicioEnum = pgEnum("categoria_servicio", CATEGORIAS_SERVICIO);
export const tipoPrendaEnum = pgEnum("tipo_prenda", TIPOS_PRENDA);
export const precisionUbicacionEnum = pgEnum("precision_ubicacion", PRECISIONES_UBICACION);
export const estadoDonacionEnum = pgEnum("estado_donacion", ESTADOS_DONACION);
export const canalContactoEnum = pgEnum("canal_contacto", ["whatsapp", "telefono"]);
export const condicionPrendaEnum = pgEnum("condicion_prenda", CONDICIONES_PRENDA);
export const estadoPublicacionEnum = pgEnum("estado_publicacion", ESTADOS_PUBLICACION);

const timestamps = {
  creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
  actualizadoEn: timestamp("actualizado_en", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

/** Cuenta de acceso. El registro e inicio de sesión los implementa el módulo de autenticación. */
export const usuarios = pgTable("usuarios", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  nombre: text("nombre").notNull(),
  rol: rolEnum("rol").notNull().default("persona"),
  ...timestamps,
});

/** Perfil público de un oficio (costurera, zapatero, etc.). Un usuario con rol "oficio" tiene a lo más uno. */
export const oficios = pgTable("oficios", {
  id: uuid("id").primaryKey().defaultRandom(),
  usuarioId: uuid("usuario_id")
    .notNull()
    .unique()
    .references(() => usuarios.id, { onDelete: "cascade" }),
  nombrePublico: text("nombre_publico").notNull(),
  descripcion: text("descripcion").notNull().default(""),
  comuna: text("comuna").notNull(),
  direccion: text("direccion"),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  /** "aproximada" protege a quienes trabajan desde su casa: la API no expone dirección ni coordenadas exactas. */
  precisionUbicacion: precisionUbicacionEnum("precision_ubicacion").notNull().default("aproximada"),
  whatsapp: text("whatsapp"),
  telefono: text("telefono"),
  verificado: boolean("verificado").notNull().default(false),
  activo: boolean("activo").notNull().default(true),
  ...timestamps,
});

export const servicios = pgTable(
  "servicios",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    oficioId: uuid("oficio_id")
      .notNull()
      .references(() => oficios.id, { onDelete: "cascade" }),
    categoria: categoriaServicioEnum("categoria").notNull(),
    titulo: text("titulo").notNull(),
    descripcion: text("descripcion").notNull().default(""),
    prendas: tipoPrendaEnum("prendas").array().notNull().default([]),
    /** Precio referencial en pesos chilenos. Null = "a convenir". */
    precioDesde: integer("precio_desde"),
    ...timestamps,
  },
  (t) => [index("servicios_oficio_idx").on(t.oficioId), index("servicios_prendas_idx").using("gin", t.prendas)],
);

export type Horario = { dia: number; abre: string; cierra: string };

/** Punto de acopio de una fundación u organización receptora de ropa. */
export const fundaciones = pgTable("fundaciones", {
  id: uuid("id").primaryKey().defaultRandom(),
  usuarioId: uuid("usuario_id").references(() => usuarios.id, { onDelete: "set null" }),
  nombre: text("nombre").notNull(),
  descripcion: text("descripcion").notNull().default(""),
  comuna: text("comuna").notNull(),
  direccion: text("direccion").notNull(),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  /** Horarios de recepción; dia: 0 = domingo … 6 = sábado (hora de Chile continental). */
  horarios: jsonb("horarios").$type<Horario[]>().notNull().default([]),
  /** Prendas que acepta. Arreglo vacío = acepta cualquier tipo. */
  prendasAceptadas: tipoPrendaEnum("prendas_aceptadas").array().notNull().default([]),
  /** Lo que la fundación necesita con urgencia ahora (texto libre, lo actualiza la propia fundación). */
  necesidadesActuales: text("necesidades_actuales").notNull().default(""),
  aceptaDanada: boolean("acepta_danada").notNull().default(false),
  telefono: text("telefono"),
  email: text("email"),
  verificado: boolean("verificado").notNull().default(false),
  activo: boolean("activo").notNull().default(true),
  ...timestamps,
});

export type ItemDonacion = {
  prenda: (typeof TIPOS_PRENDA)[number];
  cantidad: number;
  estado: "buen_estado" | "dano_reparable" | "muy_deteriorada";
};

export const donaciones = pgTable(
  "donaciones",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fundacionId: uuid("fundacion_id")
      .notNull()
      .references(() => fundaciones.id, { onDelete: "restrict" }),
    donanteId: uuid("donante_id").references(() => usuarios.id, { onDelete: "set null" }),
    items: jsonb("items").$type<ItemDonacion[]>().notNull(),
    totalPrendas: integer("total_prendas").notNull(),
    kgEstimados: real("kg_estimados").notNull(),
    estado: estadoDonacionEnum("estado").notNull().default("registrada"),
    recibidaEn: timestamp("recibida_en", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [index("donaciones_fundacion_idx").on(t.fundacionId), index("donaciones_donante_idx").on(t.donanteId)],
);

/** Cada vez que alguien contacta a un oficio desde la plataforma. Es la métrica de "reparaciones iniciadas". */
export const contactos = pgTable(
  "contactos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    oficioId: uuid("oficio_id")
      .notNull()
      .references(() => oficios.id, { onDelete: "cascade" }),
    usuarioId: uuid("usuario_id").references(() => usuarios.id, { onDelete: "set null" }),
    canal: canalContactoEnum("canal").notNull(),
    creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("contactos_oficio_idx").on(t.oficioId)],
);

/** Prenda publicada en el mercado de segunda mano. No hay pasarela de pago: se acuerda por chat o WhatsApp. */
export const publicaciones = pgTable(
  "publicaciones",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    vendedorId: uuid("vendedor_id")
      .notNull()
      .references(() => usuarios.id, { onDelete: "cascade" }),
    titulo: text("titulo").notNull(),
    descripcion: text("descripcion").notNull().default(""),
    prenda: tipoPrendaEnum("prenda").notNull(),
    /** Texto libre: "M", "38", "10 años". */
    talla: text("talla").notNull(),
    condicion: condicionPrendaEnum("condicion").notNull(),
    /** Pesos chilenos. 0 = se regala. */
    precio: integer("precio").notNull(),
    comuna: text("comuna").notNull(),
    /** Opcional: si no hay WhatsApp, el contacto es solo por el chat de la plataforma. */
    whatsapp: text("whatsapp"),
    estado: estadoPublicacionEnum("estado").notNull().default("disponible"),
    ...timestamps,
  },
  (t) => [index("publicaciones_vendedor_idx").on(t.vendedorId), index("publicaciones_estado_idx").on(t.estado)],
);

/**
 * Fotos de una publicación, en base64. Van en su propia tabla para que los listados no las arrastren
 * y se sirven como imagen desde GET /api/mercado/fotos/:id. Así el despliegue no necesita un bucket.
 */
export const fotosPublicacion = pgTable(
  "fotos_publicacion",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    publicacionId: uuid("publicacion_id")
      .notNull()
      .references(() => publicaciones.id, { onDelete: "cascade" }),
    orden: integer("orden").notNull(),
    mime: text("mime").notNull(),
    datos: text("datos").notNull(),
  },
  (t) => [index("fotos_publicacion_idx").on(t.publicacionId)],
);

/** Una conversación por comprador y publicación. */
export const conversaciones = pgTable(
  "conversaciones",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    publicacionId: uuid("publicacion_id")
      .notNull()
      .references(() => publicaciones.id, { onDelete: "cascade" }),
    compradorId: uuid("comprador_id")
      .notNull()
      .references(() => usuarios.id, { onDelete: "cascade" }),
    vendedorId: uuid("vendedor_id")
      .notNull()
      .references(() => usuarios.id, { onDelete: "cascade" }),
    creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
    /** Fecha del último mensaje: ordena la bandeja de entrada. */
    ultimoMensajeEn: timestamp("ultimo_mensaje_en", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("conversaciones_publicacion_comprador_idx").on(t.publicacionId, t.compradorId),
    index("conversaciones_comprador_idx").on(t.compradorId),
    index("conversaciones_vendedor_idx").on(t.vendedorId),
  ],
);

export const mensajes = pgTable(
  "mensajes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversacionId: uuid("conversacion_id")
      .notNull()
      .references(() => conversaciones.id, { onDelete: "cascade" }),
    autorId: uuid("autor_id")
      .notNull()
      .references(() => usuarios.id, { onDelete: "cascade" }),
    texto: text("texto").notNull(),
    leidoEn: timestamp("leido_en", { withTimezone: true }),
    creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("mensajes_conversacion_idx").on(t.conversacionId, t.creadoEn)],
);

export const oficiosRelations = relations(oficios, ({ many, one }) => ({
  servicios: many(servicios),
  usuario: one(usuarios, { fields: [oficios.usuarioId], references: [usuarios.id] }),
}));

export const serviciosRelations = relations(servicios, ({ one }) => ({
  oficio: one(oficios, { fields: [servicios.oficioId], references: [oficios.id] }),
}));

export const donacionesRelations = relations(donaciones, ({ one }) => ({
  fundacion: one(fundaciones, { fields: [donaciones.fundacionId], references: [fundaciones.id] }),
}));
