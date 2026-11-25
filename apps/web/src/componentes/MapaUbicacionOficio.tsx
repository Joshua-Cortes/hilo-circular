import L from "leaflet";
import { useEffect, useRef } from "react";

type Props = {
  lat: number;
  lng: number;
  precision: "aproximada" | "exacta";
  nombre: string;
  alElegirPunto?: (lat: number, lng: number) => void;
};

function iconoExacto() {
  return L.divIcon({
    className: "",
    html: `<span class="marcador marcador-activo"><span></span></span>`,
    iconSize: [36, 44],
    iconAnchor: [18, 42],
  });
}

/**
 * Mapa Leaflet para mostrar o seleccionar la ubicación de un oficio.
 * Con precisión "aproximada" dibuja un círculo de ~1 km sin exponer la dirección exacta;
 * con precisión "exacta" muestra un marcador en el punto comercial.
 */
export function MapaUbicacionOficio({ lat, lng, precision, nombre, alElegirPunto }: Props) {
  const contenedor = useRef<HTMLDivElement>(null);
  const mapa = useRef<L.Map | null>(null);
  const capa = useRef<L.Layer | null>(null);
  const alElegirRef = useRef(alElegirPunto);
  alElegirRef.current = alElegirPunto;

  // Inicializa el mapa una sola vez.
  // biome-ignore lint/correctness/useExhaustiveDependencies: las coordenadas y precisión se actualizan en el efecto siguiente
  useEffect(() => {
    if (!contenedor.current) return;
    const instancia = L.map(contenedor.current, {
      scrollWheelZoom: false,
      zoomControl: true,
    }).setView([lat, lng], precision === "aproximada" ? 13 : 15);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(instancia);

    instancia.on("click", (e: L.LeafletMouseEvent) => {
      if (alElegirRef.current) {
        alElegirRef.current(Number(e.latlng.lat.toFixed(4)), Number(e.latlng.lng.toFixed(4)));
      }
    });

    mapa.current = instancia;
    return () => {
      instancia.remove();
      mapa.current = null;
      capa.current = null;
    };
  }, []);

  useEffect(() => {
    const instancia = mapa.current;
    if (!instancia) return;
    if (capa.current) {
      capa.current.remove();
      capa.current = null;
    }

    if (precision === "aproximada") {
      capa.current = L.circle([lat, lng], {
        radius: 900,
        color: "#1e8449",
        weight: 2,
        dashArray: "6 4",
        fillColor: "#c9ebd3",
        fillOpacity: 0.45,
      }).addTo(instancia);
    } else {
      capa.current = L.marker([lat, lng], {
        icon: iconoExacto(),
        title: nombre,
        alt: nombre,
        keyboard: true,
      }).addTo(instancia);
    }

    instancia.setView([lat, lng], precision === "aproximada" ? 13 : 15, { animate: true });
  }, [lat, lng, precision, nombre]);

  return (
    <div
      ref={contenedor}
      role="application"
      aria-label={
        precision === "aproximada"
          ? `Mapa del sector aproximado (~1 km) de ${nombre}`
          : `Mapa de ubicación comercial de ${nombre}`
      }
      className="h-56 w-full overflow-hidden rounded-2xl border border-borde md:h-64"
    />
  );
}
