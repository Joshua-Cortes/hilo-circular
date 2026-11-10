import { AlertCircle, LocateFixed, RotateCcw, Scissors, Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { EncabezadoPagina } from "../componentes/EncabezadoPagina";
import { TarjetaOficio } from "../componentes/TarjetaOficio";
import { ChipFiltro } from "../componentes/ui/ChipFiltro";
import { api, type Catalogo, type OficioPublico } from "../lib/api";

const CENTROS_COMUNA: Record<string, { lat: number; lng: number }> = {
  "La Serena": { lat: -29.9027, lng: -71.252 },
  Coquimbo: { lat: -29.9533, lng: -71.3395 },
};

const RADIOS_DISPONIBLES = [15, 30, 50] as const;

export function Reparar() {
  const [searchParams, setSearchParams] = useSearchParams();

  const categoriaActiva = searchParams.get("categoria") ?? "";
  const prendaActiva = searchParams.get("prenda") ?? "";
  const comunaActiva = searchParams.get("comuna") ?? "";
  const radioKm = Number(searchParams.get("radioKm") ?? "15") || 15;
  const qUrl = searchParams.get("q") ?? "";

  const [textoBusqueda, setTextoBusqueda] = useState(qUrl);
  const [qDebounced, setQDebounced] = useState(qUrl);

  const [catalogo, setCatalogo] = useState<Catalogo | null>(null);
  const [oficios, setOficios] = useState<OficioPublico[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [ubicacionGps, setUbicacionGps] = useState<{ lat: number; lng: number } | null>(null);
  const [estadoGps, setEstadoGps] = useState<"inactivo" | "solicitando" | "activo" | "denegado">("inactivo");

  // Sincroniza el campo de texto cuando cambia el parámetro q en la URL (por ejemplo, al limpiar filtros).
  useEffect(() => {
    setTextoBusqueda(qUrl);
    setQDebounced(qUrl);
  }, [qUrl]);

  // Debounce de 300 ms para la búsqueda por texto.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQDebounced(textoBusqueda.trim());
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (textoBusqueda.trim().length >= 2) {
            next.set("q", textoBusqueda.trim());
          } else {
            next.delete("q");
          }
          return next;
        },
        { replace: true },
      );
    }, 300);
    return () => window.clearTimeout(timer);
  }, [textoBusqueda, setSearchParams]);

  useEffect(() => {
    api
      .catalogo()
      .then(setCatalogo)
      .catch(() => {
        // Si falla el catálogo, el listado principal mostrará su propio estado de error.
      });
  }, []);

  const coordenadasEfectivas = useMemo(() => {
    if (ubicacionGps) return ubicacionGps;
    if (comunaActiva && CENTROS_COMUNA[comunaActiva]) return CENTROS_COMUNA[comunaActiva];
    return null;
  }, [ubicacionGps, comunaActiva]);

  const cargarOficios = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const datos = await api.oficios({
        lat: coordenadasEfectivas?.lat,
        lng: coordenadasEfectivas?.lng,
        radioKm: coordenadasEfectivas ? radioKm : undefined,
        categoria: categoriaActiva || undefined,
        prenda: prendaActiva || undefined,
        q: qDebounced.length >= 2 ? qDebounced : undefined,
      });
      setOficios(datos);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCargando(false);
    }
  }, [coordenadasEfectivas, radioKm, categoriaActiva, prendaActiva, qDebounced]);

  useEffect(() => {
    cargarOficios();
  }, [cargarOficios]);

  const oficiosMostrados = useMemo(() => {
    if (!comunaActiva) return oficios;
    return oficios.filter((o) => o.comuna === comunaActiva);
  }, [oficios, comunaActiva]);

  const etiquetasPrenda = useMemo(() => new Map((catalogo?.prendas ?? []).map((p) => [p.id, p.etiqueta])), [catalogo]);
  const etiquetasCategoria = useMemo(
    () => new Map((catalogo?.categorias ?? []).map((c) => [c.id, c.etiqueta])),
    [catalogo],
  );

  function actualizarParametro(clave: string, valor: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (valor) {
        next.set(clave, valor);
      } else {
        next.delete(clave);
      }
      return next;
    });
  }

  function solicitarUbicacion() {
    if (!("geolocation" in navigator)) {
      setEstadoGps("denegado");
      return;
    }
    setEstadoGps("solicitando");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUbicacionGps({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setEstadoGps("activo");
      },
      () => {
        setEstadoGps("denegado");
      },
      { enableHighAccuracy: false, timeout: 8000 },
    );
  }

  function limpiarFiltros() {
    setTextoBusqueda("");
    setQDebounced("");
    setSearchParams(new URLSearchParams());
  }

  function ampliarRadio() {
    const siguiente = radioKm < 30 ? 30 : 50;
    actualizarParametro("radioKm", String(siguiente));
  }

  const hayFiltrosActivos = Boolean(categoriaActiva || prendaActiva || comunaActiva || qDebounced.length >= 2);

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14" aria-labelledby="titulo-reparar">
      <EncabezadoPagina
        id="titulo-reparar"
        etiqueta="01 · Reparar"
        titulo={
          <>
            Alguien de tu barrio <em className="acento">la arregla</em>
          </>
        }
      >
        Costureras, zapateros, tejedoras y tapiceros de La Serena y Coquimbo. Les escribes directo por WhatsApp, sin
        intermediarios ni comisiones.
      </EncabezadoPagina>

      <div className="mt-10 grid items-start gap-3 lg:grid-cols-[22rem_1fr]">
        {/* Panel de filtros */}
        <aside aria-label="Filtros" className="bento grid gap-6 bg-superficie lg:sticky lg:top-24">
          <div>
            <label htmlFor="buscar-oficio" className="font-bold">
              ¿Qué necesitas arreglar?
            </label>
            <div className="relative mt-2 flex items-center">
              <Search className="pointer-events-none absolute left-4 size-5 text-tinta-suave" aria-hidden="true" />
              <input
                id="buscar-oficio"
                type="search"
                value={textoBusqueda}
                onChange={(e) => setTextoBusqueda(e.target.value)}
                aria-describedby="ayuda-buscar"
                placeholder="Cierre, basta, suela…"
                className="campo pr-12 pl-12"
              />
              {textoBusqueda && (
                <button
                  type="button"
                  onClick={() => setTextoBusqueda("")}
                  aria-label="Borrar texto de búsqueda"
                  className="absolute right-1.5 flex size-10 cursor-pointer items-center justify-center rounded-full text-tinta-suave hover:bg-menta-clara hover:text-tinta"
                >
                  <X className="size-5" aria-hidden="true" />
                </button>
              )}
            </div>
            <p id="ayuda-buscar" className="mt-1.5 text-sm text-tinta-suave">
              También sirve el nombre del taller.
            </p>
          </div>

          <button
            type="button"
            onClick={solicitarUbicacion}
            disabled={estadoGps === "solicitando"}
            aria-pressed={estadoGps === "activo"}
            className={
              estadoGps === "activo" ? "boton bg-tinta text-fondo" : "boton bg-menta text-tinta hover:bg-menta/70"
            }
          >
            <LocateFixed className="size-5 shrink-0" aria-hidden="true" />
            {estadoGps === "solicitando"
              ? "Obteniendo ubicación…"
              : estadoGps === "activo"
                ? "Ordenado por tu ubicación"
                : "Ordenar por cercanía"}
          </button>
          {estadoGps === "denegado" && (
            <p className="-mt-3 rounded-2xl bg-kraft-clara px-4 py-3 text-sm text-kraft-tinta">
              No pudimos acceder a tu ubicación. Elige tu comuna para ver los talleres de tu zona.
            </p>
          )}

          <fieldset>
            <legend className="etiqueta text-tinta-suave">Comuna</legend>
            <div className="mt-2.5 flex flex-wrap gap-2">
              <ChipFiltro activo={comunaActiva === ""} onClick={() => actualizarParametro("comuna", "")}>
                Todas
              </ChipFiltro>
              {Object.keys(CENTROS_COMUNA).map((comuna) => (
                <ChipFiltro
                  key={comuna}
                  activo={comunaActiva === comuna}
                  onClick={() => actualizarParametro("comuna", comunaActiva === comuna ? "" : comuna)}
                >
                  {comuna}
                </ChipFiltro>
              ))}
            </div>
          </fieldset>

          {coordenadasEfectivas && (
            <fieldset>
              <legend className="etiqueta text-tinta-suave">Distancia máxima</legend>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {RADIOS_DISPONIBLES.map((r) => (
                  <ChipFiltro key={r} activo={radioKm === r} onClick={() => actualizarParametro("radioKm", String(r))}>
                    {r} km
                  </ChipFiltro>
                ))}
              </div>
            </fieldset>
          )}

          <fieldset>
            <legend className="etiqueta text-tinta-suave">Oficio</legend>
            <div className="mt-2.5 flex flex-wrap gap-2">
              <ChipFiltro activo={categoriaActiva === ""} onClick={() => actualizarParametro("categoria", "")}>
                Todos
              </ChipFiltro>
              {catalogo?.categorias.map((cat) => (
                <ChipFiltro
                  key={cat.id}
                  activo={categoriaActiva === cat.id}
                  onClick={() => actualizarParametro("categoria", categoriaActiva === cat.id ? "" : cat.id)}
                >
                  {cat.etiqueta}
                </ChipFiltro>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor="filtro-prenda" className="etiqueta text-tinta-suave">
              Prenda
            </label>
            <select
              id="filtro-prenda"
              value={prendaActiva}
              onChange={(e) => actualizarParametro("prenda", e.target.value)}
              className="campo mt-2.5 cursor-pointer font-bold"
            >
              <option value="">Cualquier prenda</option>
              {catalogo?.prendas.map((prenda) => (
                <option key={prenda.id} value={prenda.id}>
                  {prenda.etiqueta}
                </option>
              ))}
            </select>
          </div>

          {hayFiltrosActivos && (
            <button type="button" onClick={limpiarFiltros} className="boton-secundario">
              <RotateCcw className="size-4 shrink-0" aria-hidden="true" />
              Quitar filtros
            </button>
          )}
        </aside>

        {/* Resultados (altura mínima reservada para evitar saltos de diseño) */}
        <div className="min-h-[320px]" aria-live="polite">
          {cargando && (
            <div>
              <p className="sr-only">Buscando talleres disponibles…</p>
              <div className="grid gap-3 xl:grid-cols-2" aria-hidden="true">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="bento h-80 animate-pulse bg-superficie">
                    <div className="h-8 w-1/2 rounded-full bg-menta-clara" />
                    <div className="mt-4 h-4 w-1/3 rounded-full bg-menta-clara" />
                    <div className="mt-6 h-24 w-full rounded-2xl bg-menta-clara" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {!cargando && error && (
            <div role="alert" className="bento bg-alerta-clara">
              <AlertCircle className="size-8 text-alerta" aria-hidden="true" />
              <h2 className="mt-4 text-3xl">No pudimos cargar los talleres</h2>
              <p className="mt-2 text-lg text-tinta-800">{error}</p>
              <button type="button" onClick={cargarOficios} className="boton-primario mt-6">
                Intentar de nuevo
              </button>
            </div>
          )}

          {!cargando && !error && oficiosMostrados.length === 0 && (
            <div className="bento bg-kraft-clara">
              <Scissors className="size-10 text-kraft-tinta" aria-hidden="true" />
              <h2 className="mt-4 text-3xl">No encontramos talleres con esos filtros</h2>
              <p className="mt-2 max-w-xl text-lg text-tinta-800">
                {coordenadasEfectivas && radioKm < 50
                  ? `No hay oficios a menos de ${radioKm} km que coincidan. Prueba ampliando la distancia o quitando un filtro.`
                  : "Prueba quitando alguno de los filtros o buscando con otras palabras."}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                {coordenadasEfectivas && radioKm < 50 && (
                  <button type="button" onClick={ampliarRadio} className="boton-primario">
                    Ampliar a {radioKm < 30 ? 30 : 50} km
                  </button>
                )}
                {hayFiltrosActivos && (
                  <button type="button" onClick={limpiarFiltros} className="boton-secundario">
                    Ver todos los talleres
                  </button>
                )}
              </div>
            </div>
          )}

          {!cargando && !error && oficiosMostrados.length > 0 && (
            <div>
              <p className="mb-3 px-1 font-bold text-tinta-suave">
                {oficiosMostrados.length} {oficiosMostrados.length === 1 ? "taller" : "talleres"}
                {comunaActiva ? ` en ${comunaActiva}` : " en La Serena y Coquimbo"}
              </p>
              <div className="grid gap-3 xl:grid-cols-2">
                {oficiosMostrados.map((oficio) => (
                  <TarjetaOficio
                    key={oficio.id}
                    oficio={oficio}
                    etiquetasPrenda={etiquetasPrenda}
                    etiquetasCategoria={etiquetasCategoria}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
