import { Menu, X } from "lucide-react";
import { type ReactNode, useState } from "react";
import { Link, NavLink } from "react-router";

const ENLACES = [
  { a: "/reparar", texto: "Reparar" },
  { a: "/donar", texto: "Donar" },
  { a: "/impacto", texto: "Impacto" },
];

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5 rounded-md" aria-label="Hilo Circular, ir al inicio">
      <svg viewBox="0 0 32 32" className="size-9" aria-hidden="true">
        <rect width="32" height="32" rx="8" className="fill-bosque" />
        <circle
          cx="16"
          cy="16"
          r="8.5"
          fill="none"
          className="stroke-crema"
          strokeWidth="2.4"
          strokeDasharray="3.2 2.6"
          strokeLinecap="round"
        />
        <circle cx="16" cy="7.5" r="2.4" className="fill-terracota-claro" />
      </svg>
      <span className="font-display text-xl font-semibold tracking-tight">Hilo Circular</span>
    </Link>
  );
}

function Encabezado() {
  const [abierto, setAbierto] = useState(false);

  const claseEnlace = ({ isActive }: { isActive: boolean }) =>
    `flex min-h-12 items-center rounded-full px-4 font-bold transition-colors duration-200 ${
      isActive ? "bg-bosque text-crema" : "hover:bg-salvia-claro"
    }`;

  return (
    <header className="sticky top-0 z-20 border-b border-borde bg-crema/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <Logo />
        <nav aria-label="Principal" className="hidden md:block">
          <ul className="flex gap-1">
            {ENLACES.map((enlace) => (
              <li key={enlace.a}>
                <NavLink to={enlace.a} className={claseEnlace}>
                  {enlace.texto}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <button
          type="button"
          className="boton -mr-3 px-3 md:hidden"
          aria-expanded={abierto}
          aria-controls="menu-movil"
          onClick={() => setAbierto((v) => !v)}
        >
          {abierto ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          <span>Menú</span>
        </button>
      </div>
      {abierto && (
        <nav id="menu-movil" aria-label="Principal" className="border-t border-borde px-5 pb-4 md:hidden">
          <ul className="flex flex-col gap-1 pt-3">
            {ENLACES.map((enlace) => (
              <li key={enlace.a}>
                <NavLink to={enlace.a} className={claseEnlace} onClick={() => setAbierto(false)}>
                  {enlace.texto}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}

function PiePagina() {
  return (
    <footer className="mt-24 bg-bosque text-crema">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 md:grid-cols-[2fr_1fr]">
        <div>
          <p className="font-display text-2xl">"Cada prenda reparada o donada es una prenda menos en el desierto."</p>
          <div className="puntada mt-6 w-24 text-terracota-claro" aria-hidden="true" />
        </div>
        <div className="text-crema/85">
          <p className="font-bold text-crema">Proyecto universitario</p>
          <p>Informática y Sociedad · Universidad de La Serena · 2026</p>
          <p className="mt-2">Bastian Pizarro · Joshua Cortés · Hector Marin</p>
        </div>
      </div>
    </footer>
  );
}

export function Marco({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-bosque focus:px-5 focus:py-3 focus:text-crema"
      >
        Saltar al contenido
      </a>
      <Encabezado />
      <main id="contenido" className="flex-1">
        {children}
      </main>
      <PiePagina />
    </div>
  );
}
