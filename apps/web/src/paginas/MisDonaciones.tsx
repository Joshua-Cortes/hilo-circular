import { AlertCircle, CheckCircle2, Clock, HandHeart, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { EncabezadoPagina } from "../componentes/EncabezadoPagina";
import { api, type DonacionFundacion, type EstadoDonacion } from "../lib/api";
import { haceCuanto, useCatalogo } from "../lib/catalogo";
import { cn } from "../lib/cn";

const ESTADO: Record<EstadoDonacion, { texto: string; icono: typeof Clock; clase: string }> = {
  registrada: { texto: "Esperando que la fundación la reciba", icono: Clock, clase: "bg-kraft-clara text-kraft-tinta" },
  recibida: { texto: "Recibida · ya suma al impacto", icono: CheckCircle2, clase: "bg-lima text-tinta" },
  cancelada: { texto: "Cancelada", icono: XCircle, clase: "bg-fondo text-tinta-suave" },
};

const kg = (valor: number) => valor.toLocaleString("es-CL", { maximumFractionDigits: 1 });

/** Cierra el ciclo de Donar para quien dona: ve si su ropa llegó y cuánto aportó. */
export function MisDonaciones() {
  const { etiquetas } = useCatalogo();
  const [lista, setLista] = useState<DonacionFundacion[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelando, setCancelando] = useState<string | null>(null);

  useEffect(() => {
    api
      .misDonaciones()
      .then(setLista)
      .catch((e: Error) => setError(e.message));
  }, []);

  async function cancelar(id: string) {
    if (!window.confirm("¿Cancelar este aviso de donación? La fundación ya no te esperará.")) return;
    setCancelando(id);
    try {
      const actualizada = await api.cancelarDonacion(id);
      setLista((actual) => actual?.map((d) => (d.id === id ? { ...d, ...actualizada } : d)) ?? null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCancelando(null);
    }
  }

  const recibidas = lista?.filter((d) => d.estado === "recibida") ?? [];
  const kgRecibidos = recibidas.reduce((total, d) => total + d.kgEstimados, 0);

  return (
    <section className="mx-auto max-w-5xl px-4 py-10 md:px-6 md:py-14" aria-labelledby="titulo-mis-donaciones">
      <EncabezadoPagina
        id="titulo-mis-donaciones"
        etiqueta="02 · Donar · Mi cuenta"
        titulo={
          <>
            Mis <em className="acento">donaciones</em>
          </>
        }
        acciones={
          <Link to="/donar" className="boton-primario">
            <HandHeart className="size-5" aria-hidden="true" /> Donar otra vez
          </Link>
        }
      >
        Aquí ves si tu ropa ya llegó. Cuando la fundación confirma que la recibió, cuenta en el impacto de Hilo
        Circular.
      </EncabezadoPagina>

      {recibidas.length > 0 && (
        <p className="bento mt-10 bg-lima font-display text-2xl font-bold">
          Tus donaciones recibidas sacaron ~{kg(kgRecibidos)} kg de textil del camino al vertedero. ¡Gracias!
        </p>
      )}

      <div className="mt-3" aria-live="polite">
        {error && (
          <p role="alert" className="bento flex items-start gap-2 bg-alerta-clara font-bold">
            <AlertCircle className="mt-0.5 size-5 shrink-0 text-alerta" aria-hidden="true" /> {error}
          </p>
        )}
        {!lista && !error && <div className="mt-7 h-40 animate-pulse rounded-tarjeta bg-superficie" />}
        {lista?.length === 0 && (
          <div className="bento mt-7 bg-kraft-clara">
            <HandHeart className="size-10 text-kraft-tinta" aria-hidden="true" />
            <h2 className="mt-4 text-3xl">Todavía no avisas ninguna donación</h2>
            <p className="mt-2 text-lg text-tinta-800">
              En Donar revisas tu prenda, eliges un punto en el mapa y avisas que vas.
            </p>
          </div>
        )}
        {lista && lista.length > 0 && (
          <ul className="mt-7 grid gap-3">
            {lista.map((d) => {
              const { texto, icono: Icono, clase } = ESTADO[d.estado];
              return (
                <li key={d.id} className="bento grid gap-3 bg-superficie sm:grid-cols-[1fr_auto] sm:items-center">
                  <div className="min-w-0">
                    <p className="font-display text-xl font-bold">{d.fundacion.nombre.replace(" (demo)", "")}</p>
                    <p className="text-sm text-tinta-suave">Avisaste {haceCuanto(d.creadoEn)}</p>
                    <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Prendas">
                      {d.items.map((item) => (
                        <li key={item.prenda} className="rounded-full bg-menta-clara px-3 py-1 text-sm font-bold">
                          {item.cantidad} × {etiquetas.prenda.get(item.prenda) ?? item.prenda}
                        </li>
                      ))}
                      <li className="px-1 py-1 text-sm text-tinta-suave">~{kg(d.kgEstimados)} kg</li>
                    </ul>
                  </div>
                  <div className="flex flex-col items-start gap-2 sm:items-end">
                    <span
                      className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold", clase)}
                    >
                      <Icono className="size-4" aria-hidden="true" /> {texto}
                    </span>
                    {d.estado === "registrada" && (
                      <button
                        type="button"
                        onClick={() => cancelar(d.id)}
                        disabled={cancelando !== null}
                        className="boton min-h-11 px-4 text-sm text-alerta hover:bg-alerta-clara"
                      >
                        {cancelando === d.id ? "Cancelando…" : "Ya no voy a ir"}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
