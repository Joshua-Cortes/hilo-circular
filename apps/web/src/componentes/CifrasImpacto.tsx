import { useEffect, useState } from "react";
import { api, type Impacto } from "../lib/api";

const formato = new Intl.NumberFormat("es-CL");

const CIFRAS: { clave: keyof Impacto; etiqueta: string; sufijo?: string }[] = [
  { clave: "oficiosActivos", etiqueta: "oficios con perfil activo" },
  { clave: "puntosDonacion", etiqueta: "puntos de donación" },
  { clave: "contactosReparacion", etiqueta: "contactos para reparar" },
  { clave: "kgTextilRecuperados", etiqueta: "de textil recuperado", sufijo: " kg" },
];

export function CifrasImpacto() {
  const [impacto, setImpacto] = useState<Impacto | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api
      .impacto()
      .then(setImpacto)
      .catch(() => setError(true));
  }, []);

  if (error) {
    return <p className="mt-8 text-tinta-suave">Las cifras no están disponibles en este momento.</p>;
  }

  return (
    <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-tarjeta border border-borde bg-borde lg:grid-cols-4">
      {CIFRAS.map(({ clave, etiqueta, sufijo }) => (
        <div key={clave} className="bg-papel p-6">
          <dt className="text-tinta-suave">{etiqueta}</dt>
          {/* La altura fija evita saltos de diseño mientras carga. */}
          <dd className="mt-1 h-12 font-display text-4xl font-semibold tabular-nums">
            {impacto ? `${formato.format(impacto[clave])}${sufijo ?? ""}` : <span className="text-borde">—</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}
