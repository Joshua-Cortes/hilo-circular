# Planificación y seguimiento

El control oficial del avance semanal se lleva en los **issues y milestones de GitHub**: cada issue corresponde a una actividad de un integrante y cada milestone a una semana o un hito. Esta página resume el plan y su estado. El responsable de mantenerla actualizada cada miércoles, antes del reporte de los jueves, se define en el issue de coordinación.

## Plan original (Hito 1)

| Semana | Bastian Pizarro (frontend y mockups) | Joshua Cortés (backend y pruebas) | Hector Marin (datos, autenticación y mapa) | Entregable grupal |
|---|---|---|---|---|
| 14–19 oct | Requerimientos funcionales y casos de uso | Diagrama de arquitectura y elección del stack | Descripción e impacto social | PDF + presentación Hito 1 (15 oct) |
| 20–26 oct | Mockups de búsqueda y perfiles de oficios | Mockup de donación con mapa | Modelo de datos (diagrama ER) | Mockups y modelo de datos validados |
| 27 oct–2 nov | Repositorio, ramas e integración continua | Estructura base de la API REST | Esquema de la base de datos | Proyecto base funcionando |
| 3–9 nov | Módulo de búsqueda y filtros | Endpoints de servicios, perfiles y donaciones | Registro, inicio de sesión y roles | Avance funcional del módulo 1 |
| 10–16 nov | Integración frontend-backend | Pruebas de los endpoints | Mapa de donación (Leaflet) | Demo interna integrada |
| 17–23 nov | Pulido de la interfaz y versión móvil | Pruebas con usuarios reales | Corrección de errores | Versión casi final |
| 24–26 nov | Documentación final | Preparación de la entrega y la presentación | Video demo final | Entrega final (26 nov) |

## Estado real al 16 de noviembre

| Semana | Planificado | Real | Desvío |
|---|---|---|---|
| 14–19 oct | Hito 1 | Presentación entregada el 15 oct | Al día |
| 20–26 oct | Mockups y modelo de datos | Recuperado el 2 nov con mockups CU1/CU2/CU3 y modelo ER | Recuperado |
| 27 oct–2 nov | Proyecto base | Repositorio, CI, API completa, modelo de datos, configuración UI y mockups completos | Al día |
| 3–9 nov | Módulo 1 | Pantalla `/reparar` (CU1), formulario `/mi-taller` (CU3), autenticación `/ingresar` (CU4) y endpoints listos | Completado |
| 10–16 nov | Demo integrada | Rediseño bento en 3 caminos: Reparar (`/reparar`, `/mi-taller`), Donar (`/donar` con filtro de calidad + mapa Leaflet) y Mercado (`/mercado`, `/mensajes` con chat interno, 59 tests) | Completado |
| 17–23 nov | Versión casi final | Pulido responsivo móvil (375–1440 px), mapa de oficio, carga diferida (`React.lazy`) y accesibilidad verificada (#20) | Adelantado |
| 24–26 nov | Entrega final | Manual breve para oficios y fundaciones (`08-manual-oficios-y-fundaciones.md`) y documentación al día (#23) | Adelantado |

### Lo que se adelantó (1 nov)

- Los endpoints de servicios, perfiles y donaciones (planificados para 3–9 nov) y las pruebas automatizadas de endpoints (planificadas para 10–16 nov) quedaron implementados junto con la estructura base.
- El modelo de datos (ER) y el esquema de PostgreSQL quedaron definidos en código y migraciones. **Hector** debe revisarlos y validarlos, ya que son su responsabilidad en el plan.
- Se agregaron al alcance CU0 (asistente), CU5 (panel de fundación) y CU6 (impacto). Ver la justificación en [01-fundamentacion.md](01-fundamentacion.md).

### Replanificación propuesta

| Semana | Bastian | Joshua | Hector | Entregable |
|---|---|---|---|---|
| 2–4 nov | Mockups de búsqueda y perfil sobre el sistema de diseño | Informe y presentación del **Hito 2**; apoyo en la integración | Revisión del modelo de datos; autenticación (registro e inicio de sesión) | **Hito 2 (4 nov):** avance 2/3 + demo |
| 5–9 nov | Pantalla Reparar: búsqueda, filtros y perfil (CU1) | Despliegue de prueba (API + BD); contacto con oficios y fundaciones reales | Mapa de donación con Leaflet (CU2); roles en el frontend | Módulo de búsqueda funcionando |
| 10–16 nov | Formulario de perfil de oficio (CU3); integración | Flujo de donación (CU2) conectado a la API; carga de datos reales | Panel de fundación (CU5) | **Demo integrada (16 nov)** |
| 17–23 nov | Pulido y versión móvil; accesibilidad | Pruebas con usuarios reales (protocolo y SUS) | Corrección de errores | Versión casi final |
| 24–26 nov | Documentación final | Preparación de la entrega y la presentación | Video demo | **Entrega final (26 nov)** |
