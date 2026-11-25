import { Bike, Check, MapPin, Pause, Play, Save } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { Link } from "react-router";
import { EncabezadoPagina } from "../componentes/EncabezadoPagina";
import { api, type Catalogo, type DatosGuardarReparto, type MiReparto as PerfilReparto } from "../lib/api";
import { cn } from "../lib/cn";
import { useSesion } from "../lib/sesion";

const VACIO = { nombrePublico: "", descripcion: "", comunas: [] as string[], whatsapp: "", telefono: "" };

export function MiReparto() {
  const { usuario } = useSesion();
  const [catalogo, setCatalogo] = useState<Catalogo | null>(null);
  const [perfil, setPerfil] = useState<PerfilReparto | null>(null);
  const [formulario, setFormulario] = useState(VACIO);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    Promise.all([api.catalogo(), api.miReparto()])
      .then(([datosCatalogo, datosPerfil]) => {
        setCatalogo(datosCatalogo);
        setPerfil(datosPerfil);
        if (datosPerfil) {
          setFormulario({
            nombrePublico: datosPerfil.nombrePublico,
            descripcion: datosPerfil.descripcion,
            comunas: datosPerfil.comunas,
            whatsapp: datosPerfil.whatsapp ?? "",
            telefono: datosPerfil.telefono ?? "",
          });
        }
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setCargando(false));
  }, []);

  function cambiar<K extends keyof typeof VACIO>(campo: K, valor: (typeof VACIO)[K]) {
    setFormulario((prev) => ({ ...prev, [campo]: valor }));
    setGuardado(false);
  }

  function alternarComuna(comuna: string) {
    const comunas = formulario.comunas.includes(comuna)
      ? formulario.comunas.filter((actual) => actual !== comuna)
      : [...formulario.comunas, comuna];
    cambiar("comunas", comunas);
  }

  async function guardar(e: FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    setGuardado(false);
    const datos: DatosGuardarReparto = {
      nombrePublico: formulario.nombrePublico,
      descripcion: formulario.descripcion,
      comunas: formulario.comunas,
      whatsapp: formulario.whatsapp.trim() || null,
      telefono: formulario.telefono.trim() || null,
    };
    try {
      const actualizado = perfil ? await api.actualizarMiReparto(datos) : await api.crearMiReparto(datos);
      setPerfil(actualizado);
      setGuardado(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarDisponibilidad() {
    if (!perfil) return;
    setGuardando(true);
    setError(null);
    try {
      const actualizado = await api.actualizarMiReparto({ activo: !perfil.activo });
      setPerfil(actualizado);
      setGuardado(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGuardando(false);
    }
  }

  if (cargando)
    return (
      <section className="mx-auto max-w-4xl px-4 py-14" aria-live="polite">
        Cargando tu perfil de reparto…
      </section>
    );

  return (
    <section className="mx-auto max-w-5xl px-4 py-10 md:px-6 md:py-14">
      <Link to="/delivery" className="font-bold text-hoja-oscura hover:underline">
        ← Volver a Delivery
      </Link>
      <div className="mt-6">
        <EncabezadoPagina
          etiqueta="Mi perfil de reparto"
          titulo={
            <>
              Tu zona, <em className="acento">tu ritmo.</em>
            </>
          }
          acciones={
            perfil ? (
              <button type="button" disabled={guardando} onClick={cambiarDisponibilidad} className="boton-secundario">
                {perfil.activo ? (
                  <Pause className="size-5" aria-hidden="true" />
                ) : (
                  <Play className="size-5" aria-hidden="true" />
                )}
                {perfil.activo ? "Pausar perfil" : "Activar perfil"}
              </button>
            ) : undefined
          }
        >
          Publica las comunas donde trabajas y cómo prefieres que te contacten. Tú decides cuándo apareces en el
          directorio.
        </EncabezadoPagina>
      </div>

      {error && (
        <p role="alert" className="mt-6 rounded-2xl bg-alerta-clara p-4 font-bold text-alerta">
          {error}
        </p>
      )}
      {guardado && (
        <p
          role="status"
          className="mt-6 flex items-center gap-2 rounded-2xl bg-menta-clara p-4 font-bold text-hoja-oscura"
        >
          <Check className="size-5" aria-hidden="true" />
          Perfil guardado.
        </p>
      )}

      <form onSubmit={guardar} className="mt-8 grid gap-3 md:grid-cols-[1fr_0.75fr]">
        <div className="bento bg-superficie">
          <div className="flex items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-menta text-hoja-oscura">
              <Bike className="size-6" aria-hidden="true" />
            </span>
            <div>
              <p className="etiqueta text-hoja-oscura">Información pública</p>
              <p className="text-sm text-tinta-suave">Cuenta: {usuario?.nombre}</p>
            </div>
          </div>
          <div className="mt-6 grid gap-5">
            <div>
              <label htmlFor="nombre-reparto" className="font-bold">
                Nombre para mostrar
              </label>
              <input
                id="nombre-reparto"
                className="campo mt-2"
                value={formulario.nombrePublico}
                onChange={(e) => cambiar("nombrePublico", e.target.value)}
                minLength={3}
                maxLength={80}
                required
              />
            </div>
            <div>
              <label htmlFor="descripcion-reparto" className="font-bold">
                ¿Qué tipo de entregas puedes coordinar?
              </label>
              <textarea
                id="descripcion-reparto"
                className="campo mt-2 min-h-28 resize-y"
                value={formulario.descripcion}
                onChange={(e) => cambiar("descripcion", e.target.value)}
                maxLength={400}
                placeholder="Cuéntales brevemente cómo trabajas"
              />
            </div>
            <fieldset>
              <legend className="font-bold">Comunas que cubres</legend>
              <p className="mt-1 text-sm text-tinta-suave">Marca todas las zonas donde puedes coordinar entregas.</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {(catalogo?.comunas ?? []).map((comuna) => {
                  const activa = formulario.comunas.includes(comuna);
                  return (
                    <label
                      key={comuna}
                      className={cn(
                        "flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 font-bold transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-hoja",
                        activa ? "border-hoja bg-menta-clara" : "border-borde hover:border-hoja",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={activa}
                        onChange={() => alternarComuna(comuna)}
                        className="size-5 accent-hoja"
                      />
                      <MapPin className="size-4 text-hoja-oscura" aria-hidden="true" />
                      {comuna}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          </div>
        </div>

        <aside className="bento flex flex-col bg-menta">
          <p className="etiqueta text-hoja-oscura">Contacto directo</p>
          <h2 className="mt-3 text-2xl">¿Cómo te encuentran?</h2>
          <p className="mt-2 text-tinta-800">Agrega al menos un celular chileno para WhatsApp o llamadas.</p>
          <div className="mt-5 grid gap-5">
            <div>
              <label htmlFor="whatsapp-reparto" className="font-bold">
                WhatsApp
              </label>
              <input
                id="whatsapp-reparto"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                className="campo mt-2 bg-superficie"
                value={formulario.whatsapp}
                onChange={(e) => cambiar("whatsapp", e.target.value)}
                placeholder="+56 9 1234 5678"
              />
            </div>
            <div>
              <label htmlFor="telefono-reparto" className="font-bold">
                Teléfono
              </label>
              <input
                id="telefono-reparto"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                className="campo mt-2 bg-superficie"
                value={formulario.telefono}
                onChange={(e) => cambiar("telefono", e.target.value)}
                placeholder="+56 9 1234 5678"
              />
            </div>
          </div>
          {perfil && (
            <p className="mt-6 rounded-2xl bg-superficie p-4 text-sm text-tinta-suave">
              {perfil.verificado
                ? "Tu perfil está verificado por el equipo."
                : "El equipo aún no ha verificado tu perfil."}{" "}
              {perfil.activo ? "Apareces en el directorio." : "Tu perfil está pausado y no aparece en el directorio."}
            </p>
          )}
          <button type="submit" disabled={guardando} className="boton-primario mt-auto min-h-14 w-full">
            <Save className="size-5" aria-hidden="true" />
            {guardando ? "Guardando…" : perfil ? "Guardar cambios" : "Publicar mi perfil"}
          </button>
        </aside>
      </form>
      <p className="mt-5 text-sm text-tinta-suave">
        El costo, el horario y el punto de entrega se acuerdan por contacto directo. No recibimos pagos ni guardamos
        direcciones de retiro.
      </p>
    </section>
  );
}
