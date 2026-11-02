# Hilo Circular — Fundamentación del proyecto

> **Tipo de proyecto:** producto de software de impacto social (aplicación web).
> **Equipo:** Bastian Pizarro · Joshua Cortés · Hector Marin — Informática y Sociedad, Universidad de La Serena, 2026.
> **Territorio del piloto:** conurbación La Serena–Coquimbo, Región de Coquimbo.

## 1. Resumen

Hilo Circular es una plataforma web que alarga la vida de la ropa. Ante una prenda que ya no usa, la persona recibe una respuesta concreta:

- **Reparar.** Encuentra la costurera, el zapatero o el taller más cercano que arregla ese tipo de prenda y lo contacta por WhatsApp.
- **Donar.** Ve en un mapa las fundaciones que reciben esa prenda _hoy_, sus horarios y lo que necesitan con urgencia.
- **Reciclar.** Si la prenda ya no sirve, la orienta a un punto que acepta textiles dañados, en lugar de entregarla a una fundación que terminaría botándola.

Al mismo tiempo, la plataforma da visibilidad digital a oficios de barrio que hoy dependen del boca a boca, y entrega a las fundaciones una forma simple de comunicar qué reciben y qué no.

## 2. El problema

### 2.1 Chile, destino de la ropa que el mundo descarta

Chile es uno de los principales importadores de ropa usada del mundo y el primero de América Latina. Gran parte ingresa por la Zona Franca de Iquique y la que no se vende termina en vertederos ilegales del desierto de Atacama, en la zona de Alto Hospicio.

