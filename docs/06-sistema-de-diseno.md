# Sistema de diseño

> Construido con la skill **UI/UX Pro Max** a partir de la identidad del Hito 1: fondo crema, verde bosque, terracota y titulares con serifa.

## Dirección

La identidad es **artesanal, cálida y legible**, como un taller de barrio, no como una startup. Descartamos la recomendación automática de la herramienta (verde esmeralda, naranja e Inter), porque es la estética genérica que comparten miles de sitios. En su lugar mantuvimos la paleta del Hito 1 y la validamos con estas reglas de la skill:

- **Accesibilidad (prioridad 1):** contraste mínimo 4.5:1, foco visible y navegación por teclado.
- **Interacción táctil (prioridad 2):** objetivos de al menos 48 px, con 8 px o más de separación.
- **Estilo:** íconos SVG (Lucide), nunca emojis, y consistencia entre pantallas.
- **Tipografía:** base de 16 px o más e interlineado de al menos 1.5.

## Motivo gráfico: la puntada

Una línea punteada, como una costura, separa secciones y acompaña al logo. El logo es un círculo cosido con una cuenta terracota: un hilo que da la vuelta, que es la economía circular. En el código es la utilidad `puntada`, y se usa `border-dashed` en los separadores.

## Color

Los tokens se definen en [`apps/web/src/estilos.css`](../apps/web/src/estilos.css) y se usan como clases de Tailwind, por ejemplo `bg-crema` o `text-terracota-tinta`.

| Token | Hex | Uso |
|---|---|---|
| `crema` | `#F4EFE6` | Fondo general |
| `papel` | `#FBF8F2` | Tarjetas y superficies elevadas |
| `bosque` | `#1E3329` | Texto principal, encabezados, pie de página |
| `tinta-suave` | `#545B52` | Texto secundario |
| `terracota` | `#B4552F` | Botón primario (con texto blanco), íconos, acentos grandes |
| `terracota-tinta` | `#9A4528` | Texto de acento en tamaño normal |
| `terracota-claro` | `#E9B79F` | Detalles sobre fondo bosque |
| `salvia` | `#3D6852` | Estados positivos y énfasis secundario |
| `salvia-claro` | `#DCE6DD` | Fondos de estado y hover |
| `borde` | `#D9CFBF` | Bordes decorativos |
| `borde-fuerte` | `#8C8273` | Bordes de campos de formulario (≥ 3:1) |

### Contraste verificado (WCAG 2.2)

| Combinación | Razón | Resultado |
|---|---|---|
| bosque sobre crema | 11.75 : 1 | AAA |
| tinta-suave sobre crema | 6.12 : 1 | AA |
| terracota-tinta sobre crema | 5.63 : 1 | AA |
| salvia sobre crema | 5.56 : 1 | AA |
| blanco sobre terracota (botón) | 4.91 : 1 | AA |
| crema sobre bosque | 11.75 : 1 | AAA |
| terracota-claro sobre bosque | 7.52 : 1 | AAA |
| terracota sobre crema | 4.28 : 1 | Solo texto ≥ 24 px o íconos |
| borde-fuerte sobre crema | 3.30 : 1 | Componentes de interfaz (≥ 3:1) |

## Tipografía

| Rol | Fuente | Por qué |
|---|---|---|
| Titulares | **Fraunces** (variable, ejes `SOFT` y `opsz`) | Serifa "blanda" con calidez artesanal. Con `SOFT 60` se ve hecha a mano sin perder seriedad |
| Texto e interfaz | **Atkinson Hyperlegible** | Diseñada por el Braille Institute para personas con baja visión: distingue claramente letras parecidas (I/l/1, O/0). Clave para adultos mayores |

- La base es de **18 px** (`html { font-size: 112.5% }`), con interlineado de 1.55.
- Los titulares usan `text-balance` para evitar palabras huérfanas.
- Las fuentes se sirven desde el propio sitio con `@fontsource` (sin Google Fonts): no se comparten datos de visitantes con terceros y la página carga más rápido.

## Componentes base

| Clase | Descripción |
|---|---|
| `boton-primario` | Fondo terracota con texto blanco; alto mínimo de 48 px; forma de píldora |
| `boton-secundario` | Borde bosque de 2 px; al pasar el cursor se rellena |
| `tarjeta` | Fondo papel, borde suave, radio de 20 px |
| `puntada` | Línea de costura (motivo de marca) |

## Reglas de interacción

1. **Una pregunta por pantalla** en flujos guiados (asistente y donación). Cada flujo indica en qué paso va la persona ("Paso 1 de 3").
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
