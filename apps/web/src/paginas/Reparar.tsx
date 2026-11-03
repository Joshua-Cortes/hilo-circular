import { AlertCircle, LocateFixed, RotateCcw, Scissors, Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
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
    <section className="mx-auto max-w-6xl px-5 py-12 md:py-16" aria-labelledby="titulo-reparar">
      <div className="max-w-3xl">
        <p className="font-bold tracking-widest text-terracota-tinta uppercase">CU1 · Talleres de reparación</p>
        <h1 id="titulo-reparar" className="mt-2 text-4xl font-semibold md:text-5xl">
          Encuentra quién arregle tu prenda cerca de ti
        </h1>
        <div className="puntada mt-5 w-28 text-terracota" aria-hidden="true" />
        <p className="mt-5 text-xl text-tinta-suave">
          Costureras, zapateros, tejedoras y tapiceros de La Serena y Coquimbo. Los contactas directo por WhatsApp o
          teléfono, sin intermediarios ni comisiones.
        </p>
      </div>

      {/* Panel de búsqueda y ubicación */}
      <div className="tarjeta mt-8 p-6 md:p-8">
        <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <label htmlFor="buscar-oficio" className="block text-base font-bold text-bosque">
              ¿Qué arreglo o taller buscas?
            </label>
            <p id="ayuda-buscar" className="mt-0.5 text-sm text-tinta-suave">
              Escribe al menos 2 letras, por ejemplo: cierre, basta, suela, uniforme o el nombre del taller.
            </p>
            <div className="relative mt-2 flex items-center">
              <Search className="pointer-events-none absolute left-4 size-5 text-tinta-suave" aria-hidden="true" />
              <input
                id="buscar-oficio"
                type="search"
                value={textoBusqueda}
                onChange={(e) => setTextoBusqueda(e.target.value)}
                aria-describedby="ayuda-buscar"
                placeholder="Ej: cambio de cierre, basta, suelas…"
                className="min-h-12 w-full rounded-xl border-2 border-borde-fuerte bg-crema pr-12 pl-12 text-base font-bold text-bosque placeholder:font-normal placeholder:text-tinta-suave"
              />
              {textoBusqueda && (
                <button
                  type="button"
                  onClick={() => setTextoBusqueda("")}
                  aria-label="Borrar texto de búsqueda"
                  className="absolute right-2 flex size-10 cursor-pointer items-center justify-center rounded-full text-tinta-suave hover:bg-salvia-claro hover:text-bosque"
                >
                  <X className="size-5" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={solicitarUbicacion}
              disabled={estadoGps === "solicitando"}
              aria-pressed={estadoGps === "activo"}
              className={`boton ${
                estadoGps === "activo"
                  ? "bg-bosque text-crema"
                  : "border-2 border-bosque bg-papel text-bosque hover:bg-salvia-claro"
              }`}
            >
              <LocateFixed className="size-5 shrink-0" aria-hidden="true" />
              <span>
                {estadoGps === "solicitando"
                  ? "Obteniendo ubicación…"
                  : estadoGps === "activo"
                    ? "Ordenado por tu ubicación"
                    : "Ordenar por mi cercanía"}
              </span>
            </button>
          </div>
        </div>

        {estadoGps === "denegado" && (
          <p className="mt-4 rounded-xl bg-salvia-claro px-4 py-3 text-sm text-bosque">
            No pudimos acceder a tu ubicación. Puedes elegir tu comuna abajo para ordenar los talleres de tu zona.
          </p>
        )}

        {/* Filtro por comuna y radio */}
        <div className="mt-6 border-t border-borde pt-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span id="etiqueta-comuna" className="block text-sm font-bold tracking-wider text-tinta-suave uppercase">
                Comuna
              </span>
              <div role="group" aria-labelledby="etiqueta-comuna" className="mt-2 flex flex-wrap gap-2">
                <ChipFiltro activo={comunaActiva === ""} onClick={() => actualizarParametro("comuna", "")}>
                  Todas
                </ChipFiltro>
                {(catalogo?.comunas ?? ["La Serena", "Coquimbo"]).map((comuna) => (
                  <ChipFiltro
                    key={comuna}
                    activo={comunaActiva === comuna}
                    onClick={() => actualizarParametro("comuna", comunaActiva === comuna ? "" : comuna)}
                  >
                    {comuna}
                  </ChipFiltro>
                ))}
              </div>
            </div>

            {coordenadasEfectivas && (
              <div>
                <span id="etiqueta-radio" className="block text-sm font-bold tracking-wider text-tinta-suave uppercase">
                  Distancia máxima
                </span>
                <div role="group" aria-labelledby="etiqueta-radio" className="mt-2 flex flex-wrap gap-2">
                  {RADIOS_DISPONIBLES.map((r) => (
                    <ChipFiltro
                      key={r}
                      activo={radioKm === r}
                      onClick={() => actualizarParametro("radioKm", String(r))}
                    >
                      Hasta {r} km
                    </ChipFiltro>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Filtro por categoría de oficio */}
        <div className="mt-5 border-t border-borde pt-5">
          <span id="etiqueta-categoria" className="block text-sm font-bold tracking-wider text-tinta-suave uppercase">
            Tipo de oficio
          </span>
          <div role="group" aria-labelledby="etiqueta-categoria" className="mt-2 flex flex-wrap gap-2">
            <ChipFiltro activo={categoriaActiva === ""} onClick={() => actualizarParametro("categoria", "")}>
              Todos los oficios
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
        </div>

        {/* Filtro por tipo de prenda */}
        <div className="mt-5 border-t border-borde pt-5">
          <span id="etiqueta-prenda" className="block text-sm font-bold tracking-wider text-tinta-suave uppercase">
            Prenda que quieres arreglar
          </span>
          <div role="group" aria-labelledby="etiqueta-prenda" className="mt-2 flex flex-wrap gap-2">
            <ChipFiltro activo={prendaActiva === ""} onClick={() => actualizarParametro("prenda", "")}>
              Cualquier prenda
            </ChipFiltro>
            {catalogo?.prendas.map((prenda) => (
              <ChipFiltro
                key={prenda.id}
                activo={prendaActiva === prenda.id}
                onClick={() => actualizarParametro("prenda", prendaActiva === prenda.id ? "" : prenda.id)}
              >
                {prenda.etiqueta}
              </ChipFiltro>
            ))}
          </div>
        </div>

        {hayFiltrosActivos && (
          <div className="mt-5 flex justify-end border-t border-borde pt-4">
            <button type="button" onClick={limpiarFiltros} className="boton-secundario px-5">
              <RotateCcw className="size-4 shrink-0" aria-hidden="true" />
              <span>Quitar filtros</span>
            </button>
          </div>
        )}
      </div>

      {/* Resultados (espacio reservado para evitar saltos de diseño) */}
      <div className="mt-8 min-h-[320px]" aria-live="polite">
        {cargando && (
          <div>
            <p className="text-base font-bold text-tinta-suave">Buscando talleres disponibles…</p>
            <div className="mt-4 grid gap-6 md:grid-cols-2" aria-hidden="true">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="tarjeta h-72 animate-pulse p-6">
                  <div className="h-7 w-1/2 rounded-lg bg-borde" />
                  <div className="mt-3 h-4 w-1/3 rounded bg-borde" />
                  <div className="mt-4 h-16 w-full rounded-xl bg-borde/70" />
                  <div className="mt-6 h-12 w-48 rounded-full bg-borde" />
                </div>
              ))}
            </div>
          </div>
        )}

        {!cargando && error && (
          <div role="alert" className="tarjeta border-2 border-terracota-tinta bg-terracota-claro/25 p-8">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-1 size-7 shrink-0 text-terracota-tinta" aria-hidden="true" />
              <div>
                <h2 className="text-2xl font-semibold">No pudimos cargar los talleres</h2>
                <p className="mt-2 text-lg text-tinta-suave">{error}</p>
                <button type="button" onClick={cargarOficios} className="boton-primario mt-5">
                  Intentar de nuevo
                </button>
              </div>
            </div>
          </div>
        )}

        {!cargando && !error && oficiosMostrados.length === 0 && (
          <div className="tarjeta border-2 border-dashed border-borde-fuerte p-8 md:p-10">
            <Scissors className="size-10 text-terracota" aria-hidden="true" />
            <h2 className="mt-4 text-3xl font-semibold">No encontramos talleres con esos filtros</h2>
            <p className="mt-2 max-w-xl text-lg text-tinta-suave">
              {coordenadasEfectivas && radioKm < 50
                ? `No hay oficios registrados a menos de ${radioKm} km que coincidan con tu búsqueda. Prueba ampliando la distancia o quitando algún filtro.`
                : "Prueba quitando alguno de los filtros seleccionados o buscando con otras palabras."}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {coordenadasEfectivas && radioKm < 50 && (
                <button type="button" onClick={ampliarRadio} className="boton-primario">
                  Ampliar radio a {radioKm < 30 ? 30 : 50} km
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
            <p className="text-base font-bold text-tinta-suave">
              Mostrando {oficiosMostrados.length}{" "}
              {oficiosMostrados.length === 1 ? "taller disponible" : "talleres disponibles"}
              {comunaActiva ? ` en ${comunaActiva}` : ""}
            </p>
            <div className="mt-4 grid gap-6 md:grid-cols-2">
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
    </section>
  );
}
