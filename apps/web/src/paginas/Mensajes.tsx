import { ArrowLeft, MessagesSquare, Send } from "lucide-react";
import { type FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import { FotoPrenda } from "../componentes/FotoPrenda";
import { api, type Conversacion, type ResumenConversacion } from "../lib/api";
import { formatearPrecioVenta, haceCuanto } from "../lib/catalogo";
import { cn } from "../lib/cn";
import { useSesion } from "../lib/sesion";

/** Cada cuánto se buscan mensajes nuevos. Sin WebSockets: alcanza para un chat de compraventa. */
const INTERVALO_MS = 4000;

const hora = new Intl.DateTimeFormat("es-CL", { hour: "2-digit", minute: "2-digit" });

/** Bandeja a la izquierda y conversación a la derecha; en el celular se ve una a la vez. */
export function Mensajes() {
  const { id } = useParams();
  const [bandeja, setBandeja] = useState<ResumenConversacion[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargarBandeja = useCallback(() => {
    api
      .conversaciones()
      .then(setBandeja)
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => {
    cargarBandeja();
    const t = window.setInterval(() => document.visibilityState === "visible" && cargarBandeja(), INTERVALO_MS * 3);
    return () => window.clearInterval(t);
  }, [cargarBandeja]);

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12" aria-labelledby="titulo-mensajes">
      <h1 id="titulo-mensajes" className={cn("text-4xl md:text-5xl", id && "sr-only md:not-sr-only")}>
        Mensajes
      </h1>
      <div className="mt-6 grid gap-3 md:h-[calc(100dvh-14rem)] md:min-h-[32rem] md:grid-cols-[22rem_1fr]">
        <nav
          aria-label="Conversaciones"
          className={cn("bento min-h-0 overflow-y-auto bg-superficie p-2 md:p-2", id && "hidden md:block")}
        >
          {error && <p className="p-4 text-alerta">{error}</p>}
          {!bandeja && !error && <p className="p-4 text-tinta-suave">Cargando…</p>}
          {bandeja?.length === 0 && (
            <div className="p-5">
              <MessagesSquare className="size-8 text-hoja-oscura" aria-hidden="true" />
              <p className="mt-3 font-bold">Aún no tienes conversaciones</p>
              <p className="mt-1 text-sm text-tinta-suave">
                Cuando escribas por una prenda del mercado, o alguien te escriba por las tuyas, aparecerán aquí.
              </p>
              <Link to="/mercado" className="boton-primario mt-4">
                Ir al mercado
              </Link>
            </div>
          )}
          <ul className="grid gap-1">
            {bandeja?.map((c) => (
              <li key={c.id}>
                <Link
                  to={`/mensajes/${c.id}`}
                  aria-current={c.id === id ? "page" : undefined}
                  className={cn(
                    "flex gap-3 rounded-3xl p-3 transition-colors",
                    c.id === id ? "bg-menta" : "hover:bg-fondo",
                  )}
                >
                  <div className="size-14 shrink-0 overflow-hidden rounded-2xl">
                    <FotoPrenda foto={c.publicacion.foto} prenda="" titulo={c.publicacion.titulo} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-baseline justify-between gap-2">
                      <span className="truncate font-bold">{c.contraparte.nombre}</span>
                      <span className="shrink-0 text-xs text-tinta-suave">{haceCuanto(c.ultimoMensajeEn)}</span>
                    </p>
                    <p className="truncate text-sm text-tinta-suave">{c.publicacion.titulo}</p>
                    <p className="flex items-center justify-between gap-2">
                      <span className={cn("truncate text-sm", c.noLeidos > 0 ? "font-bold" : "text-tinta-suave")}>
                        {c.ultimoMensaje ?? "Sin mensajes todavía"}
                      </span>
                      {c.noLeidos > 0 && (
                        <span className="flex min-w-6 shrink-0 items-center justify-center rounded-full bg-hoja px-1.5 text-xs leading-6 font-bold text-white">
                          {c.noLeidos}
                          <span className="sr-only"> sin leer</span>
                        </span>
                      )}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className={cn("min-h-0", !id && "hidden md:block")}>
          {id ? (
            <Hilo key={id} id={id} alCambiar={cargarBandeja} />
          ) : (
            <div className="bento flex h-full flex-col items-center justify-center bg-menta-clara text-center">
              <MessagesSquare className="size-12 text-hoja-oscura" aria-hidden="true" />
              <p className="mt-4 font-display text-2xl font-bold">Elige una conversación</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Hilo({ id, alCambiar }: { id: string; alCambiar: () => void }) {
  const { refrescarNoLeidos } = useSesion();
  const [conversacion, setConversacion] = useState<Conversacion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const fondo = useRef<HTMLLIElement>(null);
  const totalMensajes = conversacion?.mensajes.length ?? 0;

  const cargar = useCallback(() => {
    api
      .conversacion(id)
      .then((c) => {
        setConversacion(c);
        refrescarNoLeidos();
      })
      .catch((e: Error) => setError(e.message));
  }, [id, refrescarNoLeidos]);

  useEffect(() => {
    cargar();
    const t = window.setInterval(() => document.visibilityState === "visible" && cargar(), INTERVALO_MS);
    return () => window.clearInterval(t);
  }, [cargar]);

  // Baja al último mensaje cuando llega uno nuevo.
  // biome-ignore lint/correctness/useExhaustiveDependencies: depende solo de la cantidad de mensajes
  useEffect(() => {
    fondo.current?.scrollIntoView({ block: "end" });
  }, [totalMensajes]);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const limpio = texto.trim();
    if (!limpio || !conversacion) return;
    setEnviando(true);
    try {
      const mensaje = await api.enviarMensaje(id, limpio);
      setConversacion({ ...conversacion, mensajes: [...conversacion.mensajes, mensaje] });
      setTexto("");
      alCambiar();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  if (error && !conversacion) {
    return (
      <div role="alert" className="bento bg-alerta-clara">
        <p className="font-bold">{error}</p>
        <Link to="/mensajes" className="boton-secundario mt-4">
          Volver
        </Link>
      </div>
    );
  }
  if (!conversacion) return <div className="h-full animate-pulse rounded-tarjeta bg-superficie" />;

  const { publicacion } = conversacion;
  return (
    <div className="flex h-[calc(100dvh-9rem)] flex-col overflow-hidden rounded-tarjeta bg-superficie md:h-full">
      {/* Cabecera: con quién hablo y por qué prenda */}
      <header className="flex items-center gap-3 border-b border-borde p-3">
        <Link to="/mensajes" className="flex size-11 items-center justify-center rounded-full hover:bg-fondo md:hidden">
          <ArrowLeft className="size-5" aria-hidden="true" />
          <span className="sr-only">Volver a la bandeja</span>
        </Link>
        <Link
          to={`/mercado/${publicacion.id}`}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl p-1 hover:bg-fondo"
        >
          <div className="size-12 shrink-0 overflow-hidden rounded-xl">
            <FotoPrenda foto={publicacion.foto} prenda="" titulo={publicacion.titulo} />
          </div>
          <div className="min-w-0">
            <p className="truncate font-bold">{conversacion.contraparte.nombre}</p>
            <p className="truncate text-sm text-tinta-suave">
              {publicacion.titulo} · {formatearPrecioVenta(publicacion.precio)}
              {publicacion.estado !== "disponible" && ` · ${publicacion.estado}`}
            </p>
          </div>
        </Link>
        <span className="hidden rounded-full bg-fondo px-3 py-1 text-xs font-bold text-tinta-suave sm:inline">
          {conversacion.rol === "vendedor" ? "Te quieren comprar" : "Estás comprando"}
        </span>
      </header>

      {/* Mensajes */}
      <ol
        className="flex flex-1 flex-col gap-2 overflow-y-auto bg-fondo/60 p-4"
        aria-live="polite"
        aria-label="Mensajes"
      >
        {conversacion.mensajes.length === 0 && (
          <li className="m-auto text-center text-tinta-suave">Escribe el primer mensaje.</li>
        )}
        {conversacion.mensajes.map((m) => (
          <li
            key={m.id}
            className={cn(
              "max-w-[80%] rounded-3xl px-4 py-2.5",
              m.mio ? "self-end rounded-br-md bg-tinta text-fondo" : "self-start rounded-bl-md bg-superficie",
            )}
          >
            <span className="sr-only">{m.mio ? "Tú: " : `${conversacion.contraparte.nombre}: `}</span>
            <p className="whitespace-pre-line">{m.texto}</p>
            <p className={cn("mt-0.5 text-right text-xs", m.mio ? "text-fondo/70" : "text-tinta-suave")}>
              {hora.format(new Date(m.creadoEn))}
            </p>
          </li>
        ))}
        <li ref={fondo} aria-hidden="true" />
      </ol>

      {/* Caja de texto */}
      <form onSubmit={enviar} className="flex items-end gap-2 border-t border-borde p-3">
        <label htmlFor="nuevo-mensaje" className="sr-only">
          Escribe un mensaje
        </label>
        <textarea
          id="nuevo-mensaje"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            // Enter envía; Shift+Enter hace un salto de línea.
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
          rows={1}
          maxLength={1000}
          placeholder="Escribe un mensaje…"
          className="campo max-h-32 min-h-12 resize-none py-3"
        />
        <button
          type="submit"
          disabled={enviando || !texto.trim()}
          className="flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-full bg-hoja text-white transition-colors hover:bg-hoja-oscura disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send className="size-5" aria-hidden="true" />
          <span className="sr-only">Enviar</span>
        </button>
      </form>
      {error && (
        <p role="alert" className="bg-alerta-clara px-4 py-2 text-sm">
          {error}
        </p>
      )}
    </div>
  );
}
