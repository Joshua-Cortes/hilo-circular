import {
  HandHeart,
  HeartHandshake,
  LogOut,
  Menu,
  MessageCircle,
  Plus,
  Settings,
  Store,
  User,
  Wrench,
  X,
} from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router";
import { cn } from "../lib/cn";
import { useSesion } from "../lib/sesion";

const ENLACES = [
  { a: "/reparar", texto: "Reparar" },
  { a: "/donar", texto: "Donar" },
  { a: "/mercado", texto: "Mercado" },
  { a: "/impacto", texto: "Impacto" },
  { a: "/delivery", texto: "Delivery" },
];

export function Logo({ claro = false }: { claro?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5 rounded-full" aria-label="Hilo Circular, ir al inicio">
      <svg viewBox="0 0 40 40" className="size-10 shrink-0" aria-hidden="true">
        <circle cx="20" cy="20" r="20" className={claro ? "fill-fondo/10" : "fill-menta"} />
        {/* Un hilo que da la vuelta: la puntada es el motivo de la marca. */}
        <circle
          cx="20"
          cy="20"
          r="11"
          fill="none"
          className={claro ? "stroke-lima" : "stroke-hoja"}
          strokeWidth="3"
          strokeDasharray="5 3.4"
          strokeLinecap="round"
          transform="rotate(-62 20 20)"
        />
        <path
          d="M26.5 8.5l3.5 1-1 3.5"
          fill="none"
          className={claro ? "stroke-lima" : "stroke-hoja"}
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="20" cy="20" r="3" className={claro ? "fill-lima" : "fill-tinta"} />
      </svg>
      <span className={cn("font-display text-xl font-bold tracking-tight", claro && "text-fondo")}>
        hilo<span className={claro ? "text-lima" : "text-hoja"}>circular</span>
      </span>
    </Link>
  );
}

