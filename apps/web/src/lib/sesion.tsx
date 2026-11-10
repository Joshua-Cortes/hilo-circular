import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, CLAVE_TOKEN, type Sesion, type Usuario } from "./api";

const CLAVE_USUARIO = "hilo_usuario";

type ValorSesion = {
  usuario: Usuario | null;
  noLeidos: number;
  iniciar: (sesion: Sesion) => void;
  cerrar: () => void;
  refrescarNoLeidos: () => void;
};

const ContextoSesion = createContext<ValorSesion | null>(null);

function leerGuardado(): Usuario | null {
  try {
    if (!localStorage.getItem(CLAVE_TOKEN)) return null;
    const crudo = localStorage.getItem(CLAVE_USUARIO);
    return crudo ? (JSON.parse(crudo) as Usuario) : null;
  } catch {
    return null;
  }
}

/** Sesión de la persona en este navegador y el contador de mensajes sin leer del menú. */
export function ProveedorSesion({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(leerGuardado);
  const [noLeidos, setNoLeidos] = useState(0);

  const iniciar = useCallback((sesion: Sesion) => {
    try {
      localStorage.setItem(CLAVE_TOKEN, sesion.token);
      localStorage.setItem(CLAVE_USUARIO, JSON.stringify(sesion.usuario));
    } catch {
      // Sin almacenamiento la sesión dura lo que dure la pestaña.
    }
    setUsuario(sesion.usuario);
  }, []);

  const cerrar = useCallback(() => {
    try {
      localStorage.removeItem(CLAVE_TOKEN);
      localStorage.removeItem(CLAVE_USUARIO);
    } catch {
      // Nada que limpiar.
    }
    setUsuario(null);
    setNoLeidos(0);
  }, []);

  const refrescarNoLeidos = useCallback(() => {
    if (!usuario) return;
    api
      .noLeidos()
      .then(({ total }) => setNoLeidos(total))
      .catch(() => {});
  }, [usuario]);

  useEffect(() => {
    window.addEventListener("hilo:sesion-expirada", cerrar);
    return () => window.removeEventListener("hilo:sesion-expirada", cerrar);
  }, [cerrar]);

  // El globo de mensajes se actualiza cada 20 s mientras la pestaña está visible.
  useEffect(() => {
    if (!usuario) return;
    refrescarNoLeidos();
    const intervalo = window.setInterval(() => {
      if (document.visibilityState === "visible") refrescarNoLeidos();
    }, 20_000);
    return () => window.clearInterval(intervalo);
  }, [usuario, refrescarNoLeidos]);

  const valor = useMemo(
    () => ({ usuario, noLeidos, iniciar, cerrar, refrescarNoLeidos }),
    [usuario, noLeidos, iniciar, cerrar, refrescarNoLeidos],
  );
  return <ContextoSesion.Provider value={valor}>{children}</ContextoSesion.Provider>;
}

export function useSesion() {
  const valor = useContext(ContextoSesion);
  if (!valor) throw new Error("useSesion debe usarse dentro de <ProveedorSesion>");
  return valor;
}
