import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  LocateFixed,
  Lock,
  PauseCircle,
  PlayCircle,
  Plus,
  Shield,
  Trash2,
} from "lucide-react";
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { formatearPrecio } from "../componentes/TarjetaOficio";
import { ChipFiltro } from "../componentes/ui/ChipFiltro";
import { api, type Catalogo, ErrorApi, leerSesionActual, type MiOficio } from "../lib/api";

type PasoFormulario = 1 | 2 | 3;

const SECTORES_REFERENCIA: Array<{ nombre: string; comuna: string; lat: number; lng: number }> = [
  { nombre: "Las Compañías", comuna: "La Serena", lat: -29.8772, lng: -71.2331 },
  { nombre: "Centro / Recova", comuna: "La Serena", lat: -29.9022, lng: -71.2475 },
  { nombre: "La Antena / La Florida", comuna: "La Serena", lat: -29.9165, lng: -71.2361 },
  { nombre: "Vista Hermosa / San Joaquín", comuna: "La Serena", lat: -29.926, lng: -71.241 },
  { nombre: "Centro Coquimbo", comuna: "Coquimbo", lat: -29.9531, lng: -71.3389 },
  { nombre: "Tierras Blancas", comuna: "Coquimbo", lat: -29.9748, lng: -71.3172 },
  { nombre: "Sindempart / El Llano", comuna: "Coquimbo", lat: -29.9785, lng: -71.3415 },
  { nombre: "Peñuelas / Baquedano", comuna: "Coquimbo", lat: -29.9443, lng: -71.2853 },
];

function limpiarCelularLocal(valor: string | null | undefined): string {
  if (!valor) return "";
  const digitos = valor.replace(/\D/g, "");
  if (digitos.startsWith("569") && digitos.length === 11) {
    return digitos.slice(3);
  }
  return digitos;
}

