/**
 * Reduce una foto del celular (a veces de 4 a 8 MB) a JPEG de 1200 px como máximo antes de subirla.
 * Así cada foto queda bajo ~300 KB y la publicación sube rápido incluso con datos móviles.
 */
export async function prepararFoto(archivo: File, ladoMaximo = 1200, calidad = 0.82) {
  if (!archivo.type.startsWith("image/")) throw new Error("Ese archivo no es una imagen");
  const imagen = await createImageBitmap(archivo, { imageOrientation: "from-image" });
  const escala = Math.min(1, ladoMaximo / Math.max(imagen.width, imagen.height));
  const lienzo = document.createElement("canvas");
  lienzo.width = Math.round(imagen.width * escala);
  lienzo.height = Math.round(imagen.height * escala);
  const contexto = lienzo.getContext("2d");
  if (!contexto) throw new Error("Tu navegador no pudo procesar la foto");
  contexto.drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
  imagen.close();

  const dataUrl = lienzo.toDataURL("image/jpeg", calidad);
  return { mime: "image/jpeg", datos: dataUrl.slice(dataUrl.indexOf(",") + 1), vistaPrevia: dataUrl };
}
