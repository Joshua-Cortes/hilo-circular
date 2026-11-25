import { AlertCircle, Gift, Plus, Search, Shirt, Store, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { EncabezadoPagina } from "../componentes/EncabezadoPagina";
import { FotoPrenda } from "../componentes/FotoPrenda";
import { ChipFiltro } from "../componentes/ui/ChipFiltro";
import { api, type FiltrosMercado, type Publicacion } from "../lib/api";
import { formatearPrecioVenta, haceCuanto, useCatalogo } from "../lib/catalogo";
import { cn } from "../lib/cn";

const ORDENES = [
  { id: "recientes", texto: "Más recientes" },
  { id: "precio_asc", texto: "Menor precio" },
  { id: "precio_desc", texto: "Mayor precio" },
] as const;

export function Mercado() {
  const [params, setParams] = useSearchParams();
  const { catalogo, etiquetas } = useCatalogo();
  const prenda = params.get("prenda") ?? "";
  const comuna = params.get("comuna") ?? "";
  const soloRegalo = params.get("regalo") === "1";
  const orden = (params.get("orden") ?? "recientes") as NonNullable<FiltrosMercado["orden"]>;
  const [texto, setTexto] = useState(params.get("q") ?? "");
  const [q, setQ] = useState(texto);

  const [prendas, setPrendas] = useState<Publicacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setQ(texto.trim()), 300);
    return () => window.clearTimeout(t);
  }, [texto]);

  useEffect(() => {
    setCargando(true);
    setError(null);
    api
      .mercado({ prenda: prenda || undefined, comuna: comuna || undefined, soloRegalo, orden, q })
      .then(setPrendas)
      .catch((e: Error) => setError(e.message))
      .finally(() => setCargando(false));
  }, [prenda, comuna, soloRegalo, orden, q]);

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

  const hayFiltros = Boolean(prenda || comuna || soloRegalo || q);

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14" aria-labelledby="titulo-mercado">
      <EncabezadoPagina
        id="titulo-mercado"
        etiqueta="03 · Mercado"
        titulo={
          <>
            Ropa con <em className="acento">segunda vuelta</em>
          </>
        }
        acciones={
          <>
            <Link to="/mercado/mias" className="boton-claro">
              <Store className="size-5" aria-hidden="true" /> Mis publicaciones
            </Link>
            <Link to="/mercado/publicar" className="boton-primario">
              <Plus className="size-5" aria-hidden="true" /> Publicar prenda
            </Link>
          </>
        }
      >
        Compra y vende ropa usada en La Serena y Coquimbo. Sin pagos en línea ni comisiones: conversas por el chat o por
        WhatsApp y se ponen de acuerdo.
      </EncabezadoPagina>

      {/* Filtros */}
      <div className="bento mt-10 grid gap-4 bg-superficie lg:grid-cols-[1.3fr_1fr_auto] lg:items-end">
        <div>
          <label htmlFor="buscar-prenda" className="font-bold">
            Buscar
          </label>
          <div className="relative mt-2 flex items-center">
            <Search className="pointer-events-none absolute left-4 size-5 text-tinta-suave" aria-hidden="true" />
            <input
              id="buscar-prenda"
              type="search"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Parka, jeans, uniforme…"
              className="campo pr-12 pl-12"
            />
            {texto && (
              <button
                type="button"
                onClick={() => setTexto("")}
                aria-label="Borrar búsqueda"
                className="absolute right-1.5 flex size-10 cursor-pointer items-center justify-center rounded-full text-tinta-suave hover:bg-menta-clara"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="filtro-tipo" className="font-bold">
              Tipo
            </label>
            <select
              id="filtro-tipo"
              value={prenda}
              onChange={(e) => cambiar("prenda", e.target.value)}
              className="campo mt-2 cursor-pointer"
            >
              <option value="">Todas</option>
              {catalogo?.prendas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.etiqueta}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="filtro-orden" className="font-bold">
              Ordenar
            </label>
            <select
              id="filtro-orden"
              value={orden}
              onChange={(e) => cambiar("orden", e.target.value === "recientes" ? "" : e.target.value)}
              className="campo mt-2 cursor-pointer"
            >
              {ORDENES.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.texto}
                </option>
              ))}
            </select>
          </div>
        </div>
        <fieldset className="flex flex-wrap gap-2">
          <legend className="sr-only">Más filtros</legend>
          {["La Serena", "Coquimbo"].map((c) => (
            <ChipFiltro key={c} activo={comuna === c} onClick={() => cambiar("comuna", comuna === c ? "" : c)}>
              {c}
            </ChipFiltro>
          ))}
          <ChipFiltro activo={soloRegalo} onClick={() => cambiar("regalo", soloRegalo ? "" : "1")}>
            <Gift className="size-4" aria-hidden="true" /> Se regala
          </ChipFiltro>
        </fieldset>
      </div>

      {/* Resultados */}
      <div className="mt-3 min-h-[24rem]" aria-live="polite">
        {error && (
          <div role="alert" className="bento flex items-start gap-3 bg-alerta-clara">
            <AlertCircle className="mt-1 size-6 shrink-0 text-alerta" aria-hidden="true" />
            <div>
              <h2 className="text-2xl">No pudimos cargar el mercado</h2>
              <p className="mt-1">{error}</p>
            </div>
          </div>
        )}

        {cargando && !error && (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-hidden="true">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <li key={n} className="h-80 animate-pulse rounded-tarjeta bg-superficie" />
            ))}
          </ul>
        )}

        {!cargando && !error && prendas.length === 0 && (
          <div className="bento bg-kraft-clara">
            <Shirt className="size-10 text-kraft-tinta" aria-hidden="true" />
            <h2 className="mt-4 text-3xl">{hayFiltros ? "Nada con esos filtros" : "Todavía no hay prendas"}</h2>
            <p className="mt-2 text-lg text-tinta-800">
              {hayFiltros ? "Prueba con otra búsqueda o quita algún filtro." : "Sé la primera persona en publicar."}
            </p>
            <Link to="/mercado/publicar" className="boton-primario mt-6">
              <Plus className="size-5" aria-hidden="true" /> Publicar prenda
            </Link>
          </div>
        )}

        {!cargando && !error && prendas.length > 0 && (
          <ul className="grid grid-flow-dense gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {prendas.map((p, i) => (
              <TarjetaPrenda
                key={p.id}
                prenda={p}
                destacada={i === 0 && !hayFiltros}
                etiquetaCondicion={etiquetas.condicion.get(p.condicion)}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function TarjetaPrenda({
  prenda,
  destacada,
  etiquetaCondicion,
}: {
  prenda: Publicacion;
  destacada: boolean;
  etiquetaCondicion?: string;
}) {
  return (
    <li className={cn(destacada && "sm:col-span-2 lg:row-span-2")}>
      <Link
        to={`/mercado/${prenda.id}`}
        className="group flex h-full flex-col overflow-hidden rounded-tarjeta bg-superficie transition-transform duration-300 ease-hilo hover:-translate-y-1"
      >
        <div
          className={cn(
            "relative overflow-hidden",
            destacada ? "aspect-[4/3] lg:aspect-auto lg:flex-1" : "aspect-[4/3]",
          )}
        >
          <FotoPrenda
            foto={prenda.foto}
            prenda={prenda.prenda}
            titulo={prenda.titulo}
            grande={destacada}
            className="transition-transform duration-500 ease-hilo group-hover:scale-105"
          />
          <span className="absolute top-3 left-3 rounded-full bg-superficie/95 px-3 py-1 text-xs font-bold">
            {etiquetaCondicion ?? prenda.condicion}
          </span>
          {prenda.estado === "reservada" && (
            <span className="absolute top-3 right-3 rounded-full bg-tinta px-3 py-1 text-xs font-bold text-lima">
              Reservada
            </span>
          )}
        </div>
        <div className="p-4">
          <p
            className={cn(
              "font-display font-bold",
              destacada ? "text-3xl" : "text-2xl",
              prenda.precio === 0 && "text-hoja-oscura",
            )}
          >
            {formatearPrecioVenta(prenda.precio)}
          </p>
          <h2 className={cn("mt-1 font-sans font-bold tracking-normal", destacada ? "text-xl" : "text-base")}>
            {prenda.titulo}
          </h2>
          <p className="mt-1 text-sm text-tinta-suave">
            Talla {prenda.talla} · {prenda.comuna} · {haceCuanto(prenda.creadoEn)}
          </p>
        </div>
      </Link>
    </li>
  );
}
