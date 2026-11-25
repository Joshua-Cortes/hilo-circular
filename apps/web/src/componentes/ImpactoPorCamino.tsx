import { ArrowUpRight, HandHeart, Scissors, Store } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { api, type Impacto } from "../lib/api";
import { cn } from "../lib/cn";

const formato = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 1 });

type Camino = {
  numero: string;
  nombre: string;
  icono: typeof Scissors;
  a: string;
  tono: string;
  claro?: boolean;
  principal: { clave: keyof Impacto; etiqueta: string; sufijo?: string };
  otras: { clave: keyof Impacto; etiqueta: string }[];
  comoSeMide: string;
};

/** Una cifra principal por camino, como se define en docs/00-la-idea.md, más las que la explican. */
const CAMINOS: Camino[] = [
  {
    numero: "01",
    nombre: "Reparar",
    icono: Scissors,
    a: "/reparar",
    tono: "bg-menta",
    principal: { clave: "contactosReparacion", etiqueta: "reparaciones iniciadas" },
    otras: [{ clave: "oficiosActivos", etiqueta: "oficios con perfil activo" }],
    comoSeMide: "Cada vez que alguien pulsa WhatsApp o Llamar en un taller.",
  },
  {
    numero: "02",
    nombre: "Donar",
    icono: HandHeart,
    a: "/donar",
    tono: "bg-tinta text-fondo",
    claro: true,
    principal: { clave: "kgTextilRecuperados", etiqueta: "de textil recuperado", sufijo: " kg" },
    otras: [
      { clave: "prendasDonadas", etiqueta: "prendas recibidas por fundaciones" },
      { clave: "donacionesPendientes", etiqueta: "donaciones en camino" },
      { clave: "puntosDonacion", etiqueta: "puntos de donación" },
    ],
    comoSeMide: "Solo donaciones que la fundación confirmó; kilos estimados con el peso promedio de cada prenda.",
  },
  {
    numero: "03",
    nombre: "Mercado",
    icono: Store,
    a: "/mercado",
    tono: "bg-kraft-clara",
    principal: { clave: "prendasRecirculadas", etiqueta: "prendas cambiaron de dueño" },
    otras: [{ clave: "publicacionesActivas", etiqueta: "prendas buscando nueva dueña o dueño" }],
    comoSeMide: "Publicaciones que la persona vendedora marcó como vendidas.",
  },
];

export function ImpactoPorCamino() {
  const [impacto, setImpacto] = useState<Impacto | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api
      .impacto()
      .then(setImpacto)
      .catch(() => setError(true));
  }, []);

  if (error) return <p className="mt-8 text-tinta-suave">Las cifras no están disponibles en este momento.</p>;

  const valor = (clave: keyof Impacto) => (impacto ? formato.format(impacto[clave]) : "—");

  return (
    <div className="mt-10 grid gap-3 lg:grid-cols-3">
      {CAMINOS.map(({ numero, nombre, icono: Icono, a, tono, claro, principal, otras, comoSeMide }) => (
        <section key={nombre} aria-labelledby={`impacto-${nombre}`} className={cn("bento flex flex-col gap-6", tono)}>
          <div className="flex items-start justify-between gap-3">
            <p id={`impacto-${nombre}`} className={cn("etiqueta", claro ? "text-lima" : "text-hoja-oscura")}>
              {numero} · {nombre}
            </p>
            <Icono className={cn("size-7", claro ? "text-lima" : "text-hoja-oscura")} aria-hidden="true" />
          </div>
          <p>
            {/* Altura fija mientras carga, para que el diseño no salte. */}
            <span className="block h-16 font-display text-6xl font-bold tracking-tight tabular-nums">
              {valor(principal.clave)}
              {impacto && principal.sufijo}
            </span>
            <span className="mt-1 block text-lg font-bold">{principal.etiqueta}</span>
          </p>
          <dl className={cn("grid gap-2 border-t pt-4", claro ? "border-fondo/20" : "border-tinta/10")}>
            {otras.map(({ clave, etiqueta }) => (
              <div key={clave} className="flex items-baseline justify-between gap-3">
                <dt className={claro ? "text-fondo/85" : "text-tinta-800"}>{etiqueta}</dt>
                <dd className="font-display text-2xl font-bold tabular-nums">{valor(clave)}</dd>
              </div>
            ))}
          </dl>
          <p className={cn("mt-auto text-sm", claro ? "text-fondo/75" : "text-tinta-suave")}>
            <strong>Cómo se mide:</strong> {comoSeMide}
          </p>
          <Link
            to={a}
            className={cn(
              "boton self-start",
              claro ? "bg-lima text-tinta hover:bg-lima/85" : "bg-superficie hover:bg-fondo",
            )}
          >
            Ir a {nombre} <ArrowUpRight className="size-5" aria-hidden="true" />
          </Link>
        </section>
      ))}
    </div>
  );
}
