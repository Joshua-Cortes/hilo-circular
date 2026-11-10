import { MessagesSquare, Plus, Shirt } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { EncabezadoPagina } from "../componentes/EncabezadoPagina";
import { FotoPrenda } from "../componentes/FotoPrenda";
import { api, type EstadoPublicacion, type MiPublicacion } from "../lib/api";
import { formatearPrecioVenta, haceCuanto } from "../lib/catalogo";
import { cn } from "../lib/cn";

const ESTILO_ESTADO: Record<EstadoPublicacion, string> = {
  disponible: "bg-menta text-hoja-oscura",
  reservada: "bg-kraft-clara text-kraft-tinta",
  vendida: "bg-tinta text-lima",
};

export function MisPublicaciones() {
  const [lista, setLista] = useState<MiPublicacion[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .misPublicaciones()
      .then(setLista)
      .catch((e: Error) => setError(e.message));
  }, []);

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14" aria-labelledby="titulo-mias">
      <EncabezadoPagina
        id="titulo-mias"
        etiqueta="Mi cuenta"
        titulo={
          <>
            Mis <em className="acento">publicaciones</em>
          </>
        }
        acciones={
          <Link to="/mercado/publicar" className="boton-primario">
            <Plus className="size-5" aria-hidden="true" /> Publicar otra
          </Link>
        }
      >
        Marca tus prendas como reservadas o vendidas para que nadie pregunte por algo que ya no está.
      </EncabezadoPagina>

      <div className="mt-10" aria-live="polite">
        {error && (
          <p role="alert" className="bento bg-alerta-clara font-bold">
            {error}
          </p>
        )}
        {!lista && !error && <div className="h-40 animate-pulse rounded-tarjeta bg-superficie" />}
        {lista?.length === 0 && (
          <div className="bento bg-kraft-clara">
            <Shirt className="size-10 text-kraft-tinta" aria-hidden="true" />
            <h2 className="mt-4 text-3xl">Aún no publicas nada</h2>
            <p className="mt-2 text-lg text-tinta-800">
              Esa prenda que ya no usas puede ser justo lo que alguien busca.
            </p>
            <Link to="/mercado/publicar" className="boton-primario mt-6">
              Publicar mi primera prenda
            </Link>
          </div>
        )}
        {lista && lista.length > 0 && (
          <ul className="grid gap-3 md:grid-cols-2">
            {lista.map((p) => (
              <li key={p.id}>
                <Link
                  to={`/mercado/${p.id}`}
                  className="flex gap-4 rounded-tarjeta bg-superficie p-3 transition-colors hover:bg-menta-clara"
                >
                  <div
                    className={cn(
                      "size-28 shrink-0 overflow-hidden rounded-2xl",
                      p.estado === "vendida" && "opacity-60",
                    )}
                  >
                    <FotoPrenda foto={p.foto} prenda={p.prenda} titulo={p.titulo} />
                  </div>
                  <div className="min-w-0 flex-1 py-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-xs font-bold capitalize",
                          ESTILO_ESTADO[p.estado],
                        )}
                      >
                        {p.estado}
                      </span>
                      <span className="text-sm text-tinta-suave">{haceCuanto(p.creadoEn)}</span>
                    </div>
                    <p className="mt-1.5 truncate text-lg font-bold">{p.titulo}</p>
                    <p className="font-display text-xl font-bold">{formatearPrecioVenta(p.precio)}</p>
                    <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-tinta-suave">
                      <MessagesSquare className="size-4" aria-hidden="true" />
                      {p.conversaciones === 1 ? "1 persona interesada" : `${p.conversaciones} personas interesadas`}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
