import { AlertCircle, ArrowLeft, MessageCircle, MessagesSquare, ShieldCheck, Trash2 } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { FotoPrenda } from "../componentes/FotoPrenda";
import { api, type DetallePublicacion as Detalle, type EstadoPublicacion } from "../lib/api";
import { formatearPrecioVenta, haceCuanto, useCatalogo } from "../lib/catalogo";
import { cn } from "../lib/cn";
import { useSesion } from "../lib/sesion";

const RESPUESTAS_RAPIDAS = ["Hola, ¿sigue disponible?", "¿Dónde la podría ver?", "¿Aceptas una oferta?"];

const mesAnio = new Intl.DateTimeFormat("es-CL", { month: "long", year: "numeric" });

export function DetallePublicacion() {
  const { id = "" } = useParams();
  const { etiquetas } = useCatalogo();
  const [publicacion, setPublicacion] = useState<Detalle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fotoActiva, setFotoActiva] = useState(0);

  useEffect(() => {
    setPublicacion(null);
    setError(null);
    setFotoActiva(0);
    api
      .publicacion(id)
      .then(setPublicacion)
      .catch((e: Error) => setError(e.message));
  }, [id]);

  if (error) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-14 md:px-6">
        <div role="alert" className="bento bg-alerta-clara">
          <AlertCircle className="size-8 text-alerta" aria-hidden="true" />
          <h1 className="mt-4 text-4xl">No encontramos esta prenda</h1>
          <p className="mt-2 text-lg">{error}</p>
          <Link to="/mercado" className="boton-primario mt-6">
            Volver al mercado
          </Link>
        </div>
      </section>
    );
  }

  if (!publicacion) {
    return (
      <section className="mx-auto grid max-w-7xl gap-3 px-4 py-14 md:px-6 lg:grid-cols-[1.2fr_1fr]" aria-busy="true">
        <div className="aspect-square animate-pulse rounded-tarjeta bg-superficie" />
        <div className="h-96 animate-pulse rounded-tarjeta bg-superficie" />
      </section>
    );
  }

  const fotos = publicacion.fotos.length > 0 ? publicacion.fotos : [null];

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12" aria-labelledby="titulo-prenda">
      <Link to="/mercado" className="boton -ml-4 text-tinta-suave hover:text-tinta">
        <ArrowLeft className="size-5" aria-hidden="true" /> Volver al mercado
      </Link>

      <div className="mt-4 grid items-start gap-3 lg:grid-cols-[1.2fr_1fr]">
        {/* Galería */}
        <div className="grid gap-3">
          <div className="relative aspect-square overflow-hidden rounded-tarjeta bg-superficie">
            <FotoPrenda
              foto={fotos[fotoActiva] ?? null}
              prenda={publicacion.prenda}
              titulo={`${publicacion.titulo}, foto ${fotoActiva + 1}`}
              grande
            />
            {publicacion.estado !== "disponible" && (
              <span className="absolute top-4 left-4 rounded-full bg-tinta px-4 py-1.5 font-bold text-lima">
                {publicacion.estado === "reservada" ? "Reservada" : "Vendida"}
              </span>
            )}
          </div>
          {fotos.length > 1 && (
            <ul className="grid grid-cols-4 gap-3">
              {fotos.map((foto, i) => (
                <li key={foto ?? i}>
                  <button
                    type="button"
                    onClick={() => setFotoActiva(i)}
                    aria-label={`Ver foto ${i + 1}`}
                    aria-pressed={i === fotoActiva}
                    className={cn(
                      "aspect-square w-full cursor-pointer overflow-hidden rounded-2xl border-3 transition-colors",
                      i === fotoActiva ? "border-hoja" : "border-transparent",
                    )}
                  >
                    <FotoPrenda foto={foto} prenda={publicacion.prenda} titulo="" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Información y acciones */}
        <div className="grid gap-3 lg:sticky lg:top-24">
          <div className="bento bg-superficie">
            <p className={cn("font-display text-5xl font-bold", publicacion.precio === 0 && "text-hoja-oscura")}>
              {formatearPrecioVenta(publicacion.precio)}
            </p>
            <h1 id="titulo-prenda" className="mt-2 text-3xl">
              {publicacion.titulo}
            </h1>
            <ul className="mt-4 flex flex-wrap gap-2 text-sm font-bold">
              <li className="rounded-full bg-menta px-3 py-1.5">
                {etiquetas.condicion.get(publicacion.condicion) ?? publicacion.condicion}
              </li>
              <li className="rounded-full bg-fondo px-3 py-1.5">Talla {publicacion.talla}</li>
              <li className="rounded-full bg-fondo px-3 py-1.5">
                {etiquetas.prenda.get(publicacion.prenda) ?? publicacion.prenda}
              </li>
              <li className="rounded-full bg-fondo px-3 py-1.5">{publicacion.comuna}</li>
            </ul>
            {publicacion.descripcion && (
              <p className="mt-5 text-lg whitespace-pre-line text-tinta-800">{publicacion.descripcion}</p>
            )}
            <div className="mt-6 flex items-center gap-3 border-t border-borde pt-5">
              <span
                aria-hidden="true"
                className="flex size-12 items-center justify-center rounded-full bg-kraft font-display text-xl font-bold"
              >
                {publicacion.vendedor.nombre.charAt(0)}
              </span>
              <p className="text-sm text-tinta-suave">
                Publicado por <strong className="text-tinta">{publicacion.vendedor.nombre}</strong>{" "}
                {haceCuanto(publicacion.creadoEn)}
                <br />
                En Hilo Circular desde {mesAnio.format(new Date(publicacion.vendedor.desde))}
              </p>
            </div>
          </div>

          {publicacion.esMia ? (
            <GestionPropia publicacion={publicacion} alCambiar={setPublicacion} />
          ) : (
            <Contactar publicacion={publicacion} />
          )}

          <div className="bento flex gap-3 bg-menta-clara py-5">
            <ShieldCheck className="size-6 shrink-0 text-hoja-oscura" aria-hidden="true" />
            <p className="text-sm text-tinta-800">
              <strong>Compra con cuidado:</strong> júntense en un lugar público y con luz de día, revisa la prenda antes
              de pagar y nunca transfieras por adelantado.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Contactar({ publicacion }: { publicacion: Detalle }) {
  const { usuario } = useSesion();
  const navegar = useNavigate();
  const [texto, setTexto] = useState(RESPUESTAS_RAPIDAS[0]);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (publicacion.estado === "vendida") {
    return <p className="bento bg-kraft-clara font-bold">Esta prenda ya encontró nueva dueña o dueño.</p>;
  }

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!usuario) {
      navegar(`/ingresar?volver=${encodeURIComponent(`/mercado/${publicacion.id}`)}`);
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      const { id } = await api.abrirConversacion(publicacion.id, texto.trim() || undefined);
      navegar(`/mensajes/${id}`);
    } catch (err) {
      setError((err as Error).message);
      setEnviando(false);
    }
  }

  async function abrirWhatsapp() {
    try {
      const { url } = await api.whatsappPublicacion(publicacion.id);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <form onSubmit={enviar} className="bento grid gap-3 bg-tinta text-fondo">
      <label htmlFor="mensaje-inicial" className="font-display text-2xl font-bold">
        Escríbele a {publicacion.vendedor.nombre.replace(" (demo)", "")}
      </label>
      <div className="flex flex-wrap gap-2">
        {RESPUESTAS_RAPIDAS.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setTexto(r)}
            className={cn(
              "min-h-10 cursor-pointer rounded-full px-3 text-sm font-bold transition-colors",
              texto === r ? "bg-lima text-tinta" : "bg-fondo/10 text-fondo hover:bg-fondo/20",
            )}
          >
            {r}
          </button>
        ))}
      </div>
      <textarea
        id="mensaje-inicial"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        rows={2}
        maxLength={1000}
        className="w-full resize-none rounded-2xl border-2 border-transparent bg-fondo p-3 text-tinta focus:border-lima focus:outline-none"
      />
      {error && (
        <p role="alert" className="rounded-xl bg-alerta-clara px-3 py-2 text-sm text-tinta">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={enviando} className="boton flex-1 bg-lima text-tinta hover:bg-lima/85">
          <MessagesSquare className="size-5" aria-hidden="true" />
          {enviando ? "Abriendo chat…" : usuario ? "Enviar por el chat" : "Inicia sesión para escribir"}
        </button>
        {publicacion.canales.whatsapp && (
          <button
            type="button"
            onClick={abrirWhatsapp}
            className="boton border-2 border-fondo/30 text-fondo hover:bg-fondo/10"
          >
            <MessageCircle className="size-5" aria-hidden="true" /> WhatsApp
          </button>
        )}
      </div>
    </form>
  );
}

const ACCIONES_ESTADO: { estado: EstadoPublicacion; texto: string }[] = [
  { estado: "disponible", texto: "Disponible" },
  { estado: "reservada", texto: "Reservada" },
  { estado: "vendida", texto: "Vendida" },
];

function GestionPropia({ publicacion, alCambiar }: { publicacion: Detalle; alCambiar: (p: Detalle) => void }) {
  const navegar = useNavigate();
  const [error, setError] = useState<string | null>(null);

  async function cambiarEstado(estado: EstadoPublicacion) {
    setError(null);
    try {
      alCambiar(await api.cambiarEstadoPublicacion(publicacion.id, estado));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function eliminar() {
    if (!window.confirm("¿Eliminar esta publicación? No se puede deshacer.")) return;
    try {
      await api.eliminarPublicacion(publicacion.id);
      navegar("/mercado/mias");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="bento grid gap-4 bg-lima">
      <p className="font-display text-2xl font-bold">Es tu publicación</p>
      <fieldset>
        <legend className="etiqueta">Estado</legend>
        <div className="mt-2 grid grid-cols-3 gap-1 rounded-full bg-superficie p-1">
          {ACCIONES_ESTADO.map(({ estado, texto }) => (
            <button
              key={estado}
              type="button"
              aria-pressed={publicacion.estado === estado}
              onClick={() => cambiarEstado(estado)}
              className={cn(
                "min-h-11 cursor-pointer rounded-full text-sm font-bold transition-colors",
                publicacion.estado === estado ? "bg-tinta text-lima" : "hover:bg-menta-clara",
              )}
            >
              {texto}
            </button>
          ))}
        </div>
      </fieldset>
      {error && (
        <p role="alert" className="rounded-xl bg-alerta-clara px-3 py-2 text-sm">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Link to="/mensajes" className="boton flex-1 bg-tinta text-fondo hover:bg-tinta-800">
          <MessagesSquare className="size-5" aria-hidden="true" /> Ver mensajes
        </Link>
        <button type="button" onClick={eliminar} className="boton bg-superficie text-alerta hover:bg-alerta-clara">
          <Trash2 className="size-5" aria-hidden="true" /> Eliminar
        </button>
      </div>
    </div>
  );
}