| Dato                                                | Valor                                                | Fuente y matiz                                                                                                                                                                                                                                       |
| --------------------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ropa usada o sin vender que ingresó a Chile en 2021 | ~156 mil toneladas                                   | Datos **preliminares** de CEPAL (B. O'Brien, 2023) difundidos por ONU Noticias y la prensa nacional. Citando al Servicio Nacional de Aduanas, otras fuentes informan cifras menores (≈46 mil t de "ropa usada"); la diferencia depende de qué categorías y qué método se miden. |
| Proporción que termina en el desierto               | ~60 % (≈94 mil t)                                    | Misma fuente preliminar de CEPAL.                                                                                                                                                                                                                    |
| Posición de Chile como importador de ropa usada     | 3.º (OEC, 2022, por valor) / 4.º (estudio ONU, 2021) | Ambas fuentes lo ubican primero en Latinoamérica.                                                                                                                                                                                                    |
| Textiles en el mercado chileno que son importados   | ~92 %                                                | Considerandos de la Res. Exenta N.° 3914/2025 del Ministerio del Medio Ambiente.                                                                                                                                                                     |

> En las presentaciones citamos "156 mil t y ~60 %" indicando que son estimaciones preliminares de CEPAL. Así el argumento se sostiene aunque alguien muestre la cifra de Aduanas.

### 2.2 El problema también es local

El desierto es el síntoma más visible, pero el mismo patrón se repite en cada ciudad:

1. **Se bota ropa que se podía arreglar.** Un cierre malo, una basta descosida o una suela gastada bastan para que una prenda se deseche. Arreglarla suele ser barato, pero la gente no sabe dónde hacerlo.
2. **Los oficios de reparación son invisibles.** Costureras, zapateros y tapiceros de barrio trabajan en su mayoría de forma informal y sin presencia digital. Muchos son adultos mayores con baja alfabetización digital. Si no aparecen en internet, pierden clientes frente al "compro otra".
3. **Las donaciones mal dirigidas también generan basura.** Las fundaciones reciben ropa rota, sucia o que no corresponde a lo que necesitan, y deben desecharla a su costo. Quien dona tampoco sabe qué recibe cada lugar ni en qué horario.

Hilo Circular ataca estos tres puntos en el territorio donde vive el equipo, donde podemos validar con personas reales.

## 3. Marco normativo y de políticas públicas

- **Ley 20.920 (Ley REP).** Establece la Responsabilidad Extendida del Productor y el fomento al reciclaje.
- **Textiles como producto prioritario.** Por la Resolución Exenta N.° 3914/2025, el Ministerio del Medio Ambiente declaró los textiles **séptimo producto prioritario** de la Ley REP. En marzo de 2026 se inició el procedimiento del decreto que fijará metas de recolección y valorización. Importadores y comercializadores de ropa, nueva o usada, deberán hacerse cargo de su gestión.
- **Hoja de Ruta para un Chile Circular al 2040.** Prioriza la reutilización y la reparación por sobre el reciclaje.
- **Objetivos de Desarrollo Sostenible:**
  - **ODS 12.5:** reducir la generación de desechos mediante prevención, reducción, reciclaje y reutilización.
  - **ODS 8.3:** apoyar las actividades productivas y la formalización de microempresas.
  - **ODS 11.6:** reducir el impacto ambiental de las ciudades, incluida la gestión de residuos.
  - **ODS 10.2:** inclusión social y económica, a través de la inclusión digital de los oficios.

El proyecto se ordena según la **jerarquía de residuos**: primero **reutilizar** (donar), luego **reparar** y solo al final **reciclar**. Esa jerarquía está programada en el asistente de orientación (ver §5).

## 4. Beneficiarios

| Grupo                                                                   | Tipo      | Qué gana                                                                                    | Cómo lo medimos                                      |
| ----------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| **Oficios de reparación** (costureras, zapateros, tejedoras, tapiceros) | Directo   | Visibilidad digital gratuita, nuevos clientes, contacto por el canal que ya usan (WhatsApp) | Perfiles activos y contactos recibidos               |
| **Fundaciones y organizaciones receptoras**                             | Directo   | Donaciones adecuadas a lo que necesitan; menos ropa inservible que desechar                 | Donaciones confirmadas y prendas rechazadas evitadas |
| **Hogares de La Serena y Coquimbo**                                     | Directo   | Ahorro, ya que reparar cuesta menos que comprar, y certeza de que lo que donan sirve        | Uso del asistente y búsquedas                        |
| **Personas atendidas por las fundaciones**                              | Indirecto | Vestimenta digna y adecuada a sus necesidades reales                                        | Prendas recibidas (informadas por la fundación)      |
| **Comunidad y medio ambiente**                                          | Indirecto | Menos textil en vertederos y quemas                                                         | Kilos de textil recuperados (estimados)              |

### Personas usuarias de referencia

- **Rosa, 63 años, costurera en Las Compañías.** Trabaja desde su casa hace 30 años y usa WhatsApp pero no redes sociales. Necesita que crear su perfil sea simple y que no se publique su dirección exacta.
- **Camila, 34 años, madre en Coquimbo.** Tiene uniformes que a sus hijos ya no les quedan y zapatillas con la suela despegada. Quiere resolver rápido desde el celular.
- **Coordinadora de un ropero solidario.** Recibe bolsas con ropa que no puede usar. Quiere publicar "esta semana necesitamos parkas de niño" y confirmar lo que efectivamente llega.

## 5. La propuesta

### 5.1 Funcionalidades

| #   | Funcionalidad                              | Qué resuelve                                                                                                                                                                                  |
| --- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CU0 | **Asistente "¿Qué hago con esta prenda?"** | Con dos preguntas (qué prenda es y en qué estado está) recomienda reparar, donar o reciclar y lleva directo al resultado filtrado. Es la puerta de entrada y aplica la jerarquía de residuos. |
| CU1 | **Buscar oficio**                          | Busca talleres por tipo de arreglo y de prenda, ordenados por cercanía, y los contacta por WhatsApp o teléfono.                                                                               |
| CU2 | **Donar prenda**                           | Mapa de fundaciones con horario, estado ("abierto ahora"), prendas aceptadas y necesidades actuales. Valida que la donación sirva **antes** de que la persona salga de su casa.               |
| CU3 | **Perfil de oficio**                       | El oficio registra sus servicios, sus precios referenciales y su zona. Puede elegir publicar solo una ubicación aproximada.                                                                   |
| CU4 | **Control de acceso por roles**            | Persona, Oficio, Fundación y Administración.                                                                                                                                                  |
| CU5 | **Panel de fundación**                     | Publica necesidades y horarios, y confirma las donaciones recibidas.                                                                                                                          |
| CU6 | **Indicadores de impacto públicos**        | Contadores abiertos de oficios activos, contactos, donaciones confirmadas y kilos recuperados.                                                                                                |

El detalle de cada caso de uso está en [03-casos-de-uso.md](03-casos-de-uso.md).

### 5.2 Teoría de cambio

```text
Insumos           →  Actividades                     →  Productos                       →  Resultados                         →  Impacto
Plataforma web,      Levantar oficios y fundaciones,    Perfiles de oficio, mapa de        Más reparaciones y donaciones       Menos textil en vertederos;
equipo, alianzas     onboarding asistido, difusión      donación, asistente, indicadores   adecuadas; nuevos clientes          más ingresos para oficios
con fundaciones      en juntas de vecinos y ferias                                         para oficios locales                locales; vestimenta digna
```

### 5.3 Decisiones de diseño con sentido social

Estas decisiones responden a la pregunta de la asignatura: _¿cómo afecta la tecnología a las personas que la usan y a las que deja fuera?_

1. **Accesibilidad primero.**
   - El texto usa la tipografía _Atkinson Hyperlegible_, diseñada por el Braille Institute para personas con baja visión, con un tamaño base de 18 px.
   - Los contrastes cumplen WCAG 2.2 AA y los botones miden al menos 48 px.
   - El lenguaje es simple, sin anglicismos.

   Ver [06-sistema-de-diseno.md](06-sistema-de-diseno.md).
2. **WhatsApp en lugar de un chat propio.** Los oficios ya trabajan así. Obligarlos a aprender otra herramienta los excluiría. La plataforma solo registra que hubo un contacto, para medir impacto.
3. **Privacidad de quien trabaja en su casa.** Por defecto la ubicación de un oficio es **aproximada**: la API redondea las coordenadas a ~1 km y oculta la dirección. Mostrar la dirección exacta es opcional.
4. **Donar según necesidad, no según lo que sobra.** La API rechaza una donación si la fundación no recibe ese tipo de prenda o no acepta prendas dañadas. En ese caso **sugiere repararla** con un oficio cercano. Así se evita trasladar el problema de la basura a las fundaciones.
5. **Sin comisiones ni intermediación.** La plataforma no cobra ni procesa pagos. El valor queda en el oficio y en la comunidad.
6. **Impacto honesto.**
   - Los kilos recuperados solo cuentan donaciones **confirmadas por la fundación**, no las intenciones de donar.
   - Los pesos por prenda son estimaciones declaradas que se calibrarán pesando donaciones reales.
7. **Inclusión de quien no está en internet.** Para los oficios sin habilidades digitales, el equipo ofrece un **onboarding asistido**: crea el perfil presencialmente con el oficio, con su consentimiento informado.

### 5.4 ¿Qué existe hoy y en qué nos diferenciamos?

| Alternativa actual                | Limitación                                                                                          | Hilo Circular                                                               |
| --------------------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Boca a boca, letreros de barrio   | No escala; quien se cambia de barrio no conoce a nadie                                              | Búsqueda por cercanía y tipo de arreglo                                     |
| Grupos de Facebook o Marketplace  | Orientados a vender; sin información de reparación ni de necesidades de fundaciones                 | Enfocado en reparar y donar, no en vender                                   |
| Buscadores de mapas genéricos     | Los oficios informales no aparecen o no indican qué arreglan; no muestran qué recibe cada fundación | Servicios por tipo de prenda; necesidades y prendas aceptadas por fundación |
| Apps de compraventa de ropa usada | Mueven ropa entre quienes pueden pagar; no apoyan oficios ni fundaciones                            | Une reparación, donación y reciclaje en un solo flujo, gratis               |

## 6. Métricas de impacto y metas del piloto

Las métricas se calculan automáticamente desde el endpoint público `GET /api/impacto`.

| Indicador                   | Definición operacional                                                                                      | Meta del piloto (al 26 nov)                 |
| --------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| Oficios activos             | Perfiles de oficio activos, separando los verificados presencialmente                                       | 8 oficios reales (al menos 5 verificados)   |
| Puntos de donación          | Fundaciones activas con horario y prendas aceptadas                                                         | 4 organizaciones                            |
| Contactos de reparación     | Clics en "Contactar por WhatsApp o teléfono"                                                                | 30 contactos en pruebas con usuarios        |
| Donaciones confirmadas      | Donaciones marcadas como recibidas por la fundación                                                         | 10 donaciones                               |
| Kilos de textil recuperados | Suma de pesos promedio de las prendas confirmadas                                                           | Se informa el valor obtenido, sin meta fija |
| Usabilidad                  | Puntaje SUS (System Usability Scale) en pruebas con 5 o más personas, incluyendo al menos 2 adultos mayores | SUS ≥ 70                                    |

> Las metas son nuestra propuesta y se ajustarán según los acuerdos que se logren con organizaciones reales (ver issues de la planificación).

## 7. Alcance

**Incluido en la entrega del 26 de noviembre (MVP):** CU0 a CU6, versión web responsiva y usable en celular, datos reales de un grupo acotado de oficios y fundaciones de La Serena y Coquimbo, y pruebas con usuarios reales.

**Fuera de alcance (trabajo futuro):**
- Reseñas y valoraciones de oficios.
- Notificaciones.
- App nativa.
- Integración con gestores de residuos bajo la Ley REP.
- Panel de administración avanzado.
- Extensión a otras comunas.

## 8. Riesgos y mitigación

| Riesgo                                                   | Probabilidad | Mitigación                                                                                                                      |
| -------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| Pocos oficios se registran por la brecha digital         | Alta         | Onboarding asistido presencial; el perfil se puede crear en 3 minutos y solo exige nombre, oficio, zona y WhatsApp              |
| Información de fundaciones desactualizada                | Media        | Las fundaciones editan sus necesidades y horarios; se muestra "verificado" solo tras contacto del equipo                        |
| No lograr acuerdos con fundaciones antes del 26 nov      | Media        | Se trabaja en paralelo con 2 o 3 organizaciones y, mientras tanto, con datos demo claramente marcados como ficticios            |
| Exposición de datos personales de oficios                | Media        | Ubicación aproximada por defecto, mínimo de datos, consentimiento informado y contraseñas con hash                              |
| Retraso del cronograma (ya estamos atrasados una semana) | Alta         | Replanificación en [07-planificacion.md](07-planificacion.md); la API ya está implementada y probada para destrabar el frontend |

## 9. Fuentes

- ONU Noticias (mayo de 2023). Nota sobre la ropa usada en el desierto de Atacama, con datos preliminares de CEPAL. <https://news.un.org/es/story/2023/05/1521102>
- Cooperativa.cl (26-06-2023). _En 2021 llegaron a Chile 156 mil toneladas de ropa usada._ <https://cooperativa.cl/noticias/pais/medioambiente/en-2021-llegaron-a-chile-156-mil-toneladas-de-ropa-usada-gran-parte/2023-06-26/114146.html>
- BioBioChile (26-06-2023). _90 mil toneladas en un año: el colonialismo de residuos del desierto de Atacama explicado en cifras._ <https://www.biobiochile.cl/especial/aqui-tierra/noticias/2023/06/26/90-mil-toneladas-en-un-ano-el-colonialismo-de-residuos-del-desierto-de-atacama-explicado-en-cifras.shtml>
- OEC — Observatory of Economic Complexity. _Used Clothing (HS 6309): importadores 2022._ <https://www.oec.world/en/profile/hs/116309>
- Ministerio del Medio Ambiente (2025). _Resolución Exenta N.° 3914/2025 que declara a los textiles como producto prioritario._ <https://economiacircular.mma.gob.cl/wp-content/uploads/2025/07/RE-3914-2025-Declara-Textiles-1.pdf>
- Diario Oficial (10-03-2026). _Inicio del procedimiento de elaboración del decreto de metas para textiles._ <https://www.diariooficial.interior.gob.cl/publicaciones/2026/03/10/44396/01/2779727.pdf>
- LexLatin (2025). _Textiles entran a la Ley REP: ¿Qué cambios se imponen para la producción y el consumo de ropa en Chile?_ <https://lexlatin.com/reportajes/textiles-ley-rep-cambios-produccion-consumo-ropa-chile>
- Braille Institute. _Atkinson Hyperlegible._ <https://www.brailleinstitute.org/freefont/>
- W3C (2023). _Web Content Accessibility Guidelines (WCAG) 2.2._ <https://www.w3.org/TR/WCAG22/>
