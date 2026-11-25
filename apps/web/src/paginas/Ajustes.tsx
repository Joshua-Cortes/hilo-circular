import { AlertCircle, CheckCircle2, KeyRound, LogOut, Mail, Shield, SlidersHorizontal, User } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { Link } from "react-router";
import { EncabezadoPagina } from "../componentes/EncabezadoPagina";
import { ChipFiltro } from "../componentes/ui/ChipFiltro";
import { api, ErrorApi } from "../lib/api";
import { useSesion } from "../lib/sesion";

const CLAVE_TAMANO_TEXTO = "hilo_texto_grande";

const ETIQUETA_ROL: Record<string, string> = {
  persona: "Persona (vecina / vecino)",
  oficio: "Oficio de reparación",
  fundacion: "Fundación / punto de acopio",
  admin: "Administración",
};

export function Ajustes() {
  const { usuario, actualizarUsuario, cerrar } = useSesion();

  // Datos de cuenta
  const [nombre, setNombre] = useState(usuario?.nombre ?? "");
  const [email, setEmail] = useState(usuario?.email ?? "");
  const [claveParaCorreo, setClaveParaCorreo] = useState("");
  const [guardandoCuenta, setGuardandoCuenta] = useState(false);
  const [errorCuenta, setErrorCuenta] = useState<string | null>(null);
  const [exitoCuenta, setExitoCuenta] = useState<string | null>(null);

  // Cambio de contraseña
  const [claveActual, setClaveActual] = useState("");
  const [claveNueva, setClaveNueva] = useState("");
  const [claveConfirmar, setClaveConfirmar] = useState("");
  const [guardandoClave, setGuardandoClave] = useState(false);
  const [errorClave, setErrorClave] = useState<string | null>(null);
  const [exitoClave, setExitoClave] = useState<string | null>(null);

  // Preferencia local de lectura
  const [textoGrande, setTextoGrande] = useState(() => {
    try {
      return localStorage.getItem(CLAVE_TAMANO_TEXTO) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!usuario) return;
    setNombre(usuario.nombre);
    setEmail(usuario.email);
  }, [usuario]);

  useEffect(() => {
    document.documentElement.style.fontSize = textoGrande ? "125%" : "";
    try {
      localStorage.setItem(CLAVE_TAMANO_TEXTO, textoGrande ? "1" : "0");
    } catch {
      // Sin almacenamiento, la preferencia dura lo que dure la pestaña.
    }
  }, [textoGrande]);

  if (!usuario) return null;

  const cambioCorreo = email.trim().toLowerCase() !== usuario.email.toLowerCase();

  async function guardarCuenta(e: FormEvent) {
    e.preventDefault();
    if (!usuario) return;
    setErrorCuenta(null);
    setExitoCuenta(null);

    if (nombre.trim().length < 2) {
      setErrorCuenta("Escribe tu nombre (al menos 2 letras).");
      return;
    }
    if (cambioCorreo && !claveParaCorreo) {
      setErrorCuenta("Escribe tu contraseña actual para confirmar el cambio de correo.");
      return;
    }

    setGuardandoCuenta(true);
    try {
      const actualizado = await api.actualizarCuenta({
        nombre: nombre.trim(),
        email: cambioCorreo ? email.trim() : undefined,
        claveActual: cambioCorreo ? claveParaCorreo : undefined,
      });
      actualizarUsuario(actualizado);
      setClaveParaCorreo("");
      setExitoCuenta("Tus datos fueron actualizados correctamente.");
    } catch (err) {
      setErrorCuenta(err instanceof ErrorApi ? err.message : "No pudimos guardar tus datos.");
    } finally {
      setGuardandoCuenta(false);
    }
  }

  async function guardarNuevaClave(e: FormEvent) {
    e.preventDefault();
    setErrorClave(null);
    setExitoClave(null);

    if (!claveActual) {
      setErrorClave("Escribe tu contraseña actual.");
      return;
    }
    if (claveNueva.length < 8) {
      setErrorClave("La contraseña nueva debe tener al menos 8 caracteres.");
      return;
    }
    if (claveNueva !== claveConfirmar) {
      setErrorClave("Las contraseñas nuevas no coinciden.");
      return;
    }

    setGuardandoClave(true);
    try {
      await api.cambiarClave({ claveActual, claveNueva });
      setClaveActual("");
      setClaveNueva("");
      setClaveConfirmar("");
      setExitoClave("Tu contraseña se cambió correctamente.");
    } catch (err) {
      setErrorClave(err instanceof ErrorApi ? err.message : "No pudimos cambiar tu contraseña.");
    } finally {
      setGuardandoClave(false);
    }
  }

  return (
    <section className="mx-auto max-w-4xl px-4 py-10 md:px-6 md:py-14" aria-labelledby="titulo-ajustes">
      <EncabezadoPagina
        id="titulo-ajustes"
        etiqueta="Mi cuenta"
        titulo={
          <>
            Ajustes de <em className="acento">tu cuenta</em>
          </>
        }
      >
        Actualiza tu nombre, correo electrónico, contraseña y preferencias de lectura en cualquier momento.
      </EncabezadoPagina>

      <div className="mt-8 grid gap-6">
        {/* 1. Datos personales y correo */}
        <form onSubmit={guardarCuenta} className="bento bg-superficie">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2.5 text-2xl md:text-3xl">
              <User className="size-6 text-hoja-oscura" aria-hidden="true" />
              <span>Datos de tu cuenta</span>
            </h2>
            <span className="rounded-full bg-menta-clara px-4 py-1.5 text-sm font-bold text-tinta">
              {ETIQUETA_ROL[usuario.rol] ?? usuario.rol}
            </span>
          </div>

          <div className="mt-6 grid gap-5">
            <div>
              <label htmlFor="ajuste-nombre" className="block font-bold text-tinta">
                Nombre visible
              </label>
              <input
                id="ajuste-nombre"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                className="campo mt-1.5"
              />
            </div>

            <div>
              <label htmlFor="ajuste-email" className="flex items-center gap-2 font-bold text-tinta">
                <Mail className="size-4 text-hoja-oscura" aria-hidden="true" />
                <span>Correo electrónico</span>
              </label>
              <input
                id="ajuste-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="campo mt-1.5"
              />
            </div>

            {cambioCorreo && (
              <div className="rounded-2xl border border-borde bg-menta-clara/60 p-4">
                <label htmlFor="ajuste-clave-correo" className="block font-bold text-tinta">
                  Contraseña actual (necesaria para cambiar tu correo)
                </label>
                <input
                  id="ajuste-clave-correo"
                  type="password"
                  value={claveParaCorreo}
                  onChange={(e) => setClaveParaCorreo(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="campo mt-2"
                />
              </div>
            )}

            {errorCuenta && (
              <div role="alert" className="flex items-start gap-2.5 rounded-2xl bg-alerta-clara p-4 text-alerta">
                <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                <p className="font-bold">{errorCuenta}</p>
              </div>
            )}

            {exitoCuenta && (
              <output className="flex items-start gap-2.5 rounded-2xl bg-menta-clara p-4 text-tinta">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-hoja-oscura" aria-hidden="true" />
                <p className="font-bold">{exitoCuenta}</p>
              </output>
            )}

            <div>
              <button type="submit" disabled={guardandoCuenta} className="boton-primario">
                {guardandoCuenta ? "Guardando…" : "Guardar datos"}
              </button>
            </div>
          </div>
        </form>

        {/* 2. Cambiar contraseña */}
        <form onSubmit={guardarNuevaClave} className="bento bg-superficie">
          <h2 className="flex items-center gap-2.5 text-2xl md:text-3xl">
            <KeyRound className="size-6 text-hoja-oscura" aria-hidden="true" />
            <span>Cambiar contraseña</span>
          </h2>
          <p className="mt-1 text-base text-tinta-suave">Usa una contraseña de al menos 8 caracteres.</p>

          <div className="mt-6 grid gap-5">
            <div>
              <label htmlFor="ajuste-clave-actual" className="block font-bold text-tinta">
                Contraseña actual
              </label>
              <input
                id="ajuste-clave-actual"
                type="password"
                value={claveActual}
                onChange={(e) => setClaveActual(e.target.value)}
                autoComplete="current-password"
                className="campo mt-1.5"
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label htmlFor="ajuste-clave-nueva" className="block font-bold text-tinta">
                  Contraseña nueva
                </label>
                <input
                  id="ajuste-clave-nueva"
                  type="password"
                  value={claveNueva}
                  onChange={(e) => setClaveNueva(e.target.value)}
                  autoComplete="new-password"
                  className="campo mt-1.5"
                />
              </div>

              <div>
                <label htmlFor="ajuste-clave-confirmar" className="block font-bold text-tinta">
                  Repite la contraseña nueva
                </label>
                <input
                  id="ajuste-clave-confirmar"
                  type="password"
                  value={claveConfirmar}
                  onChange={(e) => setClaveConfirmar(e.target.value)}
                  autoComplete="new-password"
                  className="campo mt-1.5"
                />
              </div>
            </div>

            {errorClave && (
              <div role="alert" className="flex items-start gap-2.5 rounded-2xl bg-alerta-clara p-4 text-alerta">
                <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                <p className="font-bold">{errorClave}</p>
              </div>
            )}

            {exitoClave && (
              <output className="flex items-start gap-2.5 rounded-2xl bg-menta-clara p-4 text-tinta">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-hoja-oscura" aria-hidden="true" />
                <p className="font-bold">{exitoClave}</p>
              </output>
            )}

            <div>
              <button type="submit" disabled={guardandoClave} className="boton-primario">
                {guardandoClave ? "Actualizando…" : "Actualizar contraseña"}
              </button>
            </div>
          </div>
        </form>

        {/* 3. Preferencias y accesos rápidos */}
        <div className="bento bg-superficie">
          <h2 className="flex items-center gap-2.5 text-2xl md:text-3xl">
            <SlidersHorizontal className="size-6 text-hoja-oscura" aria-hidden="true" />
            <span>Lectura y accesos</span>
          </h2>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-borde bg-fondo p-4">
            <div>
              <p className="font-bold text-tinta">Tamaño de letra más grande</p>
              <p className="text-sm text-tinta-suave">
                Aumenta el tamaño de los textos y botones para leer más cómodo.
              </p>
            </div>
            <ChipFiltro activo={textoGrande} onClick={() => setTextoGrande((v) => !v)}>
              {textoGrande ? "Activado" : "Normal"}
            </ChipFiltro>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-borde pt-5">
            <div className="flex flex-wrap gap-3">
              <Link to="/mercado/mias" className="boton-secundario px-5">
                Mis publicaciones
              </Link>
              {usuario.rol === "oficio" && (
                <Link to="/mi-taller" className="boton-secundario px-5">
                  Mi taller
                </Link>
              )}
              <Link to="/mensajes" className="boton-secundario px-5">
                Mensajes
              </Link>
            </div>

            <button
              type="button"
              onClick={cerrar}
              className="boton border-2 border-alerta text-alerta hover:bg-alerta hover:text-white"
            >
              <LogOut className="size-5 shrink-0" aria-hidden="true" />
              <span>Cerrar sesión</span>
            </button>
          </div>

          <p className="mt-4 flex items-center gap-2 text-sm text-tinta-suave">
            <Shield className="size-4 shrink-0 text-hoja-oscura" aria-hidden="true" />
            <span>Tus datos nunca se comparten con terceros ni se muestran sin tu permiso.</span>
          </p>
        </div>
      </div>
    </section>
  );
}
