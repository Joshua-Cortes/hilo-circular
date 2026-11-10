import {
  AlertCircle,
  BadgeCheck,
  Check,
  Clock,
  HandHeart,
  MapPin,
  Navigation,
  Recycle,
  Scissors,
  Sparkles,
} from "lucide-react";
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { EncabezadoPagina } from "../componentes/EncabezadoPagina";
import { MapaPuntos } from "../componentes/MapaPuntos";
import { ChipFiltro } from "../componentes/ui/ChipFiltro";
import { api, ErrorApi, type Horario, type PuntoDonacion } from "../lib/api";
import { useCatalogo } from "../lib/catalogo";
import { cn } from "../lib/cn";
import { useSesion } from "../lib/sesion";

/** El filtro de calidad: si una respuesta es "no", la prenda no debería ir a una fundación. */
const FILTRO = [
  { id: "limpia", texto: "Está limpia y seca" },
  { id: "sana", texto: "No tiene manchas, hoyos ni roturas" },
  { id: "funciona", texto: "Cierres, botones y costuras funcionan" },
  { id: "intima", texto: "No es ropa interior ni traje de baño usado" },
  { id: "usarias", texto: "Tú la volverías a usar o se la pasarías a alguien querido" },
] as const;

const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const COMUNAS_PILOTO = ["La Serena", "Coquimbo"];

/** "Lun, Mié, Vie · 10:00–13:00": agrupa los días que comparten horario. */
function resumirHorarios(horarios: Horario[]) {
  const porTramo = new Map<string, number[]>();
  for (const h of horarios) {
    const tramo = `${h.abre}–${h.cierra}`;
    porTramo.set(tramo, [...(porTramo.get(tramo) ?? []), h.dia]);
  }
  return [...porTramo.entries()].map(([tramo, dias]) =>
    dias.length === 7 ? `Todos los días · ${tramo}` : `${dias.map((d) => DIAS[d]).join(", ")} · ${tramo}`,
  );
}

