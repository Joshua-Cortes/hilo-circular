import { Camera, Gift, ImagePlus, X } from "lucide-react";
import { type ChangeEvent, type FormEvent, useState } from "react";
import { useNavigate } from "react-router";
import { EncabezadoPagina } from "../componentes/EncabezadoPagina";
import { FotoPrenda } from "../componentes/FotoPrenda";
import { api, ErrorApi } from "../lib/api";
import { formatearPrecioVenta, useCatalogo } from "../lib/catalogo";
import { cn } from "../lib/cn";
import { prepararFoto } from "../lib/fotos";

const MAX_FOTOS = 4;
type Foto = { mime: string; datos: string; vistaPrevia: string };

function ErrorCampo({ mensaje }: { mensaje?: string }) {
  if (!mensaje) return null;
  return <p className="mt-1.5 text-sm font-bold text-alerta">{mensaje}</p>;
}

export function Publicar() {
  const { catalogo, etiquetas } = useCatalogo();
  const navegar = useNavigate();

  const [titulo, setTitulo] = useState("");
  const [prenda, setPrenda] = useState("");
  const [talla, setTalla] = useState("");
  const [condicion, setCondicion] = useState("buen_estado");
  const [regalo, setRegalo] = useState(false);
  const [precio, setPrecio] = useState("");
  const [comuna, setComuna] = useState("La Serena");
  const [descripcion, setDescripcion] = useState("");
  const [conWhatsapp, setConWhatsapp] = useState(false);
  const [whatsapp, setWhatsapp] = useState("");
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [procesandoFotos, setProcesandoFotos] = useState(false);

  const [enviando, setEnviando] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  const precioNumero = regalo ? 0 : Number(precio.replace(/\D/g, "")) || 0;

  async function agregarFotos(e: ChangeEvent<HTMLInputElement>) {
    const archivos = [...(e.target.files ?? [])].slice(0, MAX_FOTOS - fotos.length);
    e.target.value = "";
    if (archivos.length === 0) return;
    setProcesandoFotos(true);
    try {
      const nuevas = await Promise.all(archivos.map((a) => prepararFoto(a)));
      setFotos((prev) => [...prev, ...nuevas].slice(0, MAX_FOTOS));
    } catch (err) {
      setErrores((prev) => ({ ...prev, fotos: (err as Error).message }));
    } finally {
      setProcesandoFotos(false);
    }
  }

  function validarLocal() {
    const nuevos: Record<string, string> = {};
    if (titulo.trim().length < 4) nuevos.titulo = "Ponle un título de al menos 4 letras";
    if (!prenda) nuevos.prenda = "Elige el tipo de prenda";
    if (!talla.trim()) nuevos.talla = "Indica la talla";
    if (!regalo && precioNumero <= 0) nuevos.precio = "Escribe un precio o marca que la regalas";
    if (conWhatsapp && whatsapp.replace(/\D/g, "").length < 8) nuevos.whatsapp = "Escribe tu celular, ej: 9 1234 5678";
    return nuevos;
  }

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setErrorGeneral(null);
    const locales = validarLocal();
    setErrores(locales);
    if (Object.keys(locales).length > 0) {
      document.getElementById(`campo-${Object.keys(locales)[0]}`)?.focus();
      return;
    }
    setEnviando(true);
    try {
      const creada = await api.publicar({
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        prenda,
        talla: talla.trim(),
        condicion,
        precio: precioNumero,
        comuna,
        whatsapp: conWhatsapp ? whatsapp : null,
        fotos: fotos.map(({ mime, datos }) => ({ mime, datos })),
      });
      navegar(`/mercado/${creada.id}`);
    } catch (err) {
      if (err instanceof ErrorApi && err.detalles.length > 0) {
        setErrores(Object.fromEntries(err.detalles.map((d) => [d.campo.split(".")[0], d.mensaje])));
      }
      setErrorGeneral((err as Error).message);
      setEnviando(false);
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14" aria-labelledby="titulo-publicar">
      <EncabezadoPagina
        id="titulo-publicar"
        etiqueta="03 · Mercado"
        titulo={
          <>
            Dale una <em className="acento">segunda vuelta</em>
          </>
        }
      >
        Publicar es gratis. Quien se interese te escribirá por el chat y, si quieres, por WhatsApp.
      </EncabezadoPagina>

      <form onSubmit={enviar} noValidate className="mt-10 grid items-start gap-3 lg:grid-cols-[1fr_22rem]">
        <div className="grid gap-3">
          {/* Fotos */}
          <fieldset className="bento bg-superficie">
            <legend className="sr-only">Fotos</legend>
            <h2 className="text-2xl">Fotos</h2>
            <p className="mt-1 text-tinta-suave">
              Hasta {MAX_FOTOS}. Con luz natural y la prenda estirada se venden más rápido.
            </p>
            <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {fotos.map((foto, i) => (
                <li key={foto.vistaPrevia.slice(-40)} className="relative aspect-square overflow-hidden rounded-2xl">
                  <img src={foto.vistaPrevia} alt={`Foto ${i + 1}`} className="size-full object-cover" />
                  {i === 0 && (
                    <span className="absolute bottom-2 left-2 rounded-full bg-tinta px-2.5 py-0.5 text-xs font-bold text-lima">
                      Portada
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setFotos((prev) => prev.filter((_, j) => j !== i))}
                    aria-label={`Quitar foto ${i + 1}`}
                    className="absolute top-2 right-2 flex size-9 cursor-pointer items-center justify-center rounded-full bg-superficie/95 hover:bg-alerta-clara"
                  >
                    <X className="size-5" aria-hidden="true" />
                  </button>
                </li>
              ))}
              {fotos.length < MAX_FOTOS && (
                <li>
                  <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-borde-fuerte bg-fondo p-3 text-center font-bold transition-colors hover:border-hoja hover:bg-menta-clara focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-hoja">
                    {procesandoFotos ? (
                      <span>Preparando…</span>
                    ) : (
                      <>
                        {fotos.length === 0 ? (
                          <Camera className="size-8 text-hoja-oscura" aria-hidden="true" />
                        ) : (
                          <ImagePlus className="size-8 text-hoja-oscura" aria-hidden="true" />
                        )}
                        <span className="text-sm">{fotos.length === 0 ? "Agregar fotos" : "Agregar otra"}</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={agregarFotos}
                      disabled={procesandoFotos}
                      className="sr-only"
                    />
                  </label>
                </li>
              )}
            </ul>
            <ErrorCampo mensaje={errores.fotos} />
          </fieldset>

          {/* Datos */}
          <fieldset className="bento grid gap-5 bg-superficie">
            <legend className="sr-only">Datos de la prenda</legend>
            <h2 className="text-2xl">La prenda</h2>
            <div>
              <label htmlFor="campo-titulo" className="font-bold">
                Título
              </label>
              <input
                id="campo-titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                maxLength={80}
                placeholder="Ej: Parka acolchada azul marino"
                aria-invalid={Boolean(errores.titulo)}
                className="campo mt-2"
              />
              <ErrorCampo mensaje={errores.titulo} />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="campo-prenda" className="font-bold">
                  Tipo de prenda
                </label>
                <select
                  id="campo-prenda"
                  value={prenda}
                  onChange={(e) => setPrenda(e.target.value)}
                  aria-invalid={Boolean(errores.prenda)}
                  className="campo mt-2 cursor-pointer"
                >
                  <option value="">Elige una opción</option>
                  {catalogo?.prendas.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.etiqueta}
                    </option>
                  ))}
                </select>
                <ErrorCampo mensaje={errores.prenda} />
              </div>
              <div>
                <label htmlFor="campo-talla" className="font-bold">
                  Talla
                </label>
                <input
                  id="campo-talla"
                  value={talla}
                  onChange={(e) => setTalla(e.target.value)}
                  maxLength={16}
                  placeholder="M, 38, 10 años…"
                  aria-invalid={Boolean(errores.talla)}
                  className="campo mt-2"
                />
                <ErrorCampo mensaje={errores.talla} />
              </div>
            </div>

            <fieldset>
              <legend className="font-bold">¿En qué estado está?</legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {catalogo?.condiciones.map((c) => (
                  <label
                    key={c.id}
                    className={cn(
                      "flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 font-bold transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-hoja",
                      condicion === c.id ? "border-hoja bg-menta-clara" : "border-borde hover:border-hoja",
                    )}
                  >
                    <input
                      type="radio"
                      name="condicion"
                      value={c.id}
                      checked={condicion === c.id}
                      onChange={() => setCondicion(c.id)}
                      className="size-5 accent-hoja"
                    />
                    {c.etiqueta}
                  </label>
                ))}
              </div>
            </fieldset>

            <div>
              <label htmlFor="campo-descripcion" className="font-bold">
                Descripción <span className="font-normal text-tinta-suave">(opcional)</span>
              </label>
              <textarea
                id="campo-descripcion"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                maxLength={800}
                rows={4}
                placeholder="Cuánto uso tiene, medidas, si tiene algún detalle…"
                className="campo mt-2 py-3"
              />
            </div>
          </fieldset>

          {/* Precio y contacto */}
          <fieldset className="bento grid gap-5 bg-superficie">
            <legend className="sr-only">Precio y contacto</legend>
            <h2 className="text-2xl">Precio y contacto</h2>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
              <div>
                <label htmlFor="campo-precio" className="font-bold">
                  Precio en pesos
                </label>
                <div className="relative mt-2">
                  <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 font-bold text-tinta-suave">
                    $
                  </span>
                  <input
                    id="campo-precio"
                    inputMode="numeric"
                    value={regalo ? "" : precio}
                    onChange={(e) => setPrecio(e.target.value.replace(/\D/g, "").slice(0, 7))}
                    disabled={regalo}
                    placeholder={regalo ? "Se regala" : "10000"}
                    aria-invalid={Boolean(errores.precio)}
                    className="campo pl-9 disabled:bg-fondo"
                  />
                </div>
              </div>
              <label
                className={cn(
                  "flex min-h-12 cursor-pointer items-center gap-2 rounded-full border-2 px-4 font-bold transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-hoja",
                  regalo ? "border-hoja bg-lima" : "border-borde hover:border-hoja",
                )}
              >
                <input
                  type="checkbox"
                  checked={regalo}
                  onChange={(e) => setRegalo(e.target.checked)}
                  className="sr-only"
                />
                <Gift className="size-5" aria-hidden="true" /> La regalo
              </label>
            </div>
            <ErrorCampo mensaje={errores.precio} />

            <div>
              <label htmlFor="campo-comuna" className="font-bold">
                Comuna
              </label>
              <select
                id="campo-comuna"
                value={comuna}
                onChange={(e) => setComuna(e.target.value)}
                className="campo mt-2 cursor-pointer sm:max-w-xs"
              >
                {(catalogo?.comunas ?? ["La Serena", "Coquimbo"]).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-2xl bg-fondo p-4">
              <label className="flex cursor-pointer items-start gap-3 font-bold">
                <input
                  type="checkbox"
                  checked={conWhatsapp}
                  onChange={(e) => setConWhatsapp(e.target.checked)}
                  className="mt-1 size-5 accent-hoja"
                />
                <span>
                  También quiero que me escriban por WhatsApp
                  <span className="block text-sm font-normal text-tinta-suave">
                    Si no lo marcas, solo te contactan por el chat de Hilo Circular y tu número queda privado.
                  </span>
                </span>
              </label>
              {conWhatsapp && (
                <div className="mt-3">
                  <label htmlFor="campo-whatsapp" className="sr-only">
                    Tu celular
                  </label>
                  <input
                    id="campo-whatsapp"
                    type="tel"
                    inputMode="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="+56 9 1234 5678"
                    aria-invalid={Boolean(errores.whatsapp)}
                    className="campo sm:max-w-xs"
                  />
                  <ErrorCampo mensaje={errores.whatsapp} />
                </div>
              )}
            </div>
          </fieldset>
        </div>

        {/* Vista previa */}
        <aside className="grid gap-3 lg:sticky lg:top-24" aria-label="Vista previa">
          <div className="overflow-hidden rounded-tarjeta bg-superficie">
            <p className="etiqueta px-5 pt-4 text-tinta-suave">Así se verá</p>
            <div className="mt-3 aspect-[4/3] overflow-hidden">
              <FotoPrenda foto={fotos[0]?.vistaPrevia ?? null} prenda={prenda} titulo={titulo || "Tu prenda"} />
            </div>
            <div className="p-5">
              <p className={cn("font-display text-3xl font-bold", regalo && "text-hoja-oscura")}>
                {regalo || precioNumero > 0 ? formatearPrecioVenta(precioNumero) : "$ —"}
              </p>
              <p className="mt-1 font-bold">{titulo || "Título de tu prenda"}</p>
              <p className="mt-1 text-sm text-tinta-suave">
                {[talla && `Talla ${talla}`, etiquetas.condicion.get(condicion), comuna].filter(Boolean).join(" · ")}
              </p>
            </div>
          </div>
          {errorGeneral && (
            <p role="alert" className="rounded-2xl bg-alerta-clara p-4 font-bold">
              {errorGeneral}
            </p>
          )}
          <button type="submit" disabled={enviando || procesandoFotos} className="boton-primario min-h-14 text-lg">
            {enviando ? "Publicando…" : "Publicar prenda"}
          </button>
        </aside>
      </form>
    </section>
  );
}
