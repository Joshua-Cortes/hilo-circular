
import { AlertCircle, CheckCircle2, Plus, Trash2 } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { EncabezadoPagina } from "../componentes/EncabezadoPagina";
import { ChipFiltro } from "../componentes/ui/ChipFiltro";
import { api, ErrorApi, type Horario, type MiFundacion, type DonacionFundacion, } from "../lib/api";
import { useCatalogo } from "../lib/catalogo";
import { useSesion } from "../lib/sesion";


const DIAS = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
];

export function MiFundacion() {
    const { usuario } = useSesion();
    const { catalogo } = useCatalogo();

    const [fundacion, setFundacion] = useState<MiFundacion | null>(null);
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);

    const [necesidades, setNecesidades] = useState("");
    const [prendas, setPrendas] = useState<string[]>([]);
    const [horarios, setHorarios] = useState<Horario[]>([]);

    const [error, setError] = useState<string | null>(null);
    const [exito, setExito] = useState<string | null>(null);


    const [donaciones, setDonaciones] = useState<DonacionFundacion[]>([]);
    const [cargandoDonaciones, setCargandoDonaciones] = useState(true);
    const [errorDonaciones, setErrorDonaciones] = useState<string | null>(null);
    const [confirmandoId, setConfirmandoId] = useState<string | null>(null);
    const [mensajeDonaciones, setMensajeDonaciones] = useState<string | null>(null);


    useEffect(() => {
        if (usuario?.rol !== "fundacion") {
            setCargando(false);
            return;
        }

        let vigente = true;

        api.miFundacion()
            .then((datos) => {
                if (!vigente) return;
                setFundacion(datos);
                setNecesidades(datos.necesidadesActuales);
                setPrendas(datos.prendasAceptadas);
                setHorarios(datos.horarios);
            })
            .catch((err: unknown) => {
                if (!vigente) return;
                if (err instanceof ErrorApi && err.status === 404) {
                    setError(
                        "Esta cuenta todavía no tiene un perfil de fundación registrado."
                    );
                } else {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "No se pudo cargar la fundación."
                    );
                }
            })
            .finally(() => {
                if (vigente) setCargando(false);
            });

        return () => {
            vigente = false;
        };
    }, [usuario?.rol]);


    useEffect(() => {
        if (usuario?.rol !== "fundacion") {
            setCargandoDonaciones(false);
            return;
        }

        let vigente = true;

        api.misDonaciones()
            .then((datos) => {
                if (vigente) setDonaciones(datos);
            })
            .catch((err: unknown) => {
                if (vigente) {
                    setErrorDonaciones(
                        err instanceof Error
                            ? err.message
                            : "No pudimos cargar las donaciones."
                    );
                }
            })
            .finally(() => {
                if (vigente) setCargandoDonaciones(false);
            });

        return () => {
            vigente = false;
        };
    }, [usuario?.rol]);


    function alternarPrenda(id: string) {
        setPrendas((actuales) =>
            actuales.includes(id)
                ? actuales.filter((p) => p !== id)
                : [...actuales, id]
        );
    }

    function agregarHorario() {
        if (horarios.length >= 21) return;

        setHorarios((actuales) => [
            ...actuales,
            { dia: 1, abre: "09:00", cierra: "17:00" },
        ]);
    }

    function cambiarHorario(index: number, cambio: Partial<Horario>) {
        setHorarios((actuales) =>
            actuales.map((horario, i) =>
                i === index ? { ...horario, ...cambio } : horario
            )
        );
    }

    function eliminarHorario(index: number) {
        setHorarios((actuales) =>
            actuales.filter((_, i) => i !== index)
        );
    }

    async function guardarCambios(evento: FormEvent<HTMLFormElement>) {
        evento.preventDefault();
        if (!fundacion || guardando) return;

        setError(null);
        setExito(null);

        if (horarios.some((h) => h.abre >= h.cierra)) {
            setError(
                "Revisa los horarios: el cierre debe ser posterior a la apertura."
            );
            return;
        }

        setGuardando(true);

        try {
            const actualizada = await api.actualizarMiFundacion({
                necesidadesActuales: necesidades.trim(),
                prendasAceptadas: prendas,
                horarios,
            });

            setFundacion(actualizada);
            setNecesidades(actualizada.necesidadesActuales);
            setPrendas(actualizada.prendasAceptadas);
            setHorarios(actualizada.horarios);
            setExito("Los datos de tu fundación se guardaron correctamente.");
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "No pudimos guardar los cambios."
            );
        } finally {
            setGuardando(false);
        }
    }


    async function confirmarDonacion(id: string) {
        if (confirmandoId) return;

        setConfirmandoId(id);
        setErrorDonaciones(null);
        setMensajeDonaciones(null);

        try {
            const actualizada = await api.confirmarRecepcion(id);

            setDonaciones((anteriores) =>
                anteriores.map((donacion) =>
                    donacion.id === id
                        ? {
                            ...donacion,
                            ...actualizada,
                        }
                        : donacion
                )
            );

            setMensajeDonaciones(
                "¡Donación recibida! Gracias por confirmar la recepción."
            );
        } catch (err) {
            setErrorDonaciones(
                err instanceof Error
                    ? err.message
                    : "No pudimos confirmar la donación."
            );
        } finally {
            setConfirmandoId(null);
        }
    }


    if (usuario?.rol !== "fundacion") {
        return (
            <section className="mx-auto max-w-4xl px-4 py-12">
                <div className="bento bg-superficie">
                    <h1 className="text-3xl">Panel de fundación</h1>
                    <p className="mt-3">
                        Esta sección es exclusiva para cuentas de fundación.
                    </p>
                </div>
            </section>
        );
    }

    if (cargando) {
        return (
            <div
                className="mx-auto max-w-4xl px-4 py-16"
                role="status"
            >
                Cargando información de tu fundación…
            </div>
        );
    }

    if (!fundacion) {
        return (
            <section className="mx-auto max-w-4xl px-4 py-12">
                <div className="bento bg-superficie">
                    <h1 className="text-3xl">Mi Fundación</h1>
                    <p className="mt-4 text-alerta" role="alert">
                        {error ?? "No encontramos el perfil de tu fundación."}
                    </p>
                </div>
            </section>
        );
    }

    return (
        <section className="mx-auto max-w-5xl px-4 py-10 md:px-6 md:py-14">
            <EncabezadoPagina
                etiqueta="Panel de fundación"
                titulo={
                    <>
                        Mi <em className="acento">Fundación</em>
                    </>
                }
            >
                Actualiza lo que necesitan y cuándo pueden recibir donaciones.
            </EncabezadoPagina>

            <div className="bento mt-8 bg-superficie">
                <h2 className="text-3xl">{fundacion.nombre}</h2>
                <p className="mt-2 text-tinta-suave">
                    {fundacion.direccion}, {fundacion.comuna}
                </p>
            </div>

            <form onSubmit={guardarCambios} className="mt-6 space-y-6">
                <div className="bento bg-superficie">
                    <h2 className="text-2xl">
                        ¿Qué necesitan actualmente?
                    </h2>
                    <p className="mt-2 text-tinta-suave">
                        Cuéntales a las personas qué prendas necesitan con mayor urgencia.
                    </p>

                    <label htmlFor="necesidades" className="sr-only">
                        Necesidades actuales
                    </label>
                    <textarea
                        id="necesidades"
                        value={necesidades}
                        onChange={(e) => setNecesidades(e.target.value)}
                        maxLength={400}
                        rows={4}
                        placeholder="Ejemplo: Necesitamos parkas y uniformes escolares."
                        className="mt-4 w-full rounded-xl border-2 border-borde-fuerte bg-fondo p-4 text-base text-tinta"
                    />
                    <p className="mt-2 text-sm text-tinta-suave">
                        {necesidades.length} de 400 caracteres
                    </p>
                </div>

                <fieldset className="bento bg-superficie">
                    <legend className="sr-only">
                        Tipos de prendas aceptadas
                    </legend>
                    <h2 className="text-2xl">
                        ¿Qué prendas reciben?
                    </h2>
                    <p className="mt-2 text-tinta-suave">
                        Selecciona las prendas que tu fundación puede recibir.
                        Si no seleccionas ninguna, se aceptarán todos los tipos.
                    </p>

                    <div className="mt-5 flex flex-wrap gap-3">
                        {catalogo?.prendas.map((prenda) => (
                            <ChipFiltro
                                key={prenda.id}
                                activo={prendas.includes(prenda.id)}
                                onClick={() => alternarPrenda(prenda.id)}
                            >
                                {prenda.etiqueta}
                            </ChipFiltro>
                        ))}
                    </div>
                </fieldset>

                <div className="bento bg-superficie">
                    <h2 className="text-2xl">
                        Horarios de recepción
                    </h2>
                    <p className="mt-2 text-tinta-suave">
                        Indica los días y horas en que pueden recibir donaciones.
                    </p>

                    <div className="mt-5 space-y-3">
                        {horarios.map((horario, index) => (
                            <div
                                key={index}
                                className="grid gap-3 rounded-xl border-2 border-borde bg-fondo p-4 sm:grid-cols-[1fr_1fr_1fr_auto]"
                            >
                                <label className="text-sm font-bold">
                                    Día
                                    <select
                                        value={horario.dia}
                                        onChange={(e) =>
                                            cambiarHorario(index, {
                                                dia: Number(e.target.value),
                                            })
                                        }
                                        className="mt-1 min-h-12 w-full rounded-lg border border-borde-fuerte bg-superficie px-3"
                                    >
                                        {DIAS.map((dia, numero) => (
                                            <option key={dia} value={numero}>
                                                {dia}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label className="text-sm font-bold">
                                    Abre
                                    <input
                                        type="time"
                                        value={horario.abre}
                                        onChange={(e) =>
                                            cambiarHorario(index, { abre: e.target.value })
                                        }
                                        className="mt-1 min-h-12 w-full rounded-lg border border-borde-fuerte bg-superficie px-3"
                                    />
                                </label>

                                <label className="text-sm font-bold">
                                    Cierra
                                    <input
                                        type="time"
                                        value={horario.cierra}
                                        onChange={(e) =>
                                            cambiarHorario(index, { cierra: e.target.value })
                                        }
                                        className="mt-1 min-h-12 w-full rounded-lg border border-borde-fuerte bg-superficie px-3"
                                    />
                                </label>

                                <button
                                    type="button"
                                    onClick={() => eliminarHorario(index)}
                                    aria-label={`Eliminar horario ${index + 1}`}
                                    className="boton-secundario self-end"
                                >
                                    <Trash2 className="size-5" aria-hidden="true" />
                                </button>
                            </div>
                        ))}

                        {horarios.length === 0 && (
                            <p className="text-tinta-suave">
                                Todavía no tienes horarios registrados.
                            </p>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={agregarHorario}
                        disabled={horarios.length >= 21}
                        className="boton-secundario mt-5 disabled:opacity-60"
                    >
                        <Plus className="size-5" aria-hidden="true" />
                        Agregar horario
                    </button>
                </div>

                {error && (
                    <div
                        role="alert"
                        className="flex gap-3 rounded-xl bg-superficie p-4 text-alerta"
                    >
                        <AlertCircle className="size-6 shrink-0" />
                        <p>{error}</p>
                    </div>
                )}

                {exito && (
                    <div
                        role="status"
                        className="flex gap-3 rounded-xl bg-menta-clara p-4"
                    >
                        <CheckCircle2 className="size-6 shrink-0 text-hoja" />
                        <p>{exito}</p>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={guardando}
                    className="boton-primario w-full justify-center disabled:opacity-60 sm:w-auto"
                >
                    {guardando ? "Guardando cambios…" : "Guardar cambios"}
                </button>
            </form>

            {/* Donaciones de la fundación */}
            <section className="mt-12" aria-labelledby="titulo-donaciones">
                <h2 id="titulo-donaciones" className="text-3xl md:text-4xl">
                    Donaciones recibidas y pendientes
                </h2>

                <p className="mt-3 text-tinta-suave">
                    Revisa las donaciones registradas para tu fundación.
                    Confirma cada una cuando hayas recibido las prendas.
                </p>

                {mensajeDonaciones && (
                    <div
                        role="status"
                        className="mt-5 rounded-xl bg-menta-clara p-4 text-hoja-oscura"
                    >
                        {mensajeDonaciones}
                    </div>
                )}

                {errorDonaciones && (
                    <div
                        role="alert"
                        className="mt-5 rounded-xl bg-superficie p-4 text-alerta"
                    >
                        {errorDonaciones}
                    </div>
                )}

                {cargandoDonaciones ? (
                    <p className="mt-6" role="status">
                        Cargando donaciones…
                    </p>
                ) : donaciones.length === 0 ? (
                    <div className="bento mt-6 bg-superficie">
                        <h3 className="text-2xl">Todavía no hay donaciones</h3>
                        <p className="mt-2 text-tinta-suave">
                            Cuando alguien registre una donación para tu fundación,
                            aparecerá aquí.
                        </p>
                    </div>
                ) : (
                    <div className="mt-6 grid gap-5">
                        {donaciones.map((donacion) => (
                            <article
                                key={donacion.id}
                                className="bento bg-superficie"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <h3 className="text-2xl">
                                        Donación
                                    </h3>

                                    <span className="rounded-full bg-menta-clara px-4 py-2 text-sm font-bold text-tinta">
                                        {donacion.estado === "registrada"
                                            ? "Pendiente de recepción"
                                            : donacion.estado === "recibida"
                                                ? "Recibida"
                                                : "Cancelada"}
                                    </span>
                                </div>

                                <p className="mt-2 text-sm text-tinta-suave">
                                    Registrada el{" "}
                                    {new Date(donacion.creadoEn).toLocaleDateString("es-CL")}
                                </p>

                                <div className="mt-5">
                                    <h4 className="font-bold">Prendas donadas</h4>

                                    <ul className="mt-3 space-y-2">
                                        {donacion.items.map((item, index) => (
                                            <li
                                                key={index}
                                                className="flex justify-between gap-4 border-b border-borde py-2"
                                            >
                                                <span>
                                                    {catalogo?.prendas.find(
                                                        (prenda) => prenda.id === item.prenda
                                                    )?.etiqueta ?? item.prenda}
                                                </span>
                                                <strong>{item.cantidad}</strong>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="mt-5 flex flex-wrap gap-5">
                                    <div>
                                        <p className="text-sm text-tinta-suave">
                                            Total de prendas
                                        </p>
                                        <p className="text-2xl font-bold">
                                            {donacion.totalPrendas}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm text-tinta-suave">
                                            Peso estimado
                                        </p>
                                        <p className="text-2xl font-bold">
                                            {donacion.kgEstimados.toLocaleString("es-CL", {
                                                maximumFractionDigits: 2,
                                            })}{" "}
                                            kg
                                        </p>
                                    </div>
                                </div>

                                {donacion.estado === "registrada" && (
                                    <button
                                        type="button"
                                        onClick={() => confirmarDonacion(donacion.id)}
                                        disabled={confirmandoId !== null}
                                        className="boton-primario mt-6 w-full justify-center disabled:opacity-60 sm:w-auto"
                                    >
                                        {confirmandoId === donacion.id
                                            ? "Confirmando…"
                                            : "Confirmar recepción"}
                                    </button>
                                )}

                                {donacion.estado === "recibida" && (
                                    <p className="mt-5 font-bold text-hoja">
                                        ✓ Recepción confirmada
                                    </p>
                                )}
                            </article>
                        ))}
                    </div>
                )}
            </section>

        </section>
    );
}
