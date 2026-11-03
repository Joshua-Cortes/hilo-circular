import { ArrowRight, CheckCircle2, MapPin, MessageCircle, Phone, Shield } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { api, type CanalContacto, type OficioPublico } from "../lib/api";

const formatoClp = new Intl.NumberFormat("es-CL");

export function formatearPrecio(precioDesde: number | null): string {
  if (precioDesde === null) return "A convenir";
  return `Desde $${formatoClp.format(precioDesde)}`;
}

export function formatearDistancia(distanciaKm: number | null): string | null {
  if (distanciaKm === null) return null;
  return `${distanciaKm.toLocaleString("es-CL", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`;
}

type PropsTarjetaOficio = {
  oficio: OficioPublico;
  etiquetasPrenda: Map<string, string>;
  etiquetasCategoria: Map<string, string>;
};

export function TarjetaOficio({ oficio, etiquetasPrenda, etiquetasCategoria }: PropsTarjetaOficio) {
  const [contactando, setContactando] = useState<CanalContacto | null>(null);
  const [errorContacto, setErrorContacto] = useState<string | null>(null);

  const distancia = formatearDistancia(oficio.distanciaKm);

  async function manejarContacto(canal: CanalContacto) {
    setErrorContacto(null);
    setContactando(canal);
    try {
      const { url } = await api.contactarOficio(oficio.id, canal);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      setErrorContacto((e as Error).message);
    } finally {
      setContactando(null);
    }
  }

  return (
    <article className="tarjeta flex flex-col justify-between p-6 transition-colors duration-200 ease-hilo hover:border-bosque">
      <div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold">
              <Link to={`/reparar/${oficio.id}`} className="hover:underline">
                {oficio.nombrePublico}
              </Link>
            </h2>
            {oficio.verificado && (
              <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold text-salvia">
                <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
                <span>Verificado por Hilo Circular</span>
              </p>
            )}
          </div>

          {distancia && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-salvia-claro px-3 py-1 text-sm font-bold text-bosque">
              <MapPin className="size-4 shrink-0 text-salvia" aria-hidden="true" />
              <span>{distancia}</span>
            </span>
          )}
        </div>

        <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-base text-tinta-suave">
          <span className="font-bold text-bosque">{oficio.comuna}</span>
          <span aria-hidden="true">·</span>
          {oficio.ubicacion.precision === "exacta" && oficio.direccion ? (
            <span>{oficio.direccion}</span>
          ) : (
            <span className="inline-flex items-center gap-1">
              <Shield className="size-4 shrink-0 text-terracota-tinta" aria-hidden="true" />
              <span>Sector aproximado (~1 km)</span>
            </span>
          )}
        </p>

        {oficio.descripcion && <p className="mt-3 text-base text-tinta-suave">{oficio.descripcion}</p>}

        {oficio.servicios.length > 0 && (
          <div className="mt-4 border-t border-dashed border-borde pt-4">
            <h3 className="font-sans text-xs font-bold tracking-widest text-tinta-suave uppercase">
              Servicios y precios referenciales
            </h3>
            <ul className="mt-2.5 grid gap-2.5">
              {oficio.servicios.map((servicio) => (
                <li key={servicio.id} className="rounded-xl border border-borde bg-crema/70 px-3.5 py-2.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-bold text-bosque">{servicio.titulo}</span>
                    <span className="font-bold text-terracota-tinta">{formatearPrecio(servicio.precioDesde)}</span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-salvia-claro px-2.5 py-0.5 text-xs font-bold text-bosque">
                      {etiquetasCategoria.get(servicio.categoria) ?? servicio.categoria}
                    </span>
                    {servicio.prendas.map((p) => (
                      <span
                        key={p}
                        className="rounded-full border border-borde bg-papel px-2.5 py-0.5 text-xs text-tinta-suave"
                      >
                        {etiquetasPrenda.get(p) ?? p}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="mt-6 border-t border-borde pt-4">
        {errorContacto && (
          <p role="alert" className="mb-3 rounded-xl border border-terracota-tinta bg-terracota-claro/30 p-3 text-sm">
            {errorContacto}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          {oficio.canales.whatsapp && (
            <button
              type="button"
              disabled={contactando !== null}
              onClick={() => manejarContacto("whatsapp")}
              className="boton bg-salvia text-white hover:bg-bosque disabled:opacity-60"
            >
              <MessageCircle className="size-5 shrink-0" aria-hidden="true" />
              <span>{contactando === "whatsapp" ? "Abriendo WhatsApp…" : "Contactar por WhatsApp"}</span>
            </button>
          )}

          {!oficio.canales.whatsapp && oficio.canales.telefono && (
            <button
              type="button"
              disabled={contactando !== null}
              onClick={() => manejarContacto("telefono")}
              className="boton-primario disabled:opacity-60"
            >
              <Phone className="size-5 shrink-0" aria-hidden="true" />
              <span>{contactando === "telefono" ? "Iniciando llamada…" : "Llamar por teléfono"}</span>
            </button>
          )}

          <Link to={`/reparar/${oficio.id}`} className="boton-secundario px-5">
            <span>Ver perfil</span>
            <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
