/** Cliente mínimo de la API. Los tipos reflejan las respuestas documentadas en docs/05-api.md. */

export type Opcion = { id: string; etiqueta: string };

export type Catalogo = {
  categorias: Opcion[];
  prendas: (Opcion & { pesoKg: number })[];
  estados: Opcion[];
  comunas: string[];
  condiciones: Opcion[];
};

export type Recomendacion = {
  accion: "donar" | "reparar" | "reciclar";
  titulo: string;
  explicacion: string;
  categoria: string | null;
  filtros: Record<string, string>;
};

export type Impacto = {
  oficiosActivos: number;
  puntosDonacion: number;
  contactosReparacion: number;
  donacionesRecibidas: number;
  donacionesPendientes: number;
  prendasDonadas: number;
  kgTextilRecuperados: number;
  publicacionesActivas: number;
  prendasRecirculadas: number;
};

export type Horario = { dia: number; abre: string; cierra: string };

export type MiFundacion = {
  id: string;
  usuarioId: string;
  nombre: string;
  descripcion: string;
  comuna: string;
  direccion: string;
  lat: number;
  lng: number;
  horarios: Horario[];
  prendasAceptadas: string[];
  necesidadesActuales: string;
  aceptaDanada: boolean;
  telefono: string | null;
  email: string | null;
  verificado: boolean;
  activo: boolean;
};

export type DatosActualizarFundacion = Partial<
  Pick<
    MiFundacion,
    | "nombre"
    | "descripcion"
    | "comuna"
    | "direccion"
    | "lat"
    | "lng"
    | "horarios"
    | "prendasAceptadas"
    | "necesidadesActuales"
    | "aceptaDanada"
    | "telefono"
    | "email"
    | "activo"
  >
>;

export type EstadoDonacion = "registrada" | "recibida" | "cancelada";

export type DonacionFundacion = {
  id: string;
  fundacionId: string;
  donanteId: string | null;
  estado: EstadoDonacion;
  items: {
    prenda: string;
    cantidad: number;
    estado: string;
  }[];
  totalPrendas: number;
  kgEstimados: number;
  creadoEn: string;
  actualizadoEn: string;
  recibidaEn: string | null;
  fundacion: {
    id: string;
    nombre: string;
  };
};

export type PuntoDonacion = {
  id: string;
  nombre: string;
  descripcion: string;
  comuna: string;
  direccion: string;
  ubicacion: { lat: number; lng: number };
  distanciaKm: number | null;
  horarios: Horario[];
  abiertoAhora: boolean;
  prendasAceptadas: string[];
  necesidadesActuales: string;
  aceptaDanada: boolean;
  telefono: string | null;
  email: string | null;
  verificado: boolean;
};

export type ItemDonacion = { prenda: string; cantidad: number; estado: "buen_estado" };

export type EstadoPublicacion = "disponible" | "reservada" | "vendida";

export type Publicacion = {
  id: string;
  titulo: string;
  prenda: string;
  talla: string;
  condicion: string;
  precio: number;
  comuna: string;
  estado: EstadoPublicacion;
  foto: string | null;
  vendedor: { nombre: string };
  creadoEn: string;
};

export type DetallePublicacion = Publicacion & {
  descripcion: string;
  fotos: string[];
  vendedor: { nombre: string; desde: string };
  canales: { whatsapp: boolean; chat: boolean };
  esMia: boolean;
  whatsapp?: string | null;
};

export type MiPublicacion = Publicacion & { conversaciones: number };

export type DatosPublicar = {
  titulo: string;
  descripcion: string;
  prenda: string;
  talla: string;
  condicion: string;
  precio: number;
  comuna: string;
  whatsapp: string | null;
  fotos: { mime: string; datos: string }[];
};

export type FiltrosMercado = {
  prenda?: string;
  comuna?: string;
  q?: string;
  soloRegalo?: boolean;
  orden?: "recientes" | "precio_asc" | "precio_desc";
};

export type ResumenConversacion = {
  id: string;
  publicacion: { id: string; titulo: string; precio: number; estado: EstadoPublicacion; foto: string | null };
  rol: "comprador" | "vendedor";
  contraparte: { nombre: string };
  ultimoMensaje: string | null;
  ultimoMensajeEn: string;
  noLeidos: number;
};

export type Mensaje = { id: string; texto: string; creadoEn: string; mio: boolean };

export type Conversacion = ResumenConversacion & { mensajes: Mensaje[] };

export type Usuario = { id: string; nombre: string; email: string; rol: "persona" | "oficio" | "fundacion" | "admin" };

export type Sesion = { token: string; usuario: Usuario };

export type ServicioPublico = {
  id: string;
  categoria: string;
  titulo: string;
  descripcion: string;
  prendas: string[];
  precioDesde: number | null;
};

