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
};