function MenuCuenta() {
  const { usuario, cerrar } = useSesion();
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    const alClic = (e: MouseEvent) => {
      if (!caja.current?.contains(e.target as Node)) setAbierto(false);
    };
    const alTecla = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(false);
    document.addEventListener("mousedown", alClic);
    document.addEventListener("keydown", alTecla);
    return () => {
      document.removeEventListener("mousedown", alClic);
      document.removeEventListener("keydown", alTecla);
    };
  }, [abierto]);

  if (!usuario) return null;
  const opcion = "flex min-h-12 items-center gap-3 rounded-2xl px-4 font-bold hover:bg-menta-clara";

  return (
    <div className="relative" ref={caja}>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        aria-haspopup="menu"
        className="flex size-12 cursor-pointer items-center justify-center rounded-full bg-tinta font-display text-lg font-bold text-lima transition-transform hover:scale-105"
      >
        <span className="sr-only">Mi cuenta: </span>
        {usuario.nombre.trim().charAt(0).toUpperCase()}
      </button>
      {abierto && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-64 rounded-3xl border border-borde bg-superficie p-2 shadow-[0_18px_40px_-18px_rgb(18_48_42/0.35)]"
        >
          <p className="px-4 pt-2 pb-3 text-sm text-tinta-suave">
            Hola, <strong className="text-tinta">{usuario.nombre}</strong>
          </p>
          <Link role="menuitem" to="/mercado/mias" className={opcion} onClick={() => setAbierto(false)}>
            <Store className="size-5 text-hoja-oscura" aria-hidden="true" /> Mis publicaciones
          </Link>
          {(usuario.rol === "persona" || usuario.rol === "oficio") && (
            <Link role="menuitem" to="/mis-donaciones" className={opcion} onClick={() => setAbierto(false)}>
              <HandHeart className="size-5 text-hoja-oscura" aria-hidden="true" /> Mis donaciones
            </Link>
          )}
          {usuario.rol === "oficio" && (
            <Link role="menuitem" to="/mi-taller" className={opcion} onClick={() => setAbierto(false)}>
              <Wrench className="size-5 text-hoja-oscura" aria-hidden="true" /> Mi taller
            </Link>
          )}
          {usuario.rol === "fundacion" && (
            <Link role="menuitem" to="/mi-fundacion" className={opcion} onClick={() => setAbierto(false)}>
              <HeartHandshake className="size-5 text-hoja-oscura" aria-hidden="true" />
              Mi fundación
            </Link>
          )}
          <Link role="menuitem" to="/ajustes" className={opcion} onClick={() => setAbierto(false)}>
            <Settings className="size-5 text-hoja-oscura" aria-hidden="true" /> Ajustes
          </Link>
          <button
            role="menuitem"
            type="button"
            className={cn(opcion, "w-full cursor-pointer")}
            onClick={() => {
              setAbierto(false);
              cerrar();
            }}
          >
            <LogOut className="size-5 text-hoja-oscura" aria-hidden="true" /> Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}

function BotonMensajes() {
  const { usuario, noLeidos } = useSesion();
  if (!usuario) return null;
  return (
    <Link
      to="/mensajes"
      className="relative flex size-12 items-center justify-center rounded-full bg-superficie text-tinta transition-colors hover:bg-menta-clara"
    >
      <MessageCircle className="size-5" aria-hidden="true" />
      <span className="sr-only">Mensajes{noLeidos > 0 ? `, ${noLeidos} sin leer` : ""}</span>
      {noLeidos > 0 && (
        <span
          aria-hidden="true"
          className="absolute -top-0.5 -right-0.5 flex min-w-6 items-center justify-center rounded-full bg-hoja px-1.5 text-xs leading-6 font-bold text-white ring-2 ring-fondo"
        >
          {noLeidos > 9 ? "9+" : noLeidos}
        </span>
      )}
    </Link>
  );
}

function Encabezado() {
  const { usuario } = useSesion();
  const [abierto, setAbierto] = useState(false);
  const { pathname } = useLocation();

  // Al navegar se cierra el menú del celular.
  // biome-ignore lint/correctness/useExhaustiveDependencies: debe correr justamente cuando cambia la ruta
  useEffect(() => setAbierto(false), [pathname]);

  const claseEnlace = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex min-h-12 items-center rounded-full px-4 font-bold transition-colors duration-200",
      isActive ? "bg-tinta text-fondo" : "text-tinta hover:bg-menta-clara",
    );

  return (
    <header className="sticky top-0 z-[1100] bg-fondo/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <Logo />

        <nav aria-label="Principal" className="hidden lg:block">
          <ul className="flex gap-1 rounded-full bg-superficie p-1.5 shadow-[0_1px_0_rgb(18_48_42/0.06)]">
            {ENLACES.map((enlace) => (
              <li key={enlace.a}>
                <NavLink to={enlace.a} className={claseEnlace}>
                  {enlace.texto}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <Link to="/mercado/publicar" className="boton-primario hidden px-5 sm:inline-flex">
            <Plus className="size-5" aria-hidden="true" />
            Publicar prenda
          </Link>
          <BotonMensajes />
          {usuario ? (
            <MenuCuenta />
          ) : (
            <Link to="/ingresar" className="boton-claro hidden px-5 sm:inline-flex">
              <User className="size-5" aria-hidden="true" />
              Ingresar
            </Link>
          )}
          <button
            type="button"
            className="flex size-12 cursor-pointer items-center justify-center rounded-full bg-superficie lg:hidden"
            aria-expanded={abierto}
            aria-controls="menu-movil"
            onClick={() => setAbierto((v) => !v)}
          >
            {abierto ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
            <span className="sr-only">Menú</span>
          </button>
        </div>
      </div>

      {abierto && (
        <nav id="menu-movil" aria-label="Principal" className="px-4 pb-4 lg:hidden">
          <ul className="grid gap-1 rounded-3xl bg-superficie p-2">
            {ENLACES.map((enlace) => (
              <li key={enlace.a}>
                <NavLink to={enlace.a} className={claseEnlace}>
                  {enlace.texto}
                </NavLink>
              </li>
            ))}
            <li className="mt-1 grid gap-2 border-t border-borde pt-3 sm:hidden">
              <Link to="/mercado/publicar" className="boton-primario">
                <Plus className="size-5" aria-hidden="true" /> Publicar prenda
              </Link>
              {!usuario && (
                <Link to="/ingresar" className="boton-secundario">
                  Ingresar
                </Link>
              )}
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}

function PiePagina() {
  return (
    <footer className="mx-auto mt-24 w-full max-w-7xl px-4 pb-6 md:px-6">
      <div className="grid gap-10 rounded-tarjeta bg-tinta p-8 text-fondo md:grid-cols-[1.4fr_1fr_1fr] md:p-12">
        <div>
          <Logo claro />
          <p className="mt-6 max-w-sm font-display text-2xl leading-tight font-semibold">
            Cada prenda reparada, donada o revendida es una prenda menos en el desierto.
          </p>
          <div className="puntada mt-6 w-24 text-lima" aria-hidden="true" />
        </div>
        <nav aria-label="Secundaria">
          <p className="etiqueta text-lima">La plataforma</p>
          <ul className="mt-4 grid gap-2">
            {[
              ...ENLACES,
              { a: "/mercado/publicar", texto: "Publicar una prenda" },
              { a: "/mi-taller", texto: "Soy oficio" },
            ].map((enlace) => (
              <li key={enlace.a}>
                <Link to={enlace.a} className="text-fondo/85 underline-offset-4 hover:text-fondo hover:underline">
                  {enlace.texto}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="text-fondo/85">
          <p className="etiqueta text-lima">Proyecto universitario</p>
          <p className="mt-4">Informática y Sociedad · Universidad de La Serena · 2026</p>
          <p className="mt-2">Bastian Pizarro · Joshua Cortés · Hector Marin</p>
          <p className="mt-4 text-sm text-fondo/70">
            Piloto en La Serena y Coquimbo. Los datos de oficios, puntos y prendas son de demostración.
          </p>
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
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[1200] focus:rounded-full focus:bg-tinta focus:px-5 focus:py-3 focus:text-fondo"
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
