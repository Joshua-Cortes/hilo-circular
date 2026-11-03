/** Cliente mínimo de la API. Los tipos reflejan las respuestas documentadas en docs/05-api.md. */

export type Opcion = { id: string; etiqueta: string };

export type Catalogo = {
  categorias: Opcion[];
  prendas: (Opcion & { pesoKg: number })[];
  estados: Opcion[];
  comunas: string[];
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
};

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

export class ErrorApi extends Error {
  constructor(
    readonly status: number,
    readonly codigo: string,
    message: string,
  ) {
    super(message);
  }
}

export async function pedir<T>(ruta: string, opciones?: RequestInit): Promise<T> {
  let respuesta: Response;
  try {
    respuesta = await fetch(`/api${ruta}`, {
      ...opciones,
      headers: { "Content-Type": "application/json", ...opciones?.headers },
    });
  } catch {
    throw new ErrorApi(
      0,
      "sin_conexion",
      "No pudimos conectar con Hilo Circular. Revisa tu conexión e intenta de nuevo.",
    );
  }
  const cuerpo = await respuesta.json().catch(() => null);
  if (!respuesta.ok) {
    throw new ErrorApi(
      respuesta.status,
      cuerpo?.error?.codigo ?? "error",
      cuerpo?.error?.mensaje ?? "Ocurrió un problema. Intenta de nuevo en unos minutos.",
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
};
