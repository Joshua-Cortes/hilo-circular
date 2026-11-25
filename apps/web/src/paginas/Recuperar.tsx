import { ArrowLeft, KeyRound, MailCheck } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { EncabezadoPagina } from "../componentes/EncabezadoPagina";
import { api } from "../lib/api";

export function Recuperar() {
  const [params, setParams] = useSearchParams();
  const token = params.get("token") ?? "";
  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);
  const [completado, setCompletado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      if (token) {
        await api.restablecerClave(token, clave);
        setCompletado(true);
        setParams({}, { replace: true });
      } else {
        const respuesta = await api.solicitarRecuperacion(email);
        setResetUrl(respuesta.resetUrl ?? null);
        setEnviado(true);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-10 md:px-6 md:py-14">
      <EncabezadoPagina
        etiqueta="Acceso a tu cuenta"
        titulo={
          completado ? (
            <>
              Contraseña <em className="acento">actualizada</em>
            </>
          ) : token ? (
            <>
              Elige una clave <em className="acento">nueva</em>
            </>
          ) : (
            <>
              Recupera tu <em className="acento">cuenta</em>
            </>
          )
        }
      >
        {completado
          ? "Ya puedes ingresar con tu nueva contraseña."
          : token
            ? "Crea una contraseña nueva de al menos 8 caracteres. El enlace funciona una sola vez y vence en 30 minutos."
            : "Escribe el correo de tu cuenta y te enviaremos un enlace para crear otra contraseña."}
      </EncabezadoPagina>

      <div className="bento mt-8 bg-superficie">
        {completado ? (
          <Link to="/ingresar" className="boton-primario">
            <KeyRound className="size-5" aria-hidden="true" /> Ir a ingresar
          </Link>
        ) : enviado ? (
          <div role="status" className="grid gap-4">
            <p className="flex items-center gap-2 text-lg font-bold text-hoja-oscura">
              <MailCheck className="size-6" aria-hidden="true" /> Si existe una cuenta con ese correo, enviaremos un
              enlace.
            </p>
            <p className="text-tinta-suave">
              Revisa también la carpeta de correo no deseado. El enlace vence en 30 minutos.
            </p>
            {resetUrl && (
              <p className="rounded-2xl bg-menta p-4 text-sm">
                Enlace de prueba local:{" "}
                <a className="font-bold underline" href={resetUrl}>
                  {resetUrl}
                </a>
              </p>
            )}
            <button type="button" className="boton-secundario w-fit" onClick={() => setEnviado(false)}>
              Probar con otro correo
            </button>
          </div>
        ) : (
          <form onSubmit={enviar} className="grid gap-5">
            {token ? (
              <div>
                <label htmlFor="clave-nueva" className="font-bold">
                  Nueva contraseña
                </label>
                <input
                  id="clave-nueva"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  value={clave}
                  onChange={(e) => setClave(e.target.value)}
                  className="campo mt-2"
                />
                <p className="mt-1.5 text-sm text-tinta-suave">Usa al menos 8 caracteres.</p>
              </div>
            ) : (
              <div>
                <label htmlFor="correo-recuperacion" className="font-bold">
                  Correo de tu cuenta
                </label>
                <input
                  id="correo-recuperacion"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="campo mt-2"
                />
              </div>
            )}
            {error && (
              <p role="alert" className="rounded-2xl bg-alerta-clara p-4 font-bold">
                {error}
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              <button type="submit" disabled={enviando} className="boton-primario">
                <KeyRound className="size-5" aria-hidden="true" />
                {enviando ? "Un momento…" : token ? "Guardar contraseña nueva" : "Enviar enlace"}
              </button>
              <Link to="/ingresar" className="boton-secundario">
                <ArrowLeft className="size-5" aria-hidden="true" /> Volver a ingresar
              </Link>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
