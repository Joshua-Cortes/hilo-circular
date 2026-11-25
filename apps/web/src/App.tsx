import { lazy, Suspense, useEffect } from "react";
import { Link, Route, Routes, useLocation } from "react-router";
import { EncabezadoPagina } from "./componentes/EncabezadoPagina";
import { ImpactoPorCamino } from "./componentes/ImpactoPorCamino";
import { Marco } from "./componentes/Marco";
import { RequiereSesion } from "./componentes/RequiereSesion";
import { Ingresar } from "./paginas/Ingresar";
import { Inicio } from "./paginas/Inicio";
import { Mercado } from "./paginas/Mercado";
import { Reparar } from "./paginas/Reparar";

const Donar = lazy(() => import("./paginas/Donar").then((m) => ({ default: m.Donar })));
const Ajustes = lazy(() => import("./paginas/Ajustes").then((m) => ({ default: m.Ajustes })));
const PerfilOficio = lazy(() => import("./paginas/PerfilOficio").then((m) => ({ default: m.PerfilOficio })));
const MiTaller = lazy(() => import("./paginas/MiTaller").then((m) => ({ default: m.MiTaller })));
const MiFundacion = lazy(() => import("./paginas/MiFundacion").then((m) => ({ default: m.MiFundacion })));
const DetallePublicacion = lazy(() =>
  import("./paginas/DetallePublicacion").then((m) => ({ default: m.DetallePublicacion })),
);
const Publicar = lazy(() => import("./paginas/Publicar").then((m) => ({ default: m.Publicar })));
const MisDonaciones = lazy(() => import("./paginas/MisDonaciones").then((m) => ({ default: m.MisDonaciones })));
const MisPublicaciones = lazy(() =>
  import("./paginas/MisPublicaciones").then((m) => ({ default: m.MisPublicaciones })),
);
const Mensajes = lazy(() => import("./paginas/Mensajes").then((m) => ({ default: m.Mensajes })));

function NoEncontrada() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-20 md:px-6">
      <EncabezadoPagina
        etiqueta="Error 404"
        titulo={
          <>
            Este hilo <em className="acento">se cortó</em>
          </>
        }
      >
        Puede que el enlace esté incompleto o que la página ya no exista.
      </EncabezadoPagina>
      <Link to="/" className="boton-primario mt-8">
        Ir al inicio
      </Link>
    </section>
  );
}

function PaginaImpacto() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
      <EncabezadoPagina
        etiqueta="Impacto"
        titulo={
          <>
            Lo que <em className="acento">no llegó</em> al desierto
          </>
        }
      >
        Indicadores públicos y en vivo, una cifra principal por cada camino. Se calculan con lo que pasa en la
        plataforma: nadie los escribe a mano.
      </EncabezadoPagina>
      <ImpactoPorCamino />
    </section>
  );
}

/** Al cambiar de página se vuelve arriba, salvo cuando se navega a un ancla (#mapa). */
function VolverArriba() {
  const { pathname, hash } = useLocation();
  // biome-ignore lint/correctness/useExhaustiveDependencies: debe correr justamente cuando cambia la ruta
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export function App() {
  return (
    <Marco>
      <VolverArriba />
      <Suspense
        fallback={
          <div className="mx-auto max-w-7xl px-4 py-12 md:px-6" aria-live="polite">
            <div className="bento h-64 animate-pulse bg-superficie" aria-hidden="true" />
            <span className="sr-only">Cargando pantalla…</span>
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/reparar" element={<Reparar />} />
          <Route path="/reparar/:id" element={<PerfilOficio />} />
          <Route path="/mi-taller" element={<MiTaller />} />
          <Route path="/donar" element={<Donar />} />
          <Route path="/mercado" element={<Mercado />} />
          <Route
            path="/mi-fundacion"
            element={
              <RequiereSesion>
                <MiFundacion />
              </RequiereSesion>
            }
          />
          <Route
            path="/mercado/publicar"
            element={
              <RequiereSesion>
                <Publicar />
              </RequiereSesion>
            }
          />
          <Route
            path="/mercado/mias"
            element={
              <RequiereSesion>
                <MisPublicaciones />
              </RequiereSesion>
            }
          />
          <Route
            path="/mis-donaciones"
            element={
              <RequiereSesion>
                <MisDonaciones />
              </RequiereSesion>
            }
          />
          <Route path="/mercado/:id" element={<DetallePublicacion />} />
          <Route
            path="/mensajes/:id?"
            element={
              <RequiereSesion>
                <Mensajes />
              </RequiereSesion>
            }
          />
          <Route path="/ingresar" element={<Ingresar />} />
          <Route
            path="/ajustes"
            element={
              <RequiereSesion>
                <Ajustes />
              </RequiereSesion>
            }
          />
          <Route path="/impacto" element={<PaginaImpacto />} />
          <Route path="*" element={<NoEncontrada />} />
        </Routes>
      </Suspense>
    </Marco>
  );
}
