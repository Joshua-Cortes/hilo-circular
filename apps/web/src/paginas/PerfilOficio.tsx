import { AlertCircle, ArrowLeft, CheckCircle2, MapPin, MessageCircle, Phone, Shield } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { formatearPrecio } from "../componentes/TarjetaOficio";
import { api, type CanalContacto, type Catalogo, type OficioPublico } from "../lib/api";

export function PerfilOficio() {
  const { id } = useParams<{ id: string }>();
  const [oficio, setOficio] = useState<OficioPublico | null>(null);
  const [catalogo, setCatalogo] = useState<Catalogo | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contactando, setContactando] = useState<CanalContacto | null>(null);
  const [errorContacto, setErrorContacto] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setCargando(true);
    setError(null);
    Promise.all([api.oficio(id), api.catalogo().catch(() => null)])
      .then(([datosOficio, datosCatalogo]) => {
        setOficio(datosOficio);
        if (datosCatalogo) setCatalogo(datosCatalogo);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setCargando(false));
  }, [id]);

  const etiquetasPrenda = useMemo(() => new Map((catalogo?.prendas ?? []).map((p) => [p.id, p.etiqueta])), [catalogo]);
  const etiquetasCategoria = useMemo(
    () => new Map((catalogo?.categorias ?? []).map((c) => [c.id, c.etiqueta])),
    [catalogo],
  );

  async function manejarContacto(canal: CanalContacto) {
    if (!oficio) return;
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
    <section className="mx-auto max-w-4xl px-5 py-12 md:py-16" aria-labelledby="titulo-perfil">
      <Link to="/reparar" className="boton -ml-4 text-tinta-suave hover:bg-salvia-claro hover:text-bosque">
        <ArrowLeft className="size-5 shrink-0" aria-hidden="true" />
        <span>Volver a talleres</span>
      </Link>

      <div className="mt-4 min-h-[360px]" aria-live="polite">
        {cargando && (
          <div className="tarjeta h-80 animate-pulse p-8" aria-hidden="true">
            <div className="h-8 w-1/2 rounded-lg bg-borde" />
            <div className="mt-4 h-5 w-2/3 rounded bg-borde" />
            <div className="mt-8 h-28 w-full rounded-xl bg-borde/70" />
          </div>
        )}

        {!cargando && error && (
          <div role="alert" className="tarjeta border-2 border-terracota-tinta bg-terracota-claro/25 p-8">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-1 size-7 shrink-0 text-terracota-tinta" aria-hidden="true" />
              <div>
                <h1 id="titulo-perfil" className="text-3xl font-semibold">
                  No encontramos este taller
                </h1>
                <p className="mt-2 text-lg text-tinta-suave">{error}</p>
                <Link to="/reparar" className="boton-primario mt-6">
                  Ver todos los talleres
                </Link>
              </div>
            </div>
          </div>
        )}

        {!cargando && oficio && (
          <div className="grid gap-8">
            {/* Encabezado del taller */}
            <header className="relative overflow-hidden rounded-tarjeta bg-bosque p-7 text-crema md:p-10">
              {oficio.verificado && (
                <p className="inline-flex items-center gap-2 text-sm font-bold tracking-wide text-terracota-claro uppercase">
                  <CheckCircle2 className="size-5 shrink-0" aria-hidden="true" />
                  <span>Taller verificado por Hilo Circular</span>
                </p>
              )}
              <h1 id="titulo-perfil" className="mt-2 text-4xl font-semibold md:text-5xl">
                {oficio.nombrePublico}
              </h1>
              <div className="puntada mt-5 w-24 text-terracota-claro" aria-hidden="true" />
              {oficio.descripcion && <p className="mt-5 max-w-2xl text-xl text-crema/90">{oficio.descripcion}</p>}

              <div className="mt-6 flex flex-wrap items-center gap-4 text-base font-bold text-terracota-claro">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-5 shrink-0" aria-hidden="true" />
                  <span>{oficio.comuna}</span>
                </span>
                {oficio.ubicacion.precision === "exacta" && oficio.direccion ? (
                  <span>· {oficio.direccion}</span>
                ) : (
                  <span className="inline-flex items-center gap-1.5">
                    <Shield className="size-5 shrink-0" aria-hidden="true" />
                    <span>Ubicación aproximada (~1 km)</span>
                  </span>
                )}
              </div>
            </header>

            {/* Servicios ofrecidos */}
            <section aria-labelledby="titulo-servicios" className="tarjeta p-6 md:p-8">
              <h2 id="titulo-servicios" className="text-3xl font-semibold">
                Servicios y precios referenciales
              </h2>
              <p className="mt-1 text-base text-tinta-suave">
                El valor final se acuerda directamente con el oficio según el estado de tu prenda.
              </p>

              <ul className="mt-6 grid gap-4">
                {oficio.servicios.map((servicio) => (
                  <li key={servicio.id} className="rounded-2xl border border-borde bg-crema/75 p-5">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="text-2xl font-semibold">{servicio.titulo}</h3>
                      <span className="text-lg font-bold text-terracota-tinta">
                        {formatearPrecio(servicio.precioDesde)}
                      </span>
                    </div>
                    {servicio.descripcion && <p className="mt-2 text-base text-tinta-suave">{servicio.descripcion}</p>}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-salvia-claro px-3 py-1 text-sm font-bold text-bosque">
                        {etiquetasCategoria.get(servicio.categoria) ?? servicio.categoria}
                      </span>
                      {servicio.prendas.map((p) => (
                        <span
                          key={p}
                          className="rounded-full border border-borde bg-papel px-3 py-1 text-sm text-tinta-suave"
                        >
                          {etiquetasPrenda.get(p) ?? p}
                        </span>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            {/* Privacidad y contacto directo */}
            <section aria-labelledby="titulo-contacto" className="tarjeta p-6 md:p-8">
              <h2 id="titulo-contacto" className="text-3xl font-semibold">
                Ubicación y contacto directo
              </h2>

              {oficio.ubicacion.precision === "aproximada" ? (
                <div className="mt-4 flex items-start gap-3 rounded-2xl bg-salvia-claro p-4 text-bosque">
                  <Shield className="mt-0.5 size-6 shrink-0 text-salvia" aria-hidden="true" />
                  <p className="text-base">
                    <strong>Ubicación aproximada (~1 km en {oficio.comuna}).</strong> Este oficio trabaja desde su
                    domicilio; para cuidar su privacidad no publicamos su dirección exacta ni su número de teléfono. Te
                    dará la dirección cuando conversen.
                  </p>
                </div>
              ) : (
                <p className="mt-3 text-lg text-tinta-suave">
                  Dirección comercial: <strong className="text-bosque">{oficio.direccion ?? oficio.comuna}</strong>
                </p>
              )}

              {errorContacto && (
                <p
                  role="alert"
                  className="mt-4 rounded-xl border border-terracota-tinta bg-terracota-claro/30 p-4 text-base"
                >
                  {errorContacto}
                </p>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
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

                {oficio.canales.telefono && (
                  <button
                    type="button"
                    disabled={contactando !== null}
                    onClick={() => manejarContacto("telefono")}
                    className={
                      oficio.canales.whatsapp
                        ? "boton-secundario disabled:opacity-60"
                        : "boton-primario disabled:opacity-60"
                    }
                  >
                    <Phone className="size-5 shrink-0" aria-hidden="true" />
                    <span>{contactando === "telefono" ? "Iniciando llamada…" : "Llamar por teléfono"}</span>
                  </button>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </section>
  );
}