export function Donar() {
  const [params, setParams] = useSearchParams();
  const { catalogo, etiquetas } = useCatalogo();
  const [marcados, setMarcados] = useState<Set<string>>(new Set());
  const prenda = params.get("prenda") ?? "";
  const comuna = params.get("comuna") ?? "";
  const modo = params.get("modo") === "reciclar" ? "reciclar" : "donar";
  const [soloAbiertos, setSoloAbiertos] = useState(false);

  const [puntos, setPuntos] = useState<PuntoDonacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seleccionadoId, setSeleccionadoId] = useState<string | null>(null);
  const lista = useRef<HTMLOListElement>(null);

  const pasaFiltro = marcados.size === FILTRO.length;

  function cambiar(clave: string, valor: string) {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (valor) next.set(clave, valor);
        else next.delete(clave);
        return next;
      },
      { replace: true },
    );
  }

  useEffect(() => {
    setCargando(true);
    setError(null);
    api
      .puntosDonacion({ prenda: prenda || undefined, aceptaDanada: modo === "reciclar" ? true : undefined })
      .then(setPuntos)
      .catch((e: Error) => setError(e.message))
      .finally(() => setCargando(false));
  }, [prenda, modo]);

  const visibles = useMemo(
    () => puntos.filter((p) => (!comuna || p.comuna === comuna) && (!soloAbiertos || p.abiertoAhora)),
    [puntos, comuna, soloAbiertos],
  );

  // Al elegir un punto en el mapa, la lista se desplaza hasta él.
  useEffect(() => {
    if (!seleccionadoId) return;
    lista.current
      ?.querySelector(`[data-punto="${seleccionadoId}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [seleccionadoId]);

  function alternar(id: string) {
    setMarcados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14" aria-labelledby="titulo-donar">
      <EncabezadoPagina
        id="titulo-donar"
        etiqueta="02 · Donar"
        titulo={
          <>
            Dona lo que <em className="acento">todavía sirve</em>
          </>
        }
      >
        Una donación en mal estado le cuesta a la fundación: tiene que botarla. Revisa tu prenda en 30 segundos y elige
        un punto que la reciba.
      </EncabezadoPagina>

      {/* Paso 1: filtro de calidad */}
      <div className="mt-10 grid gap-3 lg:grid-cols-[1.5fr_1fr]">
        <fieldset className="bento bg-superficie">
          <legend className="sr-only">Filtro de calidad</legend>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-3xl">
              <span className="mr-2 inline-flex size-9 items-center justify-center rounded-full bg-tinta font-sans text-base text-lima">
                1
              </span>
              ¿Tu prenda pasa el filtro?
            </h2>
            <p className="font-bold text-tinta-suave tabular-nums" aria-live="polite">
              {marcados.size} de {FILTRO.length}
            </p>
          </div>
          <ul className="mt-5 grid gap-2 sm:grid-cols-2">
            {FILTRO.map(({ id, texto }) => {
              const activo = marcados.has(id);
              return (
                <li key={id} className={id === "usarias" ? "sm:col-span-2" : undefined}>
                  <label
                    className={cn(
                      "flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 py-3 font-bold transition-colors",
                      activo ? "border-hoja bg-menta-clara" : "border-borde bg-fondo hover:border-hoja",
                    )}
                  >
                    <input type="checkbox" checked={activo} onChange={() => alternar(id)} className="peer sr-only" />
                    <span
                      aria-hidden="true"
                      className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded-lg border-2 transition-colors peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-hoja",
                        activo ? "border-hoja bg-hoja text-white" : "border-borde-fuerte bg-superficie",
                      )}
                    >
                      {activo && <Check className="size-5" strokeWidth={3} />}
                    </span>
                    {texto}
                  </label>
                </li>
              );
            })}
          </ul>
          <div className="mt-5">
            <label htmlFor="prenda-donar" className="etiqueta text-tinta-suave">
              ¿Qué vas a donar? (opcional)
            </label>
            <select
              id="prenda-donar"
              value={prenda}
              onChange={(e) => cambiar("prenda", e.target.value)}
              className="campo mt-2 cursor-pointer font-bold sm:max-w-sm"
            >
              <option value="">Varias prendas o no sé</option>
              {catalogo?.prendas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.etiqueta}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-sm text-tinta-suave">Así te mostramos solo los puntos que la reciben.</p>
          </div>
        </fieldset>

        {/* Resultado del filtro */}
        <div
          aria-live="polite"
          className={cn("bento flex flex-col", pasaFiltro ? "justify-between bg-lima" : "bg-kraft-clara")}
        >
          {pasaFiltro ? (
            <>
              <Sparkles className="size-10" aria-hidden="true" />
              <div className="mt-6">
                <h2 className="text-3xl">¡Pasa el filtro!</h2>
                <p className="mt-2 text-lg font-bold text-tinta-800">
                  Elige en el mapa un punto que esté abierto y llévala. Si avisas que vas, la fundación te espera.
                </p>
                <a href="#mapa" className="boton mt-5 bg-tinta text-lima hover:bg-tinta-800">
                  <MapPin className="size-5" aria-hidden="true" /> Ver puntos
                </a>
              </div>
            </>
          ) : (
            <>
              <p className="etiqueta text-kraft-tinta">¿Alguna respuesta es no?</p>
              <ul className="mt-4 grid gap-2">
                <li>
                  <Link
                    to={prenda ? `/reparar?prenda=${prenda}` : "/reparar"}
                    className="flex min-h-14 items-center gap-3 rounded-2xl bg-superficie px-4 font-bold hover:bg-menta-clara"
                  >
                    <Scissors className="size-5 shrink-0 text-hoja-oscura" aria-hidden="true" />
                    Tiene un daño: repárala primero
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => cambiar("modo", "reciclar")}
                    className="flex min-h-14 w-full cursor-pointer items-center gap-3 rounded-2xl bg-superficie px-4 text-left font-bold hover:bg-menta-clara"
                  >
                    <Recycle className="size-5 shrink-0 text-kraft-tinta" aria-hidden="true" />
                    Ya no sirve: llévala a reciclaje textil
                  </button>
                </li>
              </ul>
              <p className="mt-auto pt-4 text-sm text-kraft-tinta">
                Marca las cinco casillas para donar a una fundación.
              </p>
            </>
          )}
        </div>
      </div>

      {/* Paso 2: mapa y lista */}
      <div id="mapa" className="mt-3 scroll-mt-24">
        <div className="bento bg-superficie pb-3 md:pb-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-3xl">
              <span className="mr-2 inline-flex size-9 items-center justify-center rounded-full bg-tinta font-sans text-base text-lima">
                2
              </span>
              {modo === "reciclar" ? "Puntos de reciclaje textil" : "Puntos de donación"}
            </h2>
            <fieldset className="flex flex-wrap gap-2">
              <legend className="sr-only">Qué quieres hacer</legend>
              <ChipFiltro activo={modo === "donar"} onClick={() => cambiar("modo", "")}>
                <HandHeart className="size-4" aria-hidden="true" /> Donar
              </ChipFiltro>
              <ChipFiltro activo={modo === "reciclar"} onClick={() => cambiar("modo", "reciclar")}>
                <Recycle className="size-4" aria-hidden="true" /> Reciclar textil
              </ChipFiltro>
            </fieldset>
          </div>
          <fieldset className="mt-4 flex flex-wrap gap-2">
            <legend className="sr-only">Filtrar puntos</legend>
            <ChipFiltro activo={comuna === ""} onClick={() => cambiar("comuna", "")}>
              Toda la zona
            </ChipFiltro>
            {COMUNAS_PILOTO.map((c) => (
              <ChipFiltro key={c} activo={comuna === c} onClick={() => cambiar("comuna", comuna === c ? "" : c)}>
                {c}
              </ChipFiltro>
            ))}
            <ChipFiltro activo={soloAbiertos} onClick={() => setSoloAbiertos((v) => !v)}>
              <Clock className="size-4" aria-hidden="true" /> Abierto ahora
            </ChipFiltro>
          </fieldset>

          <div className="mt-5 grid gap-3 lg:h-[36rem] lg:grid-cols-[1fr_25rem]">
            <div className="isolate h-80 overflow-hidden rounded-3xl md:h-[28rem] lg:h-full">
              <MapaPuntos puntos={visibles} seleccionadoId={seleccionadoId} alSeleccionar={setSeleccionadoId} />
            </div>

            <div className="flex min-h-0 flex-col">
              <p className="px-1 pb-2 font-bold text-tinta-suave" aria-live="polite">
                {cargando
                  ? "Buscando puntos…"
                  : `${visibles.length} ${visibles.length === 1 ? "punto" : "puntos"}${prenda ? ` que reciben ${etiquetas.prenda.get(prenda)?.toLowerCase() ?? "esa prenda"}` : ""}`}
              </p>
              {error && (
                <p role="alert" className="flex gap-2 rounded-2xl bg-alerta-clara p-4">
                  <AlertCircle className="size-5 shrink-0 text-alerta" aria-hidden="true" /> {error}
                </p>
              )}
              {!cargando && !error && visibles.length === 0 && (
                <div className="rounded-2xl bg-kraft-clara p-5">
                  <p className="font-bold">No hay puntos con esos filtros.</p>
                  <p className="mt-1 text-kraft-tinta">Prueba con toda la zona o quitando "Abierto ahora".</p>
                </div>
              )}
              <ol ref={lista} className="grid min-h-0 gap-2 overflow-y-auto pr-1 lg:flex-1">
                {visibles.map((punto) => (
                  <TarjetaPunto
                    key={punto.id}
                    punto={punto}
                    seleccionado={punto.id === seleccionadoId}
                    alSeleccionar={() => setSeleccionadoId(punto.id === seleccionadoId ? null : punto.id)}
                    etiquetasPrenda={etiquetas.prenda}
                    prendaElegida={prenda}
                    pasaFiltro={pasaFiltro || modo === "reciclar"}
                  />
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

type PropsPunto = {
  punto: PuntoDonacion;
  seleccionado: boolean;
  alSeleccionar: () => void;
  etiquetasPrenda: Map<string, string>;
  prendaElegida: string;
  pasaFiltro: boolean;
};

function TarjetaPunto({ punto, seleccionado, alSeleccionar, etiquetasPrenda, prendaElegida, pasaFiltro }: PropsPunto) {
  const comoLlegar = `https://www.google.com/maps/dir/?api=1&destination=${punto.ubicacion.lat},${punto.ubicacion.lng}`;
  return (
    <li
      data-punto={punto.id}
      className={cn(
        "rounded-3xl border-2 transition-colors",
        seleccionado ? "border-tinta bg-menta-clara" : "border-transparent bg-fondo hover:border-borde",
      )}
    >
      <button
        type="button"
        onClick={alSeleccionar}
        aria-expanded={seleccionado}
        className="w-full cursor-pointer p-4 text-left"
      >
        <span className="flex items-start justify-between gap-3">
          <span className="font-display text-xl leading-tight font-bold">{punto.nombre.replace(" (demo)", "")}</span>
          <span
            className={cn(
              "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold",
              punto.abiertoAhora ? "bg-hoja text-white" : "bg-superficie text-tinta-suave",
            )}
          >
            {punto.abiertoAhora ? "Abierto" : "Cerrado"}
          </span>
        </span>
        <span className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-tinta-suave">
          <span className="font-bold text-tinta">{punto.comuna}</span>
          {punto.aceptaDanada && (
            <span className="inline-flex items-center gap-1 text-kraft-tinta">
              <Recycle className="size-3.5" aria-hidden="true" /> recibe textil dañado
            </span>
          )}
          {punto.verificado && (
            <span className="inline-flex items-center gap-1 text-hoja-oscura">
              <BadgeCheck className="size-3.5" aria-hidden="true" /> verificado
            </span>
          )}
        </span>
        {punto.necesidadesActuales && (
          <span className="mt-2 block rounded-2xl bg-lima/60 px-3 py-2 text-sm font-bold">
            Necesitan: {punto.necesidadesActuales}
          </span>
        )}
      </button>

      {seleccionado && (
        <div className="grid gap-3 px-4 pb-4">
          <p className="text-sm text-tinta-suave">{punto.descripcion}</p>
          <dl className="grid gap-2 text-sm">
            <div>
              <dt className="font-bold">Dirección</dt>
              <dd className="text-tinta-suave">{punto.direccion}</dd>
            </div>
            <div>
              <dt className="font-bold">Horario de recepción</dt>
              {resumirHorarios(punto.horarios).map((linea) => (
                <dd key={linea} className="text-tinta-suave">
                  {linea}
                </dd>
              ))}
            </div>
            <div>
              <dt className="font-bold">Recibe</dt>
              <dd className="text-tinta-suave">
                {punto.prendasAceptadas.length === 0
                  ? "Todo tipo de prendas"
                  : punto.prendasAceptadas.map((p) => etiquetasPrenda.get(p) ?? p).join(" · ")}
              </dd>
            </div>
          </dl>
          <div className="flex flex-wrap gap-2">
            <a href={comoLlegar} target="_blank" rel="noreferrer" className="boton bg-superficie px-4 hover:bg-fondo">
              <Navigation className="size-4" aria-hidden="true" /> Cómo llegar
            </a>
          </div>
          <AvisoDonacion punto={punto} prendaElegida={prendaElegida} pasaFiltro={pasaFiltro} />
        </div>
      )}
    </li>
  );
}

/** "Voy a donar aquí": registra la donación (CU2) para que la fundación la confirme al recibirla. */
function AvisoDonacion({
  punto,
  prendaElegida,
  pasaFiltro,
}: {
  punto: PuntoDonacion;
  prendaElegida: string;
  pasaFiltro: boolean;
}) {
  const { usuario } = useSesion();
  const { catalogo } = useCatalogo();
  const navegar = useNavigate();
  const [prenda, setPrenda] = useState(prendaElegida);
  const [cantidad, setCantidad] = useState(1);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listo, setListo] = useState<{ totalPrendas: number; kgEstimados: number } | null>(null);

  if (!pasaFiltro) {
    return (
      <p className="rounded-2xl bg-kraft-clara px-4 py-3 text-sm font-bold text-kraft-tinta">
        Completa el filtro de calidad (paso 1) para avisar que vas a donar.
      </p>
    );
  }
  if (listo) {
    return (
      <p role="status" className="rounded-2xl bg-lima px-4 py-3 font-bold">
        ¡Listo! Registramos {listo.totalPrendas} {listo.totalPrendas === 1 ? "prenda" : "prendas"} (~{listo.kgEstimados}{" "}
        kg). Cuando la fundación confirme que la recibió, sumará al impacto.
      </p>
    );
  }
  if (!usuario) {
    return (
      <button
        type="button"
        onClick={() => navegar(`/ingresar?volver=${encodeURIComponent("/donar")}`)}
        className="boton-primario"
      >
        <HandHeart className="size-5" aria-hidden="true" /> Inicia sesión para avisar que vas
      </button>
    );
  }

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!prenda) {
      setError("Elige qué prenda vas a llevar");
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      setListo(await api.registrarDonacion(punto.id, [{ prenda, cantidad, estado: "buen_estado" }]));
    } catch (err) {
      setError(err instanceof ErrorApi ? err.message : "No pudimos registrar la donación");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="grid gap-2 rounded-2xl bg-superficie p-3">
      <p className="font-bold">Avisar que voy a donar aquí</p>
      <div className="grid grid-cols-[1fr_5.5rem] gap-2">
        <label className="sr-only" htmlFor={`prenda-${punto.id}`}>
          Prenda
        </label>
        <select
          id={`prenda-${punto.id}`}
          value={prenda}
          onChange={(e) => setPrenda(e.target.value)}
          className="campo cursor-pointer text-sm"
        >
          <option value="">¿Qué llevas?</option>
          {catalogo?.prendas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.etiqueta}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor={`cantidad-${punto.id}`}>
          Cantidad
        </label>
        <input
          id={`cantidad-${punto.id}`}
          type="number"
          min={1}
          max={50}
          value={cantidad}
          onChange={(e) => setCantidad(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
          className="campo text-center text-sm"
        />
      </div>
      {error && (
        <p role="alert" className="rounded-xl bg-alerta-clara px-3 py-2 text-sm">
          {error}
        </p>
      )}
      <button type="submit" disabled={enviando} className="boton-primario">
        {enviando ? "Registrando…" : "Voy a donar aquí"}
      </button>
    </form>
  );
}
