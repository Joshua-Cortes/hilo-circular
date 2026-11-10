# Hilo Circular

**Tu ropa merece otra vuelta.**

Hilo Circular es una plataforma web de economía circular textil para La Serena y Coquimbo. Tres caminos para que la ropa que todavía sirve no termine en la basura:

1. **Reparar.** Encuentra la costurera, el zapatero o la tejedora de tu barrio y escríbele por WhatsApp.
2. **Donar.** Revisa que tu prenda pase un filtro de calidad y elige en el mapa un punto de donación que la reciba.
3. **Mercado.** Publica la ropa que ya no usas o compra la de otra persona. Sin pagos en línea: se conversa por el chat de la plataforma o por WhatsApp.

La idea completa, en una página: **[docs/00-la-idea.md](docs/00-la-idea.md)**.

En 2021 llegaron a Chile cerca de 156 mil toneladas de ropa usada y alrededor del 60 % terminó en el desierto de Atacama (CEPAL, datos preliminares). Cada prenda reparada o donada es una prenda menos en el desierto.

> Proyecto de la asignatura **Informática y Sociedad**, Universidad de La Serena, 2026.
> Equipo: **Bastian Pizarro** (frontend y mockups) · **Joshua Cortés** (backend y pruebas) · **Hector Marin** (datos y panel de fundación).

## Documentación

| Documento | Contenido |
|---|---|
| [00 · La idea](docs/00-la-idea.md) | **Empieza aquí.** El problema, los tres caminos, el alcance, las métricas y el guion de demo |
| [01 · Fundamentación](docs/01-fundamentacion.md) | Problema con fuentes, marco normativo (Ley REP), beneficiarios, impacto social, métricas, riesgos |
| [02 · Arquitectura](docs/02-arquitectura.md) | Diagramas, stack y justificación, seguridad, registro de decisiones |
| [03 · Casos de uso](docs/03-casos-de-uso.md) | Casos de uso agrupados por camino, con flujos y reglas |
| [04 · Modelo de datos](docs/04-modelo-de-datos.md) | Diagrama ER y decisiones de modelado |
| [05 · API](docs/05-api.md) | Endpoints, parámetros y errores |
| [06 · Sistema de diseño](docs/06-sistema-de-diseno.md) | Paleta con contraste verificado, tipografía, reglas de accesibilidad |
| [07 · Planificación](docs/07-planificacion.md) | Plan semanal, estado real y replanificación |
| [Mockup CU1 y CU3 · Oficios](docs/mockups/oficios.html) | Mockup interactivo de búsqueda, perfil y creación de oficio |
| [Mockup CU2 · Donar](docs/mockups/donar.html) | Mockup interactivo de alta fidelidad (se abre en el navegador) |
| [Entregas](docs/entregas/) | Presentaciones y documentos entregados en cada hito |

## Cómo levantar el proyecto

Requisitos: **Node.js 22 o superior**. No hace falta instalar PostgreSQL ni Docker: en desarrollo la API usa [PGlite](https://pglite.dev), un PostgreSQL embebido que guarda los datos en `apps/api/.data/`.

```bash
npm install          # instala todo el monorepo
npm run dev          # API en http://localhost:3000/api y web en http://localhost:5173
```

En desarrollo la API crea la base local y carga los datos demo de La Serena y Coquimbo al arrancar (solo lo que falte). Para probar sin registrarte usa la **cuenta demo**: `demo@hilocircular.cl` / `hilo2026`. Hay otra con rol de oficio para probar "Mi taller": `taller@hilocircular.cl` / `hilo2026`. Son cuentas ficticias que no existen en producción.

| Comando | Qué hace |
|---|---|
| `npm run dev:api` / `npm run dev:web` | Levanta solo la API o solo la web |
| `npm test` | Corre los tests de la API (PostgreSQL en memoria, no ensucia tu base local) |
| `npm run typecheck` | Verifica los tipos de TypeScript |
| `npm run lint` / `npm run format` | Revisa o formatea el código con Biome |
| `npm run build` | Compila la API y la web |
| `npm run db:generate -w @hilo/api -- --name cambio` | Genera una migración después de modificar `schema.ts` |

Para usar un PostgreSQL real, copia `apps/api/.env.example` como `apps/api/.env` y define `DATABASE_URL`.

> **Usuarios de Windows:** npm falla si la ruta de la carpeta tiene el carácter `&` (por ejemplo, `Informatica & Sociedad`), porque cmd.exe lo interpreta como separador de comandos. Clona el repositorio en una ruta sin `&`.

## Estructura

```text
apps/api   API REST: Node.js 22 · Express 5 · Drizzle ORM · PostgreSQL/PGlite · Zod · Vitest
apps/web   SPA: React 19 · TypeScript · Vite · Tailwind CSS 4 · Leaflet
docs/      Fundamentación, diseño, mockups y entregas
```

## Cómo trabajamos

Las ramas, los commits, los pull requests y el seguimiento semanal con issues están en [CONTRIBUTING.md](CONTRIBUTING.md).
