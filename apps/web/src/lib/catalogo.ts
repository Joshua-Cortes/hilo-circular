import { useEffect, useMemo, useState } from "react";
import { api, type Catalogo } from "./api";

// Una sola petición por carga de página: el catálogo casi no cambia.
let pendiente: Promise<Catalogo> | null = null;

export function useCatalogo() {
  const [catalogo, setCatalogo] = useState<Catalogo | null>(null);

  useEffect(() => {
    pendiente ??= api.catalogo().catch((e) => {
      pendiente = null;
      throw e;
    });
    let vigente = true;
    pendiente.then((c) => vigente && setCatalogo(c)).catch(() => {});
    return () => {
      vigente = false;
    };
  }, []);

  const etiquetas = useMemo(() => {
    const mapa = (lista: { id: string; etiqueta: string }[] = []) => new Map(lista.map((o) => [o.id, o.etiqueta]));
    return {
      prenda: mapa(catalogo?.prendas),
      categoria: mapa(catalogo?.categorias),
      condicion: mapa(catalogo?.condiciones),
    };
  }, [catalogo]);

  return { catalogo, etiquetas };
}

const clp = new Intl.NumberFormat("es-CL");

export const formatearPrecioVenta = (precio: number) => (precio === 0 ? "Se regala" : `$${clp.format(precio)}`);

export function haceCuanto(fecha: string) {
  const minutos = Math.round((Date.now() - new Date(fecha).getTime()) / 60_000);
  if (minutos < 1) return "recién";
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.round(horas / 24);
  return dias === 1 ? "ayer" : `hace ${dias} días`;
}
