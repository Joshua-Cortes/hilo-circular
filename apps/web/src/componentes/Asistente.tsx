import { ArrowLeft, ArrowRight, HandHeart, Recycle, Scissors } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { api, type Catalogo, type Recomendacion } from "../lib/api";

const ICONO_ACCION = { donar: HandHeart, reparar: Scissors, reciclar: Recycle };
const DESTINO_ACCION = { donar: "/donar", reparar: "/reparar", reciclar: "/donar" };
const BOTON_ACCION = {
  donar: "Ver dónde donar",
  reparar: "Ver talleres cercanos",
  reciclar: "Ver puntos de reciclaje",
};

type Paso = "prenda" | "estado" | "resultado";

/**
 * "¿Qué hago con esta prenda?": dos preguntas y una recomendación (reparar, donar o reciclar).
 * Una pregunta por pantalla y botones grandes, pensado para quien usa poco el celular.
 */
export function Asistente() {
  const [catalogo, setCatalogo] = useState<Catalogo | null>(null);
  const [paso, setPaso] = useState<Paso>("prenda");
  const [prenda, setPrenda] = useState<string | null>(null);
  const [resultado, setResultado] = useState<Recomendacion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const titulo = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    api
      .catalogo()
      .then(setCatalogo)
      .catch((e: Error) => setError(e.message));
  }, []);

  // Al cambiar de paso, el foco va al título para que los lectores de pantalla anuncien la nueva pregunta.
  // biome-ignore lint/correctness/useExhaustiveDependencies: el efecto debe correr justamente cuando cambia el paso
  useEffect(() => {
    titulo.current?.focus();
  }, [paso]);

  async function elegirEstado(estado: string) {
    if (!prenda) return;
    try {
      setResultado(await api.orientacion(prenda, estado));
      setPaso("resultado");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function reiniciar() {
    setPrenda(null);
    setResultado(null);
    setPaso("prenda");
  }

  const etiquetaPrenda = catalogo?.prendas.find((p) => p.id === prenda)?.etiqueta;
  const numeroPaso = paso === "prenda" ? 1 : paso === "estado" ? 2 : 3;

  return (
    <section
      aria-labelledby="titulo-asistente"
      className="tarjeta relative p-6 shadow-[0_1px_0_var(--color-borde)] md:p-8"
    >
      <p className="text-sm font-bold tracking-widest text-terracota-tinta uppercase">Paso {numeroPaso} de 3</p>
      <div className="mt-2 flex gap-1.5" aria-hidden="true">
        {[1, 2, 3].map((n) => (
          <span
            key={n}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${n <= numeroPaso ? "bg-terracota" : "bg-borde"}`}
          />
        ))}
      </div>

      {error && (
        <p role="alert" className="mt-6 rounded-xl border border-terracota-tinta bg-terracota-claro/30 p-4">
          {error}
        </p>
      )}

      {paso === "prenda" && (
        <div>
          <h2 id="titulo-asistente" ref={titulo} tabIndex={-1} className="mt-5 text-3xl font-semibold outline-none">
            ¿Qué prenda tienes en la mano?
          </h2>
          {!catalogo && !error && <p className="mt-6 text-tinta-suave">Cargando opciones…</p>}
          <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {catalogo?.prendas.map((opcion) => (
              <li key={opcion.id}>
                <button
                  type="button"
                  onClick={() => {
                    setPrenda(opcion.id);
                    setPaso("estado");
                  }}
                  className="flex min-h-14 w-full cursor-pointer items-center justify-between rounded-xl border-2 border-borde bg-crema px-4 text-left font-bold transition-colors duration-200 hover:border-bosque"
                >
                  {opcion.etiqueta}
                  <ArrowRight className="size-5 text-terracota" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {paso === "estado" && (
        <div>
          <h2 id="titulo-asistente" ref={titulo} tabIndex={-1} className="mt-5 text-3xl font-semibold outline-none">
            ¿Cómo está tu {etiquetaPrenda?.toLowerCase()}?
          </h2>
          <ul className="mt-6 grid gap-3">
            {catalogo?.estados.map((opcion) => (
              <li key={opcion.id}>
                <button
                  type="button"
                  onClick={() => elegirEstado(opcion.id)}
                  className="flex min-h-16 w-full cursor-pointer items-center justify-between rounded-xl border-2 border-borde bg-crema px-5 text-left text-lg font-bold transition-colors duration-200 hover:border-bosque"
                >
                  {opcion.etiqueta}
                  <ArrowRight className="size-5 shrink-0 text-terracota" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
          <button type="button" onClick={reiniciar} className="boton mt-4 -ml-4 text-tinta-suave hover:text-bosque">
            <ArrowLeft className="size-5" aria-hidden="true" /> Cambiar prenda
          </button>
        </div>
      )}

      {paso === "resultado" && resultado && (
        <Resultado resultado={resultado} tituloRef={titulo} alReiniciar={reiniciar} />
      )}
    </section>
  );
}

function Resultado({
  resultado,
  tituloRef,
  alReiniciar,
}: {
  resultado: Recomendacion;
  tituloRef: React.RefObject<HTMLHeadingElement | null>;
  alReiniciar: () => void;
}) {
  const Icono = ICONO_ACCION[resultado.accion];
  const destino = `${DESTINO_ACCION[resultado.accion]}?${new URLSearchParams(resultado.filtros)}`;
  return (
    <div aria-live="polite">
      <div className="mt-6 flex size-14 items-center justify-center rounded-full bg-salvia-claro text-salvia">
        <Icono className="size-7" aria-hidden="true" />
      </div>
      <h2 id="titulo-asistente" ref={tituloRef} tabIndex={-1} className="mt-4 text-3xl font-semibold outline-none">
        {resultado.titulo}
      </h2>
      <p className="mt-3 max-w-prose text-lg text-tinta-suave">{resultado.explicacion}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link to={destino} className="boton-primario">
          {BOTON_ACCION[resultado.accion]} <ArrowRight className="size-5" aria-hidden="true" />
        </Link>
        <button type="button" onClick={alReiniciar} className="boton-secundario">
          Consultar otra prenda
        </button>
      </div>
    </div>
  );
}
