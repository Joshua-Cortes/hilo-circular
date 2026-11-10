# Sistema de diseño

> Construido con la skill **UI/UX Pro Max** y tomando como referencia el estilo *bento* de sitios de tecnología climática: grilla de tarjetas de distintos tamaños, mucho aire y un solo color de acción.

## Dirección

**Reciclaje, no startup genérica.** Descartamos la propuesta automática de la herramienta (brutalismo con azul) y armamos una paleta propia a partir de materiales reciclados: menta de fondo, verde hoja como color de acción, cartón *kraft* y un lima de acento para lo que tiene que saltar a la vista.

- **Grilla bento:** cada camino (Reparar, Donar, Mercado) es una tarjeta grande; los datos del problema son tarjetas chicas. Sin bordes: el color de fondo separa.
- **Titulares con una palabra en cursiva verde** ("Tu ropa merece *otra vuelta*"), como una firma a mano. Es la utilidad `acento`.
- **Accesibilidad (prioridad 1):** contraste ≥ 4.5:1, foco visible, navegación por teclado y objetivos táctiles de 44 a 48 px.

## Motivo gráfico: la puntada

Una línea punteada, como una costura. El logo es un hilo punteado que da la vuelta alrededor de un botón: la economía circular. En el inicio, las cifras del problema llevan un anillo cosido. En el código son las utilidades `puntada` y el SVG `Anillo`.

## Color

Los tokens se definen en [`apps/web/src/estilos.css`](../apps/web/src/estilos.css) y se usan como clases de Tailwind, por ejemplo `bg-menta` o `text-hoja-oscura`.

| Token | Hex | Uso |
|---|---|---|
| `fondo` | `#EEF5EF` | Fondo general (menta muy clara) |
| `superficie` | `#FFFFFF` | Tarjetas bento y campos |
| `tinta` | `#12302A` | Texto principal; tarjeta oscura de "Donar"; pie de página |
| `tinta-suave` | `#4B5F57` | Texto secundario |
| `hoja` | `#1E8449` | Botón primario (texto blanco), marcadores del mapa, palabra en cursiva de los titulares |
| `hoja-oscura` | `#166536` | Texto verde en tamaño normal |
| `menta` / `menta-clara` | `#C9EBD3` / `#E2F2E6` | Tarjeta de "Reparar", estados seleccionados, hover |
| `kraft` / `kraft-clara` | `#D8BF93` / `#F2E8D5` | Cartón reciclado: avisos, estados vacíos, reciclaje textil |
| `kraft-tinta` | `#6E5020` | Texto sobre kraft; marcador de reciclaje |
| `lima` | `#C5EE5C` | Acento: "Publicar", "¡Pasa el filtro!", insignia de verificado |
| `borde` / `borde-fuerte` | `#D3E2D7` / `#7C9086` | Bordes decorativos / bordes de componentes (≥ 3:1) |
| `alerta` / `alerta-clara` | `#B03A22` / `#F8E1DA` | Errores |

### Contraste verificado (WCAG 2.2)

| Combinación | Razón | Resultado |
|---|---|---|
| tinta sobre menta | 11.00 : 1 | AAA |
| tinta sobre lima | 10.63 : 1 | AAA |
| fondo sobre tinta (texto claro en tarjeta oscura) | 12.78 : 1 | AAA |
| tinta-suave sobre fondo | 6.16 : 1 | AA |
| hoja-oscura sobre fondo | 6.42 : 1 | AA |
| kraft-tinta sobre kraft-clara | 6.10 : 1 | AA |
| alerta sobre blanco | 6.04 : 1 | AA |
| blanco sobre hoja (botón) | 4.72 : 1 | AA |
| hoja sobre fondo | 4.25 : 1 | Solo texto grande (titulares) o íconos |
| borde-fuerte sobre blanco | 3.39 : 1 | Componentes de interfaz (≥ 3:1) |

## Tipografía

| Rol | Fuente | Por qué |
|---|---|---|
| Titulares | **Bricolage Grotesque** (variable) | Grotesca con carácter, de trazos algo irregulares: moderna sin verse genérica |
| Palabra destacada | **Fraunces Italic** | Serifa cursiva que contrasta con la grotesca y da el toque "hecho a mano" |
| Texto e interfaz | **Atkinson Hyperlegible** | Diseñada por el Braille Institute para baja visión: distingue I/l/1 y O/0. Clave para adultos mayores |

- La base es de **18 px** (`html { font-size: 112.5% }`), con interlineado de 1.55.
- Los titulares usan `text-balance` para evitar palabras huérfanas.
- Las fuentes se sirven desde el propio sitio con `@fontsource` (sin Google Fonts): no se comparten datos de visitantes con terceros.

## Componentes base

| Clase | Descripción |
|---|---|
| `bento` | Celda de la grilla: radio de 28 px, sin borde, relleno de 24 a 28 px |
| `bento-enlace` | Bento que es un enlace completo: se levanta 4 px al pasar el cursor y la flecha gira |
| `boton-primario` | Píldora verde hoja con texto blanco, alto mínimo de 48 px |
| `boton-secundario` / `boton-claro` | Borde de tinta / fondo blanco |
| `campo` | Campo de formulario con borde de 2 px que se vuelve verde al enfocarlo |
| `etiqueta` | Texto en versalitas con espaciado amplio, sobre los titulares ("01 · Reparar") |
| `acento` | Palabra en Fraunces cursiva verde dentro de un titular |
| `ChipFiltro` | Filtro en forma de píldora con `aria-pressed` y ✓ cuando está activo |
| `FotoPrenda` | Foto de la prenda o, si no tiene, una silueta del tipo de prenda sobre un color de la paleta |

## Reglas de interacción

1. **Una pregunta por pantalla** en el asistente; el filtro de calidad de Donar muestra sus cinco preguntas juntas con un contador ("3 de 5"). Cada flujo indica en qué paso va la persona ("Paso 1 de 3").
2. **Al cambiar de paso, el foco va al título**, para que los lectores de pantalla anuncien la pregunta nueva.
3. **Las etiquetas siempre son visibles.** Nunca se usa un placeholder como única etiqueta. Los errores aparecen junto al campo y en lenguaje simple.
4. **Transiciones de 200 a 300 ms** con `ease-hilo`. Se respeta `prefers-reduced-motion`.
5. **Se reserva espacio para los datos que cargan,** como en las cifras de impacto, para que el diseño no salte.
6. **Diseño para celular primero.** Se prueba en 375, 768, 1024 y 1440 px, sin scroll horizontal.
7. **El color nunca es la única señal.** Estados como "Abierto ahora" llevan ícono y texto.

## Lista de verificación antes de entregar una pantalla

- [ ] Íconos SVG de Lucide con `aria-hidden` si son decorativos, y botones con texto o `aria-label`.
- [ ] `cursor-pointer` y estado hover en todo lo que se puede pulsar.
- [ ] Contraste de texto ≥ 4.5:1, verificado con la tabla anterior.
- [ ] Foco visible al navegar con Tab.
- [ ] Objetivos táctiles ≥ 48 px.
- [ ] Probado a 375 px de ancho.
- [ ] Se respeta `prefers-reduced-motion`.
