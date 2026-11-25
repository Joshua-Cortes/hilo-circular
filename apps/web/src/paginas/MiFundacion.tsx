import {
  AlertCircle,
  ArrowUpRight,
  BadgeCheck,
  Check,
  CheckCircle2,
  HandHeart,
  Inbox,
  PackageCheck,
  Recycle,
} from "lucide-react";
import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { EncabezadoPagina } from "../componentes/EncabezadoPagina";
import { ChipFiltro } from "../componentes/ui/ChipFiltro";
import { api, type MiFundacion as DatosFundacion, type DonacionFundacion, type Horario } from "../lib/api";
import { haceCuanto, useCatalogo } from "../lib/catalogo";
import { cn } from "../lib/cn";
import { useSesion } from "../lib/sesion";

/** Lunes primero: así piensan la semana las fundaciones. `dia` sigue la convención de la API (0 = domingo). */
const SEMANA = [
  { dia: 1, nombre: "Lunes" },
  { dia: 2, nombre: "Martes" },
  { dia: 3, nombre: "Miércoles" },
  { dia: 4, nombre: "Jueves" },
  { dia: 5, nombre: "Viernes" },
  { dia: 6, nombre: "Sábado" },
  { dia: 0, nombre: "Domingo" },
];

type Dia = { activo: boolean; abre: string; cierra: string };

/** Un tramo por día alcanza para los puntos de acopio del piloto; si hubiera más, se conserva el primero. */
function aSemana(horarios: Horario[]): Record<number, Dia> {
  const semana: Record<number, Dia> = {};
  for (const { dia } of SEMANA) {
    const tramo = horarios.find((h) => h.dia === dia);
    semana[dia] = tramo
      ? { activo: true, abre: tramo.abre, cierra: tramo.cierra }
      : { activo: false, abre: "10:00", cierra: "13:00" };
  }
  return semana;
}

const kg = (valor: number) => valor.toLocaleString("es-CL", { maximumFractionDigits: 1 });

