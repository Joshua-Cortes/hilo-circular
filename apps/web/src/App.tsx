import { Construction } from "lucide-react";
import { Link, Route, Routes } from "react-router";
import { CifrasImpacto } from "./componentes/CifrasImpacto";
import { Marco } from "./componentes/Marco";
import { Inicio } from "./paginas/Inicio";

/** Marcador para las pantallas que se construyen en los issues de cada integrante. */
function EnConstruccion({ titulo, issue, responsable }: { titulo: string; issue: string; responsable: string }) {
  return (
    <section className="mx-auto max-w-3xl px-5 py-20">
      <Construction className="size-10 text-terracota" aria-hidden="true" />
      <h1 className="mt-4 text-5xl font-semibold">{titulo}</h1>
      <p className="mt-4 text-xl text-tinta-suave">
        Esta pantalla está en desarrollo ({issue}, a cargo de {responsable}). La API ya responde en{" "}
        <code className="rounded bg-salvia-claro px-1.5">/api</code>.
      </p>
      <Link to="/" className="boton-secundario mt-8">
        Volver al inicio
      </Link>
    </section>
  );
}

function NoEncontrada() {
  return (
    <section className="mx-auto max-w-3xl px-5 py-20">
      <h1 className="text-5xl font-semibold">No encontramos esta página</h1>
      <p className="mt-4 text-xl text-tinta-suave">Puede que el enlace esté incompleto o que la página ya no exista.</p>
      <Link to="/" className="boton-primario mt-8">
        Ir al inicio
      </Link>
    </section>
  );
}

function PaginaImpacto() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-16">
      <h1 className="text-5xl font-semibold">Impacto</h1>
      <p className="mt-3 max-w-2xl text-xl text-tinta-suave">
        Indicadores públicos y actualizados de Hilo Circular. Los kilos recuperados se estiman con el peso promedio de
        cada prenda y solo consideran donaciones confirmadas por la fundación.
      </p>
      <CifrasImpacto />
    </section>
  );
}

export function App() {
  return (
    <Marco>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route
          path="/reparar"
          element={<EnConstruccion titulo="Reparar" issue="módulo de búsqueda" responsable="Bastian" />}
        />
        <Route
          path="/donar"
          element={<EnConstruccion titulo="Donar" issue="mapa de donación" responsable="Hector" />}
        />
        <Route path="/impacto" element={<PaginaImpacto />} />
        <Route path="*" element={<NoEncontrada />} />
      </Routes>
    </Marco>
  );
}
