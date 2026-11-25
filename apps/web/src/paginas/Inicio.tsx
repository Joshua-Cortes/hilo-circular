import { ArrowRight, ArrowUpRight, Bike, HandHeart, MapPin, Plus, Recycle, Scissors, Store } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Asistente } from "../componentes/Asistente";
import { CifrasImpacto } from "../componentes/CifrasImpacto";
import { FotoPrenda } from "../componentes/FotoPrenda";
import { api, type Impacto, type Publicacion } from "../lib/api";
import { formatearPrecioVenta } from "../lib/catalogo";

/** Flecha circular de las tarjetas bento: indica que toda la tarjeta es un enlace. */
function Flecha({ claro = false }: { claro?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`flex size-12 shrink-0 items-center justify-center rounded-full transition-transform duration-300 group-hover:rotate-45 ${
        claro ? "bg-lima text-tinta" : "bg-tinta text-lima"
      }`}
    >
      <ArrowUpRight className="size-6" />
    </span>
  );
}

/** Anillo de puntada que se dibuja alrededor de un dato, como en un parche cosido. */
function Anillo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`size-6 ${className}`} aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="3.5 2.6" />
    </svg>
  );
}

export function Inicio() {
  const [impacto, setImpacto] = useState<Impacto | null>(null);
  const [prendas, setPrendas] = useState<Publicacion[]>([]);

  useEffect(() => {
    api
      .impacto()
      .then(setImpacto)
      .catch(() => {});
    api
      .mercado()
      .then((lista) => setPrendas(lista.slice(0, 4)))
      .catch(() => {});
  }, []);

  return (
    <>
      <section className="mx-auto max-w-7xl px-4 pt-10 pb-12 text-center md:px-6 md:pt-16">
        <p className="inline-flex items-center gap-2 rounded-full bg-superficie px-4 py-2 text-sm font-bold text-hoja-oscura">
          <MapPin className="size-4" aria-hidden="true" /> Piloto en La Serena y Coquimbo
        </p>
        <h1 className="mx-auto mt-6 max-w-4xl text-5xl md:text-7xl">
          Tu ropa merece <em className="acento">otra vuelta</em>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-xl text-tinta-suave md:text-2xl">
          Repárala con un oficio de tu barrio, dónala a quien la necesita, véndela o coordina su entrega local.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a href="#caminos" className="boton-primario">
            Elegir un camino <ArrowRight className="size-5" aria-hidden="true" />
          </a>
          <a href="#asistente" className="boton-claro">
            No sé qué hacer con mi prenda
          </a>
        </div>
      </section>

      <section id="caminos" aria-label="Los tres caminos" className="mx-auto max-w-7xl scroll-mt-24 px-4 md:px-6">
        <div className="grid auto-rows-[minmax(14rem,auto)] grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          {/* 1 · Reparar */}
          <Link to="/reparar" className="group bento-enlace flex flex-col justify-between bg-menta md:col-span-2">
            <div className="flex items-start justify-between gap-4">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-superficie text-hoja-oscura">
                <Scissors className="size-7" aria-hidden="true" />
              </span>
              <Flecha />
            </div>
            <div className="mt-6">
              <p className="etiqueta text-hoja-oscura">01 · Reparar</p>
              <h2 className="mt-3 text-4xl md:text-5xl">
                Arréglala <em className="acento">cerca</em>
              </h2>
              <p className="mt-4 max-w-sm text-lg text-tinta-800">
                Costureras, zapateros y tejedoras de tu barrio. Les escribes directo por WhatsApp, sin comisiones.
              </p>
              <ul className="mt-6 flex flex-wrap gap-2 text-sm font-bold">
                {["Bastas", "Cierres", "Suelas", "Zurcidos"].map((arreglo) => (
                  <li key={arreglo} className="rounded-full bg-superficie/70 px-3 py-1.5">
                    {arreglo}
                  </li>
                ))}
              </ul>
            </div>
          </Link>

          {/* Dato del problema */}
          <div className="bento flex flex-col justify-between bg-superficie">
            <p className="flex items-center gap-2 font-display text-5xl font-bold tracking-tight">
              <Anillo className="text-hoja" /> 156 mil t
            </p>
            <p className="mt-6 font-bold text-tinta-800">
              de ropa usada llegaron a Chile en 2021.{" "}
              <span className="font-normal text-tinta-suave">Estimación preliminar de CEPAL.</span>
            </p>
          </div>

          <div className="bento relative flex flex-col justify-between overflow-hidden bg-tinta text-fondo">
            <img
              src="/img/desierto-atacama.jpg"
              alt="Montañas de ropa desechada en el desierto de Atacama"
              className="absolute inset-0 size-full object-cover opacity-55"
            />
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-tinta via-tinta/75 to-tinta/40" />
            <p className="relative z-10 flex items-center gap-2 font-display text-5xl font-bold tracking-tight text-lima">
              <Anillo className="text-lima" /> ~60 %
            </p>
            <p className="relative z-10 mt-6 font-bold text-fondo">
              terminó en vertederos del desierto de Atacama.{" "}
              <span className="font-normal text-fondo/90">Cada prenda que circula aquí es una menos allá.</span>
            </p>
          </div>

          {/* 2 · Donar */}
          <Link
            to="/donar"
            className="group bento-enlace flex flex-col justify-between bg-tinta text-fondo md:col-span-2"
          >
            <div className="flex items-start justify-between gap-4">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-fondo/10 text-lima">
                <HandHeart className="size-7" aria-hidden="true" />
              </span>
              <Flecha claro />
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
              <div>
                <p className="etiqueta text-lima">02 · Donar</p>
                <h2 className="mt-3 text-4xl">
                  Dónala <em className="acento text-lima">bien</em>
                </h2>
                <p className="mt-3 max-w-md text-lg text-fondo/85">
                  Revisa que esté en buen estado y elige en el mapa un punto que la reciba hoy.
                </p>
              </div>
              <p className="rounded-2xl bg-fondo/10 px-5 py-4 text-left">
                <span className="block font-display text-4xl font-bold text-lima tabular-nums">
                  {impacto?.puntosDonacion ?? "—"}
                </span>
                <span className="text-sm font-bold text-fondo/85">puntos de donación</span>
              </p>
            </div>
          </Link>

          {/* 3 · Mercado */}
          <Link
            to="/mercado"
            className="group bento-enlace flex flex-col gap-6 bg-superficie md:col-span-2 lg:row-span-2"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="etiqueta text-hoja-oscura">03 · Mercado</p>
                <h2 className="mt-3 text-4xl">
                  Véndela o <em className="acento">cámbiala de clóset</em>
                </h2>
                <p className="mt-3 max-w-xl text-lg text-tinta-suave">
                  Ropa de segunda mano de gente de la zona. Sin pagos en línea: conversas por el chat o por WhatsApp y
                  se juntan.
                </p>
              </div>
              <Flecha />
            </div>
            <ul className="grid flex-1 grid-cols-2 gap-3" aria-label="Prendas recién publicadas">
              {(prendas.length > 0 ? prendas : [null, null, null, null]).map((prenda, i) => (
                <li key={prenda?.id ?? i} className="overflow-hidden rounded-2xl bg-fondo">
                  <div className="aspect-[4/3] overflow-hidden">
                    {prenda ? (
                      <FotoPrenda foto={prenda.foto} prenda={prenda.prenda} titulo={prenda.titulo} />
                    ) : (
                      <div className="size-full animate-pulse bg-menta-clara" />
                    )}
                  </div>
                  {prenda && (
                    <p className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                      <span className="truncate font-bold">{prenda.titulo}</span>
                      <span className="shrink-0 font-bold text-hoja-oscura">{formatearPrecioVenta(prenda.precio)}</span>
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </Link>

          <Link
            to="/mercado/publicar"
            className="group bento-enlace flex flex-col justify-between bg-lima md:col-span-2"
          >
            <span className="flex size-14 items-center justify-center rounded-2xl bg-tinta text-lima">
              <Plus className="size-7" aria-hidden="true" />
            </span>
            <div className="mt-8">
              <h2 className="text-3xl">¿Ropa que ya no usas?</h2>
              <p className="mt-2 font-bold text-tinta-800">Publícala en dos minutos, con fotos desde el celular.</p>
              <p className="mt-5 inline-flex items-center gap-2 font-bold underline decoration-2 underline-offset-4">
                Publicar prenda <ArrowRight className="size-5" aria-hidden="true" />
              </p>
            </div>
          </Link>

          {/* 05 · Delivery local */}
          <Link
            to="/delivery"
            className="group bento-enlace flex flex-col justify-between gap-6 bg-kraft-clara md:col-span-2 lg:col-span-4 lg:flex-row lg:items-center"
          >
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-superficie text-kraft-tinta">
                <Bike className="size-7" aria-hidden="true" />
              </span>
              <div>
                <p className="etiqueta text-kraft-tinta">05 · Delivery local</p>
                <h2 className="mt-2 text-3xl md:text-4xl">
                  Que llegue a <em className="acento">tu zona</em>
                </h2>
                <p className="mt-2 max-w-2xl text-lg text-tinta-800">
                  Encuentra repartidores por comuna y coordina directamente el traslado de ropa en La Serena y Coquimbo.
                </p>
              </div>
            </div>
            <Flecha />
          </Link>
        </div>
      </section>

      <section
        id="asistente"
        aria-labelledby="titulo-orientacion"
        className="mx-auto mt-3 grid max-w-7xl scroll-mt-24 gap-3 px-4 md:px-6 lg:grid-cols-[1fr_1.3fr]"
      >
        <div className="bento flex flex-col justify-between bg-tinta-800 text-fondo">
          <div>
            <p className="etiqueta text-lima">¿No sabes qué hacer?</p>
            <h2 id="titulo-orientacion" className="mt-3 text-4xl md:text-5xl">
              Te decimos <em className="acento text-lima">qué camino</em> le sirve a tu prenda
            </h2>
            <p className="mt-5 max-w-md text-lg text-fondo/85">
              Dos preguntas y una recomendación. Primero reutilizar, después reparar y solo al final reciclar: así lo
              pide la jerarquía de residuos.
            </p>
          </div>
          <ol className="mt-10 grid gap-2 text-fondo/90">
            {[
              { icono: Store, texto: "En buen estado: dónala o véndela" },
              { icono: Scissors, texto: "Con un daño: un oficio la arregla" },
              { icono: Recycle, texto: "Muy deteriorada: va a reciclaje textil" },
            ].map(({ icono: Icono, texto }) => (
              <li key={texto} className="flex items-center gap-3 rounded-2xl bg-fondo/5 px-4 py-3 font-bold">
                <Icono className="size-5 shrink-0 text-lima" aria-hidden="true" /> {texto}
              </li>
            ))}
          </ol>
        </div>
        <Asistente />
      </section>

      <section aria-labelledby="titulo-impacto" className="mx-auto max-w-7xl px-4 pt-20 md:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="titulo-impacto" className="text-4xl md:text-5xl">
            Lo que llevamos <em className="acento">juntos</em>
          </h2>
          <Link to="/impacto" className="boton-claro">
            Ver impacto <ArrowRight className="size-5" aria-hidden="true" />
          </Link>
        </div>
        <CifrasImpacto />
      </section>
    </>
  );
}
