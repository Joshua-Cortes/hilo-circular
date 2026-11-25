# API REST

Base: `http://localhost:3000/api` en desarrollo. Todas las respuestas son JSON.

- **Respuesta exitosa:** `{ "datos": … }`
- **Error:** `{ "error": { "codigo": "…", "mensaje": "…", "detalles": … } }`. El `mensaje` está escrito para mostrarse directamente a la persona usuaria.
- **Autenticación:** encabezado `Authorization: Bearer <token>`. El token se obtiene en `POST /auth/registro` o `POST /auth/ingreso` y dura 7 días.

## Endpoints públicos

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/salud` | Chequeo de estado |
| GET | `/catalogo` | Categorías de oficio, tipos de prenda (con peso promedio), estados y comunas, con etiquetas en español |
| GET | `/orientacion?prenda&estado` | Asistente "¿Qué hago con esta prenda?". Devuelve `accion` (`donar`, `reparar` o `reciclar`), un texto explicativo y los `filtros` listos para la siguiente búsqueda |
| GET | `/oficios` | Búsqueda de oficios (ver parámetros abajo) |
| GET | `/oficios/:id` | Perfil público con sus servicios |
| POST | `/oficios/:id/contacto` | `{ canal: "whatsapp" \| "telefono" }`. Registra el contacto y devuelve `{ url }` (`https://wa.me/…` o `tel:…`). La sesión es opcional |
| GET | `/fundaciones` | Puntos de donación (ver parámetros abajo) |
| GET | `/fundaciones/:id` | Detalle de una fundación |
| GET | `/repartidores` | Directorio de repartidores activos; acepta `?comuna=` |
| POST | `/repartidores/:id/contacto` | `{ comuna, canal }` (`"whatsapp"` \| `"telefono"`). Registra el contacto por zona y devuelve `{ canal, url }`. La sesión es opcional |
| GET | `/impacto` | Indicadores de impacto, incluidos `publicacionesActivas`, `prendasRecirculadas` y `contactosDelivery` |
| POST | `/auth/registro` | `{ nombre, email, clave, rol? }` (`rol`: `persona` u `oficio`; por defecto `persona`). Devuelve `{ token, usuario }` |
| POST | `/auth/ingreso` | `{ email, clave }`. Devuelve `{ token, usuario }`. Ante cualquier error responde `401 credenciales_invalidas` con el mismo mensaje |
| POST | `/auth/recuperar` | `{ email }`. Responde `200` sin revelar si la cuenta existe; en desarrollo devuelve `{ resetUrl }` y en producción envía el enlace vía Resend (`30 min`, un solo uso) |
| POST | `/auth/restablecer` | `{ token, clave }`. Valida el token de un solo uso y actualiza la contraseña |
| GET | `/mercado` | Prendas publicadas, sin las vendidas (ver parámetros abajo) |
| GET | `/mercado/:id` | Detalle con fotos, vendedor y `canales`. Nunca expone el WhatsApp de otra persona |
| GET | `/mercado/fotos/:id` | La imagen en sí (cache inmutable de un año) |
| POST | `/mercado/:id/contacto` | Devuelve `{ url }` de WhatsApp con un mensaje ya escrito, o `422 sin_whatsapp` |

### Parámetros de `GET /oficios`

| Parámetro | Tipo | Por defecto | Descripción |
|---|---|---|---|
| `lat`, `lng` | número | — | Si se envían (los dos juntos), se ordena por distancia y se informa `distanciaKm` |
| `radioKm` | número ≤ 100 | 15 | Solo aplica con coordenadas |
| `categoria` | `costura` \| `zapateria` \| `marroquineria` \| `tejido` \| `tapiceria` | — | Oficio que ofrece al menos un servicio de esa categoría |
| `prenda` | tipo de prenda | — | Oficio con algún servicio que trabaje esa prenda |
| `q` | texto de 2 a 60 caracteres | — | Busca en el nombre, la descripción y los títulos de los servicios |
| `limite` | 1–50 | 20 | — |

