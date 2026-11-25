import { BadgeCheck, Bike, CircleHelp, MapPin, MessageCircle, Phone, RefreshCw, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { EncabezadoPagina } from "../componentes/EncabezadoPagina";
import { api, type Catalogo, type RepartidorPublico } from "../lib/api";

export function Delivery() {
  const [params, setParams] = useSearchParams();
  const comuna = params.get("comuna") ?? "La Serena";
  const [catalogo, setCatalogo] = useState<Catalogo | null>(null);
  const [repartidores, setRepartidores] = useState<RepartidorPublico[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);
  const [contactando, setContactando] = useState<string | null>(null);

  useEffect(() => {
    api
      .catalogo()
      .then(setCatalogo)
      .catch(() => {});
  }, []);

  useEffect(() => {
    setCargando(true);
    setError(false);
    api
      .repartidores(comuna)
      .then(setRepartidores)
      .catch(() => setError(true))
      .finally(() => setCargando(false));
  }, [comuna]);

  function cambiarComuna(valor: string) {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (valor) next.set("comuna", valor);
      else next.delete("comuna");
      return next;
    });
  }

  async function contactar(repartidor: RepartidorPublico, canal: "whatsapp" | "telefono") {
    setContactando(repartidor.id + canal);
    setError(false);
    try {
      const respuesta = await api.contactarRepartidor(repartidor.id, comuna, canal);
      window.location.assign(respuesta.url);
    } catch {
      setError(true);
      setContactando(null);
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
      <EncabezadoPagina
        etiqueta="05 · Delivery local"
        titulo={
          <>
            Que llegue <em className="acento">a tu zona</em>
          </>
        }
        acciones={
          <Link to="/delivery/mi-perfil" className="boton-primario">
            <Bike className="size-5" aria-hidden="true" /> Ofrecer reparto
          </Link>
        }
      >
        Coordina el traslado de ropa con personas que reparten en tu comuna. Hablan directamente y acuerdan cada entrega
        entre ustedes.
      </EncabezadoPagina>

      <div className="mt-8 grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="bento relative overflow-hidden bg-tinta text-fondo">
          <div
            aria-hidden="true"
            className="absolute -right-8 -top-12 size-64 rounded-full border-[24px] border-lima/10"
          />
          <div className="relative max-w-2xl">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-fondo/10 text-lima">
              <Bike className="size-7" aria-hidden="true" />
            </span>
            <h2 className="mt-6 text-3xl md:text-4xl">
              Una vuelta más, <em className="acento text-lima">sin salir de tu barrio.</em>
            </h2>
            <p className="mt-3 max-w-xl text-lg text-fondo/85">
              Busca por comuna, revisa quién cubre tu zona y coordina la entrega por el canal que prefieras. El precio y
              los detalles se acuerdan directamente.
            </p>
          </div>
        </div>
        <aside className="bento flex flex-col justify-between bg-menta">
          <div>
            <p className="etiqueta text-hoja-oscura">Para la comunidad</p>
            <h2 className="mt-3 text-3xl">Reparto a escala local</h2>
            <p className="mt-3 text-lg text-tinta-800">
              Apoya la reparación, la donación y el mercado circular con traslados coordinados cerca de ti.
            </p>
          </div>
          <p className="mt-6 flex items-start gap-3 rounded-2xl bg-superficie/80 p-4 text-sm text-tinta-800">
            <CircleHelp className="mt-0.5 size-5 shrink-0 text-hoja-oscura" aria-hidden="true" />
            Hilo Circular facilita el contacto; cada persona confirma disponibilidad, costo y punto de encuentro.
          </p>
        </aside>
      </div>

      <div className="mt-12 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="etiqueta text-hoja-oscura">Repartidores de la zona</p>
          <h2 className="mt-2 text-3xl md:text-4xl">Encuentra quién te ayude</h2>
        </div>
        <div className="w-full sm:w-72">
          <label htmlFor="comuna-delivery" className="font-bold">
            Tu comuna
          </label>
          <div className="relative mt-2">
            <MapPin
              className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-hoja-oscura"
              aria-hidden="true"
            />
            <select
              id="comuna-delivery"
              className="campo pl-12"
              value={comuna}
              onChange={(e) => cambiarComuna(e.target.value)}
            >
              {(catalogo?.comunas ?? ["La Serena", "Coquimbo"]).map((opcion) => (
                <option key={opcion} value={opcion}>
                  {opcion}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-5 rounded-2xl bg-alerta-clara p-4 font-bold text-alerta">
          No pudimos completar la solicitud. Revisa tu conexión e inténtalo de nuevo.
        </p>
      )}

      {cargando ? (
        <div
          className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          role="status"
          aria-live="polite"
          aria-label="Buscando repartidores"
        >
          {[0, 1, 2].map((i) => (
            <div key={i} className="bento h-64 animate-pulse bg-superficie" />
          ))}
        </div>
      ) : repartidores.length === 0 ? (
        <div className="bento mt-6 bg-kraft-clara">
          <p className="etiqueta text-kraft-tinta">Cobertura en crecimiento</p>
          <h3 className="mt-3 text-2xl">Todavía no hay repartidores publicados en {comuna}.</h3>
          <p className="mt-2 max-w-2xl text-tinta-800">
            Si haces entregas por esta zona, crea tu perfil para que la comunidad pueda encontrarte.
          </p>
          <Link to="/delivery/mi-perfil" className="boton-primario mt-5">
            Sumarme como repartidor
          </Link>
        </div>
      ) : (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {repartidores.map((repartidor) => (
            <li key={repartidor.id} className="bento flex flex-col bg-superficie">
              <div className="flex items-start justify-between gap-3">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-menta text-hoja-oscura">
                  <Bike className="size-6" aria-hidden="true" />
                </span>
                {repartidor.verificado ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-menta-clara px-3 py-1 text-sm font-bold text-hoja-oscura">
                    <BadgeCheck className="size-4" aria-hidden="true" /> Verificado
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-fondo px-3 py-1 text-sm font-bold text-tinta-suave">
                    Perfil nuevo
                  </span>
                )}
              </div>
              <h3 className="mt-5 text-2xl">{repartidor.nombrePublico}</h3>
              <p className="mt-2 min-h-14 text-tinta-suave">
                {repartidor.descripcion || "Reparto local coordinado directamente."}
              </p>
              <div className="mt-4">
                <p className="text-sm font-bold text-tinta-suave">Cubre estas comunas</p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {repartidor.comunas.map((zona) => (
                    <li key={zona} className="rounded-full bg-menta-clara px-3 py-1 text-sm font-bold text-hoja-oscura">
                      {zona}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-auto grid grid-cols-2 gap-2 pt-6">
                {repartidor.canales.whatsapp && (
                  <button
                    type="button"
                    disabled={contactando !== null}
                    onClick={() => contactar(repartidor, "whatsapp")}
                    className="boton-primario px-3"
                  >
                    {contactando === `${repartidor.id}whatsapp` ? (
                      <RefreshCw className="size-5 animate-spin" aria-hidden="true" />
                    ) : (
                      <MessageCircle className="size-5" aria-hidden="true" />
                    )}
                    WhatsApp
                  </button>
                )}
                {repartidor.canales.telefono && (
                  <button
                    type="button"
                    disabled={contactando !== null}
                    onClick={() => contactar(repartidor, "telefono")}
                    className="boton-secundario px-3"
                  >
                    {contactando === `${repartidor.id}telefono` ? (
                      <RefreshCw className="size-5 animate-spin" aria-hidden="true" />
                    ) : (
                      <Phone className="size-5" aria-hidden="true" />
                    )}
                    Llamar
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-10 flex items-center gap-3 rounded-2xl bg-superficie p-4 text-sm text-tinta-suave">
        <ShieldCheck className="size-5 shrink-0 text-hoja-oscura" aria-hidden="true" />
        Contacta solo perfiles con el medio que necesitas. Acuerda costo, horario y entrega directamente antes de enviar
        la ropa.
      </div>
    </section>
  );
}
