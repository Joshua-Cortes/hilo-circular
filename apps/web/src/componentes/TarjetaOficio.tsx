import { ArrowUpRight, BadgeCheck, MapPin, MessageCircle, Phone, Shield } from "lucide-react";
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
  const categorias = [...new Set(oficio.servicios.map((s) => s.categoria))];

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
    <article className="bento flex flex-col justify-between bg-superficie">
      <div>
        <div className="flex items-start gap-4">
          <span
            aria-hidden="true"
            className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-menta font-display text-2xl font-bold text-hoja-oscura"
          >
            {oficio.nombrePublico.charAt(0)}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl">
              <Link to={`/reparar/${oficio.id}`} className="hover:underline">
                {oficio.nombrePublico}
              </Link>
            </h2>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-tinta-suave">
              <span className="font-bold text-tinta">{oficio.comuna}</span>
              <span aria-hidden="true">·</span>
              {oficio.ubicacion.precision === "exacta" && oficio.direccion ? (
                <span>{oficio.direccion}</span>
              ) : (
                <span className="inline-flex items-center gap-1">
                  <Shield className="size-3.5 shrink-0" aria-hidden="true" /> Sector aproximado
                </span>
              )}
            </p>
          </div>
          {distancia && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-fondo px-3 py-1 text-sm font-bold">
              <MapPin className="size-4 text-hoja-oscura" aria-hidden="true" />
              {distancia}
            </span>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {oficio.verificado && (
            <span className="inline-flex items-center gap-1 rounded-full bg-lima px-3 py-1 text-sm font-bold">
              <BadgeCheck className="size-4" aria-hidden="true" /> Verificado
            </span>
          )}
          {categorias.map((c) => (
            <span key={c} className="rounded-full bg-menta-clara px-3 py-1 text-sm font-bold text-hoja-oscura">
              {etiquetasCategoria.get(c) ?? c}
            </span>
          ))}
        </div>

        {oficio.descripcion && <p className="mt-4 text-tinta-suave">{oficio.descripcion}</p>}

        {oficio.servicios.length > 0 && (
          <ul className="mt-5 grid gap-2" aria-label="Servicios y precios referenciales">
            {oficio.servicios.map((servicio) => (
              <li key={servicio.id} className="rounded-2xl bg-fondo px-4 py-3">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <span className="font-bold">{servicio.titulo}</span>
                  <span className="font-bold text-hoja-oscura">{formatearPrecio(servicio.precioDesde)}</span>
                </div>
                {servicio.prendas.length > 0 && (
                  <p className="mt-0.5 text-sm text-tinta-suave">
                    {servicio.prendas.map((p) => etiquetasPrenda.get(p) ?? p).join(" · ")}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6">
        {errorContacto && (
          <p role="alert" className="mb-3 rounded-2xl bg-alerta-clara p-3 text-sm">
            {errorContacto}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          {oficio.canales.whatsapp && (
            <button
              type="button"
              disabled={contactando !== null}
              onClick={() => manejarContacto("whatsapp")}
              className="boton-primario flex-1"
            >
              <MessageCircle className="size-5 shrink-0" aria-hidden="true" />
              {contactando === "whatsapp" ? "Abriendo WhatsApp…" : "WhatsApp"}
            </button>
          )}
          {!oficio.canales.whatsapp && oficio.canales.telefono && (
            <button
              type="button"
              disabled={contactando !== null}
              onClick={() => manejarContacto("telefono")}
              className="boton-primario flex-1"
            >
              <Phone className="size-5 shrink-0" aria-hidden="true" />
              {contactando === "telefono" ? "Iniciando llamada…" : "Llamar"}
            </button>
          )}
          <Link to={`/reparar/${oficio.id}`} className="boton bg-fondo hover:bg-menta-clara">
            Ver perfil <ArrowUpRight className="size-4 shrink-0" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
