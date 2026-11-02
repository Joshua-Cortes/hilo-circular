import { HandHeart, MapPin, Scissors } from "lucide-react";
import { Asistente } from "../componentes/Asistente";
import { CifrasImpacto } from "../componentes/CifrasImpacto";

const CAMINOS = [
  {
    icono: Scissors,
    titulo: "Reparar",
    texto:
      "Costureras, zapateros y tejedoras de tu barrio, ordenados por cercanía. Los contactas directo por WhatsApp.",
  },
  {
    icono: HandHeart,
    titulo: "Donar",
    texto: "Fundaciones que reciben ropa hoy, con su horario y lo que más necesitan esta semana.",
  },
  {
    icono: MapPin,
    titulo: "Conectar",
    texto: "Los oficios de La Serena y Coquimbo ganan visibilidad sin pagar comisiones ni aprender apps nuevas.",
  },
];

export function Inicio() {
  return (
    <>
      <section className="mx-auto grid max-w-6xl gap-10 px-5 pt-12 pb-16 md:pt-20 lg:grid-cols-[1.05fr_1fr] lg:items-start">
        <div className="lg:sticky lg:top-28">
          <p className="font-bold tracking-widest text-terracota-tinta uppercase">La Serena · Coquimbo</p>
          <h1 className="mt-4 text-5xl leading-[1.02] font-semibold md:text-6xl">
            Esa prenda <em className="font-normal text-salvia italic">todavía</em> tiene vida.
          </h1>
          <div className="puntada mt-7 w-32 text-terracota" aria-hidden="true" />
          <p className="mt-7 max-w-xl text-xl text-tinta-suave">
            Solo en 2021 llegaron a Chile cerca de 156 mil toneladas de ropa usada y gran parte terminó en el desierto
            de Atacama. Antes de botar la tuya, te ayudamos a repararla, donarla a quien la necesita o reciclarla.
          </p>
          <p className="mt-3 text-sm text-tinta-suave">Fuente: estimación preliminar de CEPAL para 2021.</p>
        </div>
        <Asistente />
      </section>

      <section aria-labelledby="titulo-caminos" className="border-y border-borde bg-papel">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 id="titulo-caminos" className="max-w-2xl text-4xl font-semibold">
            Tres caminos antes del basurero
          </h2>
          <ul className="mt-10 grid gap-8 md:grid-cols-3">
            {CAMINOS.map(({ icono: Icono, titulo, texto }) => (
              <li key={titulo} className="border-t-2 border-dashed border-borde-fuerte pt-6">
                <Icono className="size-8 text-terracota" aria-hidden="true" />
                <h3 className="mt-4 text-2xl font-semibold">{titulo}</h3>
                <p className="mt-2 text-tinta-suave">{texto}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="titulo-impacto" className="mx-auto max-w-6xl px-5 pt-16">
        <h2 id="titulo-impacto" className="text-4xl font-semibold">
          Lo que llevamos juntos
        </h2>
        <p className="mt-2 text-tinta-suave">
          Cifras en vivo desde la plataforma. Los kilos solo cuentan donaciones que la fundación confirmó.
        </p>
        <CifrasImpacto />
      </section>
    </>
  );
}
