import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { useSesion } from "../lib/sesion";

/** Si no hay sesión, manda a /ingresar y vuelve a esta misma página después de entrar. */
export function RequiereSesion({ children }: { children: ReactNode }) {
  const { usuario } = useSesion();
  const { pathname, search } = useLocation();
  if (!usuario) {
    return <Navigate to={`/ingresar?volver=${encodeURIComponent(pathname + search)}`} replace />;
  }
  return children;
}