### Parámetros de `GET /fundaciones`

`lat`, `lng`, `radioKm` (por defecto 25) y `limite` (por defecto 50) funcionan igual que en `/oficios`. Además:

| Parámetro | Descripción |
|---|---|
| `prenda` | Incluye las fundaciones que aceptan esa prenda o que aceptan cualquier prenda |
| `aceptaDanada=true\|false` | Puntos que reciben, o no, textiles dañados para reciclaje |
| `abiertoAhora=true\|false` | Según los horarios, evaluados en la hora de Chile continental |

### Parámetros de `GET /mercado`

| Parámetro | Descripción |
|---|---|
| `prenda`, `comuna`, `condicion` | Filtros exactos |
| `q` | Texto de 2 a 60 caracteres; busca en título y descripción |
| `precioMax` | Precio máximo en pesos |
| `soloRegalo` | `true` para ver solo lo que se regala (precio 0) |
| `orden` | `recientes` (por defecto), `precio_asc` o `precio_desc` |
| `limite` | 1–60, por defecto 24 |

### Ejemplo

```http
GET /api/oficios?lat=-29.9027&lng=-71.252&categoria=costura
```

```json
{
  "datos": [
    {
      "id": "8c0e…",
      "nombrePublico": "Costuras Rosita",
      "comuna": "La Serena",
      "direccion": null,
      "ubicacion": { "lat": -29.88, "lng": -71.23, "precision": "aproximada" },
      "distanciaKm": 3.4,
      "canales": { "whatsapp": true, "telefono": false },
      "verificado": true,
      "servicios": [
        { "categoria": "costura", "titulo": "Bastas y ajustes", "prendas": ["pantalon", "falda_vestido", "uniforme_escolar"], "precioDesde": 3000 }
      ]
    }
  ]
}
```

## Endpoints con sesión

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | `/oficios/yo` | oficio | Perfil propio completo (sin difuminar) |
| POST | `/oficios` | oficio | Crea el perfil propio (uno por usuario). Exige al menos un WhatsApp o teléfono chileno |
| PATCH | `/oficios/yo` | oficio | Edición parcial |
| POST | `/oficios/yo/servicios` | oficio | Agrega un servicio |
| DELETE | `/oficios/yo/servicios/:servicioId` | oficio | Elimina un servicio propio |
| GET | `/fundaciones/yo` | fundacion | Fundación propia |
| POST | `/fundaciones` | fundacion | Registra la fundación propia; queda `verificado: false` |
| PATCH | `/fundaciones/yo` | fundacion | Actualiza necesidades, horarios, prendas aceptadas, etc. |
| POST | `/donaciones` | persona, oficio | Registra una donación (ver reglas abajo) |
| GET | `/donaciones/mias` | cualquiera | Una persona ve las donaciones que hizo; una fundación, las que recibe |
| PATCH | `/donaciones/:id/recepcion` | fundacion | Confirma la recepción. Solo entonces la donación cuenta como impacto |
| PATCH | `/donaciones/:id/cancelacion` | persona, oficio | Quien donó cancela una donación aún no recibida |
| GET | `/auth/yo` | cualquiera | Datos de la cuenta |
| PATCH | `/auth/yo` | cualquiera | Actualiza `nombre` y/o `email` de la cuenta y devuelve un token renovado |
| PATCH | `/auth/clave` | cualquiera | `{ claveActual, claveNueva }`. Cambia la contraseña validando la clave actual |
| GET | `/repartidores/yo` | cualquiera | Perfil propio de repartidor (`null` si aún no se crea) |
| POST | `/repartidores` | cualquiera | Crea perfil de repartidor (`nombrePublico`, `comunas`, `whatsapp` o `telefono`, `descripcion?`) |
| PATCH | `/repartidores/yo` | cualquiera | Actualiza el perfil de repartidor o cambia `activo` para pausar/reactivar |
| POST | `/mercado` | cualquiera | Publica una prenda. Acepta hasta 4 `fotos: [{ mime, datos }]` en base64 (JPEG, PNG o WebP, máx. 700 KB cada una; se revisa la firma del archivo). El cuerpo admite hasta 4 MB |
| GET | `/mercado/mias` | cualquiera | Publicaciones propias, incluidas las vendidas, con cuántas conversaciones tiene cada una |
| PATCH | `/mercado/:id` | dueño | Edición parcial, incluido `estado`: `disponible`, `reservada` o `vendida` |
| DELETE | `/mercado/:id` | dueño | Elimina la publicación, sus fotos y sus conversaciones |
| POST | `/mercado/:id/conversacion` | cualquiera salvo el dueño | Abre (o retoma) el chat con quien publicó. `{ texto? }` envía el primer mensaje. Devuelve `{ id }` |
| GET | `/conversaciones` | participante | Bandeja: prenda, la otra persona, último mensaje y `noLeidos` |
| GET | `/conversaciones/no-leidos` | cualquiera | `{ total }` para el globo del menú |
| GET | `/conversaciones/:id` | participante | Conversación con todos sus mensajes (`mio: true/false`). Marca como leídos los de la otra persona |
| POST | `/conversaciones/:id/mensajes` | participante | `{ texto }` (1 a 1000 caracteres) |

