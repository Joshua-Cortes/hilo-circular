import { useEffect, useState } from "react";
import { api, type Impacto } from "../lib/api";
import { cn } from "../lib/cn";

const formato = new Intl.NumberFormat("es-CL");

/** Una cifra por pilar, más los kilos: así se lee de un vistazo qué aporta cada parte. */
const CIFRAS: { clave: keyof Impacto; etiqueta: string; sufijo?: string; tono: string }[] = [
  { clave: "contactosReparacion", etiqueta: "personas contactaron a un oficio para reparar", tono: "bg-menta" },
  { clave: "contactosDelivery", etiqueta: "contactos para coordinar entregas locales", tono: "bg-kraft-clara" },
  { clave: "puntosDonacion", etiqueta: "puntos de donación en La Serena y Coquimbo", tono: "bg-superficie" },
  { clave: "publicacionesActivas", etiqueta: "prendas buscando nueva dueña o dueño", tono: "bg-kraft-clara" },
  {
    clave: "kgTextilRecuperados",
    etiqueta: "de textil recuperado en donaciones confirmadas",
    sufijo: " kg",
    tono: "bg-lima",
  },
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
    <dl className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {CIFRAS.map(({ clave, etiqueta, sufijo, tono }) => (
        // En el DOM va primero <dt> (lo exige <dl>); flex-col-reverse deja la cifra arriba.
        <div key={clave} className={cn("bento flex min-h-44 flex-col-reverse justify-between", tono)}>
          <dt className="mt-6 max-w-[16rem] font-bold text-tinta-800">{etiqueta}</dt>
          {/* La altura fija evita saltos de diseño mientras carga. */}
          <dd className="h-14 font-display text-4xl font-bold tracking-tight tabular-nums xl:text-5xl">
            {impacto ? `${formato.format(impacto[clave])}${sufijo ?? ""}` : <span className="text-tinta/20">—</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}