export function MiFundacion() {
  const { usuario } = useSesion();
  const { catalogo, etiquetas } = useCatalogo();

  const [fundacion, setFundacion] = useState<DatosFundacion | null>(null);
  const [donaciones, setDonaciones] = useState<DonacionFundacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  // Lo que ven las personas en el mapa de Donar.
  const [necesidades, setNecesidades] = useState("");
  const [prendas, setPrendas] = useState<string[]>([]);
  const [aceptaDanada, setAceptaDanada] = useState(false);
  const [semana, setSemana] = useState<Record<number, Dia>>(aSemana([]));
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  const [confirmandoId, setConfirmandoId] = useState<string | null>(null);
  const [avisoDonacion, setAvisoDonacion] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  const cargarFormulario = useCallback((datos: DatosFundacion) => {
    setFundacion(datos);
    setNecesidades(datos.necesidadesActuales);
    setPrendas(datos.prendasAceptadas);
    setAceptaDanada(datos.aceptaDanada);
    setSemana(aSemana(datos.horarios));
  }, []);

  useEffect(() => {
    if (usuario?.rol !== "fundacion") return;
    let vigente = true;
    Promise.all([api.miFundacion(), api.misDonaciones()])
      .then(([datos, lista]) => {
        if (!vigente) return;
        cargarFormulario(datos);
        setDonaciones(lista);
      })
      .catch((e: Error) => vigente && setErrorCarga(e.message))
      .finally(() => vigente && setCargando(false));
    return () => {
      vigente = false;
    };
  }, [usuario?.rol, cargarFormulario]);

  const pendientes = useMemo(() => donaciones.filter((d) => d.estado === "registrada"), [donaciones]);
  const recibidas = useMemo(() => donaciones.filter((d) => d.estado === "recibida"), [donaciones]);
  const kgRecibidos = recibidas.reduce((total, d) => total + d.kgEstimados, 0);

  async function confirmar(donacion: DonacionFundacion) {
    setConfirmandoId(donacion.id);
    setAvisoDonacion(null);
    try {
      const actualizada = await api.confirmarRecepcion(donacion.id);
      setDonaciones((lista) => lista.map((d) => (d.id === donacion.id ? { ...d, ...actualizada } : d)));
      setAvisoDonacion({
        tipo: "ok",
        texto: `¡Gracias! Sumamos ${donacion.totalPrendas} prendas y ${kg(donacion.kgEstimados)} kg al impacto de Hilo Circular.`,
      });
    } catch (e) {
      setAvisoDonacion({ tipo: "error", texto: (e as Error).message });
    } finally {
      setConfirmandoId(null);
    }
  }

  async function guardar(e: FormEvent) {
    e.preventDefault();
    setAviso(null);
    const horarios = SEMANA.filter(({ dia }) => semana[dia].activo).map(({ dia }) => ({ dia, ...semana[dia] }));
    const malo = horarios.find((h) => h.abre >= h.cierra);
    if (malo) {
      const nombre = SEMANA.find((d) => d.dia === malo.dia)?.nombre;
      setAviso({
        tipo: "error",
        texto: `Revisa el ${nombre?.toLowerCase()}: la hora de cierre debe ser después de la de apertura.`,
      });
      return;
    }
    setGuardando(true);
    try {
      const actualizada = await api.actualizarMiFundacion({
        necesidadesActuales: necesidades.trim(),
        prendasAceptadas: prendas,
        aceptaDanada,
        horarios: horarios.map(({ dia, abre, cierra }) => ({ dia, abre, cierra })),
      });
      cargarFormulario(actualizada);
      setAviso({ tipo: "ok", texto: "Listo. El mapa de Donar ya muestra estos datos." });
    } catch (err) {
      setAviso({ tipo: "error", texto: (err as Error).message });
    } finally {
      setGuardando(false);
    }
  }

  function cambiarDia(dia: number, cambio: Partial<Dia>) {
    setSemana((actual) => ({ ...actual, [dia]: { ...actual[dia], ...cambio } }));
  }

  if (usuario?.rol !== "fundacion") {
    return (
      <section className="mx-auto max-w-3xl px-4 py-14 md:px-6">
        <div className="bento bg-superficie">
          <HandHeart className="size-10 text-hoja-oscura" aria-hidden="true" />
          <h1 className="mt-4 text-4xl">Panel para fundaciones</h1>
          <p className="mt-3 text-lg text-tinta-suave">
            Aquí cada punto de donación confirma lo que recibe y avisa lo que necesita. Las cuentas de fundación las
            crea el equipo de Hilo Circular después de verificar que la organización existe.
          </p>
          <Link to="/donar" className="boton-primario mt-6">
            Ver puntos de donación
          </Link>
        </div>
      </section>
    );
  }

  if (cargando || errorCarga || !fundacion) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-14 md:px-6" aria-busy={cargando}>
        {errorCarga ? (
          <div role="alert" className="bento flex items-start gap-3 bg-alerta-clara">
            <AlertCircle className="mt-1 size-6 shrink-0 text-alerta" aria-hidden="true" />
            <div>
              <h1 className="text-3xl">No pudimos abrir tu panel</h1>
              <p className="mt-2">{errorCarga}</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-3" aria-hidden="true">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-40 animate-pulse rounded-tarjeta bg-superficie" />
            ))}
          </div>
        )}
      </section>
    );
  }

  const nombreCorto = fundacion.nombre.replace(" (demo)", "");

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14" aria-labelledby="titulo-fundacion">
      <EncabezadoPagina
        id="titulo-fundacion"
        etiqueta="02 · Donar · Panel de fundación"
        titulo={
          <>
            Lo que llega a <em className="acento">{nombreCorto}</em>
          </>
        }
        acciones={
          <Link to="/donar" className="boton-claro">
            Ver en el mapa <ArrowUpRight className="size-5" aria-hidden="true" />
          </Link>
        }
      >
        <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
          {fundacion.direccion}, {fundacion.comuna}
          {fundacion.verificado && (
            <span className="inline-flex items-center gap-1 rounded-full bg-lima px-3 py-0.5 text-sm font-bold text-tinta">
              <BadgeCheck className="size-4" aria-hidden="true" /> Verificada
            </span>
          )}
        </span>
      </EncabezadoPagina>

      {/* Cifras de la fundación */}
      <dl className="mt-10 grid gap-3 sm:grid-cols-3">
        {[
          {
            etiqueta: "donaciones por confirmar",
            valor: String(pendientes.length),
            tono: pendientes.length > 0 ? "bg-lima" : "bg-superficie",
          },
          { etiqueta: "donaciones recibidas", valor: String(recibidas.length), tono: "bg-menta" },
          { etiqueta: "de textil que no llegó al vertedero", valor: `${kg(kgRecibidos)} kg`, tono: "bg-kraft-clara" },
        ].map(({ etiqueta, valor, tono }) => (
          <div key={etiqueta} className={cn("bento flex min-h-36 flex-col-reverse justify-between", tono)}>
            <dt className="mt-4 font-bold text-tinta-800">{etiqueta}</dt>
            <dd className="font-display text-5xl font-bold tracking-tight tabular-nums">{valor}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-3 grid items-start gap-3 lg:grid-cols-[1.15fr_1fr]">
        {/* 1. Donaciones: la tarea principal del panel */}
        <section aria-labelledby="titulo-pendientes" className="bento grid gap-4 bg-superficie">
          <div>
            <h2 id="titulo-pendientes" className="text-3xl">
              Por confirmar
            </h2>
            <p className="mt-1 text-tinta-suave">
              Personas que avisaron que vienen a dejar ropa. Confírmalas cuando la recibas: solo así suman al impacto.
            </p>
          </div>

          {avisoDonacion && (
            <p
              role={avisoDonacion.tipo === "ok" ? "status" : "alert"}
              className={cn(
                "flex items-start gap-2 rounded-2xl p-4 font-bold",
                avisoDonacion.tipo === "ok" ? "bg-lima" : "bg-alerta-clara",
              )}
            >
              {avisoDonacion.tipo === "ok" ? (
                <CheckCircle2 className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
              ) : (
                <AlertCircle className="mt-0.5 size-5 shrink-0 text-alerta" aria-hidden="true" />
              )}
              {avisoDonacion.texto}
            </p>
          )}

          {pendientes.length === 0 ? (
            <div className="flex items-center gap-3 rounded-2xl bg-fondo p-5">
              <Inbox className="size-8 shrink-0 text-hoja-oscura" aria-hidden="true" />
              <p>
                <strong>Nada pendiente.</strong>{" "}
                <span className="text-tinta-suave">Cuando alguien avise que viene, aparecerá aquí.</span>
              </p>
            </div>
          ) : (
            <ul className="grid gap-3">
              {pendientes.map((d) => (
                <li key={d.id} className="rounded-3xl border-2 border-borde p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-tinta-suave">Avisó {haceCuanto(d.creadoEn)}</p>
                      <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Prendas">
                        {d.items.map((item) => (
                          <li key={item.prenda} className="rounded-full bg-menta-clara px-3 py-1 text-sm font-bold">
                            {item.cantidad} × {etiquetas.prenda.get(item.prenda) ?? item.prenda}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <p className="text-right">
                      <span className="block font-display text-2xl font-bold">{d.totalPrendas} prendas</span>
                      <span className="text-sm text-tinta-suave">~{kg(d.kgEstimados)} kg</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => confirmar(d)}
                    disabled={confirmandoId !== null}
                    className="boton-primario mt-4 w-full sm:w-auto"
                  >
                    <PackageCheck className="size-5" aria-hidden="true" />
                    {confirmandoId === d.id ? "Confirmando…" : "Ya la recibimos"}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {recibidas.length > 0 && (
            <details className="group rounded-2xl bg-fondo">
              <summary className="flex min-h-12 cursor-pointer items-center justify-between gap-2 px-4 font-bold">
                Recibidas ({recibidas.length})
                <span aria-hidden="true" className="text-tinta-suave transition-transform group-open:rotate-90">
                  ›
                </span>
              </summary>
              <ul className="grid gap-2 px-4 pb-4">
                {recibidas.map((d) => (
                  <li
                    key={d.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-superficie px-4 py-3"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Check className="size-4 text-hoja-oscura" aria-hidden="true" />
                      {d.items.map((i) => `${i.cantidad} × ${etiquetas.prenda.get(i.prenda) ?? i.prenda}`).join(" · ")}
                    </span>
                    <span className="text-sm text-tinta-suave">
                      {d.recibidaEn ? `recibida ${haceCuanto(d.recibidaEn)}` : "recibida"} · ~{kg(d.kgEstimados)} kg
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </section>

        {/* 2. Lo que ven las personas en el mapa */}
        <form
          onSubmit={guardar}
          aria-labelledby="titulo-mapa"
          className="bento grid gap-6 bg-superficie lg:sticky lg:top-24"
        >
          <div>
            <h2 id="titulo-mapa" className="text-3xl">
              Lo que ven en el mapa
            </h2>
            <p className="mt-1 text-tinta-suave">Mantenlo al día y te llegará justo lo que necesitan.</p>
          </div>

          {/* Vista previa, igual a la tarjeta de la lista en /donar */}
          <div className="rounded-3xl bg-fondo p-4">
            <p className="etiqueta text-tinta-suave">Así te ven</p>
            <p className="mt-2 font-display text-xl leading-tight font-bold">{nombreCorto}</p>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-tinta-suave">
              <span className="font-bold text-tinta">{fundacion.comuna}</span>
              {aceptaDanada && (
                <span className="inline-flex items-center gap-1 text-kraft-tinta">
                  <Recycle className="size-3.5" aria-hidden="true" /> recibe textil dañado
                </span>
              )}
            </p>
            {necesidades.trim() && (
              <p className="mt-2 rounded-2xl bg-lima/60 px-3 py-2 text-sm font-bold">Necesitan: {necesidades.trim()}</p>
            )}
          </div>

          <div>
            <label htmlFor="necesidades" className="font-bold">
              ¿Qué necesitan con urgencia?
            </label>
            <textarea
              id="necesidades"
              value={necesidades}
              onChange={(e) => setNecesidades(e.target.value)}
              maxLength={400}
              rows={3}
              placeholder="Ej: parkas de niño y uniformes de básica"
              aria-describedby="ayuda-necesidades"
              className="campo mt-2 py-3"
            />
            <p id="ayuda-necesidades" className="mt-1 text-sm text-tinta-suave">
              {necesidades.length} de 400 · Déjalo vacío si no hay nada urgente.
            </p>
          </div>

          <fieldset>
            <legend className="font-bold">¿Qué prendas reciben?</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              <ChipFiltro activo={prendas.length === 0} onClick={() => setPrendas([])}>
                Recibimos de todo
              </ChipFiltro>
              {catalogo?.prendas.map((p) => (
                <ChipFiltro
                  key={p.id}
                  activo={prendas.includes(p.id)}
                  onClick={() =>
                    setPrendas((actual) =>
                      actual.includes(p.id) ? actual.filter((x) => x !== p.id) : [...actual, p.id],
                    )
                  }
                >
                  {p.etiqueta}
                </ChipFiltro>
              ))}
            </div>
          </fieldset>

          <label
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-hoja",
              aceptaDanada ? "border-kraft-tinta bg-kraft-clara" : "border-borde hover:border-hoja",
            )}
          >
            <input
              type="checkbox"
              checked={aceptaDanada}
              onChange={(e) => setAceptaDanada(e.target.checked)}
              className="mt-1 size-5 accent-hoja"
            />
            <span>
              <span className="font-bold">También recibimos textil dañado para reciclaje</span>
              <span className="block text-sm text-tinta-suave">
                Aparecerán en el mapa cuando alguien elija "Reciclar textil".
              </span>
            </span>
          </label>

          <fieldset>
            <legend className="font-bold">Horario de recepción</legend>
            <ul className="mt-2 grid gap-2">
              {SEMANA.map(({ dia, nombre }) => {
                const d = semana[dia];
                return (
                  <li
                    key={dia}
                    className={cn(
                      "grid grid-cols-[7.5rem_1fr] items-center gap-2 rounded-2xl px-3 py-2 sm:grid-cols-[8rem_1fr_1fr]",
                      d.activo ? "bg-menta-clara" : "bg-fondo",
                    )}
                  >
                    <label className="flex min-h-11 cursor-pointer items-center gap-2 font-bold">
                      <input
                        type="checkbox"
                        checked={d.activo}
                        onChange={(e) => cambiarDia(dia, { activo: e.target.checked })}
                        className="size-5 accent-hoja"
                      />
                      {nombre}
                    </label>
                    {d.activo ? (
                      <div className="col-span-1 flex items-center gap-2 sm:col-span-2">
                        <label className="sr-only" htmlFor={`abre-${dia}`}>
                          {nombre}: abre
                        </label>
                        <input
                          id={`abre-${dia}`}
                          type="time"
                          value={d.abre}
                          onChange={(e) => cambiarDia(dia, { abre: e.target.value })}
                          className="campo min-h-11 px-2 text-sm"
                        />
                        <span aria-hidden="true">–</span>
                        <label className="sr-only" htmlFor={`cierra-${dia}`}>
                          {nombre}: cierra
                        </label>
                        <input
                          id={`cierra-${dia}`}
                          type="time"
                          value={d.cierra}
                          onChange={(e) => cambiarDia(dia, { cierra: e.target.value })}
                          className="campo min-h-11 px-2 text-sm"
                        />
                      </div>
                    ) : (
                      <span className="text-sm text-tinta-suave sm:col-span-2">Cerrado</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </fieldset>

          {aviso && (
            <p
              role={aviso.tipo === "ok" ? "status" : "alert"}
              className={cn("rounded-2xl p-4 font-bold", aviso.tipo === "ok" ? "bg-menta" : "bg-alerta-clara")}
            >
              {aviso.texto}
            </p>
          )}
          <button type="submit" disabled={guardando} className="boton-primario min-h-14 text-lg">
            {guardando ? "Guardando…" : "Guardar cambios"}
          </button>
        </form>
      </div>
    </section>
  );
}