El chat no usa WebSockets: el frontend consulta la conversación abierta cada 4 segundos y la bandeja cada 12. Para una compraventa entre vecinos alcanza, y funciona igual en cualquier hosting.

### Delivery local

- `GET /repartidores` acepta `?comuna=` para filtrar perfiles activos que cubren esa comuna.
- `POST /repartidores` y `PATCH /repartidores/yo` permiten a cualquier cuenta autenticada ofrecer reparto, editar sus comunas y canales de contacto o pausar su perfil.
- `POST /repartidores/:id/contacto` registra el contacto en `contactos_reparto` (contabilizado en `/impacto` como `contactosDelivery`) y devuelve `{ canal, url }`.

### Recuperación de contraseña por correo

En desarrollo (`NODE_ENV=development`), `POST /auth/recuperar` devuelve `{ resetUrl }` para probar `/recuperar?token=…` sin credenciales SMTP. En producción requiere configurar `APP_URL`, `RESEND_API_KEY` y un remitente verificado en `EMAIL_FROM`.

### Reglas de `POST /donaciones`

```json
{ "fundacionId": "uuid", "items": [{ "prenda": "calzado", "cantidad": 1, "estado": "buen_estado" }] }
```

| Situación | Respuesta |
|---|---|
| La fundación no recibe alguna de las prendas | `422 prenda_no_aceptada`, con `detalles.prendas` |
| Hay prendas dañadas y la fundación no las acepta | `422 fundacion_no_acepta_danada`, con `detalles.sugerencias`: qué hacer con cada prenda, por ejemplo repararla en una zapatería |
| La donación es válida | `201`, con `totalPrendas` y `kgEstimados` |

## Códigos de error

| HTTP | Código | Cuándo |
|---|---|---|
| 400 | `datos_invalidos` | Falla la validación. `detalles` trae `[{ campo, mensaje }]` |
| 400 | `json_invalido` | El cuerpo de la solicitud no es JSON válido |
| 401 | `sin_sesion` / `token_invalido` | Falta el token, o expiró o fue adulterado |
| 403 | `prohibido` | Rol incorrecto o recurso ajeno |
| 404 | `no_encontrado` / `ruta_no_encontrada` | — |
| 400 | `foto_invalida` / `publicacion_propia` | El archivo no es la imagen que dice ser / chat con la publicación propia |
| 401 | `credenciales_invalidas` | Correo o contraseña incorrectos |
| 409 | `conflicto` | Perfil o correo duplicado, donación ya procesada o prenda ya vendida |
| 413 | `foto_muy_grande` | Una foto supera los 700 KB |
| 422 | `canal_no_disponible`, `prenda_no_aceptada`, `fundacion_no_acepta_danada`, `sin_whatsapp` | Reglas de negocio |
