# Cómo trabajamos

## Seguimiento

- Cada actividad de la planificación es un **issue** asignado a su responsable, con etiqueta de integrante (`👤 bastian`, `👤 joshua`, `👤 hector`) y de área.
- Cada semana o hito es un **milestone** con fecha. El avance semanal (reporte de los jueves) se lee directo de los milestones.
- Si una tarea se atrasa, se comenta en el issue el motivo y la nueva fecha. Nunca se borra el registro.

## Ramas

```text
main      ← versión estable; solo recibe merges desde develop al cierre de cada hito
develop   ← integración; aquí llegan los pull requests
feature/<n°-issue>-<descripcion-corta>   ej. feature/12-busqueda-oficios
fix/<n°-issue>-<descripcion-corta>       ej. fix/31-mapa-no-carga
docs/<descripcion-corta>                 ej. docs/informe-hito-2
```

1. Crea la rama desde `develop` actualizado: `git switch develop && git pull && git switch -c feature/12-busqueda-oficios`.
2. Haz commits pequeños.
3. Abre un PR hacia `develop` con `Closes #12` en la descripción, para que el issue se cierre solo al hacer merge.
4. La CI (lint, tipos, tests y build) debe pasar. Otro integrante revisa el PR cuando es posible.

## Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/es/) en español:

```text
feat(api): búsqueda de oficios por cercanía
fix(web): el asistente no recuperaba el foco al volver
docs: informe de avance del hito 2
test(api): casos de donación rechazada
chore: configura CI
```

## Antes de abrir un PR

```bash
npm run lint && npm run typecheck && npm test
```

Si tocaste la interfaz, revisa también la lista de verificación de [docs/06-sistema-de-diseno.md](docs/06-sistema-de-diseno.md#lista-de-verificación-antes-de-entregar-una-pantalla).