export type OficioPublico = {
  id: string;
  nombrePublico: string;
  descripcion: string;
  comuna: string;
  direccion: string | null;
  ubicacion: {
    lat: number;
    lng: number;
    precision: "exacta" | "aproximada";
  };
  distanciaKm: number | null;
  canales: {
    whatsapp: boolean;
    telefono: boolean;
  };
  verificado: boolean;
  servicios: ServicioPublico[];
};

export type MiOficio = {
  id: string;
  usuarioId: string;
  nombrePublico: string;
  descripcion: string;
  comuna: string;
  direccion: string | null;
  lat: number;
  lng: number;
  precisionUbicacion: "exacta" | "aproximada";
  telefono: string | null;
  whatsapp: string | null;
  verificado: boolean;
  activo: boolean;
  servicios: ServicioPublico[];
};

export type DatosGuardarOficio = {
  nombrePublico: string;
  descripcion: string;
  comuna: string;
  direccion?: string;
  lat: number;
  lng: number;
  precisionUbicacion: "exacta" | "aproximada";
  whatsapp?: string;
  telefono?: string;
};

export type DatosCrearServicio = {
  categoria: string;
  titulo: string;
  descripcion?: string;
  prendas: string[];
  precioDesde: number | null;
};

export type FiltrosOficios = {
  lat?: number;
  lng?: number;
  radioKm?: number;
  categoria?: string;
  prenda?: string;
  q?: string;
  limite?: number;
};

export type CanalContacto = "whatsapp" | "telefono";

export type RespuestaContacto = {
  canal: CanalContacto;
  url: string;
};

export type DetalleError = {
  campo: string;
  mensaje: string;
};

export const CLAVE_TOKEN = "hilo_token";

export class ErrorApi extends Error {
  constructor(
    readonly status: number,
    readonly codigo: string,
    message: string,
    readonly detalles: DetalleError[] = [],
    /** Detalles que no son errores por campo, por ejemplo { prendas: [...] } en una donación rechazada. */
    readonly extra: Record<string, unknown> = {},
  ) {
    super(message);
  }
}

export async function pedir<T>(ruta: string, opciones?: RequestInit): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem(CLAVE_TOKEN) : null;
  const cabeceras: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  let respuesta: Response;
  try {
    respuesta = await fetch(`/api${ruta}`, {
      ...opciones,
      headers: { ...cabeceras, ...(opciones?.headers as Record<string, string> | undefined) },
    });
  } catch {
    throw new ErrorApi(
      0,
      "sin_conexion",
      "No pudimos conectar con Hilo Circular. Revisa tu conexión e intenta de nuevo.",
    );
  }

  if (respuesta.status === 204) {
    return undefined as T;
  }

  const cuerpo = await respuesta.json().catch(() => null);
  if (!respuesta.ok) {
    const crudos = cuerpo?.error?.detalles;
    const detalles = Array.isArray(crudos) ? (crudos as DetalleError[]) : [];
    if (respuesta.status === 401 && token) {
      // La sesión guardada ya no sirve (expiró o cambió el secreto): se avisa para cerrarla.
      window.dispatchEvent(new Event("hilo:sesion-expirada"));
    }
    throw new ErrorApi(
      respuesta.status,
      cuerpo?.error?.codigo ?? "error",
      cuerpo?.error?.mensaje ?? "Ocurrió un problema. Intenta de nuevo en unos minutos.",
      detalles,
      crudos && !Array.isArray(crudos) && typeof crudos === "object" ? crudos : {},
    );
  }
  return cuerpo.datos as T;
}