export function MiTaller() {
  const sesion = useMemo(() => leerSesionActual(), []);
  const tituloPasoRef = useRef<HTMLHeadingElement>(null);

  const [catalogo, setCatalogo] = useState<Catalogo | null>(null);
  const [perfilExistente, setPerfilExistente] = useState<MiOficio | null>(null);
  const [cargandoInicial, setCargandoInicial] = useState(sesion?.rol === "oficio");
  const [paso, setPaso] = useState<PasoFormulario>(1);

  // Campos del formulario de perfil (CU3)
  const [nombrePublico, setNombrePublico] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [telefono, setTelefono] = useState("");
  const [comuna, setComuna] = useState("La Serena");
  const [precisionUbicacion, setPrecisionUbicacion] = useState<"aproximada" | "exacta">("aproximada");
  const [direccion, setDireccion] = useState("");
  const [lat, setLat] = useState(-29.8772);
  const [lng, setLng] = useState(-71.2331);

  // Campos para agregar un servicio
  const [catServicio, setCatServicio] = useState("costura");
  const [tituloServicio, setTituloServicio] = useState("");
  const [descServicio, setDescServicio] = useState("");
  const [prendasServicio, setPrendasServicio] = useState<string[]>(["pantalon"]);
  const [aConvenir, setAConvenir] = useState(false);
  const [precioDesde, setPrecioDesde] = useState("3000");

  // Estados de envío y errores por campo
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);
  const [guardandoServicio, setGuardandoServicio] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [erroresCampo, setErroresCampo] = useState<Record<string, string>>({});

  useEffect(() => {
    api
      .catalogo()
      .then(setCatalogo)
      .catch(() => null);
  }, []);

  useEffect(() => {
    if (sesion?.rol !== "oficio") return;
    setCargandoInicial(true);
    api
      .miOficio()
      .then((mi) => {
        setPerfilExistente(mi);
        setNombrePublico(mi.nombrePublico);
        setDescripcion(mi.descripcion);
        setComuna(mi.comuna);
        setDireccion(mi.direccion ?? "");
        setLat(mi.lat);
        setLng(mi.lng);
        setPrecisionUbicacion(mi.precisionUbicacion);
        setWhatsapp(limpiarCelularLocal(mi.whatsapp));
        setTelefono(limpiarCelularLocal(mi.telefono));
      })
      .catch((e: Error) => {
        // 404 significa que aún no ha creado su perfil de oficio.
        if (!(e instanceof ErrorApi && e.status === 404)) {
          setErrorGeneral(e.message);
        }
      })
      .finally(() => setCargandoInicial(false));
  }, [sesion]);

  // Al cambiar de paso, el foco va al encabezado del paso para lectores de pantalla.
  // biome-ignore lint/correctness/useExhaustiveDependencies: debe ejecutarse cuando cambia el paso
  useEffect(() => {
    tituloPasoRef.current?.focus();
  }, [paso]);

  const etiquetasPrenda = useMemo(() => new Map((catalogo?.prendas ?? []).map((p) => [p.id, p.etiqueta])), [catalogo]);
  const etiquetasCategoria = useMemo(
    () => new Map((catalogo?.categorias ?? []).map((c) => [c.id, c.etiqueta])),
    [catalogo],
  );

  function extraerErroresDeApi(err: unknown) {
    if (err instanceof ErrorApi) {
      setErrorGeneral(err.message);
      const mapa: Record<string, string> = {};
      for (const det of err.detalles) {
        if (det.campo) mapa[det.campo] = det.mensaje;
      }
      setErroresCampo(mapa);
      // Si el error pertenece a un campo del paso 1, volvemos al paso 1 para que la persona lo vea.
      if (mapa.nombrePublico || mapa.whatsapp || mapa.telefono || mapa.descripcion) {
        setPaso(1);
      } else if (mapa.comuna || mapa.direccion || mapa.lat || mapa.lng) {
        setPaso(2);
      }
    } else if (err instanceof Error) {
      setErrorGeneral(err.message);
    }
  }

  function irAPaso2() {
    const nuevosErrores: Record<string, string> = {};
    if (nombrePublico.trim().length < 3) {
      nuevosErrores.nombrePublico = "Escribe el nombre de tu taller (al menos 3 letras).";
    }
    const waLimpio = whatsapp.replace(/\D/g, "");
    const telLimpio = telefono.replace(/\D/g, "");
    if (!waLimpio && !telLimpio) {
      nuevosErrores.whatsapp = "Agrega tu número de WhatsApp o teléfono para que te puedan contactar.";
    } else {
      if (waLimpio && !/^\d{8}$/.test(waLimpio)) {
        nuevosErrores.whatsapp = "Ingresa los 8 dígitos que van después del +56 9.";
      }
      if (telLimpio && !/^\d{8}$/.test(telLimpio)) {
        nuevosErrores.telefono = "Ingresa los 8 dígitos que van después del +56 9.";
      }
    }
    setErroresCampo(nuevosErrores);
    setErrorGeneral(null);
    if (Object.keys(nuevosErrores).length === 0) {
      setPaso(2);
    }
  }

  async function guardarPerfil(e: FormEvent) {
    e.preventDefault();
    setErrorGeneral(null);
    setMensajeExito(null);
    setErroresCampo({});
    setGuardandoPerfil(true);

    const waLimpio = whatsapp.replace(/\D/g, "");
    const telLimpio = telefono.replace(/\D/g, "");

    const payload = {
      nombrePublico: nombrePublico.trim(),
      descripcion: descripcion.trim(),
      comuna,
      direccion: precisionUbicacion === "exacta" && direccion.trim() ? direccion.trim() : undefined,
      lat,
      lng,
      precisionUbicacion,
      whatsapp: waLimpio ? `+569${waLimpio}` : undefined,
      telefono: telLimpio ? `+569${telLimpio}` : undefined,
    };

    try {
      const guardado = perfilExistente ? await api.actualizarMiOficio(payload) : await api.crearMiOficio(payload);
      setPerfilExistente(guardado);
      setMensajeExito("Tu perfil fue guardado correctamente. Ahora puedes agregar o revisar tus servicios.");
      setPaso(3);
    } catch (err) {
      extraerErroresDeApi(err);
    } finally {
      setGuardandoPerfil(false);
    }
  }

  async function alternarEstadoActivo() {
    if (!perfilExistente) return;
    setErrorGeneral(null);
    setMensajeExito(null);
    try {
      const actualizado = await api.actualizarMiOficio({ activo: !perfilExistente.activo });
      setPerfilExistente(actualizado);
      setMensajeExito(
        actualizado.activo
          ? "Tu taller está visible nuevamente en las búsquedas."
          : "Tu taller quedó pausado temporalmente.",
      );
    } catch (err) {
      extraerErroresDeApi(err);
    }
  }

  async function manejarAgregarServicio(e: FormEvent) {
    e.preventDefault();
    setErrorGeneral(null);
    setMensajeExito(null);
    setErroresCampo({});

    const nuevosErrores: Record<string, string> = {};
    if (tituloServicio.trim().length < 3) {
      nuevosErrores.titulo = "Escribe qué arreglo realizas (por ejemplo: Bastas y ajustes).";
    }
    if (prendasServicio.length === 0) {
      nuevosErrores.prendas = "Elige al menos una prenda que trabajes en este servicio.";
    }
    const monto = aConvenir ? null : Number(precioDesde);
    if (!aConvenir && (Number.isNaN(monto) || (monto ?? -1) < 0)) {
      nuevosErrores.precioDesde = "Escribe un precio válido en pesos o marca A convenir.";
    }
    if (Object.keys(nuevosErrores).length > 0) {
      setErroresCampo(nuevosErrores);
      return;
    }

    setGuardandoServicio(true);
    try {
      const creado = await api.agregarServicio({
        categoria: catServicio,
        titulo: tituloServicio.trim(),
        descripcion: descServicio.trim(),
        prendas: prendasServicio,
        precioDesde: monto,
      });
      setPerfilExistente((prev) => (prev ? { ...prev, servicios: [...prev.servicios, creado] } : prev));
      setTituloServicio("");
      setDescServicio("");
      setMensajeExito("Servicio agregado a tu perfil.");
    } catch (err) {
      extraerErroresDeApi(err);
    } finally {
      setGuardandoServicio(false);
    }
  }

  async function manejarEliminarServicio(servicioId: string) {
    setErrorGeneral(null);
    setMensajeExito(null);
    try {
      await api.eliminarServicio(servicioId);
      setPerfilExistente((prev) =>
        prev ? { ...prev, servicios: prev.servicios.filter((s) => s.id !== servicioId) } : prev,
      );
      setMensajeExito("Servicio eliminado.");
    } catch (err) {
      extraerErroresDeApi(err);
    }
  }

  function usarGpsParaTaller() {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(Number(pos.coords.latitude.toFixed(4)));
        setLng(Number(pos.coords.longitude.toFixed(4)));
      },
      () => null,
    );
  }

  function alternarPrendaServicio(idPrenda: string) {
    setPrendasServicio((prev) => (prev.includes(idPrenda) ? prev.filter((p) => p !== idPrenda) : [...prev, idPrenda]));
  }

  // Ruta protegida por rol ("oficio")
  if (sesion?.rol !== "oficio") {
    return (
      <section className="mx-auto max-w-3xl px-5 py-16" aria-labelledby="titulo-acceso-oficio">
        <div className="tarjeta p-8 md:p-10">
          <Lock className="size-10 text-terracota" aria-hidden="true" />
          <h1 id="titulo-acceso-oficio" className="mt-4 text-4xl font-semibold">
            Espacio para oficios de reparación
          </h1>
          <p className="mt-3 text-xl text-tinta-suave">
            {sesion
              ? `Iniciaste sesión con el rol "${sesion.rol}". Para crear o editar un taller necesitas una cuenta con rol de Oficio.`
              : "Para publicar o editar los datos de tu taller necesitas iniciar sesión con una cuenta de Oficio."}
          </p>
          <p className="mt-3 text-base text-tinta-suave">
            Si prefieres que el equipo te ayude presencialmente a crear tu perfil en 3 minutos, también ofrecemos
            acompañamiento directo en La Serena y Coquimbo.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/reparar" className="boton-primario">
              Ver talleres publicados
            </Link>
            <Link to="/" className="boton-secundario">
              Volver al inicio
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (cargandoInicial) {
    return (
      <section className="mx-auto max-w-3xl px-5 py-16" aria-live="polite">
        <div className="tarjeta h-80 animate-pulse p-8" aria-hidden="true" />
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl px-5 py-12 md:py-16" aria-labelledby="titulo-mi-taller">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-bold tracking-widest text-terracota-tinta uppercase">CU3 · Gestión de taller</p>
          <h1 id="titulo-mi-taller" className="mt-1 text-4xl font-semibold md:text-5xl">
            {perfilExistente ? "Editar mi taller" : "Publicar mi taller"}
          </h1>
        </div>

        {perfilExistente && (
          <button type="button" onClick={alternarEstadoActivo} className="boton-secundario px-5">
            {perfilExistente.activo ? (
              <>
                <PauseCircle className="size-5 shrink-0 text-terracota-tinta" aria-hidden="true" />
                <span>Pausar mi taller</span>
              </>
            ) : (
              <>
                <PlayCircle className="size-5 shrink-0 text-salvia" aria-hidden="true" />
                <span>Reactivar mi taller</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Indicador de pasos */}
      <div className="tarjeta mt-8 p-6 md:p-8">
        <p className="text-sm font-bold tracking-widest text-terracota-tinta uppercase">Paso {paso} de 3</p>
        <div className="mt-2 flex gap-2" aria-hidden="true">
          {[1, 2, 3].map((n) => (
            <span
              key={n}
              className={`h-2 flex-1 rounded-full transition-colors duration-300 ${
                n <= paso ? "bg-terracota" : "bg-borde"
              }`}
            />
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <ChipFiltro activo={paso === 1} onClick={() => setPaso(1)}>
            1. Nombre y contacto
          </ChipFiltro>
          <ChipFiltro activo={paso === 2} onClick={irAPaso2}>
            2. Ubicación y privacidad
          </ChipFiltro>
          {perfilExistente && (
            <ChipFiltro activo={paso === 3} onClick={() => setPaso(3)}>
              3. Servicios ({perfilExistente.servicios.length})
            </ChipFiltro>
          )}
        </div>

        {errorGeneral && (
          <div
            role="alert"
            className="mt-6 flex items-start gap-3 rounded-xl border-2 border-terracota-tinta bg-terracota-claro/30 p-4"
          >
            <AlertCircle className="mt-0.5 size-6 shrink-0 text-terracota-tinta" aria-hidden="true" />
            <p className="font-bold text-bosque">{errorGeneral}</p>
          </div>
        )}

        {mensajeExito && (
          <output className="mt-6 flex items-start gap-3 rounded-xl border-2 border-salvia bg-salvia-claro p-4">
            <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-salvia" aria-hidden="true" />
            <p className="font-bold text-bosque">{mensajeExito}</p>
          </output>
        )}

        {/* PASO 1: Nombre y medios de contacto */}
        {paso === 1 && (
          <div className="mt-6">
            <h2 ref={tituloPasoRef} tabIndex={-1} className="text-3xl font-semibold outline-none">
              ¿Cómo te encuentran tus vecinos?
            </h2>
            <p className="mt-1 text-base text-tinta-suave">
              Solo pedimos lo esencial. Las personas interesadas te escribirán directo a tu WhatsApp o te llamarán.
            </p>

            <div className="mt-6 grid gap-5">
              <div>
                <label htmlFor="campo-nombre" className="block text-base font-bold text-bosque">
                  Nombre de tu taller o tu nombre
                </label>
                <span id="pista-nombre" className="block text-sm text-tinta-suave">
                  Ejemplo: Costuras Rosita, Zapatería Don Lucho
                </span>
                <input
                  id="campo-nombre"
                  type="text"
                  value={nombrePublico}
                  onChange={(e) => setNombrePublico(e.target.value)}
                  aria-describedby="pista-nombre"
                  aria-invalid={Boolean(erroresCampo.nombrePublico)}
                  className="mt-1.5 min-h-12 w-full rounded-xl border-2 border-borde-fuerte bg-crema px-4 text-lg font-bold text-bosque"
                />
                {erroresCampo.nombrePublico && (
                  <p role="alert" className="mt-1.5 text-sm font-bold text-terracota-tinta">
                    {erroresCampo.nombrePublico}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="campo-descripcion" className="block text-base font-bold text-bosque">
                  Cuéntanos brevemente tu experiencia (opcional)
                </label>
                <textarea
                  id="campo-descripcion"
                  rows={3}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border-2 border-borde-fuerte bg-crema p-4 text-base text-bosque"
                />
                {erroresCampo.descripcion && (
                  <p role="alert" className="mt-1.5 text-sm font-bold text-terracota-tinta">
                    {erroresCampo.descripcion}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="campo-whatsapp" className="block text-base font-bold text-bosque">
                  Tu número de WhatsApp
                </label>
                <span id="pista-whatsapp" className="block text-sm text-tinta-suave">
                  Escribe los 8 números después del +56 9
                </span>
                <div className="mt-1.5 flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="inline-flex min-h-12 items-center rounded-xl border-2 border-borde bg-salvia-claro px-4 text-lg font-bold text-bosque"
                  >
                    +56 9
                  </span>
                  <input
                    id="campo-whatsapp"
                    type="tel"
                    inputMode="numeric"
                    maxLength={9}
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    aria-describedby="pista-whatsapp"
                    aria-invalid={Boolean(erroresCampo.whatsapp)}
                    className="min-h-12 w-full rounded-xl border-2 border-borde-fuerte bg-crema px-4 text-lg font-bold text-bosque"
                  />
                </div>
                {erroresCampo.whatsapp && (
                  <p role="alert" className="mt-1.5 text-sm font-bold text-terracota-tinta">
                    {erroresCampo.whatsapp}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="campo-telefono" className="block text-base font-bold text-bosque">
                  Teléfono para llamadas (opcional si ya pusiste WhatsApp)
                </label>
                <div className="mt-1.5 flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="inline-flex min-h-12 items-center rounded-xl border-2 border-borde bg-salvia-claro px-4 text-lg font-bold text-bosque"
                  >
                    +56 9
                  </span>
                  <input
                    id="campo-telefono"
                    type="tel"
                    inputMode="numeric"
                    maxLength={9}
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    aria-invalid={Boolean(erroresCampo.telefono)}
                    className="min-h-12 w-full rounded-xl border-2 border-borde-fuerte bg-crema px-4 text-lg font-bold text-bosque"
                  />
                </div>
                {erroresCampo.telefono && (
                  <p role="alert" className="mt-1.5 text-sm font-bold text-terracota-tinta">
                    {erroresCampo.telefono}
                  </p>
                )}
              </div>

              <div className="mt-4 flex justify-end">
                <button type="button" onClick={irAPaso2} className="boton-primario">
                  <span>Continuar a ubicación</span>
                  <ArrowRight className="size-5 shrink-0" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PASO 2: Ubicación y privacidad */}
        {paso === 2 && (
          <form onSubmit={guardarPerfil} className="mt-6">
            <h2 ref={tituloPasoRef} tabIndex={-1} className="text-3xl font-semibold outline-none">
              ¿En qué sector atiendes y cómo cuidamos tu privacidad?
            </h2>
            <p className="mt-1 text-base text-tinta-suave">
              Si trabajas desde tu casa, ocultamos tu dirección y mostramos solo tu sector aproximado (~1 km).
            </p>

            <fieldset className="mt-6 border-0 p-0">
              <legend className="block text-base font-bold text-bosque">Comuna</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {(catalogo?.comunas ?? ["La Serena", "Coquimbo"]).map((c) => (
                  <ChipFiltro key={c} activo={comuna === c} onClick={() => setComuna(c)}>
                    {c}
                  </ChipFiltro>
                ))}
              </div>
            </fieldset>

            <fieldset className="mt-6 border-0 p-0">
              <legend className="block text-base font-bold text-bosque">Elige tu sector de referencia</legend>
              <span className="block text-sm text-tinta-suave">
                Puedes pulsar tu barrio o usar el botón de GPS de tu teléfono
              </span>
              <div className="mt-2 flex flex-wrap gap-2">
                {SECTORES_REFERENCIA.filter((s) => s.comuna === comuna).map((s) => (
                  <ChipFiltro
                    key={s.nombre}
                    activo={Math.abs(lat - s.lat) < 0.002 && Math.abs(lng - s.lng) < 0.002}
                    onClick={() => {
                      setLat(s.lat);
                      setLng(s.lng);
                    }}
                  >
                    {s.nombre}
                  </ChipFiltro>
                ))}
              </div>
              <button type="button" onClick={usarGpsParaTaller} className="boton-secundario mt-3 px-5">
                <LocateFixed className="size-4 shrink-0" aria-hidden="true" />
                <span>Usar ubicación actual de mi teléfono</span>
              </button>
            </fieldset>

            <fieldset className="mt-6 border-0 p-0">
              <legend className="block text-base font-bold text-bosque">Privacidad de tu dirección</legend>
              <div className="mt-2 grid gap-3">
                <button
                  type="button"
                  onClick={() => setPrecisionUbicacion("aproximada")}
                  aria-pressed={precisionUbicacion === "aproximada"}
                  className={`flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 text-left transition-colors ${
                    precisionUbicacion === "aproximada"
                      ? "border-bosque bg-salvia-claro"
                      : "border-borde-fuerte bg-crema"
                  }`}
                >
                  <Shield className="mt-1 size-6 shrink-0 text-salvia" aria-hidden="true" />
                  <div>
                    <span className="block text-lg font-bold text-bosque">
                      Trabajo desde mi casa (ubicación aproximada · recomendado)
                    </span>
                    <span className="mt-0.5 block text-sm text-tinta-suave">
                      Redondeamos tu ubicación a ~1 km y nunca mostramos tu dirección exacta.
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPrecisionUbicacion("exacta")}
                  aria-pressed={precisionUbicacion === "exacta"}
                  className={`flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 text-left transition-colors ${
                    precisionUbicacion === "exacta" ? "border-bosque bg-salvia-claro" : "border-borde-fuerte bg-crema"
                  }`}
                >
                  <CheckCircle2 className="mt-1 size-6 shrink-0 text-terracota-tinta" aria-hidden="true" />
                  <div>
                    <span className="block text-lg font-bold text-bosque">Tengo un local comercial a la calle</span>
                    <span className="mt-0.5 block text-sm text-tinta-suave">
                      Muestra tu dirección comercial y el punto exacto en las búsquedas.
                    </span>
                  </div>
                </button>
              </div>
            </fieldset>

            {precisionUbicacion === "exacta" && (
              <div className="mt-5">
                <label htmlFor="campo-direccion" className="block text-base font-bold text-bosque">
                  Dirección de tu local
                </label>
                <input
                  id="campo-direccion"
                  type="text"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  className="mt-1.5 min-h-12 w-full rounded-xl border-2 border-borde-fuerte bg-crema px-4 text-base font-bold text-bosque"
                />
                {erroresCampo.direccion && (
                  <p role="alert" className="mt-1.5 text-sm font-bold text-terracota-tinta">
                    {erroresCampo.direccion}
                  </p>
                )}
              </div>
            )}

            <div className="mt-8 flex flex-wrap justify-between gap-3">
              <button type="button" onClick={() => setPaso(1)} className="boton-secundario">
                <ArrowLeft className="size-5 shrink-0" aria-hidden="true" />
                <span>Paso anterior</span>
              </button>

              <button type="submit" disabled={guardandoPerfil} className="boton-primario disabled:opacity-60">
                <span>{guardandoPerfil ? "Guardando…" : "Guardar perfil y ver servicios"}</span>
                <ArrowRight className="size-5 shrink-0" aria-hidden="true" />
              </button>
            </div>
          </form>
        )}

        {/* PASO 3: Gestión de servicios */}
        {paso === 3 && (
          <div className="mt-6">
            <h2 ref={tituloPasoRef} tabIndex={-1} className="text-3xl font-semibold outline-none">
              ¿Qué arreglos ofreces en tu taller?
            </h2>
            <p className="mt-1 text-base text-tinta-suave">
              Agrega tus servicios para aparecer cuando alguien busque ese tipo de prenda o reparación.
            </p>

            {perfilExistente && perfilExistente.servicios.length > 0 && (
              <ul className="mt-5 grid gap-3">
                {perfilExistente.servicios.map((s) => (
                  <li
                    key={s.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-borde bg-crema p-4"
                  >
                    <div>
                      <p className="text-lg font-bold text-bosque">
                        {s.titulo} <span className="text-terracota-tinta">· {formatearPrecio(s.precioDesde)}</span>
                      </p>
                      <p className="mt-1 text-sm text-tinta-suave">
                        {etiquetasCategoria.get(s.categoria) ?? s.categoria} ·{" "}
                        {s.prendas.map((p) => etiquetasPrenda.get(p) ?? p).join(", ")}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => manejarEliminarServicio(s.id)}
                      aria-label={`Eliminar servicio ${s.titulo}`}
                      className="boton border border-terracota-tinta px-4 text-sm text-terracota-tinta hover:bg-terracota-claro/40"
                    >
                      <Trash2 className="size-4 shrink-0" aria-hidden="true" />
                      <span>Quitar</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <form onSubmit={manejarAgregarServicio} className="mt-6 border-t border-borde pt-6">
              <h3 className="text-2xl font-semibold">Agregar un servicio</h3>

              <fieldset className="mt-4 border-0 p-0">
                <legend className="block text-base font-bold text-bosque">Categoría del oficio</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {catalogo?.categorias.map((c) => (
                    <ChipFiltro key={c.id} activo={catServicio === c.id} onClick={() => setCatServicio(c.id)}>
                      {c.etiqueta}
                    </ChipFiltro>
                  ))}
                </div>
              </fieldset>

              <div className="mt-5">
                <label htmlFor="campo-titulo-servicio" className="block text-base font-bold text-bosque">
                  Nombre del servicio
                </label>
                <span id="pista-titulo-servicio" className="block text-sm text-tinta-suave">
                  Ejemplo: Bastas y ajustes, Cambio de cierre, Cambio de suelas
                </span>
                <input
                  id="campo-titulo-servicio"
                  type="text"
                  value={tituloServicio}
                  onChange={(e) => setTituloServicio(e.target.value)}
                  aria-describedby="pista-titulo-servicio"
                  aria-invalid={Boolean(erroresCampo.titulo)}
                  className="mt-1.5 min-h-12 w-full rounded-xl border-2 border-borde-fuerte bg-crema px-4 text-base font-bold text-bosque"
                />
                {erroresCampo.titulo && (
                  <p role="alert" className="mt-1.5 text-sm font-bold text-terracota-tinta">
                    {erroresCampo.titulo}
                  </p>
                )}
              </div>

              <fieldset className="mt-5 border-0 p-0">
                <legend className="block text-base font-bold text-bosque">¿En qué prendas haces este arreglo?</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {catalogo?.prendas.map((p) => (
                    <ChipFiltro
                      key={p.id}
                      activo={prendasServicio.includes(p.id)}
                      onClick={() => alternarPrendaServicio(p.id)}
                    >
                      {p.etiqueta}
                    </ChipFiltro>
                  ))}
                </div>
                {erroresCampo.prendas && (
                  <p role="alert" className="mt-1.5 text-sm font-bold text-terracota-tinta">
                    {erroresCampo.prendas}
                  </p>
                )}
              </fieldset>

              <div className="mt-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label htmlFor="campo-precio" className="block text-base font-bold text-bosque">
                    Precio referencial &ldquo;Desde&rdquo; (CLP)
                  </label>
                  <ChipFiltro activo={aConvenir} onClick={() => setAConvenir((v) => !v)}>
                    Precio a convenir
                  </ChipFiltro>
                </div>

                {!aConvenir && (
                  <input
                    id="campo-precio"
                    type="number"
                    min={0}
                    step={500}
                    value={precioDesde}
                    onChange={(e) => setPrecioDesde(e.target.value)}
                    aria-invalid={Boolean(erroresCampo.precioDesde)}
                    className="mt-2 min-h-12 w-full rounded-xl border-2 border-borde-fuerte bg-crema px-4 text-lg font-bold text-bosque"
                  />
                )}
                {erroresCampo.precioDesde && (
                  <p role="alert" className="mt-1.5 text-sm font-bold text-terracota-tinta">
                    {erroresCampo.precioDesde}
                  </p>
                )}
              </div>

              <div className="mt-6 flex flex-wrap justify-between gap-3">
                <button type="submit" disabled={guardandoServicio} className="boton-primario disabled:opacity-60">
                  <Plus className="size-5 shrink-0" aria-hidden="true" />
                  <span>{guardandoServicio ? "Agregando…" : "Agregar servicio"}</span>
                </button>

                {perfilExistente && (
                  <Link to={`/reparar/${perfilExistente.id}`} className="boton-secundario">
                    Ver cómo luce mi perfil público
                  </Link>
                )}
              </div>
            </form>
          </div>
        )}
      </div>
    </section>
  );
}
