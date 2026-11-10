import { KeyRound, Scissors, User } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router";
import { api, ErrorApi } from "../lib/api";
import { cn } from "../lib/cn";
import { useSesion } from "../lib/sesion";

const DEMO = { email: "demo@hilocircular.cl", clave: "hilo2026" };

/** Solo se aceptan rutas internas para volver: evita redirecciones a otros sitios. */
function destinoSeguro(volver: string | null) {
  return volver?.startsWith("/") && !volver.startsWith("//") ? volver : "/";
}

export function Ingresar() {
  const [params, setParams] = useSearchParams();
  const { usuario, iniciar } = useSesion();
  const navegar = useNavigate();
  const modo = params.get("modo") === "registro" ? "registro" : "ingreso";
  const volver = destinoSeguro(params.get("volver"));

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [rol, setRol] = useState<"persona" | "oficio">("persona");
  const [enviando, setEnviando] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  if (usuario) return <Navigate to={volver} replace />;

  function cambiarModo(nuevo: "ingreso" | "registro") {
    setErrores({});
    setError(null);
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (nuevo === "registro") next.set("modo", "registro");
        else next.delete("modo");
        return next;
      },
      { replace: true },
    );
  }

  async function entrarDemo() {
    setEnviando(true);
    setError(null);
    try {
      iniciar(await api.ingreso(DEMO));
      navegar(volver, { replace: true });
    } catch (err) {
      setError((err as Error).message);
      setEnviando(false);
    }
  }

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErrores({});
    setError(null);
    try {
      const sesion =
        modo === "registro" ? await api.registro({ nombre, email, clave, rol }) : await api.ingreso({ email, clave });
      iniciar(sesion);
      navegar(volver, { replace: true });
    } catch (err) {
      if (err instanceof ErrorApi && err.detalles.length > 0) {
        setErrores(Object.fromEntries(err.detalles.map((d) => [d.campo, d.mensaje])));
      } else {
        setError((err as Error).message);
      }
      setEnviando(false);
    }
  }

  const pestana = (activa: boolean) =>
    cn(
      "min-h-12 flex-1 cursor-pointer rounded-full font-bold transition-colors",
      activa ? "bg-tinta text-lima" : "text-tinta hover:bg-menta-clara",
    );

  return (
    <section className="mx-auto grid max-w-5xl gap-3 px-4 py-10 md:grid-cols-[1fr_1.1fr] md:px-6 md:py-14">
      <div className="bento flex flex-col justify-between bg-menta">
        <div>
          <p className="etiqueta text-hoja-oscura">Tu cuenta</p>
          <h1 className="mt-3 text-4xl md:text-5xl">
            {modo === "registro" ? (
              <>
                Súmate al <em className="acento">círculo</em>
              </>
            ) : (
              <>
                Qué bueno <em className="acento">verte</em>
              </>
            )}
          </h1>
          <p className="mt-4 text-lg text-tinta-800">
            Con una cuenta puedes publicar prendas, conversar con compradores y avisar a las fundaciones que vas a
            donar. Buscar oficios y puntos de donación no la necesita.
          </p>
        </div>
        <div className="mt-8 rounded-3xl bg-superficie p-5">
          <p className="flex items-center gap-2 font-bold">
            <KeyRound className="size-5 text-hoja-oscura" aria-hidden="true" /> ¿Solo quieres probar?
          </p>
          <p className="mt-1 text-sm text-tinta-suave">
            Cuenta demo: <strong className="text-tinta">{DEMO.email}</strong> · clave{" "}
            <strong className="text-tinta">{DEMO.clave}</strong>
          </p>
          <button type="button" disabled={enviando} onClick={entrarDemo} className="boton-secundario mt-3 w-full">
            Entrar con la cuenta demo
          </button>
        </div>
      </div>

      <div className="bento bg-superficie">
        <fieldset className="flex gap-1 rounded-full bg-fondo p-1">
          <legend className="sr-only">Elegir</legend>
          <button
            type="button"
            aria-pressed={modo === "ingreso"}
            onClick={() => cambiarModo("ingreso")}
            className={pestana(modo === "ingreso")}
          >
            Ingresar
          </button>
          <button
            type="button"
            aria-pressed={modo === "registro"}
            onClick={() => cambiarModo("registro")}
            className={pestana(modo === "registro")}
          >
            Crear cuenta
          </button>
        </fieldset>

        <form onSubmit={enviar} className="mt-6 grid gap-5" noValidate>
          {modo === "registro" && (
            <div>
              <label htmlFor="nombre" className="font-bold">
                Tu nombre
              </label>
              <input
                id="nombre"
                autoComplete="given-name"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="campo mt-2"
                aria-invalid={Boolean(errores.nombre)}
              />
              {errores.nombre && <p className="mt-1.5 text-sm font-bold text-alerta">{errores.nombre}</p>}
            </div>
          )}
          <div>
            <label htmlFor="email" className="font-bold">
              Correo
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="campo mt-2"
              aria-invalid={Boolean(errores.email)}
            />
            {errores.email && <p className="mt-1.5 text-sm font-bold text-alerta">{errores.email}</p>}
          </div>
          <div>
            <label htmlFor="clave" className="font-bold">
              Contraseña
            </label>
            <input
              id="clave"
              type="password"
              autoComplete={modo === "registro" ? "new-password" : "current-password"}
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              className="campo mt-2"
              aria-invalid={Boolean(errores.clave)}
              aria-describedby={modo === "registro" ? "ayuda-clave" : undefined}
            />
            {modo === "registro" && (
              <p id="ayuda-clave" className="mt-1.5 text-sm text-tinta-suave">
                Al menos 8 caracteres.
              </p>
            )}
            {errores.clave && <p className="mt-1.5 text-sm font-bold text-alerta">{errores.clave}</p>}
          </div>

          {modo === "registro" && (
            <fieldset>
              <legend className="font-bold">¿Cómo vas a usar Hilo Circular?</legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {(
                  [
                    { id: "persona", icono: User, texto: "Para reparar, donar o comprar y vender ropa" },
                    { id: "oficio", icono: Scissors, texto: "Tengo un oficio de reparación" },
                  ] as const
                ).map(({ id, icono: Icono, texto }) => (
                  <label
                    key={id}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 font-bold transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-hoja",
                      rol === id ? "border-hoja bg-menta-clara" : "border-borde hover:border-hoja",
                    )}
                  >
                    <input
                      type="radio"
                      name="rol"
                      checked={rol === id}
                      onChange={() => setRol(id)}
                      className="sr-only"
                    />
                    <Icono className="mt-0.5 size-5 shrink-0 text-hoja-oscura" aria-hidden="true" />
                    {texto}
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {error && (
            <p role="alert" className="rounded-2xl bg-alerta-clara p-4 font-bold">
              {error}
            </p>
          )}
          <button type="submit" disabled={enviando} className="boton-primario min-h-14 text-lg">
            {enviando ? "Un momento…" : modo === "registro" ? "Crear mi cuenta" : "Ingresar"}
          </button>
        </form>
      </div>
    </section>
  );
}