export const api = {
  catalogo: () => pedir<Catalogo>("/catalogo"),
  impacto: () => pedir<Impacto>("/impacto"),
  orientacion: (prenda: string, estado: string) =>
    pedir<Recomendacion>(`/orientacion?${new URLSearchParams({ prenda, estado })}`),
  oficios: (filtros: FiltrosOficios = {}) => {
    const params = new URLSearchParams();
    if (filtros.lat !== undefined && filtros.lng !== undefined) {
      params.set("lat", String(filtros.lat));
      params.set("lng", String(filtros.lng));
    }
    if (filtros.radioKm !== undefined) params.set("radioKm", String(filtros.radioKm));
    if (filtros.categoria) params.set("categoria", filtros.categoria);
    if (filtros.prenda) params.set("prenda", filtros.prenda);
    if (filtros.q && filtros.q.trim().length >= 2) params.set("q", filtros.q.trim());
    if (filtros.limite !== undefined) params.set("limite", String(filtros.limite));
    const qs = params.toString();
    return pedir<OficioPublico[]>(qs ? `/oficios?${qs}` : "/oficios");
  },
  oficio: (id: string) => pedir<OficioPublico>(`/oficios/${encodeURIComponent(id)}`),
  contactarOficio: (id: string, canal: CanalContacto) =>
    pedir<RespuestaContacto>(`/oficios/${encodeURIComponent(id)}/contacto`, {
      method: "POST",
      body: JSON.stringify({ canal }),
    }),
  miOficio: () => pedir<MiOficio>("/oficios/yo"),
  crearMiOficio: (datos: DatosGuardarOficio) =>
    pedir<MiOficio>("/oficios", {
      method: "POST",
      body: JSON.stringify(datos),
    }),
  actualizarMiOficio: (datos: Partial<DatosGuardarOficio> & { activo?: boolean }) =>
    pedir<MiOficio>("/oficios/yo", {
      method: "PATCH",
      body: JSON.stringify(datos),
    }),
  agregarServicio: (datos: DatosCrearServicio) =>
    pedir<ServicioPublico>("/oficios/yo/servicios", {
      method: "POST",
      body: JSON.stringify(datos),
    }),
  eliminarServicio: (servicioId: string) =>
    pedir<void>(`/oficios/yo/servicios/${encodeURIComponent(servicioId)}`, {
      method: "DELETE",
    }),

  // Cuentas
  registro: (datos: { nombre: string; email: string; clave: string; rol: "persona" | "oficio" }) =>
    pedir<Sesion>("/auth/registro", { method: "POST", body: JSON.stringify(datos) }),
  ingreso: (datos: { email: string; clave: string }) =>
    pedir<Sesion>("/auth/ingreso", { method: "POST", body: JSON.stringify(datos) }),

  // Donar

  // Panel de fundación
  miFundacion: () => pedir<MiFundacion>("/fundaciones/yo"),

  actualizarMiFundacion: (datos: DatosActualizarFundacion) =>
    pedir<MiFundacion>("/fundaciones/yo", {
      method: "PATCH",
      body: JSON.stringify(datos),
    }),

  misDonaciones: () => pedir<DonacionFundacion[]>("/donaciones/mias"),

  confirmarRecepcion: (id: string) =>
    pedir<Omit<DonacionFundacion, "fundacion">>(`/donaciones/${encodeURIComponent(id)}/recepcion`, { method: "PATCH" }),

  puntosDonacion: (filtros: { prenda?: string; aceptaDanada?: boolean } = {}) => {
    const params = new URLSearchParams();
    if (filtros.prenda) params.set("prenda", filtros.prenda);
    if (filtros.aceptaDanada !== undefined) params.set("aceptaDanada", String(filtros.aceptaDanada));
    const qs = params.toString();
    return pedir<PuntoDonacion[]>(qs ? `/fundaciones?${qs}` : "/fundaciones");
  },
  registrarDonacion: (fundacionId: string, items: ItemDonacion[]) =>
    pedir<{ id: string; totalPrendas: number; kgEstimados: number }>("/donaciones", {
      method: "POST",
      body: JSON.stringify({ fundacionId, items }),
    }),

  // Mercado
  mercado: (filtros: FiltrosMercado = {}) => {
    const params = new URLSearchParams();
    if (filtros.prenda) params.set("prenda", filtros.prenda);
    if (filtros.comuna) params.set("comuna", filtros.comuna);
    if (filtros.q && filtros.q.trim().length >= 2) params.set("q", filtros.q.trim());
    if (filtros.soloRegalo) params.set("soloRegalo", "true");
    if (filtros.orden) params.set("orden", filtros.orden);
    const qs = params.toString();
    return pedir<Publicacion[]>(qs ? `/mercado?${qs}` : "/mercado");
  },
  publicacion: (id: string) => pedir<DetallePublicacion>(`/mercado/${encodeURIComponent(id)}`),
  misPublicaciones: () => pedir<MiPublicacion[]>("/mercado/mias"),
  publicar: (datos: DatosPublicar) =>
    pedir<DetallePublicacion>("/mercado", { method: "POST", body: JSON.stringify(datos) }),
  cambiarEstadoPublicacion: (id: string, estado: EstadoPublicacion) =>
    pedir<DetallePublicacion>(`/mercado/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify({ estado }),
    }),
  eliminarPublicacion: (id: string) => pedir<void>(`/mercado/${encodeURIComponent(id)}`, { method: "DELETE" }),
  whatsappPublicacion: (id: string) =>
    pedir<{ url: string }>(`/mercado/${encodeURIComponent(id)}/contacto`, { method: "POST" }),
  abrirConversacion: (publicacionId: string, texto?: string) =>
    pedir<{ id: string }>(`/mercado/${encodeURIComponent(publicacionId)}/conversacion`, {
      method: "POST",
      body: JSON.stringify(texto ? { texto } : {}),
    }),

  // Chat
  conversaciones: () => pedir<ResumenConversacion[]>("/conversaciones"),
  conversacion: (id: string) => pedir<Conversacion>(`/conversaciones/${encodeURIComponent(id)}`),
  enviarMensaje: (id: string, texto: string) =>
    pedir<Mensaje>(`/conversaciones/${encodeURIComponent(id)}/mensajes`, {
      method: "POST",
      body: JSON.stringify({ texto }),
    }),
  noLeidos: () => pedir<{ total: number }>("/conversaciones/no-leidos"),
};
