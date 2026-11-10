import L from "leaflet";
import { useEffect, useRef } from "react";
import type { PuntoDonacion } from "../lib/api";

/** Centro entre La Serena y Coquimbo: se ve toda la conurbación de una vez. */
const CENTRO_CONURBACION: L.LatLngTuple = [-29.935, -71.29];

function icono(punto: PuntoDonacion, seleccionado: boolean) {
  const tipo = seleccionado ? "marcador-activo" : punto.aceptaDanada ? "marcador-reciclaje" : "marcador-donacion";
  return L.divIcon({
    className: "",
    html: `<span class="marcador ${tipo}"><span></span></span>`,
    iconSize: [36, 44],
    iconAnchor: [18, 42],
  });
}

type Props = {
  puntos: PuntoDonacion[];
  seleccionadoId: string | null;
  alSeleccionar: (id: string) => void;
};

/**
 * Mapa de Leaflet con las teselas públicas de OpenStreetMap (gratis, sin API key; exigen la atribución). Leaflet se maneja directo
 * y no con react-leaflet: son pocas líneas y evitamos otra dependencia que actualizar.
 */
export function MapaPuntos({ puntos, seleccionadoId, alSeleccionar }: Props) {
  const contenedor = useRef<HTMLDivElement>(null);
  const mapa = useRef<L.Map | null>(null);
  const marcadores = useRef(new Map<string, L.Marker>());
  const alSeleccionarRef = useRef(alSeleccionar);
  alSeleccionarRef.current = alSeleccionar;

  useEffect(() => {
    if (!contenedor.current) return;
    const instancia = L.map(contenedor.current, { scrollWheelZoom: false, zoomControl: true }).setView(
      CENTRO_CONURBACION,
      12,
    );
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(instancia);
    mapa.current = instancia;
    return () => {
      instancia.remove();
      mapa.current = null;
      marcadores.current.clear();
    };
  }, []);

  // Rehace los marcadores cuando cambia la lista (filtros) y encuadra todos los puntos.
  // biome-ignore lint/correctness/useExhaustiveDependencies: la selección se pinta en el efecto de abajo
  useEffect(() => {
    const instancia = mapa.current;
    if (!instancia) return;
    for (const marcador of marcadores.current.values()) marcador.remove();
    marcadores.current.clear();

    for (const punto of puntos) {
      const marcador = L.marker([punto.ubicacion.lat, punto.ubicacion.lng], {
        icon: icono(punto, punto.id === seleccionadoId),
        title: punto.nombre,
        alt: punto.nombre,
        keyboard: true,
      })
        .on("click", () => alSeleccionarRef.current(punto.id))
        .addTo(instancia);
      marcadores.current.set(punto.id, marcador);
    }

    if (puntos.length > 0) {
      const limites = L.latLngBounds(puntos.map((p) => [p.ubicacion.lat, p.ubicacion.lng] as L.LatLngTuple));
      instancia.fitBounds(limites, { padding: [48, 48], maxZoom: 14 });
    }
  }, [puntos]);

  useEffect(() => {
    for (const punto of puntos) {
      marcadores.current.get(punto.id)?.setIcon(icono(punto, punto.id === seleccionadoId));
    }
    const elegido = puntos.find((p) => p.id === seleccionadoId);
    if (elegido && mapa.current) {
      mapa.current.flyTo([elegido.ubicacion.lat, elegido.ubicacion.lng], Math.max(mapa.current.getZoom(), 14), {
        duration: 0.6,
      });
      marcadores.current.get(elegido.id)?.setZIndexOffset(1000);
    }
  }, [seleccionadoId, puntos]);

  return (
    <div
      ref={contenedor}
      role="application"
      aria-label="Mapa de puntos de donación. La misma información está en la lista."
      className="size-full"
    />
  );
}
